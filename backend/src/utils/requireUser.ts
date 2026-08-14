
import type { Request } from "express";
import type { JwtUser } from "../types/jwtUser";
import { unauthorized } from "./httpError";
import { AUTH } from "../constants/messages";

export const requireUser = (req: Request): JwtUser => {
    if (!req.user) throw unauthorized(AUTH.LOGIN_REQUIRED);
    return req.user;
};
