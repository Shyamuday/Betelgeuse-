CREATE TABLE "HomeAnnouncement" (
  "id" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "linkLabel" TEXT,
  "linkUrl" TEXT,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "HomeAnnouncement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HomeAnnouncement_isPublished_idx" ON "HomeAnnouncement"("isPublished");
CREATE INDEX "HomeAnnouncement_sortOrder_idx" ON "HomeAnnouncement"("sortOrder");
