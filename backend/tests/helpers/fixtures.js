const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");
const prisma = require("../../src/utils/prismaClient");

const createTestCategory = (overrides = {}) => {
  const unique = randomUUID();
  return prisma.category.create({
    data: {
      name: overrides.name || `Test Category ${unique}`,
      slug: overrides.slug || `test-category-${unique}`
    }
  });
};

const createTestUser = (overrides = {}) => {
  const unique = randomUUID();
  return prisma.user.create({
    data: {
      email: overrides.email || `test-user-${unique}@example.com`,
      passwordHash: overrides.passwordHash || "$2a$10$dummyHashForTestsOnly",
      fullName: overrides.fullName || `Test User ${unique}`
    }
  });
};

const createTestEvent = async (overrides = {}) => {
  const unique = randomUUID();
  const organizerId = overrides.organizerId || (await createTestUser()).id;
  const categoryId = overrides.categoryId || (await createTestCategory()).id;

  return prisma.event.create({
    data: {
      organizerId,
      categoryId,
      title: overrides.title || "Test Event",
      slug: overrides.slug || `test-event-${unique}`,
      description: overrides.description || "Test event description",
      startDate: overrides.startDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
      endDate: overrides.endDate || new Date(Date.now() + 25 * 60 * 60 * 1000),
      address: overrides.address || "Test Address 1",
      latitude: overrides.latitude ?? 41.0,
      longitude: overrides.longitude ?? 29.0,
      capacity: overrides.capacity ?? 100,
      status: overrides.status || "PUBLISHED"
    }
  });
};

const createTestTicketType = async (overrides = {}) => {
  const eventId = overrides.eventId || (await createTestEvent()).id;

  return prisma.ticketType.create({
    data: {
      eventId,
      name: overrides.name || "Standard",
      price: overrides.price ?? 100,
      totalCount: overrides.totalCount ?? 10,
      category: overrides.category || "STANDARD"
    }
  });
};

// Mirrors the production token payload (see authService.js) so role-gated
// routes authorize test users the same way they authorize real ones.
const createAuthToken = (user) =>
  jwt.sign(
    { userId: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET
  );

module.exports = {
  createTestCategory,
  createTestUser,
  createTestEvent,
  createTestTicketType,
  createAuthToken
};
