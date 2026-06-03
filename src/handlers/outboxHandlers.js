const { sendTicketEmail } = require('../services/emailService');

const outboxHandlers = {
    'SEND_TICKET_EMAIL': async (payload) => {
        const { userEmail, fullName, orderId } = payload;
        
        await sendTicketEmail(userEmail, fullName, orderId);
    }
    
};

module.exports = outboxHandlers;