"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeEventRole = void 0;
const prismaClient_1 = __importDefault(require("../utils/prismaClient"));
const MESSAGES = __importStar(require("../constants/messages"));
const httpError_1 = require("../utils/httpError");
const authorizeEventRole = (...allowed) => {
    const first = allowed[0];
    const allowedEventRoles = Array.isArray(first) ? first : allowed;
    return async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            // @types/express@5 types every param as `string | string[]`, because
            // a path *can* repeat a name. These routes declare `:eventId` once,
            // so it is always a string. Asserting rather than adding a
            // typeof guard keeps the unreachable array case behaving exactly as
            // it does today; the `!eventId` check below is the real guard.
            const eventId = req.params.eventId;
            if (!userId) {
                return next((0, httpError_1.unauthorized)(MESSAGES.AUTH.LOGIN_REQUIRED));
            }
            if (!eventId) {
                return next((0, httpError_1.badRequest)(MESSAGES.EVENT.ID_MISSING));
            }
            if (req.user?.role === "ADMIN" || req.user?.role === "SUPER_ADMIN") {
                return next();
            }
            const event = await prismaClient_1.default.event.findFirst({
                where: { id: eventId, deletedAt: null },
                select: { id: true, organizerId: true }
            });
            if (!event) {
                return next((0, httpError_1.notFound)(MESSAGES.EVENT.NOT_FOUND));
            }
            if (event.organizerId === userId) {
                return next();
            }
            const userEventRole = await prismaClient_1.default.eventRole.findUnique({
                where: {
                    eventId_userId: { eventId, userId }
                }
            });
            if (!userEventRole || !allowedEventRoles.includes(userEventRole.role)) {
                return next((0, httpError_1.forbidden)(MESSAGES.AUTH.EVENT_ROLE_REQUIRED));
            }
            next();
        }
        catch (error) {
            // A failed lookup is a server fault, not a permission decision, so
            // it keeps its own 500 instead of errorHandler's 400 fallback.
            console.error("[RBAC ERROR]:", error);
            return next((0, httpError_1.httpError)(MESSAGES.AUTH.AUTHORIZATION_FAILED, 500));
        }
    };
};
exports.authorizeEventRole = authorizeEventRole;
//# sourceMappingURL=eventRoleMiddleware.js.map