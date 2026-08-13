-- PostgreSQL does not index foreign key columns automatically, and these three
-- tables grow with every purchase. Without them the soldCount aggregate, the
-- "my tickets" lookup and the expiry cron all sequentially scan.

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "order_items_ticketTypeId_idx" ON "order_items"("ticketTypeId");

-- CreateIndex
CREATE INDEX "Ticket_userId_idx" ON "Ticket"("userId");

-- CreateIndex
CREATE INDEX "Ticket_ticketTypeId_idx" ON "Ticket"("ticketTypeId");

-- CreateIndex
CREATE INDEX "Ticket_orderItemId_idx" ON "Ticket"("orderItemId");

-- CreateIndex
CREATE INDEX "orders_userId_idx" ON "orders"("userId");

-- CreateIndex
CREATE INDEX "orders_eventId_idx" ON "orders"("eventId");

-- CreateIndex
-- Matches cancelExpiredPendingOrders: WHERE status = 'PENDING' AND createdAt < ...
CREATE INDEX "orders_status_createdAt_idx" ON "orders"("status", "createdAt");
