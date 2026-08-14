
import type { Request, Response } from "express";
import * as ticketService from '../services/ticketService';
import * as MESSAGES from '../constants/messages';
import { badRequest } from '../utils/httpError';
import { requireUser } from '../utils/requireUser';

const getMyTickets = async (req: Request, res: Response): Promise<void> => {
  const tickets = await ticketService.getUserTicketsWithQrCode(requireUser(req).userId);

  res.json(tickets);
};

const scanTicket = async (req: Request, res: Response): Promise<void> => {
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

export {
  getMyTickets,
  scanTicket
};
