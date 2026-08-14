
import type { ErrorRequestHandler } from "express";

type HandledError = Error & { statusCode?: number; errors?: string[] };

const errorHandler: ErrorRequestHandler = (error: HandledError, req, res, next) => {
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

export = errorHandler;
