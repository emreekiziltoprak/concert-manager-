"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALIDATION = exports.AUTH = exports.TICKET = exports.TICKET_TYPE = exports.EVENT = void 0;
const ticketCategories_1 = require("./ticketCategories");
exports.EVENT = {
    NOT_FOUND: "Event not found",
    ID_MISSING: "Event ID parameter is missing."
};
exports.TICKET_TYPE = {
    NOT_FOUND: "Ticket type not found",
    DUPLICATE_NAME: (name) => `A ticket type named "${name}" already exists for this event.`,
    DUPLICATE_CATEGORY: (category) => `A ticket type with category ${category} already exists for this event.`,
    CAPACITY_EXCEEDED: (remaining, eventCapacity, used) => `Capacity cannot exceed ${remaining}. The event capacity is ${eventCapacity} ` +
        `and the other ticket types already allocate ${used}.`,
    CAPACITY_BELOW_RESERVED: (reserved) => `Capacity cannot be lower than ${reserved}, the number of tickets already ` +
        `sold or reserved for this ticket type.`,
    DELETE_BLOCKED: (orderItems, tickets) => `This ticket type has ${orderItems} order(s) and ${tickets} issued ticket(s) ` +
        `and cannot be deleted. Deactivate it instead.`,
    DELETE_BLOCKED_BY_REFERENCE: "This ticket type is referenced by existing orders and cannot be deleted. " +
        "Deactivate it instead."
};
exports.TICKET = {
    ID_REQUIRED: "Ticket ID is required.",
    INVALID: "Invalid ticket! No ticket matching this ID was found in the system.",
    ALREADY_USED: "WARNING: This ticket has already been used!",
    VALIDATED: "Ticket validated successfully."
};
exports.AUTH = {
    LOGIN_REQUIRED: "Login required",
    INVALID_TOKEN: "Token is invalid",
    EVENT_ROLE_REQUIRED: "You do not have the required event permissions (e.g., OWNER/CO_ORGANISER) " +
        "to perform this action.",
    GLOBAL_ROLE_REQUIRED: "Access denied. You do not have the required global permissions for this action.",
    AUTHORIZATION_FAILED: "Internal server error during authorization."
};
exports.VALIDATION = {
    NAME_REQUIRED: "name is required.",
    PRICE_INVALID: "price must be greater than or equal to 0.",
    CAPACITY_INVALID: "capacity must be an integer greater than 0.",
    CATEGORY_INVALID: `category must be one of: ${ticketCategories_1.TICKET_CATEGORIES.join(", ")}.`
};
//# sourceMappingURL=messages.js.map