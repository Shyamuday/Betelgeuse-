-- Blog enhancements: author, views, ranking, comments

ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "authorId" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "authorName" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "authorRole" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "isHidden" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "BlogPost_viewCount_idx" ON "BlogPost"("viewCount");
CREATE INDEX IF NOT EXISTS "BlogPost_sortOrder_idx" ON "BlogPost"("sortOrder");
CREATE INDEX IF NOT EXISTS "BlogPost_isFeatured_idx" ON "BlogPost"("isFeatured");
CREATE INDEX IF NOT EXISTS "BlogPost_isPublished_isHidden_category_idx" ON "BlogPost"("isPublished", "isHidden", "category");

ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "BlogComment" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "userId" TEXT,
  "authorName" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "isApproved" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BlogComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BlogComment_postId_isApproved_idx" ON "BlogComment"("postId", "isApproved");
CREATE INDEX IF NOT EXISTS "BlogComment_createdAt_idx" ON "BlogComment"("createdAt");

ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
