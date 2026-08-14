"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorCode = exports.errorMessage = void 0;
const errorMessage = (error) => error instanceof Error ? error.message : String(error);
exports.errorMessage = errorMessage;
const errorCode = (error) => typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : undefined;
exports.errorCode = errorCode;
//# sourceMappingURL=errorMessage.js.map