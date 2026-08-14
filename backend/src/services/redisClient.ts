
import Redis from "ioredis";

const redis = new Redis({
    host: 'concert_redis',
    port: 6379
});

redis.on('connect', () => console.log("redis connection is succesful"));
// Logs the error object itself, exactly as before -- not errorMessage(err).
// This is the only place a connection failure surfaces, and the stack matters.
redis.on('error', (err) => console.error("redis connection error", err));

// `export =` so `require("./src/services/redisClient")` in server.js keeps
// receiving the client itself rather than a `{ default: ... }` wrapper.
export = redis;
