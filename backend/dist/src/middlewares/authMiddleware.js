"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const MESSAGES = __importStar(require("../constants/messages"));
const httpError_1 = require("../utils/httpError");
const env_1 = require("../config/env");
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next((0, httpError_1.unauthorized)(MESSAGES.AUTH.LOGIN_REQUIRED));
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
        const decoded = jsonwebtoken_1.default.verify(token, (0, env_1.requireEnv)("JWT_SECRET"));
        // jwt.verify is typed `string | JwtPayload`, but the payload shape is
        // guaranteed by authService.login, which is the only signer.
        req.user = decoded;
        next();
    }
    catch (err) {
        return next((0, httpError_1.unauthorized)(MESSAGES.AUTH.INVALID_TOKEN));
    }
}
module.exports = authMiddleware;
//# sourceMappingURL=authMiddleware.js.map