/**
 * Account-wide role authorization.
 *
 * Guards routes that are not about one particular record -- creating an event,
 * scanning tickets -- where the only question is what kind of account is
 * calling. For "may this user touch *this* event", use
 * middlewares/eventRoleMiddleware instead.
 *
 * @module middlewares/roleMiddleware
 */

const MESSAGES = require("../constants/messages");
const { forbidden } = require("../utils/httpError");

/**
 * Builds middleware that admits only the listed account roles.
 *
 * Runs after authMiddleware, which is what puts `req.user` on the request; the
 * missing-user case is treated as denied rather than throwing, so a route
 * mounted without authMiddleware fails closed.
 *
 * @param {...string} allowedRoles Accepted UserRole values.
 * @returns {import("express").RequestHandler} Middleware answering 403 when the
 *   user's role is not listed.
 */
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return next(forbidden(MESSAGES.AUTH.GLOBAL_ROLE_REQUIRED));
        }
        next();
    };
};

module.exports = { authorizeRoles };
