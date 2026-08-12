# Issue #14: Automated Unit and Integration Tests — Design

**GitHub Issue:** https://github.com/emreekiziltoprak/concert-manager-/issues/14
**Date:** 2026-08-12
**Status:** Approved

## Problem

The backend has no automated test suite. Critical business logic around order
creation, stock accounting, and expired-order cleanup relies on Postgres row
locking (`FOR UPDATE`) and transactional atomicity that has never been
verified under concurrency. Issue #14 asks for:

- Jest + Supertest installed as the testing stack
- Integration tests for the expired-order cancellation cron job
- Unit tests for available-stock calculation (PENDING + SUCCESS orders count
  against stock, CANCELLED does not)
- Tests that simulate race conditions to validate the database locking
  mechanism

## Goals

- Cover the three areas named in the issue, plus two correctness gaps found
  during design review that sit squarely inside "concurrency and payments":
  cron/webhook race safety, and order-creation atomicity on partial failure.
- Tests must run against a real Postgres instance — the behavior under test
  (`FOR UPDATE`, transaction rollback) cannot be validated with a mocked
  Prisma client.
- Tests must be deterministic and fully isolated from third-party services
  (Stripe, email) — no network calls in CI-less local runs.

## Non-Goals

- `completePayment`, `resumePendingOrder`, `cancelPendingOrder` in
  `paymentService.js` are payment-critical but not named in the issue. Left
  for a follow-up issue to avoid scope creep.
- No CI pipeline is being added in this pass (none exists yet in the repo).
  The test command is designed to be CI-ready but wiring up
  `.github/workflows` is out of scope.
- Lock-granularity test (different `ticketTypeId` rows not blocking each
  other) and the cron-restocks-capacity end-to-end scenario were proposed
  during design review and explicitly declined by the user to keep scope
  tight.

## Architecture

### Test database

Tests run against a dedicated database (`event_hub_test`) on the same
Postgres container already used by `docker-compose.dev.yml` — no new
infrastructure. `backend/.env.test` holds a `DATABASE_URL` pointing at this
database; it carries no real secrets since Stripe and email are mocked in
every test. `.env.test` is added to `.gitignore` (the existing `.env` rule
is an exact-name match and does not cover it).

Before a test run, `prisma migrate deploy` is applied against the test
database. Tests execute inside the `concert_backend` container (`docker exec
-it concert_backend npm test`), consistent with the existing Makefile
pattern of running project commands inside the container rather than on the
host.

Reset strategy: a `beforeEach` truncates the tables each suite touches
(`orders`, `order_items`, `tickets`, `ticket_types`, plus their `events` /
`users` / `categories` parents as needed), via `TRUNCATE ... CASCADE`. A
transaction-wrap-and-rollback strategy was considered and rejected: the
race-condition tests need genuinely concurrent, independently-committing
transactions, and wrapping the whole test in an outer transaction would
either hide or distort the very locking behavior being tested.

`package.json` test script uses `jest --runInBand`. Race-condition tests
create real concurrent load against shared tables; running Jest workers in
parallel would let unrelated test files truncate tables out from under each
other. Serial execution trades speed for correctness here, which is the
right trade for a suite this size.

### `app.js` / `server.js` split

`backend/server.js` currently builds the Express app, calls `app.listen()`,
and starts `startOrderCronJobs()` / `startOutboxWorker()` all at module load
time — there is no way to obtain the app without those side effects.

`backend/src/app.js` is introduced: it owns Express app construction
(middleware registration, route mounting) and exports the app instance with
no listener bound and no jobs started. `server.js` becomes a thin entry
point: `require('./src/app')`, then `app.listen(...)`, then the cron/outbox
starts. Supertest imports `src/app.js` directly, so HTTP-level tests never
open a real port and never trigger the cron scheduler or outbox worker.

### Stock calculation extraction

The available-stock arithmetic currently lives inline inside
`paymentService.createOrder`'s transaction, mixed with the `FOR UPDATE` raw
query and the `orderItem.aggregate` call — not a pure function, so it can't
be unit tested in isolation today.

A new pure function `calculateAvailableStock(totalCount, reservedQuantity)`
is extracted into `backend/src/services/stockCalculation.js` and imported by
`paymentService.createOrder` in place of the inline subtraction. The
`status: { in: ["PENDING", "SUCCESS"] }` filter that
determines what counts as "reserved" stays in the Prisma aggregate query
inside `createOrder` — it's a query concern, not an arithmetic one — and is
exercised by the integration-level race-condition tests instead.

### Mocking

`backend/tests/helpers/stripeMock.js` provides a `jest.mock('../../src/utils/stripeClient')`
factory used by every suite that touches order cancellation or checkout, so
no test ever calls the real Stripe API.

## Test Suites

```
backend/tests/
  helpers/
    db.js          # test DB connection, truncate-between-tests helper
    fixtures.js     # createTestUser, createTestEvent, createTestTicketType
    stripeMock.js   # jest.mock factory for src/utils/stripeClient
  unit/
    stockCalculation.test.js
  integration/
    orderService.test.js
    stockRaceCondition.test.js
    checkout.test.js
  jest.config.js
```

### 1. `unit/stockCalculation.test.js` — available stock (unit)

Pure-function tests for `calculateAvailableStock`, no database:

- `totalCount - reservedQuantity` computed correctly
- Requested quantity exactly equal to remaining stock is allowed (boundary)
- Requested quantity greater than remaining stock is rejected

### 2. `integration/orderService.test.js` — expired order cancellation (cron)

Calls `cancelExpiredPendingOrders()` directly (no waiting on the real cron
schedule) against seeded orders in the test DB:

- PENDING order older than 10 minutes with a `stripePaymentIntentId` →
  cancelled, `stripe.paymentIntents.cancel` called (mocked), status becomes
  `CANCELLED`
- PENDING order older than 10 minutes with no `stripePaymentIntentId` →
  cancelled directly, no Stripe call
- PENDING order younger than 10 minutes → untouched
- Already-SUCCESS or already-CANCELLED order older than 10 minutes →
  untouched
- Mocked Stripe cancel call rejects for one order → that order is skipped
  and left PENDING, the rest of the batch still cancels, no exception
  escapes the function
- **Cron/webhook race:** an order is eligible at the time of `findMany`, but
  its status flips to `SUCCESS` (simulating a webhook completing payment)
  before the cron's `updateMany` runs. The `updateMany`'s
  `where: { status: 'PENDING' }` guard must prevent it from being
  overwritten to `CANCELLED`.

### 3. `integration/stockRaceCondition.test.js` — concurrency and locking

Runs against the test DB with a `TicketType` seeded with a small
`totalCount`:

- `totalCount: 1`, two concurrent `createOrder()` calls (`Promise.all`) for
  the same ticket type → exactly one succeeds, the other rejects with the
  insufficient-stock error; stock never goes negative
- `totalCount: 5`, three concurrent calls requesting 2 each (6 total
  demand) → exactly enough succeed to reach but not exceed 5, verified by
  summing `quantity` across the orders that actually committed
- **Atomicity on partial failure:** a single `createOrder()` call with a
  multi-item cart where the second item's ticket type has insufficient
  stock → the whole call rejects and neither `Order` nor any `OrderItem` for
  the first (valid) item is left in the database

### 4. `integration/checkout.test.js` — HTTP layer (Supertest)

Drives `src/app.js` through Supertest, exercising
`POST /api/payments/checkout` end-to-end (auth middleware → `createOrder` →
`createPaymentIntent`), with `stripeClient` mocked:

- Valid cart, authenticated user → 200 with `clientSecret` and `orderId`
- Insufficient stock → 400 with an error message, no order persisted
- Unauthenticated request → 401 (auth middleware rejects before reaching
  the controller)

## Configuration Changes

- `backend/.env.test` — new file, test-only `DATABASE_URL`, no real
  third-party secrets
- `.gitignore` — add `.env.test`
- `Makefile` — add `test:` target running
  `docker exec -it concert_backend npm test`
- `backend/package.json` — add `jest`, `supertest` devDependencies; add
  `"test": "jest --runInBand"` script; add a `jest` config block (or
  `jest.config.js`) scoping `testEnvironment: "node"` and the `tests/`
  root

## Risks / Open Questions

- None blocking. The design intentionally excludes broader payment-service
  coverage and CI wiring to keep this change focused on what issue #14
  asks for.
