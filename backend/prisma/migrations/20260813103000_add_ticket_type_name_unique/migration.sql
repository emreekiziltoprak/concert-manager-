-- CreateIndex
CREATE UNIQUE INDEX "ticket_types_eventId_name_key" ON "ticket_types"("eventId", "name");
-- ensures ticket type names are unique within an event
