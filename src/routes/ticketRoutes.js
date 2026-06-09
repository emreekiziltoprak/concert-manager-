const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const  authMiddleware  = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

router.get('/my-tickets', authMiddleware, ticketController.getMyTickets);

router.post('/scan', authMiddleware, authorizeRoles('ORGANIZER', 'ADMIN'), ticketController.scanTicket);

module.exports = router;