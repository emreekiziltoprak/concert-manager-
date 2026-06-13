const cron = require("node-cron");
const prisma = require("../utils/prismaClient");
const outboxHandlers = require("../handlers/outboxHandlers");

const processOutboxEvents = async () => {
    try{
        const pendingEvents = 
        await prisma.outboxEvent.findMany({
            where: { status: "PENDING"},
            take: 50,
            orderBy: {createdAt: 'asc'}
        });

        if(pendingEvents.length === 0) return;

        for (const event of pendingEvents) {
            try{
                const handler = outboxHandlers[event.type];

                if(!handler) {
                    throw new Error(`Unknown Event type: ${event.type}`);
                }

                await handler(event.payload);

                await prisma.outboxEvent.update({
                    where: {id: event.id},
                    data: {status: "PROCESSED"},
                });
                
            } 
            catch(error) {
                console.error("Error when handling worker", error.message);
                
                await prisma.outboxEvent.update({
                    where: {id: event.id},
                    data: {status: "FAILED", error: error.message},
                });
            }
        }
    }
    catch(error){
        console.error("Outbox table cant be read", error.message);
    }
}

const startOutboxWorker = () => {
    cron.schedule("* * * * *", processOutboxEvents);
}


module.exports = {startOutboxWorker};