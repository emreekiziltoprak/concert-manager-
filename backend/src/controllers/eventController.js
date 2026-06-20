const eventService = require("../services/eventService");
const ticketService = require("../services/ticketService");

const toNumber = (value) => {
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim() !== "") return Number(value);
    return null;
};

const validateTicketTypeBody = (body) => {
    const errors = [];
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const price = toNumber(body.price);
    const capacity = toNumber(body.capacity);

    if (!name) {
        errors.push("name is required.");
    }

    if (price === null || !Number.isFinite(price) || price < 0) {
        errors.push("price must be greater than or equal to 0.");
    }

    if (capacity === null || !Number.isInteger(capacity) || capacity <= 0) {
        errors.push("capacity must be an integer greater than 0.");
    }

    return {
        errors,
        data: {
            name,
            price,
            capacity,
            category: body.category,
            isActive: body.isActive,
        },
    };
};

const addTicketTypeToEvent = async (req, res) => {
    try {
        const { errors, data } = validateTicketTypeBody(req.body);

        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        const ticketType = await ticketService.createTicketType(req.params.eventId, data);
        return res.status(201).json({ ticketType });
    } catch (error) {
        return res.status(error.statusCode || 400).json({ error: error.message });
    }
};

const addEvent = async (req, res) => {
    try {
        const successResponse = await eventService.addEvent(req.body);
        res.status(201).send(successResponse);
    } catch(e) {
        res.status(400).send({error: e.message});
    }
}

const getEvents = async (req, res) => {
    try {
        const allEvents = await eventService.getEvents();
        return res.status(200).json({events: allEvents});
    } catch (error) {
        return res.status(400).send({error: error.message});
    }
}

const getEventById = async (req, res) => {
    try {
        const event = await eventService.getEventById(req.params.eventId);
        return res.status(200).json({event: event});
    } catch (error) {
        return res.status(400).send({error: error.message});
    }
}

const updateEvent = async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const updatedEvent = await eventService.updateEvent(eventId, req.body, req.user);
        return res.status(200).send({updatedEvent: updatedEvent});
    } catch(err) {
        res.status(400).send({error: err.message});
    }
}

const deleteEvent = async (req, res) => {
    try {
        const deletedEvent = await eventService.deleteEvent(req.body.eventId, req.user);
        res.status(200).send({deletedEvent: deletedEvent});
    } catch (error) {
        res.status(400).send({error: error.message});
    }
}

module.exports = {addEvent, getEvents, getEventById, updateEvent, deleteEvent, addTicketTypeToEvent};
