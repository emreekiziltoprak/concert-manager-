"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTicketTypeOfEvent = exports.updateTicketTypeOfEvent = exports.addTicketTypeToEvent = exports.deleteEvent = exports.updateEvent = exports.getEventById = exports.getEvents = exports.addEvent = void 0;
const eventService = __importStar(require("../services/eventService"));
const ticketService = __importStar(require("../services/ticketService"));
const MESSAGES = __importStar(require("../constants/messages"));
const ticketCategories_1 = require("../constants/ticketCategories");
const httpError_1 = require("../utils/httpError");
const requireUser_1 = require("../utils/requireUser");
const toNumber = (value) => {
    if (typeof value === "number")
        return value;
    if (typeof value === "string" && value.trim() !== "")
        return Number(value);
    return null;
};
const parseTicketTypeBody = (body) => {
    const errors = [];
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const price = toNumber(body.price);
    const capacity = toNumber(body.capacity);
    const category = body.category === undefined || body.category === null || body.category === ""
        ? ticketCategories_1.DEFAULT_TICKET_CATEGORY
        : body.category;
    if (!name) {
        errors.push(MESSAGES.VALIDATION.NAME_REQUIRED);
    }
    if (price === null || !Number.isFinite(price) || price < 0) {
        errors.push(MESSAGES.VALIDATION.PRICE_INVALID);
    }
    if (capacity === null || !Number.isInteger(capacity) || capacity <= 0) {
        errors.push(MESSAGES.VALIDATION.CAPACITY_INVALID);
    }
    if (!(0, ticketCategories_1.isTicketCategory)(category)) {
        errors.push(MESSAGES.VALIDATION.CATEGORY_INVALID);
    }
    if (errors.length > 0) {
        throw (0, httpError_1.validationFailed)(errors);
    }
    // The throw above is the proof that these three are valid, but it proves it
    // through the `errors` array rather than through control flow the compiler
    // can follow, so the assertions have to be written out.
    return {
        name,
        price: price,
        capacity: capacity,
        category: category,
        isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    };
};
const params = (req) => req.params;
const addTicketTypeToEvent = async (req, res) => {
    const data = parseTicketTypeBody(req.body);
    const ticketType = await ticketService.createTicketType(params(req).eventId, data);
    res.status(201).json({ ticketType });
};
exports.addTicketTypeToEvent = addTicketTypeToEvent;
const updateTicketTypeOfEvent = async (req, res) => {
    const data = parseTicketTypeBody(req.body);
    const ticketType = await ticketService.updateTicketType(params(req).eventId, params(req).ticketTypeId, data);
    res.json({ ticketType });
};
exports.updateTicketTypeOfEvent = updateTicketTypeOfEvent;
const deleteTicketTypeOfEvent = async (req, res) => {
    const deletedTicketType = await ticketService.deleteTicketType(params(req).eventId, params(req).ticketTypeId);
    res.json({ deletedTicketType });
};
exports.deleteTicketTypeOfEvent = deleteTicketTypeOfEvent;
const addEvent = async (req, res) => {
    const successResponse = await eventService.addEvent(req.body, (0, requireUser_1.requireUser)(req));
    res.status(201).json(successResponse);
};
exports.addEvent = addEvent;
const getEvents = async (req, res) => {
    const allEvents = await eventService.getEvents();
    res.json({ events: allEvents });
};
exports.getEvents = getEvents;
const getEventById = async (req, res) => {
    const event = await eventService.getEventById(params(req).eventId);
    res.json({ event: event });
};
exports.getEventById = getEventById;
const updateEvent = async (req, res) => {
    const updatedEvent = await eventService.updateEvent(params(req).eventId, req.body);
    res.json({ updatedEvent: updatedEvent });
};
exports.updateEvent = updateEvent;
const deleteEvent = async (req, res) => {
    const deletedEvent = await eventService.deleteEvent(params(req).eventId);
    res.json({ deletedEvent: deletedEvent });
};
exports.deleteEvent = deleteEvent;
//# sourceMappingURL=eventController.js.map