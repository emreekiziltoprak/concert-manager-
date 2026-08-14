
import prisma = require("../utils/prismaClient");
import QRCode from 'qrcode';
import * as MESSAGES from "../constants/messages";
import { notFound, badRequest, conflict } from "../utils/httpError";
import { errorCode } from "../utils/errorMessage";
import { Prisma } from "../types/prisma";
import type { TransactionClient } from "../types/prisma";

type TicketCategory = NonNullable<Prisma.TicketTypeCreateManyInput["category"]>;

const getUserTicketsWithQrCode = async (userId: string) => {
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

const validateUserTicket = async (ticketId: string) => {
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

const getOrderTicketsEmail = async (orderId: string) => {
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

type StockHoldingStatus = "PENDING" | "SUCCESS";

const STOCK_HOLDING_ORDER_STATUSES = Object.freeze([
    "PENDING", "SUCCESS"
]) as StockHoldingStatus[];

const eventSummary = { event: { select: { id: true, title: true } } };

interface LockedEventRow {
    id: string;
    capacity: number;
}

const lockEvent = async (tx: TransactionClient, eventId: string): Promise<LockedEventRow> => {
    // `noUncheckedIndexedAccess` makes this destructure `LockedEventRow | undefined`,
    // which the guard below narrows.
    const [event] = await tx.$queryRaw<LockedEventRow[]>`
        SELECT id, capacity FROM "events"
        WHERE id = ${eventId} AND "deletedAt" IS NULL FOR UPDATE`;

    if (!event) throw notFound(MESSAGES.EVENT.NOT_FOUND);

    return event;
};

const findTicketType = async (tx: TransactionClient, eventId: string, ticketTypeId: string) => {
    const ticketType = await tx.ticketType.findFirst({
        where: { id: ticketTypeId, eventId },
        select: { id: true },
    });

    if (!ticketType) throw notFound(MESSAGES.TICKET_TYPE.NOT_FOUND);

    return ticketType;
};

const getReservedQuantity = async (tx: TransactionClient, ticketTypeId: string): Promise<number> => {
    const aggregations = await tx.orderItem.aggregate({
        where: {
            ticketTypeId,
            order: { status: { in: STOCK_HOLDING_ORDER_STATUSES } },
        },
        _sum: { quantity: true },
    });

    return aggregations._sum.quantity || 0;
};

export interface TicketTypeBody {
    name: string;
    price: number;
    capacity: number;
    category: string;
    isActive: boolean;
}

const assertNoConflicts = async (
    tx: TransactionClient,
    event: LockedEventRow,
    data: TicketTypeBody,
    ticketTypeId?: string
): Promise<void> => {
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

const toTicketTypeRow = (data: TicketTypeBody) => ({
    name: data.name.trim(),
    price: String(data.price),
    totalCount: data.capacity,
    // The single assertion in this file. eventController rejects any category
    // outside TICKET_CATEGORIES before the body gets here, but that check is a
    // `readonly string[]` membership test, which TypeScript cannot use to narrow.
    category: data.category as TicketCategory,
    isActive: data.isActive,
});

const createTicketType = (eventId: string, data: TicketTypeBody) =>
    prisma.$transaction(async (tx) => {
        const event = await lockEvent(tx, eventId);

        await assertNoConflicts(tx, event, data);

        const created = await tx.ticketType.create({
            data: { eventId, ...toTicketTypeRow(data) },
            include: eventSummary,
        });

        return { ...created, soldCount: 0 };
    });

const updateTicketType = (eventId: string, ticketTypeId: string, data: TicketTypeBody) =>
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

const deleteTicketType = (eventId: string, ticketTypeId: string) =>
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
            // errorCode, not `instanceof Prisma.PrismaClientKnownRequestError`:
            // instanceof is stricter than the duck-typed check this replaces, and
            // no test covers this branch, so a migration must not narrow it.
            if (errorCode(error) === "P2003") {
                throw conflict(MESSAGES.TICKET_TYPE.DELETE_BLOCKED_BY_REFERENCE);
            }
            throw error;
        }
    });

export {
    getUserTicketsWithQrCode,
    validateUserTicket,
    getOrderTicketsEmail,
    createTicketType,
    updateTicketType,
    deleteTicketType
};
