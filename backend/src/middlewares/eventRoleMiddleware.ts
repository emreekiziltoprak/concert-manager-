
import type { RequestHandler } from "express";
import prisma from "../utils/prismaClient";
import * as MESSAGES from "../constants/messages";
import { httpError, notFound, badRequest, unauthorized, forbidden } from "../utils/httpError";

const authorizeEventRole = (...allowed: (string | string[])[]): RequestHandler => {
    const first = allowed[0];
    const allowedEventRoles: string[] = Array.isArray(first) ? first : (allowed as string[]);

    return async (req, res, next) => {
        try {
            const userId = req.user?.userId;

            // @types/express@5 types every param as `string | string[]`, because
            // a path *can* repeat a name. These routes declare `:eventId` once,
            // so it is always a string. Asserting rather than adding a
            // typeof guard keeps the unreachable array case behaving exactly as
            // it does today; the `!eventId` check below is the real guard.
            const eventId = req.params.eventId as string | undefined;

            if (!userId) {
                return next(unauthorized(MESSAGES.AUTH.LOGIN_REQUIRED));
            }

            if (!eventId) {
                return next(badRequest(MESSAGES.EVENT.ID_MISSING));
            }

            if (req.user?.role === "ADMIN" || req.user?.role === "SUPER_ADMIN") {
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

export { authorizeEventRole };
