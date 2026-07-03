-- Homeopathic repertory catalog and consultation case analyses

CREATE TYPE "RepertorySourceCode" AS ENUM ('REPERTORIUM_PUBLICUM');
CREATE TYPE "CaseAnalysisStatus" AS ENUM ('DRAFT', 'FINALIZED');

CREATE TABLE "RepertorySource" (
  "id" TEXT NOT NULL,
  "code" "RepertorySourceCode" NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RepertorySource_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RepertorySource_code_key" ON "RepertorySource"("code");

CREATE TABLE "HomeopathicRemedy" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "abbreviation" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "HomeopathicRemedy_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HomeopathicRemedy_normalizedName_key" ON "HomeopathicRemedy"("normalizedName");
CREATE INDEX "HomeopathicRemedy_abbreviation_idx" ON "HomeopathicRemedy"("abbreviation");

CREATE TABLE "RepertoryRubric" (
  "id" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "chapter" TEXT NOT NULL,
  "subchapter" TEXT,
  "text" TEXT NOT NULL,
  "normalizedText" TEXT NOT NULL,
  "parentPath" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RepertoryRubric_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RepertoryRubric_sourceId_chapter_idx" ON "RepertoryRubric"("sourceId", "chapter");
CREATE INDEX "RepertoryRubric_normalizedText_idx" ON "RepertoryRubric"("normalizedText");

CREATE TABLE "RepertoryRubricRemedy" (
  "id" TEXT NOT NULL,
  "rubricId" TEXT NOT NULL,
  "remedyId" TEXT NOT NULL,
  "grade" INTEGER NOT NULL,

  CONSTRAINT "RepertoryRubricRemedy_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RepertoryRubricRemedy_rubricId_remedyId_key" ON "RepertoryRubricRemedy"("rubricId", "remedyId");
CREATE INDEX "RepertoryRubricRemedy_remedyId_idx" ON "RepertoryRubricRemedy"("remedyId");

CREATE TABLE "CaseAnalysis" (
  "id" TEXT NOT NULL,
  "consultationId" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "sourceId" TEXT,
  "status" "CaseAnalysisStatus" NOT NULL DEFAULT 'DRAFT',
  "notes" TEXT,
  "selectedRemedyId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CaseAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CaseAnalysis_consultationId_createdAt_idx" ON "CaseAnalysis"("consultationId", "createdAt");
CREATE INDEX "CaseAnalysis_doctorId_idx" ON "CaseAnalysis"("doctorId");

CREATE TABLE "CaseAnalysisRubric" (
  "id" TEXT NOT NULL,
  "analysisId" TEXT NOT NULL,
  "rubricId" TEXT NOT NULL,
  "weight" INTEGER NOT NULL DEFAULT 1,

  CONSTRAINT "CaseAnalysisRubric_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CaseAnalysisRubric_analysisId_rubricId_key" ON "CaseAnalysisRubric"("analysisId", "rubricId");

CREATE TABLE "CaseAnalysisResult" (
  "id" TEXT NOT NULL,
  "analysisId" TEXT NOT NULL,
  "remedyId" TEXT NOT NULL,
  "totalScore" INTEGER NOT NULL,
  "coverage" INTEGER NOT NULL,
  "rank" INTEGER NOT NULL,

  CONSTRAINT "CaseAnalysisResult_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CaseAnalysisResult_analysisId_remedyId_key" ON "CaseAnalysisResult"("analysisId", "remedyId");
CREATE INDEX "CaseAnalysisResult_analysisId_rank_idx" ON "CaseAnalysisResult"("analysisId", "rank");

ALTER TABLE "RepertoryRubric"
  ADD CONSTRAINT "RepertoryRubric_sourceId_fkey"
  FOREIGN KEY ("sourceId") REFERENCES "RepertorySource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RepertoryRubricRemedy"
  ADD CONSTRAINT "RepertoryRubricRemedy_rubricId_fkey"
  FOREIGN KEY ("rubricId") REFERENCES "RepertoryRubric"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RepertoryRubricRemedy"
  ADD CONSTRAINT "RepertoryRubricRemedy_remedyId_fkey"
  FOREIGN KEY ("remedyId") REFERENCES "HomeopathicRemedy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CaseAnalysis"
  ADD CONSTRAINT "CaseAnalysis_consultationId_fkey"
  FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CaseAnalysis"
  ADD CONSTRAINT "CaseAnalysis_doctorId_fkey"
  FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CaseAnalysis"
  ADD CONSTRAINT "CaseAnalysis_sourceId_fkey"
  FOREIGN KEY ("sourceId") REFERENCES "RepertorySource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CaseAnalysis"
  ADD CONSTRAINT "CaseAnalysis_selectedRemedyId_fkey"
  FOREIGN KEY ("selectedRemedyId") REFERENCES "HomeopathicRemedy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CaseAnalysisRubric"
  ADD CONSTRAINT "CaseAnalysisRubric_analysisId_fkey"
  FOREIGN KEY ("analysisId") REFERENCES "CaseAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CaseAnalysisRubric"
  ADD CONSTRAINT "CaseAnalysisRubric_rubricId_fkey"
  FOREIGN KEY ("rubricId") REFERENCES "RepertoryRubric"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CaseAnalysisResult"
  ADD CONSTRAINT "CaseAnalysisResult_analysisId_fkey"
  FOREIGN KEY ("analysisId") REFERENCES "CaseAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CaseAnalysisResult"
  ADD CONSTRAINT "CaseAnalysisResult_remedyId_fkey"
  FOREIGN KEY ("remedyId") REFERENCES "HomeopathicRemedy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
