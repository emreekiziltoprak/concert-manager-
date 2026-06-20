const prisma = require("../utils/prismaClient");
const QRCode = require('qrcode');

const getUserTicketsWithQrCode = async (userId) => {
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

const validateUserTicket = async (ticketId) => {
    const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },

    });

    if (!ticket) {
    throw new Error("Invalid ticket! No ticket matching this ID was found in the system.");
    }

    if (ticket.isUsed) {
    throw new Error("WARNING: This ticket has already been used!");
    }

    const updatedTicket = await prisma.ticket.update({
        where: {id : ticketId},
        data: {isUsed: true}
    });

    return updatedTicket;
};

const getOrderTicketsEmail = async (orderId) => {
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

const createTicketType = async (eventId, ticketTypeData) => {
    const createdTicketType = await prisma.$transaction(async (tx) => {
        const event = await tx.event.findUnique({
            where: { id: eventId },
            select: { id: true, deletedAt: true },
        });

        if (!event || event.deletedAt !== null) {
            const error = new Error("Event not found");
            error.statusCode = 404;
            throw error;
        }

        return tx.ticketType.create({
            data: {
                eventId,
                name: ticketTypeData.name.trim(),
                price: String(ticketTypeData.price),
                totalCount: ticketTypeData.capacity,
                category: ticketTypeData.category || "STANDARD",
                isActive: ticketTypeData.isActive ?? true,
            },
            include: {
                event: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });
    });

    return createdTicketType;
};

module.exports = {
    getUserTicketsWithQrCode,
    validateUserTicket,
    getOrderTicketsEmail,
    createTicketType
};
