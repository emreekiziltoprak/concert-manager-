const ticketService  = require("../services/ticketService");
const emailService = require("../services/emailService");

const outboxHandlers = {
    'SEND_TICKET_EMAIL': async (payload) => {
        const { userEmail, fullName, orderId } = payload;
        
        const ticketData = await ticketService.getOrderTicketsEmail(orderId);

        await emailService.sendTicketEmail(
            userEmail,
            fullName,
            ticketData
        );

    }
    
};

module.exports = outboxHandlers;