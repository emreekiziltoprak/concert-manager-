const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authorizeEventRole = (allowedEventRoles) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id; 
            const eventId = req.params.eventId; 

            if (!eventId) {
                return res.status(400).json({ error: "Event ID parameter is missing." });
            }

            if (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN') {
                return next();
            }

            const userEventRole = await prisma.eventRole.findUnique({
                where: { 
                    eventId_userId: { eventId, userId } 
                }
            });

            if (!userEventRole || !allowedEventRoles.includes(userEventRole.role)) {
                return res.status(403).json({ 
                    error: "You do not have the required event permissions (e.g., OWNER/CO_ORGANISER) to perform this action." 
                });
            }

            next();
        } catch (error) {
            console.error("[RBAC ERROR]:", error);
            return res.status(500).json({ error: "Internal server error during authorization." });
        }
    };
};

module.exports = { authorizeEventRole };