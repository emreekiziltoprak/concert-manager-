import request from "supertest";
import app from "../../src/app";
import { prisma, truncateAll, disconnect } from "../helpers/db";
import {
  createTestUser,
  createTestEvent,
  createTestTicketType,
  createTestOrder,
  createAuthToken
} from "../helpers/fixtures";
import type { Event, Ticket, TicketType, User } from "../../generated/prisma";

let buyer: User;
let organiser: User;
let admin: User;
let event: Event;
let ticketType: TicketType;

let buyerToken: string;
let organiserToken: string;
let adminToken: string;

// A Ticket row only exists once an order item has been paid for.
interface IssueTicketInput { userId: string; ticketTypeId: string; orderItemId: string }

const issueTicket = async ({ userId, ticketTypeId, orderItemId }: IssueTicketInput) =>
  prisma.ticket.create({
    data: { userId, ticketTypeId, orderItemId, isSold: true }
  });

beforeEach(async () => {
  await truncateAll();

  buyer = await createTestUser({ role: "USER" });
  organiser = await createTestUser({ role: "ORGANISER" });
  admin = await createTestUser({ role: "ADMIN" });

  event = await createTestEvent({ organizerId: organiser.id, capacity: 100 });
  ticketType = await createTestTicketType({ eventId: event.id, name: "Standard", totalCount: 20 });

  buyerToken = createAuthToken(buyer);
  organiserToken = createAuthToken(organiser);
  adminToken = createAuthToken(admin);
});

afterAll(disconnect);

describe("GET /api/tickets/my-tickets", () => {
  // Regression: the handler read req.user.id, but the token payload uses userId.
  test("returns the caller's tickets with a QR code", async () => {
    const order = await createTestOrder({
      userId: buyer.id,
      eventId: event.id,
      ticketTypeId: ticketType.id,
      quantity: 1,
      status: "SUCCESS"
    });
    const ticket = await issueTicket({
      userId: buyer.id,
      ticketTypeId: ticketType.id,
      orderItemId: order.orderItems[0]!.id
    });

    const response = await request(app)
      .get("/api/tickets/my-tickets")
      .set("Authorization", `Bearer ${buyerToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].id).toBe(ticket.id);
    expect(response.body[0].qrCode).toMatch(/^data:image\/png;base64,/);
  });

  test("returns only the caller's own tickets", async () => {
    const order = await createTestOrder({
      userId: organiser.id,
      eventId: event.id,
      ticketTypeId: ticketType.id,
      quantity: 1,
      status: "SUCCESS"
    });
    await issueTicket({
      userId: organiser.id,
      ticketTypeId: ticketType.id,
      orderItemId: order.orderItems[0]!.id
    });

    const response = await request(app)
      .get("/api/tickets/my-tickets")
      .set("Authorization", `Bearer ${buyerToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test("returns 401 without a token", async () => {
    const response = await request(app).get("/api/tickets/my-tickets");

    expect(response.status).toBe(401);
  });
});

describe("POST /api/tickets/scan", () => {
  let ticket: Ticket;

  beforeEach(async () => {
    const order = await createTestOrder({
      userId: buyer.id,
      eventId: event.id,
      ticketTypeId: ticketType.id,
      quantity: 1,
      status: "SUCCESS"
    });
    ticket = await issueTicket({
      userId: buyer.id,
      ticketTypeId: ticketType.id,
      orderItemId: order.orderItems[0]!.id
    });
  });

  // Regression: the route allowed "ORGANIZER", but the UserRole enum is "ORGANISER".
  test("lets an ORGANISER scan a ticket and marks it used", async () => {
    const response = await request(app)
      .post("/api/tickets/scan")
      .set("Authorization", `Bearer ${organiserToken}`)
      .send({ ticketId: ticket.id });

    expect(response.status).toBe(200);
    expect(response.body.ticket.isUsed).toBe(true);

    const stored = await prisma.ticket.findUnique({ where: { id: ticket.id } });
    expect(stored!.isUsed).toBe(true);
  });

  test("lets an ADMIN scan a ticket", async () => {
    const response = await request(app)
      .post("/api/tickets/scan")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ ticketId: ticket.id });

    expect(response.status).toBe(200);
  });

  test("refuses a second scan of the same ticket", async () => {
    await request(app)
      .post("/api/tickets/scan")
      .set("Authorization", `Bearer ${organiserToken}`)
      .send({ ticketId: ticket.id });

    const response = await request(app)
      .post("/api/tickets/scan")
      .set("Authorization", `Bearer ${organiserToken}`)
      .send({ ticketId: ticket.id });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/already been used/i);
  });

  test("returns 400 for an unknown ticket id", async () => {
    const response = await request(app)
      .post("/api/tickets/scan")
      .set("Authorization", `Bearer ${organiserToken}`)
      .send({ ticketId: "33333333-3333-3333-3333-333333333333" });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/invalid ticket/i);
  });

  test("returns 400 when no ticket id is sent", async () => {
    const response = await request(app)
      .post("/api/tickets/scan")
      .set("Authorization", `Bearer ${organiserToken}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/required/i);
  });

  test("returns 403 for a plain user", async () => {
    const response = await request(app)
      .post("/api/tickets/scan")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ ticketId: ticket.id });

    expect(response.status).toBe(403);

    const stored = await prisma.ticket.findUnique({ where: { id: ticket.id } });
    expect(stored!.isUsed).toBe(false);
  });

  test("returns 401 without a token", async () => {
    const response = await request(app)
      .post("/api/tickets/scan")
      .send({ ticketId: ticket.id });

    expect(response.status).toBe(401);
  });
});
