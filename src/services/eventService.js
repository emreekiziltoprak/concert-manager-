const prisma = require("../utils/prismaClient");

const addEvent = async (event) => {
    const eventResp = await prisma.event.create({data: event});
    return {message: "Event successfully created", eventResp};
};

const getEvents = async () => {
    return await prisma.event.findMany();
}

const updateEvent = async (event, user) => {
    const existingEvent = await prisma.event.findFirst({
        where: {
            id: event.id,
            deletedAt: null
        }
    });

    if(!existingEvent) throw new Error("Event cannot be found");

    if(existingEvent.organizerId !== user.userId)
        throw new Error("You have no access for editing this event");

    const updatedEvent = await prisma.event.update({
        where: {id: event.id},
        data: event
    });

    return updatedEvent;
}

const deleteEvent = async(eventId, user) =>{
    const existingEvent = await prisma.event.findFirst({where: {id: eventId, deletedAt: null}});
    if(!existingEvent) {throw new Error("Event cannot be found")}

    if(existingEvent.organizerId !== user.userId)  
       { throw new Error("You have no access for deleting this event") } 

    const deletedEvent  = await prisma.event.delete({
        where: {id: eventId},
    });

    return deletedEvent;
}

module.exports = {addEvent, getEvents, updateEvent, deleteEvent};