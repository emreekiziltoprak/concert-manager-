"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
const ticketController = __importStar(require("../controllers/ticketController"));
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const router = express_1.default.Router();
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
router.get('/my-tickets', authMiddleware_1.default, ticketController.getMyTickets);
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
router.post('/scan', authMiddleware_1.default, (0, roleMiddleware_1.authorizeRoles)('ORGANISER', 'ADMIN', 'SUPER_ADMIN'), ticketController.scanTicket);
module.exports = router;
//# sourceMappingURL=ticketRoutes.js.map