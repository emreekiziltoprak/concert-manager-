"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiLimiter = exports.authLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const FIFTEEN_MINUTES = 15 * 60 * 1000;
const isTest = process.env.NODE_ENV === "test";
const isStripeWebhook = (req) => req.originalUrl.startsWith("/api/payments/webhook");
const buildLimiter = (limit, message) => (0, express_rate_limit_1.default)({
    windowMs: FIFTEEN_MINUTES,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: (req) => isTest || isStripeWebhook(req),
    handler: (req, res) => res.status(429).json({ error: message })
});
const authLimiter = buildLimiter(20, "Too many authentication attempts. Please try again in 15 minutes.");
exports.authLimiter = authLimiter;
const apiLimiter = buildLimiter(300, "Too many requests. Please slow down and try again shortly.");
exports.apiLimiter = apiLimiter;
//# sourceMappingURL=rateLimiters.js.map