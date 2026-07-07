-- CreateEnum
CREATE TYPE "ClinicalMediaType" AS ENUM ('SKIN', 'TONGUE', 'NAIL', 'HAIR', 'SWELLING', 'OTHER');

-- CreateTable
CREATE TABLE "ClinicalMedia" (
    "id" TEXT NOT NULL,
    "caseAnalysisId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "mediaType" "ClinicalMediaType" NOT NULL,
    "bodyRegion" TEXT,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileName" TEXT,
    "observations" TEXT,
    "patientConsent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicalMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClinicalMedia_caseAnalysisId_createdAt_idx" ON "ClinicalMedia"("caseAnalysisId", "createdAt");

-- AddForeignKey
ALTER TABLE "ClinicalMedia" ADD CONSTRAINT "ClinicalMedia_caseAnalysisId_fkey" FOREIGN KEY ("caseAnalysisId") REFERENCES "CaseAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalMedia" ADD CONSTRAINT "ClinicalMedia_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
