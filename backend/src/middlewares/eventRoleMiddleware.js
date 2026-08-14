/**
 * Per-event authorization.
 *
 * roleMiddleware answers "may this account do this kind of thing at all"; this
 * one answers "may it do it to *this* event". Running it as middleware keeps
 * services free of permission logic, so there is exactly one place to audit and
 * no chance of a service re-checking ownership and contradicting the route.
 *
 * @module middlewares/eventRoleMiddleware
 */

const prisma = require("../utils/prismaClient");
const MESSAGES = require("../constants/messages");
const { httpError, notFound, badRequest, unauthorized, forbidden } = require("../utils/httpError");

/**
 * Builds middleware that admits a user only if they hold one of the given roles
 * on the event named by `:eventId`.
 *
 * Access is granted by any of three paths, cheapest first:
 *  1. an account-wide ADMIN or SUPER_ADMIN, who is never scoped to one event;
 *  2. the event's `organizerId` -- events created before EventRole existed have
 *     no role row, and their organizer would otherwise be locked out of their
 *     own event;
 *  3. a matching EventRole row.
 *
 * Both call styles are accepted, varargs and array, because the routes use both
 * and silently reducing `("OWNER", "CO_ORGANISER")` to the string `"OWNER"`
 * previously rejected every co-organiser.
 *
 * @param {...(string|string[])} allowed Accepted EventRole values, as separate
 *   arguments or a single array.
 * @returns {import("express").RequestHandler} Middleware answering 401 when
 *   unauthenticated, 400 without an `:eventId`, 404 for an unknown event, 403
 *   when the user holds no accepted role, and 500 if the lookup itself fails.
 */
const authorizeEventRole = (...allowed) => {
    const allowedEventRoles = Array.isArray(allowed[0]) ? allowed[0] : allowed;

    return async (req, res, next) => {
        try {
            // The token payload is {userId, role, email} (see authService.js);
            // reading `id` here instead used to make every lookup miss.
            const userId = req.user?.userId || req.user?.id;
            const eventId = req.params.eventId;

            if (!userId) {
                return next(unauthorized(MESSAGES.AUTH.LOGIN_REQUIRED));
            }

            if (!eventId) {
                return next(badRequest(MESSAGES.EVENT.ID_MISSING));
            }

            if (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN') {
                return next();
            }

            const event = await prisma.event.findFirst({
                where: { id: eventId, deletedAt: null },
                select: { id: true, organizerId: true }
            });

            if (!event) {
                return next(notFound(MESSAGES.EVENT.NOT_FOUND));
            }

            if (event.organizerId === userId) {
                return next();
            }

            const userEventRole = await prisma.eventRole.findUnique({
                where: {
                    eventId_userId: { eventId, userId }
                }
            });

            if (!userEventRole || !allowedEventRoles.includes(userEventRole.role)) {
                return next(forbidden(MESSAGES.AUTH.EVENT_ROLE_REQUIRED));
            }

            next();
        } catch (error) {
            // A failed lookup is a server fault, not a permission decision, so
            // it keeps its own 500 instead of errorHandler's 400 fallback.
            console.error("[RBAC ERROR]:", error);
            return next(httpError(MESSAGES.AUTH.AUTHORIZATION_FAILED, 500));
        }
    };
};

module.exports = { authorizeEventRole };
