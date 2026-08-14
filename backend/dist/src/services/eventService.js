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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEvent = exports.updateEvent = exports.getEventById = exports.getEvents = exports.addEvent = void 0;
const prisma = require("../utils/prismaClient");
const MESSAGES = __importStar(require("../constants/messages"));
const httpError_1 = require("../utils/httpError");
const STOCK_HOLDING_ORDER_STATUSES = Object.freeze([
    "PENDING", "SUCCESS"
]);
const eventRoleSummary = { select: { userId: true, role: true } };
const addEvent = async (eventData, user) => {
    const { ticketTypes, eventRole, eventRoles, organizerId, ...rest } = eventData;
    const ownerId = user.userId;
    const eventResp = await prisma.event.create({
        data: {
            ...rest,
            organizerId: ownerId,
            ...(ticketTypes?.length ? { ticketTypes: { create: ticketTypes } } : {}),
            eventRoles: {
                create: { userId: ownerId, assignedById: ownerId, role: "OWNER" }
            }
        },
        include: {
            ticketTypes: true,
            eventRoles: true
        }
    });
    return { message: "Event successfully created", eventResp };
};
exports.addEvent = addEvent;
const getEvents = async () => {
    return await prisma.event.findMany({
        include: {
            ticketTypes: true,
            eventRoles: eventRoleSummary
        }
    });
};
exports.getEvents = getEvents;
const getEventById = async (eventId) => {
    const event = await prisma.event.findFirst({
        where: { id: eventId, deletedAt: null },
        include: {
            ticketTypes: true,
            eventRoles: eventRoleSummary
        }
    });
    if (!event) {
        throw (0, httpError_1.notFound)(MESSAGES.EVENT.NOT_FOUND);
    }
    const reserved = await prisma.orderItem.groupBy({
        by: ["ticketTypeId"],
        where: {
            ticketTypeId: { in: event.ticketTypes.map((ticketType) => ticketType.id) },
            order: {
                status: { in: STOCK_HOLDING_ORDER_STATUSES }
            }
        },
        _sum: {
            quantity: true
        }
    });
    const soldCounts = new Map(reserved.map((row) => [row.ticketTypeId, row._sum.quantity || 0]));
    return {
        ...event,
        ticketTypes: event.ticketTypes.map((ticketType) => ({
            ...ticketType,
            soldCount: soldCounts.get(ticketType.id) || 0
        }))
    };
};
exports.getEventById = getEventById;
const updateEvent = async (eventId, event) => {
    const existingEvent = await prisma.event.findFirst({
        where: {
            id: eventId,
            deletedAt: null
        }
    });
    if (!existingEvent)
        throw (0, httpError_1.notFound)(MESSAGES.EVENT.NOT_FOUND);
    const updatedEvent = await prisma.event.update({
        where: { id: eventId },
        data: event
    });
    return updatedEvent;
};
exports.updateEvent = updateEvent;
const deleteEvent = async (eventId) => {
    const existingEvent = await prisma.event.findFirst({ where: { id: eventId, deletedAt: null } });
    if (!existingEvent) {
        throw (0, httpError_1.notFound)(MESSAGES.EVENT.NOT_FOUND);
    }
    const deletedEvent = await prisma.event.delete({
        where: { id: eventId },
    });
    return deletedEvent;
};
exports.deleteEvent = deleteEvent;
//# sourceMappingURL=eventService.js.map