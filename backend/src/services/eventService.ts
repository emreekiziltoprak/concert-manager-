
import prisma = require("../utils/prismaClient");
import * as MESSAGES from "../constants/messages";
import { notFound } from "../utils/httpError";
import { Prisma } from "../types/prisma";

type StockHoldingStatus = "PENDING" | "SUCCESS";

const STOCK_HOLDING_ORDER_STATUSES = Object.freeze([
    "PENDING", "SUCCESS"
]) as StockHoldingStatus[];

const eventRoleSummary = {select: {userId: true, role: true}};

export type AddEventInput =
    Omit<Prisma.EventUncheckedCreateInput, "organizerId" | "ticketTypes" | "eventRoles"> & {
        organizerId?: string;
        ticketTypes?: Prisma.TicketTypeCreateWithoutEventInput[];
        eventRole?: unknown;
        eventRoles?: unknown;
    };

const addEvent = async (eventData: AddEventInput, user: { userId: string }) => {
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

const getEvents = async () => {
    return await prisma.event.findMany({
        include: {
            ticketTypes: true,
            eventRoles: eventRoleSummary
        }
    });
};

const getEventById = async (eventId: string) => {
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

const updateEvent = async (eventId: string, event: Prisma.EventUncheckedUpdateInput) => {
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

const deleteEvent = async(eventId: string) =>{
    const existingEvent = await prisma.event.findFirst({where: {id: eventId, deletedAt: null}});
    if(!existingEvent) {throw notFound(MESSAGES.EVENT.NOT_FOUND)}

    const deletedEvent  = await prisma.event.delete({
        where: {id: eventId},
    });

    return deletedEvent;
};

export {addEvent, getEvents, getEventById, updateEvent, deleteEvent};
