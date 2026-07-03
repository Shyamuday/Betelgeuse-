-- AlterEnum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'RECEPTIONIST';

-- CreateTable
CREATE TABLE "ReceptionistProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "employeeId" TEXT,
    "designation" TEXT NOT NULL DEFAULT 'Receptionist',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReceptionistProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReceptionistProfile_userId_key" ON "ReceptionistProfile"("userId");
CREATE UNIQUE INDEX "ReceptionistProfile_employeeId_key" ON "ReceptionistProfile"("employeeId");
CREATE INDEX "ReceptionistProfile_storeId_idx" ON "ReceptionistProfile"("storeId");

-- AddForeignKey
ALTER TABLE "ReceptionistProfile" ADD CONSTRAINT "ReceptionistProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReceptionistProfile" ADD CONSTRAINT "ReceptionistProfile_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
