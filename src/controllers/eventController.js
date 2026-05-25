const eventService = require("../services/eventService");

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
        const event = await eventService.getEventById(req.params.id);
        return res.status(200).json({event: event});
    } catch (error) {
        return res.status(400).send({error: error.message});
    }
}

const updateEvent = async (req, res) => {
    try {
        const updatedEvent = await eventService.updateEvent(req.body, req.user);
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

module.exports = {addEvent, getEvents, getEventById, updateEvent, deleteEvent};