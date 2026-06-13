CREATE UNIQUE INDEX "unique_pending_order" ON
 "orders" ("userId", "eventId") WHERE status = 'PENDING';
-- ensures a user can have only one pending order per event