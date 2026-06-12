/*
  Warnings:

  - The values [SPEAKER,VOLUNTEER,ATTENDEE] on the enum `EventRoleType` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[stripePaymentIntentId]` on the table `orders` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EventRoleType_new" AS ENUM ('OWNER', 'CO_ORGANISER', 'MODERATOR', 'SPONSOR');
ALTER TABLE "event_roles" ALTER COLUMN "role" TYPE "EventRoleType_new" USING ("role"::text::"EventRoleType_new");
ALTER TYPE "EventRoleType" RENAME TO "EventRoleType_old";
ALTER TYPE "EventRoleType_new" RENAME TO "EventRoleType";
DROP TYPE "public"."EventRoleType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "isUsed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "stripePaymentIntentId" TEXT;

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_stripePaymentIntentId_key" ON "orders"("stripePaymentIntentId");
