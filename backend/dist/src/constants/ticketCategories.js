"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTicketCategory = exports.DEFAULT_TICKET_CATEGORY = exports.TICKET_CATEGORIES = void 0;
const prisma_1 = require("../types/prisma");
// Derived from the Prisma enum rather than hand-listed, so a schema change
// propagates instead of drifting.
exports.TICKET_CATEGORIES = Object.values(prisma_1.TicketCategory);
exports.DEFAULT_TICKET_CATEGORY = prisma_1.TicketCategory.STANDARD;
const isTicketCategory = (value) => typeof value === "string" && exports.TICKET_CATEGORIES.includes(value);
exports.isTicketCategory = isTicketCategory;
//# sourceMappingURL=ticketCategories.js.map