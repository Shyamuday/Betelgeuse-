-- CreateTable
CREATE TABLE "InAppNotification" (
    "id" TEXT NOT NULL,
    "recipientUserId" TEXT,
    "recipientStoreStaffId" TEXT,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "metadata" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InAppNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InAppNotification_recipientUserId_readAt_createdAt_idx" ON "InAppNotification"("recipientUserId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "InAppNotification_recipientStoreStaffId_readAt_createdAt_idx" ON "InAppNotification"("recipientStoreStaffId", "readAt", "createdAt");

-- AddForeignKey
ALTER TABLE "InAppNotification" ADD CONSTRAINT "InAppNotification_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InAppNotification" ADD CONSTRAINT "InAppNotification_recipientStoreStaffId_fkey" FOREIGN KEY ("recipientStoreStaffId") REFERENCES "StoreStaff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
