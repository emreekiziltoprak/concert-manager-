const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");
const authMiddleware = require("../middlewares/authMiddleware");
const { authorizeRoles } = require("../middlewares/roleMiddleware");
const { authorizeEventRole } = require("../middlewares/eventRoleMiddleware");

/**
 * @swagger
 * /api/events:
 * get:
 * summary: Get all events
 * tags: [Events]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: List of events
 * 401:
 * description: Unauthorized
 */
router.get("/events", authMiddleware, eventController.getEvents);

/**
 * @swagger
 * /api/events/{eventId}:
 * get:
 * summary: Get event by ID
 * tags: [Events]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: eventId
 * schema:
 * type: string
 * required: true
 * description: Event ID (UUID)
 * responses:
 * 200:
 * description: Event found
 * 401:
 * description: Unauthorized
 * 404:
 * description: Event not found
 */
router.get("/events/:eventId", authMiddleware, eventController.getEventById);

/**
 * @swagger
 * /api/events:
 * post:
 * summary: Create a new event
 * tags: [Events]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - title
 * - slug
 * - startDate
 * - capacity
 * properties:
 * title:
 * type: string
 * slug:
 * type: string
 * description:
 * type: string
 * startDate:
 * type: string
 * format: date-time
 * endDate:
 * type: string
 * format: date-time
 * capacity:
 * type: integer
 * status:
 * type: string
 * enum: [DRAFT, PUBLISHED, CANCELLED, COMPLETED, ARCHIVED]
 * responses:
 * 201:
 * description: Event created successfully
 * 400:
 * description: Bad request
 * 401:
 * description: Unauthorized
 */
router.post("/events", authMiddleware, authorizeRoles('ORGANISER', 'ADMIN', 'SUPER_ADMIN'), eventController.addEvent);

/**
 * @swagger
 * /api/events/{eventId}:
 * put:
 * summary: Update an event
 * tags: [Events]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: eventId
 * schema:
 * type: string
 * required: true
 * description: Event ID to update
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * title:
 * type: string
 * slug:
 * type: string
 * description:
 * type: string
 * status:
 * type: string
 * enum: [DRAFT, PUBLISHED, CANCELLED, COMPLETED, ARCHIVED]
 * responses:
 * 200:
 * description: Event updated successfully
 * 400:
 * description: Bad request
 * 401:
 * description: Unauthorized
 */
router.put("/events/:eventId", authMiddleware, authorizeEventRole(['OWNER', 'CO_ORGANISER']), eventController.updateEvent);

/**
 * @swagger
 * /api/events/{eventId}:
 * delete:
 * summary: Delete an event
 * tags: [Events]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: eventId
 * schema:
 * type: string
 * required: true
 * description: The UUID of the event to delete
 * responses:
 * 200:
 * description: Event deleted successfully
 * 400:
 * description: Bad request
 * 401:
 * description: Unauthorized
 */
router.delete("/events/:eventId", authMiddleware, authorizeEventRole(['OWNER']), eventController.deleteEvent);

module.exports = router;