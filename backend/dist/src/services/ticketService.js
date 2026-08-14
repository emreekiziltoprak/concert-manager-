"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTicketType = exports.updateTicketType = exports.createTicketType = exports.getOrderTicketsEmail = exports.validateUserTicket = exports.getUserTicketsWithQrCode = void 0;
const prisma = require("../utils/prismaClient");
const qrcode_1 = __importDefault(require("qrcode"));
const MESSAGES = __importStar(require("../constants/messages"));
const httpError_1 = require("../utils/httpError");
const errorMessage_1 = require("../utils/errorMessage");
const getUserTicketsWithQrCode = async (userId) => {
    const tickets = await prisma.ticket.findMany({
        where: {
            userId: userId,
        },
    });
    const ticketsWithQr = await Promise.all(tickets.map(async (ticket) => {
        const qrCodeDataURL = await qrcode_1.default.toDataURL(ticket.id.toString());
        return {
            ...ticket,
            qrCode: qrCodeDataURL,
        };
    }));
    return ticketsWithQr;
};
exports.getUserTicketsWithQrCode = getUserTicketsWithQrCode;
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
        where: { id: ticketId },
        data: { isUsed: true }
    });
    return updatedTicket;
};
exports.validateUserTicket = validateUserTicket;
const getOrderTicketsEmail = async (orderId) => {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
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
};
exports.getOrderTicketsEmail = getOrderTicketsEmail;
const STOCK_HOLDING_ORDER_STATUSES = Object.freeze([
    "PENDING", "SUCCESS"
]);
const eventSummary = { event: { select: { id: true, title: true } } };
const lockEvent = async (tx, eventId) => {
    // `noUncheckedIndexedAccess` makes this destructure `LockedEventRow | undefined`,
    // which the guard below narrows.
    const [event] = await tx.$queryRaw `
        SELECT id, capacity FROM "events"
        WHERE id = ${eventId} AND "deletedAt" IS NULL FOR UPDATE`;
    if (!event)
        throw (0, httpError_1.notFound)(MESSAGES.EVENT.NOT_FOUND);
    return event;
};
const findTicketType = async (tx, eventId, ticketTypeId) => {
    const ticketType = await tx.ticketType.findFirst({
        where: { id: ticketTypeId, eventId },
        select: { id: true },
    });
    if (!ticketType)
        throw (0, httpError_1.notFound)(MESSAGES.TICKET_TYPE.NOT_FOUND);
    return ticketType;
};
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
const assertNoConflicts = async (tx, event, data, ticketTypeId) => {
    const otherTicketTypes = await tx.ticketType.findMany({
        where: { eventId: event.id, ...(ticketTypeId ? { id: { not: ticketTypeId } } : {}) },
        select: { name: true, category: true, totalCount: true },
    });
    const name = data.name.trim();
    if (otherTicketTypes.some((sibling) => sibling.name.trim().toLowerCase() === name.toLowerCase())) {
        throw (0, httpError_1.conflict)(MESSAGES.TICKET_TYPE.DUPLICATE_NAME(name));
    }
    if (otherTicketTypes.some((sibling) => sibling.category === data.category)) {
        throw (0, httpError_1.conflict)(MESSAGES.TICKET_TYPE.DUPLICATE_CATEGORY(data.category));
    }
    const used = otherTicketTypes.reduce((sum, sibling) => sum + sibling.totalCount, 0);
    const remaining = Math.max(event.capacity - used, 0);
    if (data.capacity > remaining) {
        throw (0, httpError_1.badRequest)(MESSAGES.TICKET_TYPE.CAPACITY_EXCEEDED(remaining, event.capacity, used));
    }
};
const toTicketTypeRow = (data) => ({
    name: data.name.trim(),
    price: String(data.price),
    totalCount: data.capacity,
    // The single assertion in this file. eventController rejects any category
    // outside TICKET_CATEGORIES before the body gets here, but that check is a
    // `readonly string[]` membership test, which TypeScript cannot use to narrow.
    category: data.category,
    isActive: data.isActive,
});
const createTicketType = (eventId, data) => prisma.$transaction(async (tx) => {
    const event = await lockEvent(tx, eventId);
    await assertNoConflicts(tx, event, data);
    const created = await tx.ticketType.create({
        data: { eventId, ...toTicketTypeRow(data) },
        include: eventSummary,
    });
    return { ...created, soldCount: 0 };
});
exports.createTicketType = createTicketType;
const updateTicketType = (eventId, ticketTypeId, data) => prisma.$transaction(async (tx) => {
    const event = await lockEvent(tx, eventId);
    await findTicketType(tx, eventId, ticketTypeId);
    await assertNoConflicts(tx, event, data, ticketTypeId);
    const reserved = await getReservedQuantity(tx, ticketTypeId);
    if (data.capacity < reserved) {
        throw (0, httpError_1.conflict)(MESSAGES.TICKET_TYPE.CAPACITY_BELOW_RESERVED(reserved));
    }
    const updated = await tx.ticketType.update({
        where: { id: ticketTypeId },
        data: toTicketTypeRow(data),
        include: eventSummary,
    });
    return { ...updated, soldCount: reserved };
});
exports.updateTicketType = updateTicketType;
const deleteTicketType = (eventId, ticketTypeId) => prisma.$transaction(async (tx) => {
    await lockEvent(tx, eventId);
    await findTicketType(tx, eventId, ticketTypeId);
    const orderItems = await tx.orderItem.count({ where: { ticketTypeId } });
    const tickets = await tx.ticket.count({ where: { ticketTypeId } });
    if (orderItems > 0 || tickets > 0) {
        throw (0, httpError_1.conflict)(MESSAGES.TICKET_TYPE.DELETE_BLOCKED(orderItems, tickets));
    }
    try {
        return await tx.ticketType.delete({ where: { id: ticketTypeId } });
    }
    catch (error) {
        // errorCode, not `instanceof Prisma.PrismaClientKnownRequestError`:
        // instanceof is stricter than the duck-typed check this replaces, and
        // no test covers this branch, so a migration must not narrow it.
        if ((0, errorMessage_1.errorCode)(error) === "P2003") {
            throw (0, httpError_1.conflict)(MESSAGES.TICKET_TYPE.DELETE_BLOCKED_BY_REFERENCE);
        }
        throw error;
    }
});
exports.deleteTicketType = deleteTicketType;
//# sourceMappingURL=ticketService.js.map