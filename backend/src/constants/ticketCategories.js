/**
 * The TicketCategory enum from prisma/schema.prisma, mirrored for JavaScript.
 *
 * Keep in sync with `enum TicketCategory` in prisma/schema.prisma and with
 * `ticketCategoryOptions` in frontend/src/components/EditEventModal.jsx.
 *
 * @module constants/ticketCategories
 */

/** @type {ReadonlyArray<string>} Every accepted ticket category. */
const TICKET_CATEGORIES = Object.freeze([
    "STANDARD",
    "CHILD",
    "STUDENT",
    "EARLY_BID",
    "FREE"
]);

/** @type {string} Category applied when the request omits one. */
const DEFAULT_TICKET_CATEGORY = "STANDARD";

module.exports = { TICKET_CATEGORIES, DEFAULT_TICKET_CATEGORY };
