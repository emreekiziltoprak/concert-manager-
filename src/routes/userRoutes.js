const express = require('express');
const router = express.Router();
const userController = require('../controllers/usersController');
const authMiddleware = require('../middlewares/authMiddleware');


/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and profile
 */

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get the current logged-in user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response with user profile information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "550e8400-e29b-41d4-a716-446655440000"
 *                 email:
 *                   type: string
 *                   example: "user@example.com"
 *                 fullName:
 *                   type: string
 *                   example: "John Doe"
 *                 avatarUrl:
 *                   type: string
 *                   nullable: true
 *                   example: "https://example.com/avatar.jpg"
 *                 bio:
 *                   type: string
 *                   nullable: true
 *                   example: "Music lover and concert goer"
 *                 phoneNumber:
 *                   type: string
 *                   nullable: true
 *                   example: "+1234567890"
 *                 isActive:
 *                   type: boolean
 *                   example: true
 *                 isEmailVerified:
 *                   type: boolean
 *                   example: true
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2026-06-09T12:34:56Z"
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2026-06-09T15:20:00Z"
 *       401:
 *         description: Unauthorized – missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User info cant be fetched."
 */



router.get('/profile', authMiddleware, userController.getUserProfile);

module.exports = router;