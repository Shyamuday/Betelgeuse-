CREATE TABLE "HopeHubAssessmentAttempt" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "assessmentId" TEXT NOT NULL,
  "assessmentType" TEXT NOT NULL,
  "category" TEXT,
  "title" TEXT NOT NULL,
  "version" TEXT NOT NULL DEFAULT 'v1',
  "answers" JSONB NOT NULL,
  "totalScore" INTEGER NOT NULL,
  "maxScore" INTEGER NOT NULL,
  "level" TEXT NOT NULL,
  "color" TEXT,
  "description" TEXT,
  "suggestions" JSONB,
  "safetyFlag" BOOLEAN NOT NULL DEFAULT false,
  "retakeNumber" INTEGER NOT NULL DEFAULT 1,
  "previousId" TEXT,
  "source" TEXT,
  "entryPage" TEXT,
  "completedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "HopeHubAssessmentAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HopeHubAssessmentAttempt_userId_assessmentId_completedAt_idx"
  ON "HopeHubAssessmentAttempt"("userId", "assessmentId", "completedAt");

CREATE INDEX "HopeHubAssessmentAttempt_userId_completedAt_idx"
  ON "HopeHubAssessmentAttempt"("userId", "completedAt");

CREATE INDEX "HopeHubAssessmentAttempt_assessmentId_idx"
  ON "HopeHubAssessmentAttempt"("assessmentId");

CREATE INDEX "HopeHubAssessmentAttempt_safetyFlag_idx"
  ON "HopeHubAssessmentAttempt"("safetyFlag");

ALTER TABLE "HopeHubAssessmentAttempt"
  ADD CONSTRAINT "HopeHubAssessmentAttempt_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HopeHubAssessmentAttempt"
  ADD CONSTRAINT "HopeHubAssessmentAttempt_previousId_fkey"
  FOREIGN KEY ("previousId") REFERENCES "HopeHubAssessmentAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
