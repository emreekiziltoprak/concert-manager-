import * as ticketService from "../services/ticketService";
import * as emailService from "../services/emailService";
import type { Prisma } from "../types/prisma";

type OutboxHandler = (payload: Prisma.JsonValue) => Promise<void>;

interface SendTicketEmailPayload {
    userEmail: string;
    fullName: string;
    orderId: string;
}

const outboxHandlers: Record<string, OutboxHandler | undefined> = {
    'SEND_TICKET_EMAIL': async (payload) => {
        // `Prisma.JsonValue` is a union including primitives and arrays, so it
        // does not destructure. Cast to the producer's shape; see above.
        const { userEmail, fullName, orderId } = payload as unknown as SendTicketEmailPayload;

        const ticketData = await ticketService.getOrderTicketsEmail(orderId);

        // getOrderTicketsEmail is a findUnique, so it returns null for an
        // unknown id. Previously that null went straight to sendTicketEmail,
        // which dereferences `ticketData.event.title` -- the failure surfaced as
        // a TypeError from inside the email template rather than as the missing
        // order it actually was.
        if (!ticketData) {
            throw new Error(`Order ${orderId} not found for ticket email`);
        }

        await emailService.sendTicketEmail(
            userEmail,
            fullName,
            ticketData
        );

    }

};

export = outboxHandlers;
