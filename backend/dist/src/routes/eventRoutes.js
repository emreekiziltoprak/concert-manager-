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
const eventController = __importStar(require("../controllers/eventController"));
const authMiddleware_1 = __importDefault(require("../middlewares/authMiddleware"));
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const eventRoleMiddleware_1 = require("../middlewares/eventRoleMiddleware");
const router = express_1.default.Router();
/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event management endpoints
 */
/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of events
 *       401:
 *         description: Unauthorized
 */
router.get("/", authMiddleware_1.default, eventController.getEvents);
/**
 * @swagger
 * /api/events/{eventId}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID (UUID)
 *     responses:
 *       200:
 *         description: Event found
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 */
router.get("/:eventId", authMiddleware_1.default, eventController.getEventById);
/**
 * @swagger
 * /api/events/{eventId}/ticket-types:
 *   post:
 *     summary: Create a ticket type for an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - capacity
 *             properties:
 *               name:
 *                 type: string
 *                 example: VIP
 *               price:
 *                 type: number
 *                 example: 250
 *               capacity:
 *                 type: integer
 *                 example: 100
 *               category:
 *                 type: string
 *                 enum:
 *                   - STANDARD
 *                   - CHILD
 *                   - STUDENT
 *                   - EARLY_BID
 *                   - FREE
 *                 example: STANDARD
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Ticket type created successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Event not found
 */
router.post("/:eventId/ticket-types", authMiddleware_1.default, (0, eventRoleMiddleware_1.authorizeEventRole)(["OWNER", "CO_ORGANISER"]), eventController.addTicketTypeToEvent);
/**
 * @swagger
 * /api/events/{eventId}/ticket-types/{ticketTypeId}:
 *   put:
 *     summary: Update a ticket type of an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *       - in: path
 *         name: ticketTypeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket type ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - capacity
 *             properties:
 *               name:
 *                 type: string
 *                 example: VIP
 *               price:
 *                 type: number
 *                 example: 250
 *               capacity:
 *                 type: integer
 *                 example: 100
 *               category:
 *                 type: string
 *                 enum:
 *                   - STANDARD
 *                   - CHILD
 *                   - STUDENT
 *                   - EARLY_BID
 *                   - FREE
 *                 example: STANDARD
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Ticket type updated successfully
 *       400:
 *         description: Invalid request body, or capacity exceeds the remaining event capacity
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Event or ticket type not found
 *       409:
 *         description: Duplicate name/category, or capacity below the already reserved count
 */
router.put("/:eventId/ticket-types/:ticketTypeId", authMiddleware_1.default, (0, eventRoleMiddleware_1.authorizeEventRole)(["OWNER", "CO_ORGANISER"]), eventController.updateTicketTypeOfEvent);
/**
 * @swagger
 * /api/events/{eventId}/ticket-types/{ticketTypeId}:
 *   delete:
 *     summary: Delete a ticket type of an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *       - in: path
 *         name: ticketTypeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket type ID
 *     responses:
 *       200:
 *         description: Ticket type deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Event or ticket type not found
 *       409:
 *         description: Ticket type is referenced by existing orders or tickets
 */
router.delete("/:eventId/ticket-types/:ticketTypeId", authMiddleware_1.default, (0, eventRoleMiddleware_1.authorizeEventRole)(["OWNER", "CO_ORGANISER"]), eventController.deleteTicketTypeOfEvent);
/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - slug
 *               - startDate
 *               - capacity
 *             properties:
 *               title:
 *                 type: string
 *                 example: Tech Conference 2026
 *               slug:
 *                 type: string
 *                 example: tech-conference-2026
 *               description:
 *                 type: string
 *                 example: Annual technology conference
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               capacity:
 *                 type: integer
 *                 example: 500
 *               status:
 *                 type: string
 *                 enum:
 *                   - DRAFT
 *                   - PUBLISHED
 *                   - CANCELLED
 *                   - COMPLETED
 *                   - ARCHIVED
 *     responses:
 *       201:
 *         description: Event created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post("/", authMiddleware_1.default, (0, roleMiddleware_1.authorizeRoles)("ORGANISER", "ADMIN", "SUPER_ADMIN"), eventController.addEvent);
/**
 * @swagger
 * /api/events/{eventId}:
 *   put:
 *     summary: Update an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum:
 *                   - DRAFT
 *                   - PUBLISHED
 *                   - CANCELLED
 *                   - COMPLETED
 *                   - ARCHIVED
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Event not found
 */
router.put("/:eventId", authMiddleware_1.default, (0, eventRoleMiddleware_1.authorizeEventRole)(["OWNER", "CO_ORGANISER"]), eventController.updateEvent);
/**
 * @swagger
 * /api/events/{eventId}:
 *   delete:
 *     summary: Delete an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: The UUID of the event to delete
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Event not found
 */
router.delete("/:eventId", authMiddleware_1.default, (0, eventRoleMiddleware_1.authorizeEventRole)(["OWNER"]), eventController.deleteEvent);
module.exports = router;
//# sourceMappingURL=eventRoutes.js.map