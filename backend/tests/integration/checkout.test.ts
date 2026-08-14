import request from "supertest";
import app from "../../src/app";
import { prisma, truncateAll, disconnect } from "../helpers/db";
import {
  createTestUser,
  createTestEvent,
  createTestTicketType,
  createAuthToken
} from "../helpers/fixtures";
import type { Event, User } from "../../generated/prisma";

jest.mock("../../src/utils/stripeClient", () => require("../helpers/stripeMock"));
import stripeMock = require("../helpers/stripeMock");
const { paymentIntents } = stripeMock;

let user: User;
let event: Event;
let token: string;

beforeEach(async () => {
  await truncateAll();
  paymentIntents.create.mockReset().mockResolvedValue({
    id: "pi_test_123",
    client_secret: "pi_test_123_secret_abc"
  });
  user = await createTestUser();
  event = await createTestEvent();
  token = createAuthToken(user);
});

afterAll(disconnect);

test("creates an order and returns a client secret for a valid cart", async () => {
  const ticketType = await createTestTicketType({ eventId: event.id, totalCount: 10 });

  const response = await request(app)
    .post("/api/payments/checkout")
    .set("Authorization", `Bearer ${token}`)
    .send({ eventId: event.id, cartItems: [{ ticketTypeId: ticketType.id, count: 2 }] });

  expect(response.status).toBe(200);
  expect(response.body.status).toBe("REQUIRES_PAYMENT");
  expect(response.body.clientSecret).toBe("pi_test_123_secret_abc");

  const order = await prisma.order.findUnique({ where: { id: response.body.orderId } });
  expect(order!.status).toBe("PENDING");
});

test("returns 400 and creates no order when stock is insufficient", async () => {
  const ticketType = await createTestTicketType({ eventId: event.id, totalCount: 1 });

  // The controller logs the stack on the 400 path by design; capturing it
  // keeps the test output clean.
  const errorLog = jest.spyOn(console, "error").mockImplementation(() => {});

  let response;
  try {
    response = await request(app)
      .post("/api/payments/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send({ eventId: event.id, cartItems: [{ ticketTypeId: ticketType.id, count: 5 }] });

    expect(errorLog).toHaveBeenCalled();
  } finally {
    errorLog.mockRestore();
  }

  expect(response.status).toBe(400);
  expect(response.body.error).toBe("there is no enough tickets");

  const orders = await prisma.order.findMany({ where: { eventId: event.id } });
  expect(orders).toHaveLength(0);
});

test("returns 401 when no auth token is provided", async () => {
  const ticketType = await createTestTicketType({ eventId: event.id, totalCount: 10 });

  const response = await request(app)
    .post("/api/payments/checkout")
    .send({ eventId: event.id, cartItems: [{ ticketTypeId: ticketType.id, count: 1 }] });

  expect(response.status).toBe(401);
});
