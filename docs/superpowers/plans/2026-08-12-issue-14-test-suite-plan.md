# Issue #14 Test Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Jest + Supertest test suite covering expired-order cancellation, available-stock calculation, and database-locking/concurrency behavior in the concert-manager backend, per GitHub issue #14.

**Architecture:** Tests run inside the existing `concert_backend` Docker container against a dedicated `event_hub_test` Postgres database (same container as dev, separate DB name), truncated between tests. Two small production-code changes enable testability: `paymentService.js`'s inline stock arithmetic is extracted into a pure `calculateAvailableStock()` function, and the Express app is split out of `server.js` into an importable `src/app.js` with no side effects (no `app.listen()`, no cron/outbox/redis startup). Stripe is mocked in every test; nothing in this suite calls a real third-party service.

**Tech Stack:** Jest, Supertest, existing Prisma + `pg` stack, Node's built-in `crypto.randomUUID()` for test fixtures.

**Spec:** `docs/superpowers/specs/2026-08-12-issue-14-test-suite-design.md`

## Global Constraints

- Tests that touch locking/atomicity/concurrency MUST run against a real Postgres database — never a mocked Prisma client.
- No test may call the real Stripe API or send a real email. `src/utils/stripeClient` is mocked via `jest.mock` in every integration test that touches order cancellation or checkout.
- `npm test` runs as `jest --runInBand` — integration tests share one Postgres database and truncate between tests, so test files must run serially, not in parallel workers.
- Test files live under `backend/tests/unit/` and `backend/tests/integration/`.
- `backend/.env.test` is never committed (added to `.gitignore`); it carries the same Stripe/JWT/email values as `backend/.env` since none of the third-party ones are actually used (Stripe is always mocked), but `DATABASE_URL` points at `event_hub_test` instead of `concert_db`.
- Out of scope (per spec's Non-Goals): `completePayment`, `resumePendingOrder`, `cancelPendingOrder` coverage; CI workflow wiring; lock-granularity-across-ticket-types test; cron-restocks-capacity end-to-end test.

---

## File Structure

New files:
- `backend/jest.config.js` — Jest configuration
- `backend/.env.test` — test-only database URL (gitignored)
- `backend/tests/helpers/loadEnv.js` — loads `.env.test` before any test file's own requires run
- `backend/tests/helpers/db.js` — shared Prisma client + `truncateAll()` for test isolation
- `backend/tests/helpers/fixtures.js` — `createTestUser`, `createTestEvent`, `createTestTicketType`, `createTestCategory`, `createAuthToken`
- `backend/tests/helpers/stripeMock.js` — shared `jest.fn()` mocks for `stripeClient`
- `backend/tests/integration/smoke.test.js` — proves the DB/env wiring works
- `backend/src/services/stockCalculation.js` — extracted `calculateAvailableStock()`
- `backend/tests/unit/stockCalculation.test.js`
- `backend/src/app.js` — Express app, extracted from `server.js`
- `backend/tests/integration/app.test.js` — Supertest smoke test for the extracted app
- `backend/tests/integration/orderService.test.js` — cron cancellation tests
- `backend/tests/integration/stockRaceCondition.test.js` — concurrency/locking/atomicity tests
- `backend/tests/integration/checkout.test.js` — Supertest tests for `POST /api/payments/checkout`

Modified files:
- `backend/package.json` — add `jest`/`supertest` devDependencies, `"test"` script
- `.gitignore` — add `.env.test`
- `Makefile` — add `test:` target
- `backend/server.js` — becomes a thin entry point over `src/app.js`
- `backend/src/services/paymentService.js` — uses `calculateAvailableStock()`

---

### Task 1: Test infrastructure and database

**Files:**
- Create: `backend/jest.config.js`
- Create: `backend/.env.test`
- Create: `backend/tests/helpers/loadEnv.js`
- Create: `backend/tests/helpers/db.js`
- Create: `backend/tests/helpers/fixtures.js`
- Create: `backend/tests/helpers/stripeMock.js`
- Create: `backend/tests/integration/smoke.test.js`
- Modify: `backend/package.json`
- Modify: `.gitignore`
- Modify: `Makefile`

**Interfaces:**
- Produces: `tests/helpers/db.js` exports `{ prisma, truncateAll }` — `prisma` is the shared Prisma client instance (same instance `src/utils/prismaClient.js` exports), `truncateAll()` returns a `Promise<void>` that empties every application table.
- Produces: `tests/helpers/fixtures.js` exports `createTestCategory(overrides?)`, `createTestUser(overrides?)`, `createTestEvent(overrides?)`, `createTestTicketType(overrides?)` — each returns `Promise<PrismaModelRecord>`; and `createAuthToken(user)` — returns a signed JWT `string`. Every later task's integration tests use these.
- Produces: `tests/helpers/stripeMock.js` exports `{ paymentIntents: { create: jest.fn(), cancel: jest.fn(), retrieve: jest.fn() } }`, used via `jest.mock("../../src/utils/stripeClient", () => require("../helpers/stripeMock"))`.

- [ ] **Step 1: Install Jest and Supertest**

Run inside the backend container:

```bash
docker exec -it concert_backend npm install --save-dev jest supertest
```

This updates `backend/package.json` and `backend/package-lock.json` automatically.

- [ ] **Step 2: Add the test script to `backend/package.json`**

In the `"scripts"` block, add:

```json
"test": "jest --runInBand"
```

- [ ] **Step 3: Create `backend/jest.config.js`**

```js
module.exports = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/tests/helpers/loadEnv.js"],
  testTimeout: 15000
};
```

- [ ] **Step 4: Create the test database**

```bash
docker exec -it concert_postgres psql -U admin -d concert_db -c "CREATE DATABASE event_hub_test;"
```

- [ ] **Step 5: Create `backend/.env.test`**

Copy `backend/.env` to `backend/.env.test`, then edit only the `DATABASE_URL` line so the database name at the end changes from `concert_db` to `event_hub_test` (keep the same user, password, host, and port). Every other value in the file is unused by the test suite (Stripe and email are always mocked) and can stay as-is.

- [ ] **Step 6: Add `.env.test` to `.gitignore`**

Add this line to `.gitignore` (in the same area as the existing `.agents`/`.claude` entries):

```
.env.test
```

- [ ] **Step 7: Apply migrations to the test database**

```bash
docker exec -it concert_backend sh -c "npx prisma generate && DATABASE_URL=\$(grep '^DATABASE_URL=' .env.test | cut -d '=' -f2- | tr -d '\"') npx prisma migrate deploy"
```

(`^DATABASE_URL=` anchors to the start of the line — `backend/.env`'s leading comment line also contains the substring `DATABASE_URL`, so an unanchored grep would match both lines and corrupt the value.)

- [ ] **Step 8: Add the `test:` target to `Makefile`**

Add near the other `docker exec` targets (after `sh-be:`):

```makefile
test:
	docker exec -it concert_backend npm test
```

- [ ] **Step 9: Create `backend/tests/helpers/loadEnv.js`**

```js
const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env.test"),
  override: true
});
```

- [ ] **Step 10: Create `backend/tests/helpers/db.js`**

```js
const prisma = require("../../src/utils/prismaClient");

const truncateAll = () =>
  prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "order_items", "orders", "Ticket", "ticket_types", "event_registrations", "event_roles", "events", "categories", "users", "OutboxEvent" RESTART IDENTITY CASCADE;'
  );

module.exports = { prisma, truncateAll };
```

- [ ] **Step 11: Create `backend/tests/helpers/fixtures.js`**

```js
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

const createAuthToken = (user) => jwt.sign({ userId: user.id }, process.env.JWT_SECRET);

module.exports = {
  createTestCategory,
  createTestUser,
  createTestEvent,
  createTestTicketType,
  createAuthToken
};
```

- [ ] **Step 12: Create `backend/tests/helpers/stripeMock.js`**

```js
const paymentIntents = {
  create: jest.fn(),
  cancel: jest.fn(),
  retrieve: jest.fn()
};

module.exports = { paymentIntents };
```

- [ ] **Step 13: Write the smoke test — `backend/tests/integration/smoke.test.js`**

```js
const { prisma, truncateAll } = require("../helpers/db");
const { createTestUser } = require("../helpers/fixtures");

afterAll(async () => {
  await prisma.$disconnect();
});

test("can connect to the test database and create/truncate data", async () => {
  await truncateAll();

  const user = await createTestUser({ email: "smoke-test@example.com" });
  expect(user.id).toBeDefined();

  const found = await prisma.user.findUnique({ where: { id: user.id } });
  expect(found.email).toBe("smoke-test@example.com");

  await truncateAll();

  const afterTruncate = await prisma.user.findMany();
  expect(afterTruncate).toHaveLength(0);
});
```

- [ ] **Step 14: Run the test and verify it passes**

```bash
docker exec -it concert_backend npm test
```

Expected: 1 test suite, 1 test, PASS. If it fails with a connection error, re-check Step 5's `DATABASE_URL` edit and Step 7's migration.

- [ ] **Step 15: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/jest.config.js \
  backend/tests/helpers/loadEnv.js backend/tests/helpers/db.js \
  backend/tests/helpers/fixtures.js backend/tests/helpers/stripeMock.js \
  backend/tests/integration/smoke.test.js .gitignore Makefile
git commit -m "chore: set up Jest test infrastructure and test database"
```

(`backend/.env.test` is gitignored and intentionally not committed.)

---

### Task 2: Extract `calculateAvailableStock`

**Files:**
- Create: `backend/src/services/stockCalculation.js`
- Create: `backend/tests/unit/stockCalculation.test.js`
- Modify: `backend/src/services/paymentService.js:1-2,33` (add import, replace inline subtraction)

**Interfaces:**
- Consumes: nothing from other tasks (pure function, no DB).
- Produces: `calculateAvailableStock(totalCount: number, reservedQuantity: number): number` from `backend/src/services/stockCalculation.js`, imported by `paymentService.createOrder` (Task 5's race-condition tests exercise this indirectly through `createOrder`).

- [ ] **Step 1: Write the failing unit test**

Create `backend/tests/unit/stockCalculation.test.js`:

```js
const { calculateAvailableStock } = require("../../src/services/stockCalculation");

describe("calculateAvailableStock", () => {
  test("subtracts reserved quantity from total count", () => {
    expect(calculateAvailableStock(10, 3)).toBe(7);
  });

  test("returns 0 when reserved quantity equals total count", () => {
    expect(calculateAvailableStock(5, 5)).toBe(0);
  });

  test("allows a request that exactly matches remaining stock", () => {
    const available = calculateAvailableStock(10, 8);
    const requested = 2;
    expect(requested <= available).toBe(true);
  });

  test("rejects a request greater than remaining stock", () => {
    const available = calculateAvailableStock(10, 9);
    const requested = 2;
    expect(requested <= available).toBe(false);
  });
});
```

- [ ] **Step 2: Run it and verify it fails**

```bash
docker exec -it concert_backend npx jest tests/unit/stockCalculation.test.js
```

Expected: FAIL — `Cannot find module '../../src/services/stockCalculation'`.

- [ ] **Step 3: Create `backend/src/services/stockCalculation.js`**

```js
const calculateAvailableStock = (totalCount, reservedQuantity) => {
  return totalCount - reservedQuantity;
};

module.exports = { calculateAvailableStock };
```

- [ ] **Step 4: Run it and verify it passes**

```bash
docker exec -it concert_backend npx jest tests/unit/stockCalculation.test.js
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Wire it into `paymentService.js`**

In `backend/src/services/paymentService.js`, change the top of the file (currently lines 1-2):

```js
const prisma = require("../utils/prismaClient");
const stripe = require("../utils/stripeClient");
```

to:

```js
const prisma = require("../utils/prismaClient");
const stripe = require("../utils/stripeClient");
const { calculateAvailableStock } = require("./stockCalculation");
```

Then change this line (currently line 33):

```js
        const availableTickets = ticketType.totalCount - (aggregations._sum.quantity || 0);
```

to:

```js
        const availableTickets = calculateAvailableStock(ticketType.totalCount, aggregations._sum.quantity || 0);
```

- [ ] **Step 6: Run the unit test again to confirm nothing broke**

```bash
docker exec -it concert_backend npm test
```

Expected: all suites still PASS (Task 5's race-condition tests will give this change real integration coverage later).

- [ ] **Step 7: Commit**

```bash
git add backend/src/services/stockCalculation.js backend/tests/unit/stockCalculation.test.js \
  backend/src/services/paymentService.js
git commit -m "refactor: extract calculateAvailableStock as a testable pure function"
```

---

### Task 3: Split Express app into `src/app.js`

**Files:**
- Create: `backend/src/app.js`
- Create: `backend/tests/integration/app.test.js`
- Modify: `backend/server.js` (full rewrite, it is currently 34 lines)

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `backend/src/app.js` exports a configured Express `app` (routes mounted, no `.listen()`, no cron/outbox/redis startup, no `dotenv.config()` call). Task 6's Supertest tests `require("../../src/app")` directly.

- [ ] **Step 1: Write the failing Supertest smoke test**

Create `backend/tests/integration/app.test.js`:

```js
const request = require("supertest");
const app = require("../../src/app");

describe("GET /", () => {
  test("returns the health-check message", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Event api is working" });
  });
});
```

- [ ] **Step 2: Run it and verify it fails**

```bash
docker exec -it concert_backend npx jest tests/integration/app.test.js
```

Expected: FAIL — `Cannot find module '../../src/app'`.

- [ ] **Step 3: Create `backend/src/app.js`**

```js
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./config/swagger");
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const eventRoutes = require("./routes/eventRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(cors());
app.use(cookieParser());
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

app.use("/api/payments", paymentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/users", userRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.get("/", (req, res) => {
  res.json({ message: "Event api is working" });
});

module.exports = app;
```

- [ ] **Step 4: Rewrite `backend/server.js`**

Replace the entire file with:

```js
require("dotenv").config();

const app = require("./src/app");
require("./src/services/redisClient");
const { startOrderCronJobs } = require("./src/services/orderService");
const { startOutboxWorker } = require("./src/jobs/outboxWorker");

startOrderCronJobs();
startOutboxWorker();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server ${PORT} is alive!`);
});
```

- [ ] **Step 5: Run the smoke test and verify it passes**

```bash
docker exec -it concert_backend npm test
```

Expected: all suites PASS, including the new `app.test.js`.

- [ ] **Step 6: Manually verify the real server still boots**

```bash
docker logs -f concert_backend
```

Confirm the log shows `Server 3000 is alive!` and no startup errors (restart the container first if it was already running: `make restart`).

- [ ] **Step 7: Commit**

```bash
git add backend/src/app.js backend/server.js backend/tests/integration/app.test.js
git commit -m "refactor: split Express app into app.js for testability"
```

---

### Task 4: Cron cancellation integration tests

**Files:**
- Create: `backend/tests/integration/orderService.test.js`

**Interfaces:**
- Consumes: `tests/helpers/db.js` (`prisma`, `truncateAll`), `tests/helpers/fixtures.js` (`createTestUser`, `createTestEvent`), `tests/helpers/stripeMock.js` (`paymentIntents`), and `cancelExpiredPendingOrders` from `backend/src/services/orderService.js` (existing, unmodified).
- Produces: nothing consumed by later tasks.

No production code changes are expected in this task — `cancelExpiredPendingOrders` already guards against the cron/webhook race via its `updateMany({ where: { status: 'PENDING' } })` filter. If any assertion below fails against the current implementation, stop and report it rather than changing the test to match — that would indicate a real bug, not a test-authoring mistake.

- [ ] **Step 1: Write `backend/tests/integration/orderService.test.js`**

```js
const { prisma, truncateAll } = require("../helpers/db");
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

afterAll(async () => {
  await prisma.$disconnect();
});

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
  const failing = await createTestOrder({
    userId: user.id,
    eventId: event.id,
    status: "PENDING",
    createdAt: ELEVEN_MINUTES_AGO,
    stripePaymentIntentId: "pi_will_fail"
  });
  const succeeding = await createTestOrder({
    userId: user.id,
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

  await expect(cancelExpiredPendingOrders()).resolves.not.toThrow();

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
```

- [ ] **Step 2: Run it and verify all tests pass**

```bash
docker exec -it concert_backend npx jest tests/integration/orderService.test.js
```

Expected: PASS, 7 tests.

- [ ] **Step 3: Commit**

```bash
git add backend/tests/integration/orderService.test.js
git commit -m "test: add integration tests for expired order cancellation"
```

---

### Task 5: Stock race-condition and atomicity tests

**Files:**
- Create: `backend/tests/integration/stockRaceCondition.test.js`

**Interfaces:**
- Consumes: `tests/helpers/db.js`, `tests/helpers/fixtures.js` (`createTestUser`, `createTestEvent`, `createTestTicketType`), `tests/helpers/stripeMock.js`, and `paymentService.createOrder(userId, eventId, cartItems)` from Task 2 (must run after Task 2 — this suite exercises the refactored code path).
- Produces: nothing consumed by later tasks.

No production code changes are expected — the `FOR UPDATE` row lock and `$transaction` wrapper in `paymentService.createOrder` already provide the locking and atomicity guarantees under test.

- [ ] **Step 1: Write `backend/tests/integration/stockRaceCondition.test.js`**

```js
const { prisma, truncateAll } = require("../helpers/db");
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

afterAll(async () => {
  await prisma.$disconnect();
});

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
  const okType = await createTestTicketType({ eventId: event.id, totalCount: 10 });
  const scarceType = await createTestTicketType({ eventId: event.id, totalCount: 1 });

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
```

- [ ] **Step 2: Run it and verify all tests pass**

```bash
docker exec -it concert_backend npx jest tests/integration/stockRaceCondition.test.js
```

Expected: PASS, 3 tests. If the first two tests fail with more orders succeeding than they should, the `FOR UPDATE` locking is not working as expected — stop and report it; do not loosen the assertions.

- [ ] **Step 3: Commit**

```bash
git add backend/tests/integration/stockRaceCondition.test.js
git commit -m "test: add concurrency and locking tests for order creation"
```

---

### Task 6: Supertest coverage for the checkout endpoint

**Files:**
- Create: `backend/tests/integration/checkout.test.js`

**Interfaces:**
- Consumes: `backend/src/app.js` (Task 3), `tests/helpers/db.js`, `tests/helpers/fixtures.js` (including `createAuthToken`), `tests/helpers/stripeMock.js`.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Write `backend/tests/integration/checkout.test.js`**

```js
const request = require("supertest");
const app = require("../../src/app");
const { prisma, truncateAll } = require("../helpers/db");
const {
  createTestUser,
  createTestEvent,
  createTestTicketType,
  createAuthToken
} = require("../helpers/fixtures");

jest.mock("../../src/utils/stripeClient", () => require("../helpers/stripeMock"));
const { paymentIntents } = require("../helpers/stripeMock");

let user;
let event;
let token;

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

afterAll(async () => {
  await prisma.$disconnect();
});

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
  expect(order.status).toBe("PENDING");
});

test("returns 400 and creates no order when stock is insufficient", async () => {
  const ticketType = await createTestTicketType({ eventId: event.id, totalCount: 1 });

  const response = await request(app)
    .post("/api/payments/checkout")
    .set("Authorization", `Bearer ${token}`)
    .send({ eventId: event.id, cartItems: [{ ticketTypeId: ticketType.id, count: 5 }] });

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
```

- [ ] **Step 2: Run it and verify all tests pass**

```bash
docker exec -it concert_backend npx jest tests/integration/checkout.test.js
```

Expected: PASS, 3 tests.

- [ ] **Step 3: Run the full suite one last time**

```bash
docker exec -it concert_backend npm test
```

Expected: all 7 suites (smoke, stockCalculation, app, orderService, stockRaceCondition, checkout — plus any others created along the way) PASS.

- [ ] **Step 4: Commit**

```bash
git add backend/tests/integration/checkout.test.js
git commit -m "test: add Supertest coverage for checkout endpoint"
```
