import express from "express";
// Namespace import, not a default import: the controllers are mid-migration and
// will land as named exports. `import * as` binds identically against a legacy
// `module.exports = {...}`, an `export =`, and named ESM exports, so the
// `authController.register` call sites below stay valid either way.
import * as authController from "../controllers/authController";
import { validateResponse } from "../middlewares/validate";
import { loginSchema, registerSchema } from "../schemas/auth.schema";

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request
 */
router.post("/register", validateResponse(registerSchema), authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Bad request
 */
router.post("/login", validateResponse(loginSchema), authController.login);

// `export =`, not `export default`: under module: commonjs a default export
// emits `module.exports.default`, and app.ts would mount the wrapper object
// instead of the router.
export = router;