import express from "express";

import * as paymentController from "../controllers/paymentController";
import authMiddleware from "../middlewares/authMiddleware";

const router = express.Router();

/**
 * @swagger
 * /payments/checkout:
 *   post:
 *     summary: Create checkout session and get client secret
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - cartItems
 *             properties:
 *               eventId:
 *                 type: integer
 *               cartItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     ticketTypeId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Checkout session created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clientSecret:
 *                   type: string
 *                 orderId:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 */
router.post("/checkout", authMiddleware, paymentController.checkout);

/**
 * @swagger
 * /payments/webhook:
 *   post:
 *     summary: Stripe webhook endpoint
 *     tags: [Payments]
 *     description: Receives webhook events from Stripe for payment processing
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post("/webhook", paymentController.webhook);
export = router;