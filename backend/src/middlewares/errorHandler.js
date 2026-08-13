/**
 * The one place an error becomes an HTTP response.
 *
 * Express recognises a middleware as an error handler by its four parameters,
 * and routes anything passed to `next(error)` here. Express 5 also forwards a
 * rejected promise from an async handler automatically, which is why the
 * controllers below can drop their try/catch blocks entirely and simply throw.
 *
 * Mounted last in app.js, after every route.
 *
 * @module middlewares/errorHandler
 */

/**
 * Translates a thrown error into a status code and a JSON body.
 *
 * Two response shapes, picked by whether the error carries a field list:
 *   - `{errors: [...]}` from utils/httpError.validationFailed, for body validation
 *   - `{error: "..."}`  for everything else
 *
 * Errors without a `statusCode` are not ours -- a Prisma failure, a typo, a
 * genuine bug -- so they are logged with their stack. They still answer 400
 * rather than 500, which is what the per-handler catch blocks did before this
 * middleware existed; keeping that preserves the current API behaviour, such as
 * a duplicate event slug reporting Prisma's message as a 400.
 *
 * @param {Error & {statusCode?: number, errors?: string[]}} error Thrown error.
 * @param {import("express").Request} req Unused, but required for Express to
 *   see the four-parameter error-handler signature.
 * @param {import("express").Response} res Response to write.
 * @param {import("express").NextFunction} next Used only to delegate to the
 *   default handler when a response has already started.
 * @returns {void}
 */
const errorHandler = (error, req, res, next) => {
    // Headers already flushed: Express must finish the broken response itself.
    if (res.headersSent) {
        return next(error);
    }

    if (!error.statusCode) {
        console.error("[UNHANDLED ERROR]:", error);
    }

    const statusCode = error.statusCode || 400;

    if (error.errors) {
        return res.status(statusCode).json({ errors: error.errors });
    }

    return res.status(statusCode).json({ error: error.message });
};

module.exports = errorHandler;
