ALTER TYPE "ClinicalMediaType" ADD VALUE IF NOT EXISTS 'XRAY';
ALTER TYPE "ClinicalMediaType" ADD VALUE IF NOT EXISTS 'CT';
ALTER TYPE "ClinicalMediaType" ADD VALUE IF NOT EXISTS 'MRI';
ALTER TYPE "ClinicalMediaType" ADD VALUE IF NOT EXISTS 'ULTRASOUND';
ALTER TYPE "ClinicalMediaType" ADD VALUE IF NOT EXISTS 'ECG';
ALTER TYPE "ClinicalMediaType" ADD VALUE IF NOT EXISTS 'LAB_REPORT';
ALTER TYPE "ClinicalMediaType" ADD VALUE IF NOT EXISTS 'PATHOLOGY';
ALTER TYPE "ClinicalMediaType" ADD VALUE IF NOT EXISTS 'OTHER_IMAGING';

CREATE TYPE "ImagingInterpretationStatus" AS ENUM ('DRAFT', 'DOCTOR_APPROVED', 'REJECTED');

CREATE TABLE "ImagingInterpretation" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "caseAnalysisId" TEXT,
    "status" "ImagingInterpretationStatus" NOT NULL DEFAULT 'DRAFT',
    "aiProvider" TEXT NOT NULL DEFAULT 'ollama',
    "aiModel" TEXT NOT NULL,
    "rawAiOutput" TEXT,
    "structuredSnapshot" JSONB NOT NULL,
    "doctorOverrideRationale" TEXT,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImagingInterpretation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ImagingInterpretation_mediaId_createdAt_idx" ON "ImagingInterpretation"("mediaId", "createdAt");
CREATE INDEX "ImagingInterpretation_caseAnalysisId_createdAt_idx" ON "ImagingInterpretation"("caseAnalysisId", "createdAt");

ALTER TABLE "ImagingInterpretation" ADD CONSTRAINT "ImagingInterpretation_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "ClinicalMedia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImagingInterpretation" ADD CONSTRAINT "ImagingInterpretation_caseAnalysisId_fkey" FOREIGN KEY ("caseAnalysisId") REFERENCES "CaseAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
