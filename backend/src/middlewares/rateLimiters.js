/**
 * Request rate limiting.
 *
 * Two limiters rather than one, because the endpoints they protect fail
 * differently: guessing a password is worth thousands of attempts to an
 * attacker, so /api/auth gets a tight budget, while ordinary browsing needs a
 * generous one to stay usable.
 *
 * Disabled under NODE_ENV=test -- the integration suite fires hundreds of
 * requests from a single address in a few seconds and would otherwise trip
 * every limit.
 *
 * @module middlewares/rateLimiters
 */

const rateLimit = require("express-rate-limit");

const FIFTEEN_MINUTES = 15 * 60 * 1000;

/** Jest sets NODE_ENV=test; limiters stay off there. */
const isTest = process.env.NODE_ENV === "test";

/**
 * Stripe retries a webhook it cannot deliver. Throttling those would leave the
 * matching order stuck as PENDING until the expiry cron cancels it, so the
 * callback path is never counted.
 *
 * @param {import("express").Request} req Incoming request.
 * @returns {boolean} True when the request should bypass the limiter.
 */
const isStripeWebhook = (req) => req.originalUrl.startsWith("/api/payments/webhook");

/**
 * Builds a limiter that answers 429 with the project's `{error}` body shape.
 *
 * @param {number} limit   Requests allowed per window, per IP.
 * @param {string} message Text sent once the budget is spent.
 * @returns {import("express").RequestHandler} The limiter, or a pass-through under test.
 */
const buildLimiter = (limit, message) =>
    rateLimit({
        windowMs: FIFTEEN_MINUTES,
        limit,
        standardHeaders: "draft-7",
        legacyHeaders: false,
        skip: (req) => isTest || isStripeWebhook(req),
        handler: (req, res) => res.status(429).json({ error: message })
    });

/**
 * Login, register and password endpoints. Tight, because these are the ones
 * worth brute-forcing.
 */
const authLimiter = buildLimiter(
    20,
    "Too many authentication attempts. Please try again in 15 minutes."
);

/**
 * Everything else. Loose enough that a person browsing never notices, tight
 * enough that a script cannot hammer the checkout -- where every attempt opens
 * a transaction and takes a row lock.
 */
const apiLimiter = buildLimiter(
    300,
    "Too many requests. Please slow down and try again shortly."
);

module.exports = { authLimiter, apiLimiter };
