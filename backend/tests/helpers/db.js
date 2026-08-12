const prisma = require("../../src/utils/prismaClient");

const truncateAll = () =>
  prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "order_items", "orders", "Ticket", "ticket_types", "event_registrations", "event_roles", "events", "categories", "users", "OutboxEvent" RESTART IDENTITY CASCADE;'
  );

// Releases both the Prisma client and the underlying pg pool. $disconnect()
// alone leaves the adapter's pool open, which keeps Jest from exiting.
const disconnect = async () => {
  await prisma.$disconnect();
  await prisma.$pool.end();
};

module.exports = { prisma, truncateAll, disconnect };
