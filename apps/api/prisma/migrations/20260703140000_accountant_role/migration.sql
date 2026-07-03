-- AlterEnum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ACCOUNTANT';

-- CreateTable
CREATE TABLE "AccountantProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeId" TEXT,
    "designation" TEXT NOT NULL DEFAULT 'Accountant',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountantProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountantProfile_userId_key" ON "AccountantProfile"("userId");
CREATE UNIQUE INDEX "AccountantProfile_employeeId_key" ON "AccountantProfile"("employeeId");

-- AddForeignKey
ALTER TABLE "AccountantProfile" ADD CONSTRAINT "AccountantProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
