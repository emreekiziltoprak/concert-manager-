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
            orderItem: {
                include: {
                    tickets: true,
                    ticketType: true
                }
            }
        }
    });

    return order;
}

module.exports = {
    getUserTicketsWithQrCode,
    validateUserTicket,
    getOrderTicketsEmail
};