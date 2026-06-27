const redis = require("../services/redisClient");

const idempotencyMiddleware = async (req, res, next) => {
        
    try {
    
    const userId = req.user.id;
    const key = req.headers["idempotency-key"];
    if(!key){
        return res.status(400).json({message: "Impotency key is required!"});
    }
    const redisKey = await redis.get(key);

    if(redisKey){
        return res.status(429).json({message: "Too many requests"});
    }
    else {
        await redis.set(key, "in-progress", "EX", 120);
        next();
    }

    } catch (error) {
            return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {idempotencyMiddleware};