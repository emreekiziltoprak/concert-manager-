const prisma = require("../utils/prismaClient");

const createPendingOrder = async (userId, eventId, cardItems) => {
    return await prisma.$transaction(async (tx)=> {
        const event = await tx.event.findUnique({
            where: {id: eventId}
        });

        if(!event || event.status !== "PUBLISHED"){
            throw new Error("This event is not avaliable");
        }

        for (const ticket of cardItems) {

            //get ticket type information and make security check
            const ticketType = await tx.$queryRaw`
            SELECT * FROM "ticket_types"
            WHERE "id" = ${ticket.ticketTypeId}
            FOR UPDATE
            ` 

            if(!ticketType) throw new Error("Invalid Ticket Type");

            if(ticketType.eventId !== eventId)
                throw new Error("This ticket doesnt belong to this event");
    
            if(!ticketType.isActive)
                throw new Error(`${ticketType.name} This ticket type is closed to sale`)

            //
        }
    })
} 