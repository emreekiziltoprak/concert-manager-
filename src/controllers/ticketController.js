const ticketService = require('../services/ticketService');

const getMyTickets = async (req, res) => {
  try {
    const userId = req.user.id;
    const tickets = await ticketService.getUserTicketsWithQrCode(userId);
    
    res.status(200).json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ error: "Tickets cant be fetched." });
  }
};

const scanTicket = async (req, res) => {
  try {
    const { ticketId } = req.body;

    if (!ticketId) {
      return res.status(400).json({ error: "Ticket ID is required." });
    }

    const scannedTicket = await ticketService.validateUserTicket(ticketId);

    res.status(200).json({ 
      message: "Ticket validated successfully.", 
      ticket: scannedTicket 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getMyTickets,
  scanTicket
};