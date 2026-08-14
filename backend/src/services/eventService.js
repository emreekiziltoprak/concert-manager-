/**
 * Event persistence.
 *
 * Deliberately contains no authorization: which users may touch which event is
 * decided once, by authorizeEventRole, before a request ever reaches a
 * controller. These functions only guard existence, so a soft-deleted event
 * reads the same as a missing one everywhere.
 *
 * @module services/eventService
 */

const prisma = require("../utils/prismaClient");
const MESSAGES = require("../constants/messages");
const { notFound } = require("../utils/httpError");

/**
 * Order statuses that still hold stock; a CANCELLED order releases its seats.
 *
 * @type {ReadonlyArray<string>}
 */
const STOCK_HOLDING_ORDER_STATUSES = Object.freeze(["PENDING", "SUCCESS"]);

/**
 * Roles surfaced to the client so it can decide whether to render management
 * controls. Only the pair the frontend actually needs is selected -- never the
 * whole EventRole row, which would leak who assigned what and when.
 */
const eventRoleSummary = {select: {userId: true, role: true}};

/**
 * Creates an event and makes its creator the OWNER in the same transaction.
 *
 * `organizerId`, `eventRole` and `eventRoles` are stripped from the body on
 * purpose -- ownership follows the authenticated user, otherwise a client could
 * name someone else as owner, or grant itself a role on an event it does not own.
 *
 * @param {object} eventData Request body; may carry a `ticketTypes` array to
 *   create alongside the event.
 * @param {{userId: string}} user Authenticated user from the JWT.
 * @returns {Promise<{message: string, eventResp: object}>} The created event
 *   with its ticket types and roles.
 */
const addEvent = async (eventData, user) => {
    const {ticketTypes, eventRole, eventRoles, organizerId, ...rest} = eventData;
    const ownerId = user.userId;

    const eventResp = await prisma.event.create({
        data: {
            ...rest,
            organizerId: ownerId,
            ...(ticketTypes?.length ? {ticketTypes: {create: ticketTypes}} : {}),
            eventRoles: {
                create: {userId: ownerId, assignedById: ownerId, role: "OWNER"}
            }
        },
        include: {
            ticketTypes: true,
            eventRoles: true
        }
    });

    return {message: "Event successfully created", eventResp};
};

/**
 * Lists every event with its ticket types and roles.
 *
 * Roles are included so the events page can hide edit and delete controls from
 * users who would only get a 403; the server still enforces it either way.
 *
 * No `soldCount` here -- that costs an extra aggregate per event and the list
 * does not render it. Use {@link getEventById} when the count is needed.
 *
 * @returns {Promise<Array<object>>} All events.
 */
const getEvents = async () => {
    return await prisma.event.findMany({
        include: {
            ticketTypes: true,
            eventRoles: eventRoleSummary
        }
    });
};

/**
 * Loads one event, attaching a `soldCount` to each ticket type.
 *
 *
 * @param {string} eventId Event to load.
 * @returns {Promise<object>} The event, its roles, and ticket types carrying
 *   `soldCount` (0 when nothing is reserved).
 * @throws {Error} 404 when the event is missing or soft-deleted.
 */
const getEventById = async (eventId) => {
    const event = await prisma.event.findFirst({
        where: {id: eventId, deletedAt: null},
        include: {
            ticketTypes: true,
            eventRoles: eventRoleSummary
        }
    });

    if (!event) {
        throw notFound(MESSAGES.EVENT.NOT_FOUND);
    }

    const reserved = await prisma.orderItem.groupBy({
        by: ["ticketTypeId"],
        where: {
            ticketTypeId: {in: event.ticketTypes.map((ticketType) => ticketType.id)},
            order: {
                status: {in: STOCK_HOLDING_ORDER_STATUSES}
            }
        },
        _sum: {
            quantity: true
        }
    });

    const soldCounts = new Map(
        reserved.map((row) => [row.ticketTypeId, row._sum.quantity || 0])
    );

    return {
        ...event,
        ticketTypes: event.ticketTypes.map((ticketType) => ({
            ...ticketType,
            soldCount: soldCounts.get(ticketType.id) || 0
        }))
    };
};

/**
 * Applies changes to an event.
 *
 * @param {string} eventId Event to update.
 * @param {object} event Prisma data object built by the controller.
 * @returns {Promise<object>} The updated event.
 * @throws {Error} 404 when the event is missing or soft-deleted.
 */
const updateEvent = async (eventId, event) => {
    const existingEvent = await prisma.event.findFirst({
        where: {
            id: eventId,
            deletedAt: null
        }
    });

    if(!existingEvent) throw notFound(MESSAGES.EVENT.NOT_FOUND);

    const updatedEvent = await prisma.event.update({
        where: {id: eventId},
        data: event
    });

    return updatedEvent;
};

/**
 * Removes an event.
 *
 * @param {string} eventId Event to delete.
 * @returns {Promise<object>} The deleted event.
 * @throws {Error} 404 when the event is missing or already soft-deleted.
 */
const deleteEvent = async(eventId) =>{
    const existingEvent = await prisma.event.findFirst({where: {id: eventId, deletedAt: null}});
    if(!existingEvent) {throw notFound(MESSAGES.EVENT.NOT_FOUND)}

    const deletedEvent  = await prisma.event.delete({
        where: {id: eventId},
    });

    return deletedEvent;
};

module.exports = {addEvent, getEvents, getEventById, updateEvent, deleteEvent};
