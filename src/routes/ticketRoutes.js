const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { authMiddleware, checkRole } = require('../middlewares/authMiddleware');

router.get('/my-tickets', authMiddleware, ticketController.getMyTickets);

router.post('/scan', authMiddleware, checkRole(['ORGANIZER', 'ADMIN']), ticketController.scanTicket);

module.exports = router;