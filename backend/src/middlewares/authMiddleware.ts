
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import * as MESSAGES from "../constants/messages";
import { unauthorized } from "../utils/httpError";
import { requireEnv } from "../config/env";
import type { JwtUser } from "../types/jwtUser";

function authMiddleware(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(unauthorized(MESSAGES.AUTH.LOGIN_REQUIRED));
    }

    // slice, not split(" ")[1]: under noUncheckedIndexedAccess the element is
    // `string | undefined`, and the fix is not merely a cast -- a bare "Bearer "
    // header used to hand `undefined` to jwt.verify. slice yields "" there,
    // which fails verification the same way but without the type hole.
    const token = authHeader.slice("Bearer ".length);

    try {
        // requireEnv is called here rather than at module scope on purpose: a
        // missing JWT_SECRET must stay a per-request 401 (jwt.verify already
        // threw on `undefined`), not a crash at import time.
        const decoded = jwt.verify(token, requireEnv("JWT_SECRET"));

        // jwt.verify is typed `string | JwtPayload`, but the payload shape is
        // guaranteed by authService.login, which is the only signer.
        req.user = decoded as JwtUser;
        next();
    } catch (err) {
        return next(unauthorized(MESSAGES.AUTH.INVALID_TOKEN));
    }
}

export = authMiddleware;
