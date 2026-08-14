const { prisma, truncateAll, disconnect } = require("../helpers/db");
const { createTestUser, createTestEvent } = require("../helpers/fixtures");

jest.mock("../../src/utils/stripeClient", () => require("../helpers/stripeMock"));
const { paymentIntents } = require("../helpers/stripeMock");

const { cancelExpiredPendingOrders } = require("../../src/services/orderService");

const ELEVEN_MINUTES_AGO = new Date(Date.now() - 11 * 60 * 1000);
const FIVE_MINUTES_AGO = new Date(Date.now() - 5 * 60 * 1000);

const createTestOrder = ({ userId, eventId, status, createdAt, stripePaymentIntentId = null }) =>
  prisma.order.create({
    data: { userId, eventId, totalAmount: 100, status, createdAt, stripePaymentIntentId }
  });

let user;
let event;

beforeEach(async () => {
  await truncateAll();
  paymentIntents.cancel.mockReset().mockResolvedValue({ id: "pi_test", status: "canceled" });
  user = await createTestUser();
  event = await createTestEvent();
});

afterAll(disconnect);

test("cancels an expired PENDING order that has a Stripe payment intent", async () => {
  const order = await createTestOrder({
    userId: user.id,
    eventId: event.id,
    status: "PENDING",
    createdAt: ELEVEN_MINUTES_AGO,
    stripePaymentIntentId: "pi_expired_1"
  });

  const result = await cancelExpiredPendingOrders();

  const updated = await prisma.order.findUnique({ where: { id: order.id } });
  expect(updated.status).toBe("CANCELLED");
  expect(result.count).toBe(1);
  expect(paymentIntents.cancel).toHaveBeenCalledWith("pi_expired_1");
});

test("cancels an expired PENDING order that has no Stripe payment intent, without calling Stripe", async () => {
  const order = await createTestOrder({
    userId: user.id,
    eventId: event.id,
    status: "PENDING",
    createdAt: ELEVEN_MINUTES_AGO,
    stripePaymentIntentId: null
  });

  await cancelExpiredPendingOrders();

  const updated = await prisma.order.findUnique({ where: { id: order.id } });
  expect(updated.status).toBe("CANCELLED");
  expect(paymentIntents.cancel).not.toHaveBeenCalled();
});

test("leaves a PENDING order younger than 10 minutes untouched", async () => {
  const order = await createTestOrder({
    userId: user.id,
    eventId: event.id,
    status: "PENDING",
    createdAt: FIVE_MINUTES_AGO
  });

  await cancelExpiredPendingOrders();

  const updated = await prisma.order.findUnique({ where: { id: order.id } });
  expect(updated.status).toBe("PENDING");
});

test.each(["SUCCESS", "CANCELLED"])(
  "leaves an already-%s order untouched even if it is old",
  async (status) => {
    const order = await createTestOrder({
      userId: user.id,
      eventId: event.id,
      status,
      createdAt: ELEVEN_MINUTES_AGO
    });

    await cancelExpiredPendingOrders();

    const updated = await prisma.order.findUnique({ where: { id: order.id } });
    expect(updated.status).toBe(status);
  }
);

test("skips an order whose Stripe cancel call fails, but still cancels the rest of the batch", async () => {
  // Separate buyers: a partial unique index (unique_pending_order) allows only
  // one PENDING order per user per event.
  const otherUser = await createTestUser();

  const failing = await createTestOrder({
    userId: user.id,
    eventId: event.id,
    status: "PENDING",
    createdAt: ELEVEN_MINUTES_AGO,
    stripePaymentIntentId: "pi_will_fail"
  });
  const succeeding = await createTestOrder({
    userId: otherUser.id,
    eventId: event.id,
    status: "PENDING",
    createdAt: ELEVEN_MINUTES_AGO,
    stripePaymentIntentId: "pi_will_succeed"
  });

  paymentIntents.cancel.mockImplementation((id) =>
    id === "pi_will_fail"
      ? Promise.reject(new Error("stripe unavailable"))
      : Promise.resolve({ id, status: "canceled" })
  );

  // The failure path logs to console.error by design; capturing it keeps the
  // test output clean and asserts the skip was actually reported.
  const errorLog = jest.spyOn(console, "error").mockImplementation(() => {});

  try {
    await expect(cancelExpiredPendingOrders()).resolves.not.toThrow();

    expect(errorLog).toHaveBeenCalledWith(
      "order expiry: intent cancel failed, skipping order",
      failing.id,
      "stripe unavailable"
    );
  } finally {
    errorLog.mockRestore();
  }

  const failingOrder = await prisma.order.findUnique({ where: { id: failing.id } });
  const succeedingOrder = await prisma.order.findUnique({ where: { id: succeeding.id } });

  expect(failingOrder.status).toBe("PENDING");
  expect(succeedingOrder.status).toBe("CANCELLED");
});

test("does not cancel an order that became SUCCESS between being found and being updated", async () => {
  const order = await createTestOrder({
    userId: user.id,
    eventId: event.id,
    status: "PENDING",
    createdAt: ELEVEN_MINUTES_AGO,
    stripePaymentIntentId: "pi_race"
  });

  // Simulates a webhook completing the payment while cancelExpiredPendingOrders
  // is between its findMany and updateMany calls.
  paymentIntents.cancel.mockImplementation(async (id) => {
    await prisma.order.update({ where: { id: order.id }, data: { status: "SUCCESS" } });
    return { id, status: "canceled" };
  });

  await cancelExpiredPendingOrders();

  const updated = await prisma.order.findUnique({ where: { id: order.id } });
  expect(updated.status).toBe("SUCCESS");
});
