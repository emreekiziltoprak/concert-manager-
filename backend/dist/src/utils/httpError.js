"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationFailed = exports.forbidden = exports.unauthorized = exports.conflict = exports.badRequest = exports.notFound = exports.httpError = exports.HttpError = void 0;
class HttpError extends Error {
    statusCode;
    errors;
    constructor(message, statusCode, errors) {
        super(message);
        this.statusCode = statusCode;
        if (errors)
            this.errors = errors;
    }
}
exports.HttpError = HttpError;
const httpError = (message, statusCode) => new HttpError(message, statusCode);
exports.httpError = httpError;
const notFound = (message) => new HttpError(message, 404);
exports.notFound = notFound;
const badRequest = (message) => new HttpError(message, 400);
exports.badRequest = badRequest;
const conflict = (message) => new HttpError(message, 409);
exports.conflict = conflict;
const unauthorized = (message) => new HttpError(message, 401);
exports.unauthorized = unauthorized;
const forbidden = (message) => new HttpError(message, 403);
exports.forbidden = forbidden;
const validationFailed = (errors) => new HttpError(errors.join(" "), 400, errors);
exports.validationFailed = validationFailed;
//# sourceMappingURL=httpError.js.map