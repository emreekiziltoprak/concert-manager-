/**
 * HTTP layer for events and their ticket types.
 *
 * Every handler does the same two things and nothing else: hand clean values to
 * a service, then send the success response. There are no try/catch blocks --
 * Express 5 forwards a rejected async handler to middlewares/errorHandler, which
 * owns the translation from error to status code. That is why a service can
 * throw `notFound(...)` and the client sees a 404 without any handler here
 * mentioning 404.
 *
 * @module controllers/eventController
 */

const eventService = require("../services/eventService");
const ticketService = require("../services/ticketService");
const MESSAGES = require("../constants/messages");
const { TICKET_CATEGORIES, DEFAULT_TICKET_CATEGORY } = require("../constants/ticketCategories");
const { validationFailed } = require("../utils/httpError");

/**
 * Coerces a request value to a number without JavaScript's loose conversions.
 *
 * @param {*} value Raw value from the request body.
 * @returns {number|null} The number, or null when absent or non-numeric.
 */
const toNumber = (value) => {
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim() !== "") return Number(value);
    return null;
};

/**
 * Validates and normalises a ticket type request body, or throws.
 *
 * Runs before any database work so obviously bad input never opens a
 * transaction, and collects every problem rather than stopping at the first, so
 * a form can show all of them at once.
 *
 * Normalising here is what lets ticketService skip defensive fallbacks: by the
 * time the returned data reaches it, `category` and `isActive` are always set.
 *
 * Shared by create and update, since PUT replaces every mutable field.
 *
 * @param {object} body The raw `req.body`.
 * @returns {{name: string, price: number, capacity: number, category: string, isActive: boolean}}
 *   Values safe to pass to a service.
 * @throws {Error} 400 carrying `errors`, one entry per invalid field.
 */
const parseTicketTypeBody = (body) => {
    const errors = [];
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const price = toNumber(body.price);
    const capacity = toNumber(body.capacity);
    const category = body.category === undefined || body.category === null || body.category === ""
        ? DEFAULT_TICKET_CATEGORY
        : body.category;

    if (!name) {
        errors.push(MESSAGES.VALIDATION.NAME_REQUIRED);
    }

    if (price === null || !Number.isFinite(price) || price < 0) {
        errors.push(MESSAGES.VALIDATION.PRICE_INVALID);
    }

    if (capacity === null || !Number.isInteger(capacity) || capacity <= 0) {
        errors.push(MESSAGES.VALIDATION.CAPACITY_INVALID);
    }

    if (!TICKET_CATEGORIES.includes(category)) {
        errors.push(MESSAGES.VALIDATION.CATEGORY_INVALID);
    }

    if (errors.length > 0) {
        throw validationFailed(errors);
    }

    return {
        name,
        price,
        capacity,
        category,
        isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    };
};

/**
 * POST /api/events/:eventId/ticket-types - adds a ticket type to an event.
 *
 * @param {import("express").Request} req  `params.eventId`, ticket type body.
 * @param {import("express").Response} res 201 `{ticketType}`, 400 `{errors}` for
 *   a malformed body, or `{error}` with the status the service raised.
 * @returns {Promise<void>}
 */
const addTicketTypeToEvent = async (req, res) => {
    const data = parseTicketTypeBody(req.body);
    const ticketType = await ticketService.createTicketType(req.params.eventId, data);

    res.status(201).json({ ticketType });
};

/**
 * PUT /api/events/:eventId/ticket-types/:ticketTypeId - replaces a ticket type.
 *
 * A full replace rather than a patch: the edit form is prefilled with every
 * field and always sends all of them.
 *
 * @param {import("express").Request} req  `params.eventId`, `params.ticketTypeId`, body.
 * @param {import("express").Response} res 200 `{ticketType}`, 400 `{errors}`, or
 *   `{error}` with the status the service raised (404/409/400).
 * @returns {Promise<void>}
 */
const updateTicketTypeOfEvent = async (req, res) => {
    const data = parseTicketTypeBody(req.body);
    const ticketType = await ticketService.updateTicketType(
        req.params.eventId,
        req.params.ticketTypeId,
        data
    );

    res.json({ ticketType });
};

/**
 * DELETE /api/events/:eventId/ticket-types/:ticketTypeId - removes a ticket type.
 *
 * @param {import("express").Request} req  `params.eventId`, `params.ticketTypeId`.
 * @param {import("express").Response} res 200 `{deletedTicketType}`, 404 when it
 *   does not exist, or 409 when orders or issued tickets reference it.
 * @returns {Promise<void>}
 */
const deleteTicketTypeOfEvent = async (req, res) => {
    const deletedTicketType = await ticketService.deleteTicketType(
        req.params.eventId,
        req.params.ticketTypeId
    );

    res.json({ deletedTicketType });
};

/**
 * POST /api/events - creates an event owned by the authenticated user.
 *
 * @param {import("express").Request} req  Event body; `req.user` supplies the owner.
 * @param {import("express").Response} res 201 `{message, eventResp}`.
 * @returns {Promise<void>}
 */
const addEvent = async (req, res) => {
    const successResponse = await eventService.addEvent(req.body, req.user);

    res.status(201).json(successResponse);
}

/**
 * GET /api/events - lists every event.
 *
 * @param {import("express").Request} req  Unused.
 * @param {import("express").Response} res 200 `{events}`.
 * @returns {Promise<void>}
 */
const getEvents = async (req, res) => {
    const allEvents = await eventService.getEvents();

    res.json({events: allEvents});
}

/**
 * GET /api/events/:eventId - one event, with a `soldCount` per ticket type.
 *
 * @param {import("express").Request} req  `params.eventId`.
 * @param {import("express").Response} res 200 `{event}`, or 404.
 * @returns {Promise<void>}
 */
const getEventById = async (req, res) => {
    const event = await eventService.getEventById(req.params.eventId);

    res.json({event: event});
}

/**
 * PUT /api/events/:eventId - applies changes to an event.
 *
 * @param {import("express").Request} req  `params.eventId` and the fields to change.
 * @param {import("express").Response} res 200 `{updatedEvent}`, or 404.
 * @returns {Promise<void>}
 */
const updateEvent = async (req, res) => {
    const updatedEvent = await eventService.updateEvent(req.params.eventId, req.body);

    res.json({updatedEvent: updatedEvent});
}

/**
 * DELETE /api/events/:eventId - removes an event.
 *
 * The id must come from the path: authorizeEventRole authorizes
 * `req.params.eventId`, so honouring an id in the body would let the owner of
 * one event pass authorization for it and delete a different one.
 *
 * @param {import("express").Request} req  `params.eventId`.
 * @param {import("express").Response} res 200 `{deletedEvent}`, or 404.
 * @returns {Promise<void>}
 */
const deleteEvent = async (req, res) => {
    const deletedEvent = await eventService.deleteEvent(req.params.eventId);

    res.json({deletedEvent: deletedEvent});
}

module.exports = {
    addEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    addTicketTypeToEvent,
    updateTicketTypeOfEvent,
    deleteTicketTypeOfEvent
};
