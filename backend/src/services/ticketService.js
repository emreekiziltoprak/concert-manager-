/**
 * Ticket and ticket type persistence.
 *
 * Holds two related concerns: the issued Ticket rows a buyer owns, and the
 * TicketType catalogue an event manager maintains. The ticket type half owns
 * every business rule that constrains a catalogue -- unique names, one row per
 * category, and capacities that stay within the event -- and enforces them
 * inside a transaction so the HTTP layer cannot bypass them.
 *
 * @module services/ticketService
 */

const prisma = require("../utils/prismaClient");
const QRCode = require('qrcode');
const MESSAGES = require("../constants/messages");
const { notFound, badRequest, conflict } = require("../utils/httpError");

/**
 * Lists a user's tickets, each with a scannable QR code.
 *
 * The QR encodes the ticket id and is generated on read rather than stored, so
 * it can never fall out of sync with the row.
 *
 * @param {string} userId Owner of the tickets.
 * @returns {Promise<Array<object>>} Tickets, each with a `qrCode` data URL.
 */
const getUserTicketsWithQrCode = async (userId) => {
    const tickets = await prisma.ticket.findMany({
        where: {
            userId: userId,
        },
    });

    const ticketsWithQr = await Promise.all(
        tickets.map(async (ticket) => {
            const qrCodeDataURL = await QRCode.toDataURL(ticket.id.toString());

            return {
                ...ticket,
                qrCode: qrCodeDataURL,
            };
        })
    );

    return ticketsWithQr;
};

/**
 * Redeems a ticket at the door: verifies it, then marks it used.
 *
 * Marking happens in the same call as the check on purpose -- a scan that only
 * reported "valid" would let the same code through twice.
 *
 * @param {string} ticketId Id read from the QR code.
 * @returns {Promise<object>} The ticket, now flagged as used.
 * @throws {Error} When no such ticket exists, or it was already scanned.
 */
const validateUserTicket = async (ticketId) => {
    const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },

    });

    if (!ticket) {
    throw new Error(MESSAGES.TICKET.INVALID);
    }

    if (ticket.isUsed) {
    throw new Error(MESSAGES.TICKET.ALREADY_USED);
    }

    const updatedTicket = await prisma.ticket.update({
        where: {id : ticketId},
        data: {isUsed: true}
    });

    return updatedTicket;
};

/**
 * Loads an order with everything the confirmation email template renders.
 *
 * @param {string} orderId Order to load.
 * @returns {Promise<object|null>} Order with user, event, items and tickets.
 */
const getOrderTicketsEmail = async (orderId) => {
    const order = await prisma.order.findUnique({
        where: {id: orderId},
        include: {
            user: true,
            event: true,
            orderItems: {
                include: {
                    tickets: true,
                    ticketType: true
                }
            }
        }
    });

    return order;
}

/**
 * Statuses that hold stock. A CANCELLED order releases its seats, so it must not
 * count towards the reserved quantity.
 *
 * @type {ReadonlyArray<string>}
 */
const STOCK_HOLDING_ORDER_STATUSES = Object.freeze(["PENDING", "SUCCESS"]);

/**
 * Event fields echoed back with a ticket type, so the client can show which
 * event a row belongs to without a second request.
 */
const eventSummary = { event: { select: { id: true, title: true } } };

/**
 * Loads the event and holds a row lock on it for the rest of the transaction.
 *
 * @param {import("@prisma/client").Prisma.TransactionClient} tx Active transaction.
 * @param {string} eventId Event to lock.
 * @returns {Promise<{id: string, capacity: number}>} The locked event.
 * @throws {Error} 404 when the event is missing or soft-deleted.
 */
const lockEvent = async (tx, eventId) => {
    const [event] = await tx.$queryRaw`
        SELECT id, capacity FROM "events"
        WHERE id = ${eventId} AND "deletedAt" IS NULL FOR UPDATE`;

    if (!event) throw notFound(MESSAGES.EVENT.NOT_FOUND);

    return event;
};

/**
 * Confirms the ticket type exists *and* belongs to this event.
 *
 * Both ids come from the URL, but only the event id is authorized by
 * authorizeEventRole. Matching on the pair is what stops a manager of one event
 * from editing another event's ticket type by pasting its id into the path.
 *
 * @param {import("@prisma/client").Prisma.TransactionClient} tx Active transaction.
 * @param {string} eventId      Event the ticket type must belong to.
 * @param {string} ticketTypeId Ticket type being addressed.
 * @returns {Promise<{id: string}>} The matched ticket type.
 * @throws {Error} 404 when it does not exist or belongs to another event.
 */
const findTicketType = async (tx, eventId, ticketTypeId) => {
    const ticketType = await tx.ticketType.findFirst({
        where: { id: ticketTypeId, eventId },
        select: { id: true },
    });

    if (!ticketType) throw notFound(MESSAGES.TICKET_TYPE.NOT_FOUND);

    return ticketType;
};

/**
 * Sums the seats already spoken for by orders that still hold stock.
 *
 *
 * @param {import("@prisma/client").Prisma.TransactionClient} tx Active transaction.
 * @param {string} ticketTypeId Ticket type to measure.
 * @returns {Promise<number>} Reserved quantity, 0 when there are no orders.
 */
const getReservedQuantity = async (tx, ticketTypeId) => {
    const aggregations = await tx.orderItem.aggregate({
        where: {
            ticketTypeId,
            order: { status: { in: STOCK_HOLDING_ORDER_STATUSES } },
        },
        _sum: { quantity: true },
    });

    return aggregations._sum.quantity || 0;
};

/**
 * Enforces the three rules that relate a ticket type to its otherTicketTypes: unique
 * name, unique category, and a capacity that fits in what the event has left.
 *
 *
 * @param {import("@prisma/client").Prisma.TransactionClient} tx Active transaction.
 * @param {{id: string, capacity: number}} event Locked event from {@link lockEvent}.
 * @param {{name: string, capacity: number, category: string}} data Validated request body.
 * @param {string} [ticketTypeId] On update, the row to exclude so it does not
 *   collide with itself; omitted on create.
 * @returns {Promise<void>} Resolves when every rule passes.
 * @throws {Error} 409 on a duplicate name or category, 400 when over capacity.
 */
const assertNoConflicts = async (tx, event, data, ticketTypeId) => {
    const otherTicketTypes = await tx.ticketType.findMany({
        where: { eventId: event.id, ...(ticketTypeId ? { id: { not: ticketTypeId } } : {}) },
        select: { name: true, category: true, totalCount: true },
    });

    const name = data.name.trim();

    if (otherTicketTypes.some((sibling) => sibling.name.trim().toLowerCase() === name.toLowerCase())) {
        throw conflict(MESSAGES.TICKET_TYPE.DUPLICATE_NAME(name));
    }

    if (otherTicketTypes.some((sibling) => sibling.category === data.category)) {
        throw conflict(MESSAGES.TICKET_TYPE.DUPLICATE_CATEGORY(data.category));
    }

    const used = otherTicketTypes.reduce((sum, sibling) => sum + sibling.totalCount, 0);
    const remaining = Math.max(event.capacity - used, 0);

    if (data.capacity > remaining) {
        throw badRequest(
            MESSAGES.TICKET_TYPE.CAPACITY_EXCEEDED(remaining, event.capacity, used)
        );
    }
};

/**
 * Maps a validated request body onto TicketType columns.
 *
 * The API and the schema disagree on two points: the request calls the seat
 * count `capacity` while the column is `totalCount`, and `price` is a Decimal
 * that Prisma wants as a string to avoid float rounding. This is the single
 * place that translation happens.
 *
 * Values arrive already validated and defaulted by
 * eventController.validateTicketTypeBody, so no fallbacks are applied here.
 *
 * @param {{name: string, price: number, capacity: number, category: string, isActive: boolean}} data
 *   Validated request body.
 * @returns {{name: string, price: string, totalCount: number, category: string, isActive: boolean}}
 *   Prisma data object, without `eventId`.
 */
const toTicketTypeRow = (data) => ({
    name: data.name.trim(),
    price: String(data.price),
    totalCount: data.capacity,
    category: data.category,
    isActive: data.isActive,
});

/**
 * Adds a ticket type to an event.
 *
 * @param {string} eventId Event to add to.
 * @param {{name: string, price: number, capacity: number, category: string, isActive: boolean}} data
 *   Validated request body.
 * @returns {Promise<object>} The created ticket type, with `soldCount: 0` so the
 *   client can render it exactly like a row loaded from GET /events/:id.
 * @throws {Error} 404 unknown event, 409 duplicate name/category, 400 over capacity.
 */
const createTicketType = (eventId, data) =>
    prisma.$transaction(async (tx) => {
        const event = await lockEvent(tx, eventId);

        await assertNoConflicts(tx, event, data);

        const created = await tx.ticketType.create({
            data: { eventId, ...toTicketTypeRow(data) },
            include: eventSummary,
        });

        return { ...created, soldCount: 0 };
    });

/**
 * Replaces the mutable fields of one ticket type.
 *
 * A full replace rather than a patch: the edit form is prefilled with every
 * field and always sends all of them, so there is no partial-update case to
 * reason about.
 *
 * @param {string} eventId      Event the ticket type belongs to.
 * @param {string} ticketTypeId Ticket type to update.
 * @param {{name: string, price: number, capacity: number, category: string, isActive: boolean}} data
 *   Validated request body.
 * @returns {Promise<object>} The updated ticket type with its current `soldCount`.
 * @throws {Error} 404 unknown event/ticket type, 409 duplicate name/category or
 *   a capacity below the reserved quantity, 400 over the event capacity.
 */
const updateTicketType = (eventId, ticketTypeId, data) =>
    prisma.$transaction(async (tx) => {
        const event = await lockEvent(tx, eventId);
        await findTicketType(tx, eventId, ticketTypeId);

        await assertNoConflicts(tx, event, data, ticketTypeId);

        const reserved = await getReservedQuantity(tx, ticketTypeId);

        if (data.capacity < reserved) {
            throw conflict(MESSAGES.TICKET_TYPE.CAPACITY_BELOW_RESERVED(reserved));
        }

        const updated = await tx.ticketType.update({
            where: { id: ticketTypeId },
            data: toTicketTypeRow(data),
            include: eventSummary,
        });

        return { ...updated, soldCount: reserved };
    });

/**
 * Deletes a ticket type, but only while nothing points at it.
 *
 * `Ticket.ticketTypeId` and `OrderItem.ticketTypeId` are both ON DELETE
 * RESTRICT, so the database would refuse the delete anyway; counting first just
 * turns that refusal into an explanation the user can act on. The counts are
 * deliberately not filtered by order status, because the foreign key is not
 * either -- even a cancelled order's items block the delete.
 *
 * @param {string} eventId      Event the ticket type belongs to.
 * @param {string} ticketTypeId Ticket type to delete.
 * @returns {Promise<object>} The deleted ticket type.
 * @throws {Error} 404 unknown event/ticket type, 409 when orders or issued
 *   tickets reference it.
 */
const deleteTicketType = (eventId, ticketTypeId) =>
    prisma.$transaction(async (tx) => {
        await lockEvent(tx, eventId);
        await findTicketType(tx, eventId, ticketTypeId);

        const orderItems = await tx.orderItem.count({ where: { ticketTypeId } });
        const tickets = await tx.ticket.count({ where: { ticketTypeId } });

        if (orderItems > 0 || tickets > 0) {
            throw conflict(MESSAGES.TICKET_TYPE.DELETE_BLOCKED(orderItems, tickets));
        }

        try {
            return await tx.ticketType.delete({ where: { id: ticketTypeId } });
        } catch (error) {
            if (error.code === "P2003") {
                throw conflict(MESSAGES.TICKET_TYPE.DELETE_BLOCKED_BY_REFERENCE);
            }
            throw error;
        }
    });

module.exports = {
    getUserTicketsWithQrCode,
    validateUserTicket,
    getOrderTicketsEmail,
    createTicketType,
    updateTicketType,
    deleteTicketType
};
