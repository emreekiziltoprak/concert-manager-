
import { TICKET_CATEGORIES } from "./ticketCategories";

export const EVENT = {
    NOT_FOUND: "Event not found",
    ID_MISSING: "Event ID parameter is missing."
};

export const TICKET_TYPE = {
    NOT_FOUND: "Ticket type not found",

    DUPLICATE_NAME: (name: string): string =>
        `A ticket type named "${name}" already exists for this event.`,

    DUPLICATE_CATEGORY: (category: string): string =>
        `A ticket type with category ${category} already exists for this event.`,

    CAPACITY_EXCEEDED: (remaining: number, eventCapacity: number, used: number): string =>
        `Capacity cannot exceed ${remaining}. The event capacity is ${eventCapacity} ` +
        `and the other ticket types already allocate ${used}.`,

    CAPACITY_BELOW_RESERVED: (reserved: number): string =>
        `Capacity cannot be lower than ${reserved}, the number of tickets already ` +
        `sold or reserved for this ticket type.`,

    DELETE_BLOCKED: (orderItems: number, tickets: number): string =>
        `This ticket type has ${orderItems} order(s) and ${tickets} issued ticket(s) ` +
        `and cannot be deleted. Deactivate it instead.`,

    DELETE_BLOCKED_BY_REFERENCE:
        "This ticket type is referenced by existing orders and cannot be deleted. " +
        "Deactivate it instead."
};

export const TICKET = {
    ID_REQUIRED: "Ticket ID is required.",
    INVALID: "Invalid ticket! No ticket matching this ID was found in the system.",
    ALREADY_USED: "WARNING: This ticket has already been used!",
    VALIDATED: "Ticket validated successfully."
};

export const AUTH = {
    LOGIN_REQUIRED: "Login required",
    INVALID_TOKEN: "Token is invalid",
    EVENT_ROLE_REQUIRED:
        "You do not have the required event permissions (e.g., OWNER/CO_ORGANISER) " +
        "to perform this action.",
    GLOBAL_ROLE_REQUIRED:
        "Access denied. You do not have the required global permissions for this action.",
    AUTHORIZATION_FAILED: "Internal server error during authorization."
};

export const VALIDATION = {
    NAME_REQUIRED: "name is required.",
    PRICE_INVALID: "price must be greater than or equal to 0.",
    CAPACITY_INVALID: "capacity must be an integer greater than 0.",
    CATEGORY_INVALID: `category must be one of: ${TICKET_CATEGORIES.join(", ")}.`
};
