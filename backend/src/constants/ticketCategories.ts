import { TicketCategory } from "../types/prisma";

// Derived from the Prisma enum rather than hand-listed, so a schema change
// propagates instead of drifting.
export const TICKET_CATEGORIES: readonly TicketCategory[] = Object.values(TicketCategory);

export const DEFAULT_TICKET_CATEGORY: TicketCategory = TicketCategory.STANDARD;

export const isTicketCategory = (value: unknown): value is TicketCategory =>
    typeof value === "string" && (TICKET_CATEGORIES as readonly string[]).includes(value);

export type { TicketCategory };
