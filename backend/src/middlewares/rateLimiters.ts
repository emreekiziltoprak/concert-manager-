
import type { Request, RequestHandler } from "express";
import rateLimit from "express-rate-limit";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

const isTest = process.env.NODE_ENV === "test";

const isStripeWebhook = (req: Request): boolean =>
    req.originalUrl.startsWith("/api/payments/webhook");

const buildLimiter = (limit: number, message: string): RequestHandler =>
    rateLimit({
        windowMs: FIFTEEN_MINUTES,
        limit,
        standardHeaders: "draft-7",
        legacyHeaders: false,
        skip: (req) => isTest || isStripeWebhook(req),
        handler: (req, res) => res.status(429).json({ error: message })
    });

const authLimiter = buildLimiter(
    20,
    "Too many authentication attempts. Please try again in 15 minutes."
);

const apiLimiter = buildLimiter(
    300,
    "Too many requests. Please slow down and try again shortly."
);

export { authLimiter, apiLimiter };
