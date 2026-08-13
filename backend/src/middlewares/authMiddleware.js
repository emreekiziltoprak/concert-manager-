/**
 * Bearer token authentication.
 *
 * The first middleware on every protected route: it turns the Authorization
 * header into `req.user`, which everything downstream -- roleMiddleware,
 * eventRoleMiddleware, the controllers -- reads instead of parsing the token
 * again.
 *
 * @module middlewares/authMiddleware
 */

const jwt = require("jsonwebtoken");
const MESSAGES = require("../constants/messages");
const { unauthorized } = require("../utils/httpError");

/**
 * Verifies the bearer token and attaches its payload to the request.
 *
 * Sets `req.user` to the decoded payload `{userId, role, email}` (see
 * authService.login). Note the key is `userId`, not `id`.
 *
 * @param {import("express").Request} req   Request carrying `Authorization: Bearer <token>`.
 * @param {import("express").Response} res  Unused; errorHandler writes the response.
 * @param {import("express").NextFunction} next Called with `unauthorized(...)` when
 *   the header is absent, malformed, or the token fails verification.
 * @returns {void}
 */
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(unauthorized(MESSAGES.AUTH.LOGIN_REQUIRED));
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return next(unauthorized(MESSAGES.AUTH.INVALID_TOKEN));
    }
}

module.exports = authMiddleware;
