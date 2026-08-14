// The only module allowed to reference ../../generated/prisma. The client is
// generated to a custom output, so @prisma/client cannot resolve model types.
export { Prisma, PrismaClient } from "../../generated/prisma";

export {
    UserRole,
    TicketCategory,
    EventStatus,
    EventRoleType,
    OrderStatus
} from "../../generated/prisma";

export type TransactionClient = import("../../generated/prisma").Prisma.TransactionClient;
