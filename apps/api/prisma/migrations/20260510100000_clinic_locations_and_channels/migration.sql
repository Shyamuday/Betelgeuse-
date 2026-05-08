-- CreateEnum
CREATE TYPE "ConsultationChannel" AS ENUM ('ONLINE_CHAT', 'VIDEO', 'PHONE', 'IN_CLINIC');

-- CreateTable
CREATE TABLE "ClinicLocation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "phone" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClinicLocation_slug_key" ON "ClinicLocation"("slug");

-- CreateIndex
CREATE INDEX "ClinicLocation_isActive_sortOrder_idx" ON "ClinicLocation"("isActive", "sortOrder");

-- AlterTable
ALTER TABLE "Consultation" ADD COLUMN     "locationId" TEXT,
ADD COLUMN     "channel" "ConsultationChannel" NOT NULL DEFAULT 'ONLINE_CHAT';

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "ClinicLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
