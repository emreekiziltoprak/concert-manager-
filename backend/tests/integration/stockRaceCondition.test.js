const { prisma, truncateAll, disconnect } = require("../helpers/db");
const { createTestUser, createTestEvent, createTestTicketType } = require("../helpers/fixtures");

jest.mock("../../src/utils/stripeClient", () => require("../helpers/stripeMock"));

const paymentService = require("../../src/services/paymentService");

let user;
let event;

beforeEach(async () => {
  await truncateAll();
  user = await createTestUser();
  event = await createTestEvent();
});

afterAll(disconnect);

test("only one of two concurrent orders succeeds when only one ticket is left", async () => {
  const ticketType = await createTestTicketType({ eventId: event.id, totalCount: 1 });
  const buyerA = await createTestUser();
  const buyerB = await createTestUser();
  const cartItems = [{ ticketTypeId: ticketType.id, count: 1 }];

  const results = await Promise.allSettled([
    paymentService.createOrder(buyerA.id, event.id, cartItems),
    paymentService.createOrder(buyerB.id, event.id, cartItems)
  ]);

  const fulfilled = results.filter((r) => r.status === "fulfilled");
  const rejected = results.filter((r) => r.status === "rejected");

  expect(fulfilled).toHaveLength(1);
  expect(rejected).toHaveLength(1);
  expect(rejected[0].reason.message).toBe("there is no enough tickets");

  const orders = await prisma.order.findMany({ where: { eventId: event.id } });
  expect(orders).toHaveLength(1);
});

test("exactly enough concurrent orders succeed to reach available stock, never exceeding it", async () => {
  const ticketType = await createTestTicketType({ eventId: event.id, totalCount: 5 });
  const buyers = await Promise.all([createTestUser(), createTestUser(), createTestUser()]);
  const cartItems = [{ ticketTypeId: ticketType.id, count: 2 }];

  const results = await Promise.allSettled(
    buyers.map((buyer) => paymentService.createOrder(buyer.id, event.id, cartItems))
  );

  const fulfilled = results.filter((r) => r.status === "fulfilled");
  const rejected = results.filter((r) => r.status === "rejected");

  expect(fulfilled).toHaveLength(2);
  expect(rejected).toHaveLength(1);

  const orderItems = await prisma.orderItem.findMany({ where: { ticketTypeId: ticketType.id } });
  const totalReserved = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  expect(totalReserved).toBe(4);
});

test("rolls back the whole order when one cart item has insufficient stock", async () => {
  // Names must differ: ticket_types is unique on (eventId, name).
  const okType = await createTestTicketType({ eventId: event.id, name: "Plenty", totalCount: 10 });
  const scarceType = await createTestTicketType({ eventId: event.id, name: "Scarce", totalCount: 1 });

  const cartItems = [
    { ticketTypeId: okType.id, count: 1 },
    { ticketTypeId: scarceType.id, count: 5 }
  ];

  await expect(paymentService.createOrder(user.id, event.id, cartItems)).rejects.toThrow(
    "there is no enough tickets"
  );

  const orders = await prisma.order.findMany({ where: { eventId: event.id } });
  const orderItems = await prisma.orderItem.findMany({
    where: { ticketTypeId: { in: [okType.id, scarceType.id] } }
  });

  expect(orders).toHaveLength(0);
  expect(orderItems).toHaveLength(0);
});
