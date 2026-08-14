"use strict";
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
//# sourceMappingURL=errorHandler.js.map