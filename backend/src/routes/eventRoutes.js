
const express = require("express");
const router = express.Router();

const eventController = require("../controllers/eventController");
const authMiddleware = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");
const { authorizeEventRole } = require("../middlewares/eventRoleMiddleware");

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
router.get("/", authMiddleware, eventController.getEvents);

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
router.get("/:eventId", authMiddleware, eventController.getEventById);

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
router.post(
  "/:eventId/ticket-types",
  authMiddleware,
  authorizeEventRole("OWNER", "CO_ORGANISER"),
  eventController.addTicketTypeToEvent
);

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
router.post(
  "/",
  authMiddleware,
  authorizeRoles("ORGANISER", "ADMIN", "SUPER_ADMIN"),
  eventController.addEvent
);

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
router.put(
  "/:eventId",
  authMiddleware,
  authorizeEventRole(["OWNER", "CO_ORGANISER"]),
  eventController.updateEvent
);

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
router.delete(
  "/:eventId",
  authMiddleware,
  authorizeEventRole(["OWNER"]),
  eventController.deleteEvent
);

module.exports = router;
