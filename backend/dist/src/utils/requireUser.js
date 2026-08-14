"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireUser = void 0;
const httpError_1 = require("./httpError");
const messages_1 = require("../constants/messages");
const requireUser = (req) => {
    if (!req.user)
        throw (0, httpError_1.unauthorized)(messages_1.AUTH.LOGIN_REQUIRED);
    return req.user;
};
exports.requireUser = requireUser;
//# sourceMappingURL=requireUser.js.map