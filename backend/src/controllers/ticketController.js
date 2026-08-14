/**
 * HTTP layer for issued tickets.
 *
 * Like eventController, these handlers only call a service and send the success
 * response; middlewares/errorHandler turns anything thrown into a status code.
 *
 * @module controllers/ticketController
 */

const ticketService = require('../services/ticketService');
const MESSAGES = require('../constants/messages');
const { badRequest } = require('../utils/httpError');

/**
 * GET /api/tickets/my-tickets - the caller's tickets, each with a QR code.
 *
 * @param {import("express").Request} req  `req.user` supplies the owner.
 * @param {import("express").Response} res 200 with the ticket array.
 * @returns {Promise<void>}
 */
const getMyTickets = async (req, res) => {
  const tickets = await ticketService.getUserTicketsWithQrCode(req.user.userId);

  res.json(tickets);
};

/**
 * POST /api/tickets/scan - validates a ticket at the door and marks it used.
 *
 * @param {import("express").Request} req  `body.ticketId` read from the QR code.
 * @param {import("express").Response} res 200 with the redeemed ticket.
 * @returns {Promise<void>}
 * @throws {Error} 400 when the id is missing, unknown, or already scanned.
 */
const scanTicket = async (req, res) => {
  const { ticketId } = req.body;

  if (!ticketId) {
    throw badRequest(MESSAGES.TICKET.ID_REQUIRED);
  }

  const scannedTicket = await ticketService.validateUserTicket(ticketId);

  res.json({
    message: MESSAGES.TICKET.VALIDATED,
    ticket: scannedTicket
  });
};

module.exports = {
  getMyTickets,
  scanTicket
};
