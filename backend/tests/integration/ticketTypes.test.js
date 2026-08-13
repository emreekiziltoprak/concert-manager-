const request = require("supertest");
const app = require("../../src/app");
const { prisma, truncateAll, disconnect } = require("../helpers/db");
const {
  createTestCategory,
  createTestUser,
  createTestEvent,
  createTestTicketType,
  createTestEventRole,
  createTestOrder,
  createAuthToken
} = require("../helpers/fixtures");

// Every actor the event-role middleware distinguishes.
let organizer;      // event.organizerId + an OWNER EventRole row
let coOrganiser;    // CO_ORGANISER EventRole row only
let admin;          // global ADMIN, no relationship to the event
let outsider;       // authenticated but unrelated
let event;

let organizerToken;
let coOrganiserToken;
let adminToken;
let outsiderToken;

const ticketTypesUrl = (eventId) => `/api/events/${eventId}/ticket-types`;

const validBody = (overrides = {}) => ({
  name: "VIP",
  price: 250,
  capacity: 10,
  category: "STANDARD",
  isActive: true,
  ...overrides
});

beforeEach(async () => {
  await truncateAll();

  organizer = await createTestUser({ role: "ORGANISER" });
  coOrganiser = await createTestUser({ role: "USER" });
  admin = await createTestUser({ role: "ADMIN" });
  outsider = await createTestUser({ role: "USER" });

  event = await createTestEvent({ organizerId: organizer.id, capacity: 100 });

  await createTestEventRole({ eventId: event.id, userId: organizer.id, role: "OWNER" });
  await createTestEventRole({
    eventId: event.id,
    userId: coOrganiser.id,
    assignedById: organizer.id,
    role: "CO_ORGANISER"
  });

  organizerToken = createAuthToken(organizer);
  coOrganiserToken = createAuthToken(coOrganiser);
  adminToken = createAuthToken(admin);
  outsiderToken = createAuthToken(outsider);
});

afterAll(disconnect);

describe("POST /api/events/:eventId/ticket-types", () => {
  test("creates a ticket type for the OWNER", async () => {
    const response = await request(app)
      .post(ticketTypesUrl(event.id))
      .set("Authorization", `Bearer ${organizerToken}`)
      .send(validBody({ capacity: 40, category: "CHILD" }));

    expect(response.status).toBe(201);
    expect(response.body.ticketType.name).toBe("VIP");

    const stored = await prisma.ticketType.findUnique({
      where: { id: response.body.ticketType.id }
    });
    expect(stored.totalCount).toBe(40);
    expect(stored.category).toBe("CHILD");
    expect(stored.isActive).toBe(true);
  });

  test("creates a ticket type for a CO_ORGANISER", async () => {
    const response = await request(app)
      .post(ticketTypesUrl(event.id))
      .set("Authorization", `Bearer ${coOrganiserToken}`)
      .send(validBody());

    expect(response.status).toBe(201);
  });

  test("creates a ticket type for the organizer even without an EventRole row", async () => {
    const legacyEvent = await createTestEvent({ organizerId: organizer.id, capacity: 50 });

    const response = await request(app)
      .post(ticketTypesUrl(legacyEvent.id))
      .set("Authorization", `Bearer ${organizerToken}`)
      .send(validBody());

    expect(response.status).toBe(201);
  });

  test("creates a ticket type for an ADMIN unrelated to the event", async () => {
    const response = await request(app)
      .post(ticketTypesUrl(event.id))
      .set("Authorization", `Bearer ${adminToken}`)
      .send(validBody());

    expect(response.status).toBe(201);
  });

  test("returns 403 for an authenticated user with no relationship to the event", async () => {
    const response = await request(app)
      .post(ticketTypesUrl(event.id))
      .set("Authorization", `Bearer ${outsiderToken}`)
      .send(validBody());

    expect(response.status).toBe(403);
    expect(await prisma.ticketType.count({ where: { eventId: event.id } })).toBe(0);
  });

  test("returns 401 when no auth token is provided", async () => {
    const response = await request(app).post(ticketTypesUrl(event.id)).send(validBody());

    expect(response.status).toBe(401);
  });

  test("returns 404 for an unknown event", async () => {
    const response = await request(app)
      .post(ticketTypesUrl("11111111-1111-1111-1111-111111111111"))
      .set("Authorization", `Bearer ${organizerToken}`)
      .send(validBody());

    expect(response.status).toBe(404);
  });

  test("returns 404 for a soft-deleted event", async () => {
    await prisma.event.update({ where: { id: event.id }, data: { deletedAt: new Date() } });

    const response = await request(app)
      .post(ticketTypesUrl(event.id))
      .set("Authorization", `Bearer ${adminToken}`)
      .send(validBody());

    expect(response.status).toBe(404);
  });

  test("rejects a duplicate name regardless of case and padding", async () => {
    await createTestTicketType({ eventId: event.id, name: "VIP", totalCount: 10 });

    const response = await request(app)
      .post(ticketTypesUrl(event.id))
      .set("Authorization", `Bearer ${organizerToken}`)
      .send(validBody({ name: "  vip  ", category: "CHILD" }));

    expect(response.status).toBe(409);
    expect(response.body.error).toMatch(/already exists/i);
    expect(await prisma.ticketType.count({ where: { eventId: event.id } })).toBe(1);
  });

  test("rejects a category already used by another ticket type", async () => {
    await createTestTicketType({
      eventId: event.id,
      name: "Standard",
      category: "STANDARD",
      totalCount: 10
    });

    const response = await request(app)
      .post(ticketTypesUrl(event.id))
      .set("Authorization", `Bearer ${organizerToken}`)
      .send(validBody({ name: "Another", category: "STANDARD" }));

    expect(response.status).toBe(409);
    expect(response.body.error).toMatch(/category STANDARD/i);
  });

  test("rejects a capacity that pushes the event over its total capacity", async () => {
    await createTestTicketType({
      eventId: event.id,
      name: "Standard",
      category: "STANDARD",
      totalCount: 60
    });

    const response = await request(app)
      .post(ticketTypesUrl(event.id))
      .set("Authorization", `Bearer ${organizerToken}`)
      .send(validBody({ name: "VIP", category: "CHILD", capacity: 50 }));

    expect(response.status).toBe(400);
    // Event capacity 100 minus the 60 already allocated.
    expect(response.body.error).toContain("40");
    expect(await prisma.ticketType.count({ where: { eventId: event.id } })).toBe(1);
  });

  test("allows a capacity that exactly fills the remaining allowance", async () => {
    await createTestTicketType({
      eventId: event.id,
      name: "Standard",
      category: "STANDARD",
      totalCount: 60
    });

    const response = await request(app)
      .post(ticketTypesUrl(event.id))
      .set("Authorization", `Bearer ${organizerToken}`)
      .send(validBody({ name: "VIP", category: "CHILD", capacity: 40 }));

    expect(response.status).toBe(201);
  });

  test("returns 400 with field errors for an invalid body", async () => {
    const response = await request(app)
      .post(ticketTypesUrl(event.id))
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({ name: "  ", price: -1, capacity: 0, category: "GOLD" });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("name"),
        expect.stringContaining("price"),
        expect.stringContaining("capacity"),
        expect.stringContaining("category")
      ])
    );
  });
});

describe("PUT /api/events/:eventId/ticket-types/:ticketTypeId", () => {
  let ticketType;

  beforeEach(async () => {
    ticketType = await createTestTicketType({
      eventId: event.id,
      name: "Standard",
      category: "STANDARD",
      totalCount: 20
    });
  });

  test("updates every mutable field", async () => {
    const response = await request(app)
      .put(`${ticketTypesUrl(event.id)}/${ticketType.id}`)
      .set("Authorization", `Bearer ${organizerToken}`)
      .send(validBody({ name: "Renamed", price: 75, capacity: 30, category: "STUDENT", isActive: false }));

    expect(response.status).toBe(200);

    const stored = await prisma.ticketType.findUnique({ where: { id: ticketType.id } });
    expect(stored.name).toBe("Renamed");
    expect(Number(stored.price)).toBe(75);
    expect(stored.totalCount).toBe(30);
    expect(stored.category).toBe("STUDENT");
    expect(stored.isActive).toBe(false);
  });

  test("accepts its own unchanged name and category", async () => {
    const response = await request(app)
      .put(`${ticketTypesUrl(event.id)}/${ticketType.id}`)
      .set("Authorization", `Bearer ${organizerToken}`)
      .send(validBody({ name: "Standard", category: "STANDARD", capacity: 25 }));

    expect(response.status).toBe(200);
  });

  test("rejects a sibling's name regardless of case", async () => {
    await createTestTicketType({
      eventId: event.id,
      name: "VIP",
      category: "CHILD",
      totalCount: 10
    });

    const response = await request(app)
      .put(`${ticketTypesUrl(event.id)}/${ticketType.id}`)
      .set("Authorization", `Bearer ${organizerToken}`)
      .send(validBody({ name: "vip", category: "STANDARD", capacity: 20 }));

    expect(response.status).toBe(409);
  });

  test("rejects a sibling's category", async () => {
    await createTestTicketType({
      eventId: event.id,
      name: "VIP",
      category: "CHILD",
      totalCount: 10
    });

    const response = await request(app)
      .put(`${ticketTypesUrl(event.id)}/${ticketType.id}`)
      .set("Authorization", `Bearer ${organizerToken}`)
      .send(validBody({ name: "Standard", category: "CHILD", capacity: 20 }));

    expect(response.status).toBe(409);
  });

  test("rejects a capacity beyond what the other ticket types leave free", async () => {
    await createTestTicketType({
      eventId: event.id,
      name: "VIP",
      category: "CHILD",
      totalCount: 70
    });

    const response = await request(app)
      .put(`${ticketTypesUrl(event.id)}/${ticketType.id}`)
      .set("Authorization", `Bearer ${organizerToken}`)
      .send(validBody({ name: "Standard", category: "STANDARD", capacity: 31 }));

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("30");
  });

  test("counts only the other ticket types, so a type can keep its own allocation", async () => {
    await createTestTicketType({
      eventId: event.id,
      name: "VIP",
      category: "CHILD",
      totalCount: 70
    });

    const response = await request(app)
      .put(`${ticketTypesUrl(event.id)}/${ticketType.id}`)
      .set("Authorization", `Bearer ${organizerToken}`)
      .send(validBody({ name: "Standard", category: "STANDARD", capacity: 30 }));

    expect(response.status).toBe(200);
  });

  test("rejects lowering the capacity below the reserved quantity", async () => {
    await createTestOrder({
      userId: outsider.id,
      eventId: event.id,
      ticketTypeId: ticketType.id,
      quantity: 5,
      status: "PENDING"
    });

    const response = await request(app)
      .put(`${ticketTypesUrl(event.id)}/${ticketType.id}`)
      .set("Authorization", `Bearer ${organizerToken}`)
      .send(validBody({ name: "Standard", category: "STANDARD", capacity: 3 }));

    expect(response.status).toBe(409);
    expect(response.body.error).toMatch(/already/i);

    const stored = await prisma.ticketType.findUnique({ where: { id: ticketType.id } });
    expect(stored.totalCount).toBe(20);
  });

  test("allows lowering the capacity to exactly the reserved quantity", async () => {
    await createTestOrder({
      userId: outsider.id,
      eventId: event.id,
      ticketTypeId: ticketType.id,
      quantity: 5,
      status: "SUCCESS"
    });

    const response = await request(app)
      .put(`${ticketTypesUrl(event.id)}/${ticketType.id}`)
      .set("Authorization", `Bearer ${organizerToken}`)
      .send(validBody({ name: "Standard", category: "STANDARD", capacity: 5 }));

    expect(response.status).toBe(200);
  });

  test("ignores cancelled orders when computing the reserved quantity", async () => {
    await createTestOrder({
      userId: outsider.id,
      eventId: event.id,
      ticketTypeId: ticketType.id,
      quantity: 5,
      status: "CANCELLED"
    });

    const response = await request(app)
      .put(`${ticketTypesUrl(event.id)}/${ticketType.id}`)
      .set("Authorization", `Bearer ${organizerToken}`)
      .send(validBody({ name: "Standard", category: "STANDARD", capacity: 1 }));

    expect(response.status).toBe(200);
  });

  test("returns 404 when the ticket type belongs to a different event", async () => {
    const otherEvent = await createTestEvent({ organizerId: organizer.id, capacity: 50 });
    const otherTicketType = await createTestTicketType({
      eventId: otherEvent.id,
      name: "Elsewhere",
      totalCount: 5
    });

    const response = await request(app)
      .put(`${ticketTypesUrl(event.id)}/${otherTicketType.id}`)
      .set("Authorization", `Bearer ${organizerToken}`)
      .send(validBody({ name: "Hijacked", category: "CHILD", capacity: 5 }));

    expect(response.status).toBe(404);

    const stored = await prisma.ticketType.findUnique({ where: { id: otherTicketType.id } });
    expect(stored.name).toBe("Elsewhere");
  });

  test.each([
    ["CO_ORGANISER", () => coOrganiserToken, 200],
    ["ADMIN", () => adminToken, 200],
    ["outsider", () => outsiderToken, 403]
  ])("responds %s -> %s", async (_role, getToken, expected) => {
    const response = await request(app)
      .put(`${ticketTypesUrl(event.id)}/${ticketType.id}`)
      .set("Authorization", `Bearer ${getToken()}`)
      .send(validBody({ name: "Standard", category: "STANDARD", capacity: 20 }));

    expect(response.status).toBe(expected);
  });

  test("returns 401 without a token", async () => {
    const response = await request(app)
      .put(`${ticketTypesUrl(event.id)}/${ticketType.id}`)
      .send(validBody());

    expect(response.status).toBe(401);
  });
});

describe("DELETE /api/events/:eventId/ticket-types/:ticketTypeId", () => {
  let ticketType;

  beforeEach(async () => {
    ticketType = await createTestTicketType({
      eventId: event.id,
      name: "Standard",
      category: "STANDARD",
      totalCount: 20
    });
  });

  test("deletes a ticket type nothing references", async () => {
    const response = await request(app)
      .delete(`${ticketTypesUrl(event.id)}/${ticketType.id}`)
      .set("Authorization", `Bearer ${organizerToken}`);

    expect(response.status).toBe(200);
    expect(await prisma.ticketType.findUnique({ where: { id: ticketType.id } })).toBeNull();
  });

  // Ticket.ticketTypeId and OrderItem.ticketTypeId are ON DELETE RESTRICT, so
  // every order status blocks the delete -- cancelled ones included.
  test.each(["PENDING", "SUCCESS", "CANCELLED"])(
    "returns 409 when a %s order references the ticket type",
    async (status) => {
      await createTestOrder({
        userId: outsider.id,
        eventId: event.id,
        ticketTypeId: ticketType.id,
        quantity: 2,
        status
      });

      const response = await request(app)
        .delete(`${ticketTypesUrl(event.id)}/${ticketType.id}`)
        .set("Authorization", `Bearer ${organizerToken}`);

      expect(response.status).toBe(409);
      expect(response.body.error).toMatch(/deactivate it instead/i);
      expect(await prisma.ticketType.findUnique({ where: { id: ticketType.id } })).not.toBeNull();
    }
  );

  test("returns 409 when issued tickets reference the ticket type", async () => {
    const order = await createTestOrder({
      userId: outsider.id,
      eventId: event.id,
      ticketTypeId: ticketType.id,
      quantity: 1,
      status: "SUCCESS"
    });

    await prisma.ticket.create({
      data: {
        ticketTypeId: ticketType.id,
        orderItemId: order.orderItems[0].id,
        userId: outsider.id,
        isSold: true
      }
    });

    const response = await request(app)
      .delete(`${ticketTypesUrl(event.id)}/${ticketType.id}`)
      .set("Authorization", `Bearer ${organizerToken}`);

    expect(response.status).toBe(409);
    expect(response.body.error).toMatch(/1 issued ticket/i);
  });

  test("returns 404 for an unknown ticket type", async () => {
    const response = await request(app)
      .delete(`${ticketTypesUrl(event.id)}/22222222-2222-2222-2222-222222222222`)
      .set("Authorization", `Bearer ${organizerToken}`);

    expect(response.status).toBe(404);
  });

  test("returns 404 when the ticket type belongs to a different event", async () => {
    const otherEvent = await createTestEvent({ organizerId: organizer.id, capacity: 50 });
    const otherTicketType = await createTestTicketType({
      eventId: otherEvent.id,
      name: "Elsewhere",
      totalCount: 5
    });

    const response = await request(app)
      .delete(`${ticketTypesUrl(event.id)}/${otherTicketType.id}`)
      .set("Authorization", `Bearer ${organizerToken}`);

    expect(response.status).toBe(404);
    expect(await prisma.ticketType.findUnique({ where: { id: otherTicketType.id } })).not.toBeNull();
  });

  test.each([
    ["CO_ORGANISER", () => coOrganiserToken, 200],
    ["ADMIN", () => adminToken, 200],
    ["outsider", () => outsiderToken, 403]
  ])("responds %s -> %s", async (_role, getToken, expected) => {
    const response = await request(app)
      .delete(`${ticketTypesUrl(event.id)}/${ticketType.id}`)
      .set("Authorization", `Bearer ${getToken()}`);

    expect(response.status).toBe(expected);
  });

  test("returns 401 without a token", async () => {
    const response = await request(app).delete(`${ticketTypesUrl(event.id)}/${ticketType.id}`);

    expect(response.status).toBe(401);
  });
});

describe("GET /api/events/:eventId", () => {
  test("returns a soldCount per ticket type and the event roles", async () => {
    const sold = await createTestTicketType({
      eventId: event.id,
      name: "Standard",
      category: "STANDARD",
      totalCount: 20
    });
    const untouched = await createTestTicketType({
      eventId: event.id,
      name: "VIP",
      category: "CHILD",
      totalCount: 10
    });

    await createTestOrder({
      userId: outsider.id,
      eventId: event.id,
      ticketTypeId: sold.id,
      quantity: 3,
      status: "PENDING"
    });
    await createTestOrder({
      userId: admin.id,
      eventId: event.id,
      ticketTypeId: sold.id,
      quantity: 4,
      status: "SUCCESS"
    });
    // Cancelled orders release their stock, so they must not be counted.
    await createTestOrder({
      userId: coOrganiser.id,
      eventId: event.id,
      ticketTypeId: untouched.id,
      quantity: 9,
      status: "CANCELLED"
    });

    const response = await request(app)
      .get(`/api/events/${event.id}`)
      .set("Authorization", `Bearer ${organizerToken}`);

    expect(response.status).toBe(200);

    const byId = Object.fromEntries(
      response.body.event.ticketTypes.map((ticketType) => [ticketType.id, ticketType])
    );
    expect(byId[sold.id].soldCount).toBe(7);
    expect(byId[untouched.id].soldCount).toBe(0);

    expect(response.body.event.eventRoles).toEqual(
      expect.arrayContaining([{ userId: organizer.id, role: "OWNER" }])
    );
  });

  test("returns 404 for a soft-deleted event", async () => {
    await prisma.event.update({ where: { id: event.id }, data: { deletedAt: new Date() } });

    const response = await request(app)
      .get(`/api/events/${event.id}`)
      .set("Authorization", `Bearer ${organizerToken}`);

    expect(response.status).toBe(404);
  });
});

describe("event-level authorization", () => {
  const updateBody = { title: "Updated title" };

  test("lets an ADMIN who does not own the event update it", async () => {
    const response = await request(app)
      .put(`/api/events/${event.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(updateBody);

    expect(response.status).toBe(200);
    expect(response.body.updatedEvent.title).toBe("Updated title");
  });

  test("lets a CO_ORGANISER update the event", async () => {
    const response = await request(app)
      .put(`/api/events/${event.id}`)
      .set("Authorization", `Bearer ${coOrganiserToken}`)
      .send(updateBody);

    expect(response.status).toBe(200);
  });

  test("lets the organizer update an event that has no EventRole row", async () => {
    const legacyEvent = await createTestEvent({ organizerId: organizer.id, capacity: 50 });

    const response = await request(app)
      .put(`/api/events/${legacyEvent.id}`)
      .set("Authorization", `Bearer ${organizerToken}`)
      .send(updateBody);

    expect(response.status).toBe(200);
  });

  test("returns 403 when an unrelated user updates the event", async () => {
    const response = await request(app)
      .put(`/api/events/${event.id}`)
      .set("Authorization", `Bearer ${outsiderToken}`)
      .send(updateBody);

    expect(response.status).toBe(403);
  });

  test("deletes the event named in the path, not one named in the body", async () => {
    const otherEvent = await createTestEvent({ organizerId: organizer.id, capacity: 50 });

    const response = await request(app)
      .delete(`/api/events/${event.id}`)
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({ eventId: otherEvent.id });

    expect(response.status).toBe(200);
    expect(await prisma.event.findUnique({ where: { id: event.id } })).toBeNull();
    expect(await prisma.event.findUnique({ where: { id: otherEvent.id } })).not.toBeNull();
  });

  test("grants the creator an OWNER role and ignores a client-supplied one", async () => {
    const category = await createTestCategory();

    const response = await request(app)
      .post("/api/events")
      .set("Authorization", `Bearer ${organizerToken}`)
      .send({
        categoryId: category.id,
        organizerId: outsider.id,
        eventRole: { userId: outsider.id, assignedById: outsider.id, role: "OWNER" },
        title: "Created Event",
        slug: `created-event-${Date.now()}`,
        description: "Created through the API",
        startDate: new Date(Date.now() + 86400000).toISOString(),
        endDate: new Date(Date.now() + 90000000).toISOString(),
        address: "Somewhere 1",
        latitude: 41,
        longitude: 29,
        capacity: 100,
        status: "DRAFT"
      });

    expect(response.status).toBe(201);

    const createdId = response.body.eventResp.id;
    const roles = await prisma.eventRole.findMany({ where: { eventId: createdId } });

    expect(roles).toHaveLength(1);
    expect(roles[0]).toMatchObject({ userId: organizer.id, role: "OWNER" });

    const created = await prisma.event.findUnique({ where: { id: createdId } });
    expect(created.organizerId).toBe(organizer.id);
  });
});
