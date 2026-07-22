CREATE TABLE "HomeCarouselSlide" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "eyebrow" TEXT,
  "imageAlt" TEXT,
  "imageKey" TEXT,
  "externalImageUrl" TEXT,
  "actionLabel" TEXT,
  "actionType" TEXT NOT NULL DEFAULT 'BOOK',
  "actionUrl" TEXT,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "HomeCarouselSlide_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HomeCarouselSlide_isPublished_idx" ON "HomeCarouselSlide"("isPublished");
CREATE INDEX "HomeCarouselSlide_sortOrder_idx" ON "HomeCarouselSlide"("sortOrder");
