-- CreateEnum
CREATE TYPE "RewardProgramKind" AS ENUM ('REFERRAL', 'LOYALTY', 'PROMO', 'WELCOME', 'CUSTOM');
CREATE TYPE "RewardTrigger" AS ENUM ('PATIENT_SIGNUP_WITH_REFERRAL', 'FIRST_CONSULTATION_PAID', 'CONSULTATION_PAID', 'MEDICINE_ORDER_PAID', 'MANUAL');
CREATE TYPE "RewardBeneficiary" AS ENUM ('REFERRER', 'REFERRED_PATIENT', 'PAYING_PATIENT');
CREATE TYPE "RewardValueType" AS ENUM ('WALLET_CREDIT_FLAT', 'CHECKOUT_DISCOUNT_FLAT', 'CHECKOUT_DISCOUNT_PERCENT');
CREATE TYPE "RewardAppliesTo" AS ENUM ('CONSULTATION', 'MEDICINE_DELIVERY', 'ANY');
CREATE TYPE "PatientReferralStatus" AS ENUM ('REGISTERED', 'QUALIFIED', 'REWARDED', 'REJECTED');
CREATE TYPE "WalletLedgerDirection" AS ENUM ('CREDIT', 'DEBIT');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "referredByUserId" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "grossAmountInPaise" INTEGER;
ALTER TABLE "Payment" ADD COLUMN "discountInPaise" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Payment" ADD COLUMN "walletRedeemedInPaise" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Payment" ADD COLUMN "appliedRules" JSONB;

-- CreateTable
CREATE TABLE "RewardProgramRule" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "kind" "RewardProgramKind" NOT NULL,
    "trigger" "RewardTrigger" NOT NULL,
    "beneficiary" "RewardBeneficiary" NOT NULL,
    "valueType" "RewardValueType" NOT NULL,
    "valueAmount" INTEGER NOT NULL,
    "appliesTo" "RewardAppliesTo" NOT NULL DEFAULT 'CONSULTATION',
    "promoCode" TEXT,
    "maxUsesPerPatient" INTEGER,
    "maxUsesGlobal" INTEGER,
    "maxDiscountInPaise" INTEGER,
    "minOrderInPaise" INTEGER,
    "minPayableInPaise" INTEGER NOT NULL DEFAULT 100,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "conditions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardProgramRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RewardRedemption" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "paymentId" TEXT,
    "amountInPaise" INTEGER NOT NULL,
    "context" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardRedemption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PatientReferralCode" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientReferralCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PatientReferral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredUserId" TEXT NOT NULL,
    "referralCodeId" TEXT NOT NULL,
    "status" "PatientReferralStatus" NOT NULL DEFAULT 'REGISTERED',
    "qualifiedAt" TIMESTAMP(3),
    "rewardedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientReferral_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PatientWallet" (
    "patientId" TEXT NOT NULL,
    "balanceInPaise" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientWallet_pkey" PRIMARY KEY ("patientId")
);

CREATE TABLE "WalletLedgerEntry" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "direction" "WalletLedgerDirection" NOT NULL,
    "amountInPaise" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "ruleId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RewardProgramRule_code_key" ON "RewardProgramRule"("code");
CREATE UNIQUE INDEX "RewardProgramRule_promoCode_key" ON "RewardProgramRule"("promoCode");
CREATE INDEX "RewardProgramRule_isActive_trigger_appliesTo_idx" ON "RewardProgramRule"("isActive", "trigger", "appliesTo");
CREATE INDEX "RewardProgramRule_kind_isActive_idx" ON "RewardProgramRule"("kind", "isActive");

CREATE INDEX "RewardRedemption_ruleId_patientId_idx" ON "RewardRedemption"("ruleId", "patientId");
CREATE INDEX "RewardRedemption_patientId_createdAt_idx" ON "RewardRedemption"("patientId", "createdAt");
CREATE INDEX "RewardRedemption_paymentId_idx" ON "RewardRedemption"("paymentId");

CREATE UNIQUE INDEX "PatientReferralCode_patientId_key" ON "PatientReferralCode"("patientId");
CREATE UNIQUE INDEX "PatientReferralCode_code_key" ON "PatientReferralCode"("code");

CREATE UNIQUE INDEX "PatientReferral_referredUserId_key" ON "PatientReferral"("referredUserId");
CREATE INDEX "PatientReferral_referrerId_status_idx" ON "PatientReferral"("referrerId", "status");

CREATE INDEX "WalletLedgerEntry_patientId_createdAt_idx" ON "WalletLedgerEntry"("patientId", "createdAt");

CREATE INDEX "User_referredByUserId_idx" ON "User"("referredByUserId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referredByUserId_fkey" FOREIGN KEY ("referredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "RewardProgramRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PatientReferralCode" ADD CONSTRAINT "PatientReferralCode_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PatientReferral" ADD CONSTRAINT "PatientReferral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PatientReferral" ADD CONSTRAINT "PatientReferral_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PatientReferral" ADD CONSTRAINT "PatientReferral_referralCodeId_fkey" FOREIGN KEY ("referralCodeId") REFERENCES "PatientReferralCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PatientWallet" ADD CONSTRAINT "PatientWallet_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WalletLedgerEntry" ADD CONSTRAINT "WalletLedgerEntry_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WalletLedgerEntry" ADD CONSTRAINT "WalletLedgerEntry_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "RewardProgramRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
