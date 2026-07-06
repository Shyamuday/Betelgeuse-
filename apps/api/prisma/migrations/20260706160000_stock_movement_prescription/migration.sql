-- AlterTable
ALTER TABLE "StockMovement" ADD COLUMN "prescriptionId" TEXT;

-- CreateIndex
CREATE INDEX "StockMovement_prescriptionId_idx" ON "StockMovement"("prescriptionId");

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
