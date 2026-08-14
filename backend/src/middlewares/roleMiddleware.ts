
import type { RequestHandler } from "express";
import * as MESSAGES from "../constants/messages";
import { forbidden } from "../utils/httpError";
import type { UserRole } from "../types/jwtUser";

export const authorizeRoles = (...allowedRoles: UserRole[]): RequestHandler => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return next(forbidden(MESSAGES.AUTH.GLOBAL_ROLE_REQUIRED));
        }
        next();
    };
};
