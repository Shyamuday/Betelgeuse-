-- Product analytics events for funnel instrumentation

CREATE TYPE "ProductEventCategory" AS ENUM ('FUNNEL', 'ENGAGEMENT', 'SYSTEM');

CREATE TABLE "ProductEvent" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" "ProductEventCategory" NOT NULL DEFAULT 'FUNNEL',
  "actorId" TEXT,
  "actorRole" "Role",
  "sessionId" TEXT,
  "properties" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ProductEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductEvent_name_createdAt_idx" ON "ProductEvent"("name", "createdAt");
CREATE INDEX "ProductEvent_category_createdAt_idx" ON "ProductEvent"("category", "createdAt");
CREATE INDEX "ProductEvent_actorId_createdAt_idx" ON "ProductEvent"("actorId", "createdAt");

ALTER TABLE "ProductEvent"
  ADD CONSTRAINT "ProductEvent_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
