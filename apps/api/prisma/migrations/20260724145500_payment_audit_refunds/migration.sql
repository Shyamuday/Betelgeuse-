ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'PARTIALLY_REFUNDED';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'REFUNDED';

ALTER TABLE "Payment"
  ADD COLUMN IF NOT EXISTS "refundedAmountInPaise" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "PaymentGatewayEvent" (
  "id" TEXT NOT NULL,
  "paymentId" TEXT,
  "provider" TEXT NOT NULL DEFAULT 'razorpay',
  "providerEventId" TEXT,
  "eventType" TEXT NOT NULL,
  "providerOrderId" TEXT,
  "providerPaymentId" TEXT,
  "amountInPaise" INTEGER,
  "currency" TEXT,
  "status" TEXT,
  "source" TEXT NOT NULL,
  "signatureVerified" BOOLEAN NOT NULL DEFAULT false,
  "payload" JSONB,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PaymentGatewayEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentRefund" (
  "id" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'razorpay',
  "providerRefundId" TEXT,
  "providerPaymentId" TEXT NOT NULL,
  "amountInPaise" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "reason" TEXT,
  "notes" JSONB,
  "processedByUserId" TEXT,
  "providerCreatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PaymentRefund_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentGatewayEvent_provider_providerEventId_key"
  ON "PaymentGatewayEvent"("provider", "providerEventId");

CREATE INDEX "PaymentGatewayEvent_paymentId_receivedAt_idx"
  ON "PaymentGatewayEvent"("paymentId", "receivedAt");

CREATE INDEX "PaymentGatewayEvent_providerOrderId_idx"
  ON "PaymentGatewayEvent"("providerOrderId");

CREATE INDEX "PaymentGatewayEvent_providerPaymentId_idx"
  ON "PaymentGatewayEvent"("providerPaymentId");

CREATE INDEX "PaymentGatewayEvent_eventType_receivedAt_idx"
  ON "PaymentGatewayEvent"("eventType", "receivedAt");

CREATE UNIQUE INDEX "PaymentRefund_provider_providerRefundId_key"
  ON "PaymentRefund"("provider", "providerRefundId");

CREATE INDEX "PaymentRefund_paymentId_createdAt_idx"
  ON "PaymentRefund"("paymentId", "createdAt");

CREATE INDEX "PaymentRefund_providerPaymentId_idx"
  ON "PaymentRefund"("providerPaymentId");

CREATE INDEX "PaymentRefund_status_idx"
  ON "PaymentRefund"("status");

ALTER TABLE "PaymentGatewayEvent"
  ADD CONSTRAINT "PaymentGatewayEvent_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PaymentRefund"
  ADD CONSTRAINT "PaymentRefund_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
