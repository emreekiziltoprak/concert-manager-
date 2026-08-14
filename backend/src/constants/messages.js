/**
 * Every message the event and ticket type endpoints send back to a client.
 *
 * These strings are part of the API contract: the frontend renders them
 * verbatim (see `extractApiError` in EditEventModal.jsx) and the integration
 * tests assert on them. Scattered across services they drifted apart -- a
 * missing event was reported as "Event not found" in one place and "Event
 * cannot be found" in another -- so they live here instead, where the whole
 * vocabulary can be read and reworded at once.
 *
 * Messages that need runtime detail are exported as functions rather than
 * template strings, so the values they interpolate stay visible at the call
 * site and cannot be forgotten.
 *
 * Scope note: only the event / ticket type / authorization paths are routed
 * through this module so far. payment, order and auth services still hold their
 * own strings inline and can be migrated the same way.
 *
 * @module constants/messages
 */

const { TICKET_CATEGORIES } = require("./ticketCategories");

/** Messages about the Event record itself. */
const EVENT = {
    /** 404 - no such event, or it is soft-deleted (`deletedAt` is set). */
    NOT_FOUND: "Event not found",
    /** 400 - a route was mounted without the `:eventId` segment. */
    ID_MISSING: "Event ID parameter is missing."
};

/** Messages about TicketType records and the rules that constrain them. */
const TICKET_TYPE = {
    /** 404 - no such ticket type, or it belongs to a different event. */
    NOT_FOUND: "Ticket type not found",

    /**
     * 409 - another ticket type of the same event already uses this name.
     * Matching is case-insensitive, so the name is echoed back exactly as typed
     * to make clear which input was rejected.
     *
     * @param {string} name Name the client tried to use, already trimmed.
     * @returns {string} Message for the client.
     */
    DUPLICATE_NAME: (name) =>
        `A ticket type named "${name}" already exists for this event.`,

    /**
     * 409 - each category may be used by at most one ticket type per event,
     * which is what lets the modal grey out the categories already in use.
     *
     * @param {string} category One of TICKET_CATEGORIES.
     * @returns {string} Message for the client.
     */
    DUPLICATE_CATEGORY: (category) =>
        `A ticket type with category ${category} already exists for this event.`,

    /**
     * 400 - the ticket types of an event may not allocate more seats than the
     * event holds. All three numbers are included because the client needs the
     * remaining allowance to fix the input, and the other two explain it.
     *
     * @param {number} remaining      Seats still unallocated (never negative).
     * @param {number} eventCapacity  The event's total capacity.
     * @param {number} used           Seats the other ticket types allocate.
     * @returns {string} Message for the client.
     */
    CAPACITY_EXCEEDED: (remaining, eventCapacity, used) =>
        `Capacity cannot exceed ${remaining}. The event capacity is ${eventCapacity} ` +
        `and the other ticket types already allocate ${used}.`,

    /**
     * 409 - capacity may not be lowered past the tickets already spoken for,
     * which would make the available stock negative for buyers mid-checkout.
     *
     * @param {number} reserved Quantity on PENDING or SUCCESS orders.
     * @returns {string} Message for the client.
     */
    CAPACITY_BELOW_RESERVED: (reserved) =>
        `Capacity cannot be lower than ${reserved}, the number of tickets already ` +
        `sold or reserved for this ticket type.`,

    /**
     * 409 - the delete was refused because rows point at this ticket type. The
     * counts tell the user how much history they would lose, and the closing
     * sentence names the supported alternative.
     *
     * @param {number} orderItems Order items referencing the ticket type.
     * @param {number} tickets    Issued tickets referencing the ticket type.
     * @returns {string} Message for the client.
     */
    DELETE_BLOCKED: (orderItems, tickets) =>
        `This ticket type has ${orderItems} order(s) and ${tickets} issued ticket(s) ` +
        `and cannot be deleted. Deactivate it instead.`,

    /**
     * 409 - same refusal, but raised from the foreign key rather than the count
     * query, so no exact numbers are available.
     */
    DELETE_BLOCKED_BY_REFERENCE:
        "This ticket type is referenced by existing orders and cannot be deleted. " +
        "Deactivate it instead."
};

/** Messages about individual issued tickets, used when scanning at the door. */
const TICKET = {
    /** 400 - the scan request carried no ticket id. */
    ID_REQUIRED: "Ticket ID is required.",
    /** The scanned id matches no ticket. */
    INVALID: "Invalid ticket! No ticket matching this ID was found in the system.",
    /** The ticket exists but was already scanned; a warning, not a lookup failure. */
    ALREADY_USED: "WARNING: This ticket has already been used!",
    /** Success, shown to whoever is working the door. */
    VALIDATED: "Ticket validated successfully."
};

/** Messages produced while authenticating and authorizing a request. */
const AUTH = {
    /** 401 - no bearer token on the request, or no user on `req`. */
    LOGIN_REQUIRED: "Login required",
    /** 401 - the token failed signature or expiry verification. */
    INVALID_TOKEN: "Token is invalid",
    /** 403 - the user holds no accepted role on this specific event. */
    EVENT_ROLE_REQUIRED:
        "You do not have the required event permissions (e.g., OWNER/CO_ORGANISER) " +
        "to perform this action.",
    /** 403 - the user's account-wide role is not allowed to call this route. */
    GLOBAL_ROLE_REQUIRED:
        "Access denied. You do not have the required global permissions for this action.",
    /** 500 - the authorization lookup itself failed. */
    AUTHORIZATION_FAILED: "Internal server error during authorization."
};

/**
 * Field-level messages returned as `{errors: [...]}` before any database work.
 * Phrased as "<field> must ..." so several can be listed together and still read
 * as one sentence each.
 */
const VALIDATION = {
    NAME_REQUIRED: "name is required.",
    PRICE_INVALID: "price must be greater than or equal to 0.",
    CAPACITY_INVALID: "capacity must be an integer greater than 0.",
    CATEGORY_INVALID: `category must be one of: ${TICKET_CATEGORIES.join(", ")}.`
};

module.exports = { EVENT, TICKET_TYPE, TICKET, AUTH, VALIDATION };
