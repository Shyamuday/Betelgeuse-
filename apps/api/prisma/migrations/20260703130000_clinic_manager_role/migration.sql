-- AlterEnum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'CLINIC_MANAGER';

-- CreateTable
CREATE TABLE "ClinicManagerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "employeeId" TEXT,
    "designation" TEXT NOT NULL DEFAULT 'Clinic Manager',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicManagerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClinicManagerProfile_userId_key" ON "ClinicManagerProfile"("userId");
CREATE UNIQUE INDEX "ClinicManagerProfile_employeeId_key" ON "ClinicManagerProfile"("employeeId");
CREATE INDEX "ClinicManagerProfile_storeId_idx" ON "ClinicManagerProfile"("storeId");

-- AddForeignKey
ALTER TABLE "ClinicManagerProfile" ADD CONSTRAINT "ClinicManagerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClinicManagerProfile" ADD CONSTRAINT "ClinicManagerProfile_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
