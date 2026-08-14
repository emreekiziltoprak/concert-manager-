import cron from "node-cron";
import prisma from "../utils/prismaClient";
import outboxHandlers from "../handlers/outboxHandlers";
import { errorMessage } from "../utils/errorMessage";

const processOutboxEvents = async (): Promise<void> => {
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
                console.error("Error when handling worker", errorMessage(error));

                await prisma.outboxEvent.update({
                    where: {id: event.id},
                    data: {status: "FAILED", error: errorMessage(error)},
                });
            }
        }
    }
    catch(error){
        console.error("Outbox table cant be read", errorMessage(error));
    }
}

const startOutboxWorker = (): void => {
    cron.schedule("* * * * *", processOutboxEvents);
}


export { startOutboxWorker };
