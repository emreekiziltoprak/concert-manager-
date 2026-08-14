const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const  authMiddleware  = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Issued ticket endpoints
 */

/**
 * @swagger
 * /api/tickets/my-tickets:
 *   get:
 *     summary: Get the authenticated user's tickets, each with a QR code
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tickets, each carrying a qrCode data URL
 *       401:
 *         description: Unauthorized
 */
router.get('/my-tickets', authMiddleware, ticketController.getMyTickets);

/**
 * @swagger
 * /api/tickets/scan:
 *   post:
 *     summary: Validate a ticket at the door and mark it used
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ticketId
 *             properties:
 *               ticketId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ticket validated successfully
 *       400:
 *         description: Ticket ID missing, unknown ticket, or already used
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/scan', authMiddleware, authorizeRoles('ORGANISER', 'ADMIN', 'SUPER_ADMIN'), ticketController.scanTicket);

module.exports = router;
