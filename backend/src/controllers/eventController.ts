
import type { Request, Response } from "express";
import * as eventService from "../services/eventService";
import * as ticketService from "../services/ticketService";
import * as MESSAGES from "../constants/messages";
import { DEFAULT_TICKET_CATEGORY, isTicketCategory, type TicketCategory } from "../constants/ticketCategories";
import { validationFailed } from "../utils/httpError";
import { requireUser } from "../utils/requireUser";

interface TicketTypeRequestBody {
    name?: unknown;
    price?: unknown;
    capacity?: unknown;
    category?: unknown;
    isActive?: unknown;
}

interface TicketTypeData {
    name: string;
    price: number;
    capacity: number;
    category: string;
    isActive: boolean;
}

const toNumber = (value: unknown): number | null => {
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim() !== "") return Number(value);
    return null;
};

const parseTicketTypeBody = (body: TicketTypeRequestBody): TicketTypeData => {
    const errors: string[] = [];
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const price = toNumber(body.price);
    const capacity = toNumber(body.capacity);
    const category = body.category === undefined || body.category === null || body.category === ""
        ? DEFAULT_TICKET_CATEGORY
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

    if (!isTicketCategory(category)) {
        errors.push(MESSAGES.VALIDATION.CATEGORY_INVALID);
    }

    if (errors.length > 0) {
        throw validationFailed(errors);
    }

    // The throw above is the proof that these three are valid, but it proves it
    // through the `errors` array rather than through control flow the compiler
    // can follow, so the assertions have to be written out.
    return {
        name,
        price: price as number,
        capacity: capacity as number,
        category: category as TicketCategory,
        isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    };
};

type EventParams = { eventId: string; ticketTypeId: string };

const params = (req: Request): EventParams => req.params as EventParams;

const addTicketTypeToEvent = async (req: Request, res: Response): Promise<void> => {
    const data = parseTicketTypeBody(req.body);
    const ticketType = await ticketService.createTicketType(params(req).eventId, data);

    res.status(201).json({ ticketType });
};

const updateTicketTypeOfEvent = async (req: Request, res: Response): Promise<void> => {
    const data = parseTicketTypeBody(req.body);
    const ticketType = await ticketService.updateTicketType(
        params(req).eventId,
        params(req).ticketTypeId,
        data
    );

    res.json({ ticketType });
};

const deleteTicketTypeOfEvent = async (req: Request, res: Response): Promise<void> => {
    const deletedTicketType = await ticketService.deleteTicketType(
        params(req).eventId,
        params(req).ticketTypeId
    );

    res.json({ deletedTicketType });
};

const addEvent = async (req: Request, res: Response): Promise<void> => {
    const successResponse = await eventService.addEvent(req.body, requireUser(req));

    res.status(201).json(successResponse);
}

const getEvents = async (req: Request, res: Response): Promise<void> => {
    const allEvents = await eventService.getEvents();

    res.json({events: allEvents});
}

const getEventById = async (req: Request, res: Response): Promise<void> => {
    const event = await eventService.getEventById(params(req).eventId);

    res.json({event: event});
}

const updateEvent = async (req: Request, res: Response): Promise<void> => {
    const updatedEvent = await eventService.updateEvent(params(req).eventId, req.body);

    res.json({updatedEvent: updatedEvent});
}

const deleteEvent = async (req: Request, res: Response): Promise<void> => {
    const deletedEvent = await eventService.deleteEvent(params(req).eventId);

    res.json({deletedEvent: deletedEvent});
}

export {
    addEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    addTicketTypeToEvent,
    updateTicketTypeOfEvent,
    deleteTicketTypeOfEvent
};
