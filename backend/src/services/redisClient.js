const Redis = require("ioredis");

const redis = new Redis({
    host: 'concert_redis',
    port: 6379
}); 

redis.on('connect', () => console.log("redis connection is succesful"))
redis.on('error', (err) => console.error("redis connection error", err))

module.exports = redis;