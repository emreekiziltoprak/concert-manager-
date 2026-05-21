-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ORGANISER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "EventRoleType" AS ENUM ('OWNER', 'CO_ORGANISER', 'SPEAKER', 'MODERATOR', 'VOLUNTEER', 'SPONSOR', 'ATTENDEE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "event_roles" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "role" "EventRoleType" NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_roles_eventId_idx" ON "event_roles"("eventId");

-- CreateIndex
CREATE INDEX "event_roles_userId_idx" ON "event_roles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "event_roles_eventId_userId_key" ON "event_roles"("eventId", "userId");

-- AddForeignKey
ALTER TABLE "event_roles" ADD CONSTRAINT "event_roles_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_roles" ADD CONSTRAINT "event_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_roles" ADD CONSTRAINT "event_roles_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
