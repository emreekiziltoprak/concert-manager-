"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const ioredis_1 = __importDefault(require("ioredis"));
const redis = new ioredis_1.default({
    host: 'concert_redis',
    port: 6379
});
redis.on('connect', () => console.log("redis connection is succesful"));
// Logs the error object itself, exactly as before -- not errorMessage(err).
// This is the only place a connection failure surfaces, and the stack matters.
redis.on('error', (err) => console.error("redis connection error", err));
module.exports = redis;
//# sourceMappingURL=redisClient.js.map