/**
 * Central factory for errors that carry an HTTP status code.
 *
 * Services must not depend on express, so they cannot answer a request
 * themselves. Instead they throw an Error tagged with `statusCode`, and every
 * controller ends its catch block with the same line:
 *
 *     res.status(error.statusCode || 400).json({ error: error.message });
 *
 * Without the tag every failure collapses into a generic 400, which is how a
 * missing event used to be reported as a validation error. Keeping the factory
 * in one place also keeps the status codes consistent across services: 404 for
 * "does not exist", 409 for "collides with something that already exists", 400
 * for "the value you sent is out of range".
 *
 * @module utils/httpError
 */

/**
 * Builds an Error carrying an HTTP status code.
 *
 * Returns the error instead of throwing it, so call sites read `throw
 * httpError(...)` and stay obvious to both readers and static analysis.
 *
 * @param {string} message     User-facing message; see constants/messages.js.
 * @param {number} statusCode  HTTP status the controller should answer with.
 * @returns {Error & {statusCode: number}} Error ready to be thrown.
 */
const httpError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

/**
 * 404 - the requested record does not exist, or is soft-deleted.
 *
 * @param {string} message User-facing message.
 * @returns {Error & {statusCode: number}} Error ready to be thrown.
 */
const notFound = (message) => httpError(message, 404);

/**
 * 400 - the request was well-formed but a value is outside the allowed range,
 * for example a ticket type capacity larger than the event has left.
 *
 * @param {string} message User-facing message.
 * @returns {Error & {statusCode: number}} Error ready to be thrown.
 */
const badRequest = (message) => httpError(message, 400);

/**
 * 409 - the request collides with the current state of the data, for example a
 * duplicate ticket type name or a delete blocked by existing orders. Separated
 * from 400 so the client can tell "fix your input" from "something else already
 * owns this".
 *
 * @param {string} message User-facing message.
 * @returns {Error & {statusCode: number}} Error ready to be thrown.
 */
const conflict = (message) => httpError(message, 409);

/**
 * 401 - the caller is not authenticated at all.
 *
 * @param {string} message User-facing message.
 * @returns {Error & {statusCode: number}} Error ready to be thrown.
 */
const unauthorized = (message) => httpError(message, 401);

/**
 * 403 - the caller is authenticated but not allowed to do this. Distinct from
 * 401: logging in again would not help.
 *
 * @param {string} message User-facing message.
 * @returns {Error & {statusCode: number}} Error ready to be thrown.
 */
const forbidden = (message) => httpError(message, 403);

/**
 * 400 carrying a list of field problems rather than one sentence.
 *
 * Request body validation reports every problem at once so a form can show them
 * all, which needs a different response shape: `{errors: [...]}` instead of
 * `{error: "..."}`. The `errors` property is what errorHandler keys on to pick
 * that shape, and `message` is the joined text so logs stay readable.
 *
 * @param {string[]} errors One entry per invalid field.
 * @returns {Error & {statusCode: number, errors: string[]}} Error ready to be thrown.
 */
const validationFailed = (errors) => {
    const error = httpError(errors.join(" "), 400);
    error.errors = errors;
    return error;
};

module.exports = {
    httpError,
    notFound,
    badRequest,
    conflict,
    unauthorized,
    forbidden,
    validationFailed
};
