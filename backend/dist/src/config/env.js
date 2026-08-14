"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalEnv = exports.requireEnv = void 0;
const requireEnv = (name) => {
    const value = process.env[name];
    if (!value)
        throw new Error(`Missing required environment variable: ${name}`);
    return value;
};
exports.requireEnv = requireEnv;
const optionalEnv = (name, fallback) => process.env[name] ?? fallback;
exports.optionalEnv = optionalEnv;
//# sourceMappingURL=env.js.map