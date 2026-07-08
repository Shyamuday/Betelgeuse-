-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ProductEventCategory" AS ENUM ('FUNNEL', 'ENGAGEMENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PATIENT', 'DOCTOR', 'ADMIN', 'HR', 'RECEPTIONIST', 'CLINIC_MANAGER', 'ACCOUNTANT', 'SUPPLIER', 'WAREHOUSE_MANAGER', 'DELIVERY_EXECUTIVE', 'DIAGNOSTIC_PARTNER', 'BRANCH_OWNER', 'PATIENT_COORDINATOR', 'CALL_CENTER', 'MARKETING', 'CORPORATE_WELLNESS', 'INSURANCE_PARTNER');

-- CreateEnum
CREATE TYPE "PatientGender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "LifestyleStatus" AS ENUM ('NEVER', 'FORMER', 'OCCASIONAL', 'REGULAR', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "DietType" AS ENUM ('VEGETARIAN', 'NON_VEGETARIAN', 'VEGAN', 'EGGETARIAN', 'MIXED');

-- CreateEnum
CREATE TYPE "ThermalPreference" AS ENUM ('HOT_NATURED', 'COLD_NATURED', 'MIXED', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "VacancyStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('REMOTE', 'ON_SITE', 'HYBRID');

-- CreateEnum
CREATE TYPE "ChatSessionStatus" AS ENUM ('ACTIVE', 'NEEDS_OPERATOR', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('PAYMENT_PENDING', 'PAID', 'ASSIGNED', 'IN_PROGRESS', 'PRESCRIPTION_UPLOADED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "BillingPlanType" AS ENUM ('ONE_TIME_APPOINTMENT', 'STARTER_MONTHLY', 'CONTINUITY_QUARTERLY');

-- CreateEnum
CREATE TYPE "SupportNoteCategory" AS ENUM ('GENERAL', 'BILLING', 'ADHERENCE', 'TECHNICAL', 'ESCALATION');

-- CreateEnum
CREATE TYPE "MedicineDeliveryStatus" AS ENUM ('PENDING', 'ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PatientAddressType" AS ENUM ('HOME', 'WORK', 'OTHER');

-- CreateEnum
CREATE TYPE "LabReferralStatus" AS ENUM ('SENT', 'ACCEPTED', 'SAMPLE_COLLECTED', 'IN_PROGRESS', 'RESULT_READY', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExpenseLevel" AS ENUM ('CLINIC', 'STORE');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('RENT', 'ELECTRICITY', 'WATER', 'INTERNET', 'TELEPHONE', 'EQUIPMENT', 'SOFTWARE', 'FURNITURE', 'VEHICLE', 'STATIONERY', 'OFFICE_SUPPLIES', 'PACKAGING', 'CLEANING_SUPPLIES', 'MEDICAL_SUPPLIES', 'SALARY', 'TRAINING', 'INSURANCE', 'LEGAL', 'SECURITY', 'MARKETING', 'MAINTENANCE', 'LOGISTICS', 'BANK_CHARGES', 'MISC');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('CASUAL', 'SICK', 'EARNED', 'UNPAID', 'MATERNITY', 'PATERNITY');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EmployeeType" AS ENUM ('DOCTOR', 'STORE_STAFF');

-- CreateEnum
CREATE TYPE "WorkShift" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'FULL_DAY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'RESIGNED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "HomeopathicDoctorType" AS ENUM ('CHIEF_CONSULTANT', 'JUNIOR_DOCTOR', 'SPECIALIST_CONSULTANT', 'VISITING_DOCTOR', 'TELEMEDICINE_DOCTOR', 'MEDICAL_INTERN', 'RESIDENT_MEDICAL_OFFICER');

-- CreateEnum
CREATE TYPE "HomeopathicSpecialtyFocus" AS ENUM ('SKIN', 'CHILD', 'WOMENS_HEALTH', 'CHRONIC_DISEASES');

-- CreateEnum
CREATE TYPE "DoctorCompensationModel" AS ENUM ('SALARIED', 'CONSULT_ONLY', 'HYBRID');

-- CreateEnum
CREATE TYPE "InsuranceClaimStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID');

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PrescriptionOptionType" AS ENUM ('METHOD', 'DIAGNOSED_DISEASE');

-- CreateEnum
CREATE TYPE "DoseEventStatus" AS ENUM ('PENDING', 'TAKEN', 'SKIPPED', 'MISSED');

-- CreateEnum
CREATE TYPE "RepertorySourceCode" AS ENUM ('REPERTORIUM_PUBLICUM', 'OOREP_PUBLICUM', 'OOREP_KENT_DE');

-- CreateEnum
CREATE TYPE "CaseAnalysisStatus" AS ENUM ('DRAFT', 'FINALIZED');

-- CreateEnum
CREATE TYPE "ClinicalMediaType" AS ENUM ('SKIN', 'TONGUE', 'NAIL', 'HAIR', 'SWELLING', 'EYE', 'EAR', 'WOUND', 'JOINT', 'POSTURE', 'DENTAL', 'ABDOMEN', 'CHEST', 'LIMBS', 'OTHER');

-- CreateEnum
CREATE TYPE "RewardProgramKind" AS ENUM ('REFERRAL', 'LOYALTY', 'PROMO', 'WELCOME', 'CUSTOM');

-- CreateEnum
CREATE TYPE "RewardTrigger" AS ENUM ('PATIENT_SIGNUP_WITH_REFERRAL', 'FIRST_CONSULTATION_PAID', 'CONSULTATION_PAID', 'MEDICINE_ORDER_PAID', 'MANUAL');

-- CreateEnum
CREATE TYPE "RewardBeneficiary" AS ENUM ('REFERRER', 'REFERRED_PATIENT', 'PAYING_PATIENT');

-- CreateEnum
CREATE TYPE "RewardValueType" AS ENUM ('WALLET_CREDIT_FLAT', 'CHECKOUT_DISCOUNT_FLAT', 'CHECKOUT_DISCOUNT_PERCENT');

-- CreateEnum
CREATE TYPE "RewardAppliesTo" AS ENUM ('CONSULTATION', 'MEDICINE_DELIVERY', 'ANY');

-- CreateEnum
CREATE TYPE "PatientReferralStatus" AS ENUM ('REGISTERED', 'QUALIFIED', 'REWARDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "WalletLedgerDirection" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "StoreRole" AS ENUM ('MANAGER', 'STAFF');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('PURCHASE_IN', 'SALE_OUT', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'TRANSFER_IN', 'TRANSFER_OUT', 'EXPIRED_REMOVAL');

-- CreateEnum
CREATE TYPE "StockStatus" AS ENUM ('ACTIVE', 'LOW_STOCK', 'OUT_OF_STOCK', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "StoreKind" AS ENUM ('BRANCH', 'WAREHOUSE');

-- CreateEnum
CREATE TYPE "StockTransferStatus" AS ENUM ('PENDING_DISPATCH', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WebsiteLeadSource" AS ENUM ('CHAT_BOT', 'HOME_BOOKING', 'PROMO_POPUP');

-- CreateEnum
CREATE TYPE "WebsiteLeadFollowUp" AS ENUM ('NEW', 'NEEDS_CALLBACK', 'CALLED', 'NO_ANSWER', 'WHATSAPP_SENT', 'REGISTERED', 'BOOKED', 'NOT_INTERESTED', 'CLOSED');

-- CreateTable
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

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "mobile" TEXT,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "patientCode" TEXT,
    "profileImageKey" TEXT,
    "homeClinicStoreId" TEXT,
    "allergies" TEXT,
    "currentMedications" TEXT,
    "chronicConditions" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "PatientGender",
    "bloodGroup" TEXT,
    "alternateMobile" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "country" TEXT DEFAULT 'India',
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "emergencyContactRelation" TEXT,
    "occupation" TEXT,
    "maritalStatus" "MaritalStatus",
    "heightCm" INTEGER,
    "weightKg" DOUBLE PRECISION,
    "pastSurgeries" TEXT,
    "familyMedicalHistory" TEXT,
    "smokingStatus" "LifestyleStatus",
    "alcoholUse" "LifestyleStatus",
    "preferredLanguage" TEXT,
    "patientNotes" TEXT,
    "dietType" "DietType",
    "foodHabits" TEXT,
    "foodCravings" TEXT,
    "foodAversions" TEXT,
    "appetiteNotes" TEXT,
    "thirstNotes" TEXT,
    "sleepPattern" TEXT,
    "dreamNotes" TEXT,
    "thermalPreference" "ThermalPreference",
    "perspirationNotes" TEXT,
    "bowelHabits" TEXT,
    "urineHabits" TEXT,
    "menstrualHistory" TEXT,
    "mentalTemperament" TEXT,
    "fearsPhobias" TEXT,
    "angerGriefPatterns" TEXT,
    "concentrationMemory" TEXT,
    "socialBehaviour" TEXT,
    "stressTriggers" TEXT,
    "childhoodIllnesses" TEXT,
    "vaccinationHistory" TEXT,
    "previousHomeopathicTreatment" TEXT,
    "aggravatingFactors" TEXT,
    "relievingFactors" TEXT,
    "exerciseHabits" TEXT,
    "stimulantHabits" TEXT,
    "constitutionalNotes" TEXT,
    "skinHairNailNotes" TEXT,
    "weatherSensitivity" TEXT,
    "referredByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" "Role",
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "summary" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReminderPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inApp" BOOLEAN NOT NULL DEFAULT true,
    "sms" BOOLEAN NOT NULL DEFAULT true,
    "whatsapp" BOOLEAN NOT NULL DEFAULT false,
    "push" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" TEXT NOT NULL DEFAULT '22:00',
    "quietHoursEnd" TEXT NOT NULL DEFAULT '07:00',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReminderPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT,
    "category" TEXT NOT NULL,
    "readTime" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobVacancy" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "jobType" "JobType" NOT NULL DEFAULT 'FULL_TIME',
    "locationType" "LocationType" NOT NULL DEFAULT 'ON_SITE',
    "location" TEXT,
    "description" TEXT NOT NULL,
    "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "responsibilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "VacancyStatus" NOT NULL DEFAULT 'DRAFT',
    "isUrgent" BOOLEAN NOT NULL DEFAULT false,
    "deadline" TIMESTAMP(3),
    "salaryRange" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobVacancy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL,
    "visitorName" TEXT,
    "visitorPhone" TEXT,
    "visitorEmail" TEXT,
    "userId" TEXT,
    "status" "ChatSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "botStage" INTEGER NOT NULL DEFAULT 0,
    "concern" TEXT,
    "visitorKey" TEXT,
    "entryPage" TEXT,
    "preferredCallbackTime" TEXT,
    "operatorNote" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Disease" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "feeInPaise" INTEGER NOT NULL,
    "intakeQuestions" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "publicCategory" TEXT,
    "publicDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Disease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiseaseLocationFee" (
    "id" TEXT NOT NULL,
    "diseaseId" TEXT NOT NULL,
    "locationKey" TEXT NOT NULL,
    "feeInPaise" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiseaseLocationFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consultation" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "diseaseId" TEXT NOT NULL,
    "assignedDoctorId" TEXT,
    "clinicStoreId" TEXT,
    "status" "ConsultationStatus" NOT NULL DEFAULT 'PAYMENT_PENDING',
    "billingPlanCode" TEXT,
    "pricingSnapshot" JSONB,
    "intakeAnswers" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'razorpay',
    "billingPlanCode" TEXT,
    "providerOrderId" TEXT,
    "providerPaymentId" TEXT,
    "grossAmountInPaise" INTEGER,
    "discountInPaise" INTEGER NOT NULL DEFAULT 0,
    "walletRedeemedInPaise" INTEGER NOT NULL DEFAULT 0,
    "amountInPaise" INTEGER NOT NULL,
    "lineItems" JSONB,
    "appliedRules" JSONB,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingPlan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "planType" "BillingPlanType" NOT NULL,
    "priceInPaise" INTEGER NOT NULL,
    "consultationsLimit" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportCaseNote" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "consultationId" TEXT,
    "authorId" TEXT NOT NULL,
    "category" "SupportNoteCategory" NOT NULL DEFAULT 'GENERAL',
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportCaseNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientAddress" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "addressType" "PatientAddressType" NOT NULL DEFAULT 'HOME',
    "recipientName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "landmark" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "deliveryInstructions" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicineDelivery" (
    "id" TEXT NOT NULL,
    "deliveryNumber" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "prescriptionId" TEXT,
    "assignedExecutiveId" TEXT,
    "patientAddressId" TEXT,
    "status" "MedicineDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "deliveryAddress" TEXT NOT NULL,
    "deliveryPhone" TEXT NOT NULL,
    "notes" TEXT,
    "otpHash" TEXT,
    "failureReason" TEXT,
    "proofNote" TEXT,
    "assignedAt" TIMESTAMP(3),
    "pickedUpAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicineDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicineDeliveryLine" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "medicineId" TEXT,
    "label" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,

    CONSTRAINT "MedicineDeliveryLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticCenter" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "gstin" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosticCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticCenterProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "diagnosticCenterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosticCenterProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabReferral" (
    "id" TEXT NOT NULL,
    "referralNumber" TEXT NOT NULL,
    "diagnosticCenterId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "consultationId" TEXT,
    "status" "LabReferralStatus" NOT NULL DEFAULT 'SENT',
    "clinicalNotes" TEXT,
    "partnerNotes" TEXT,
    "expectedResultDate" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabReferral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabReferralLine" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "testName" TEXT NOT NULL,
    "testCode" TEXT,
    "specimen" TEXT,
    "resultSummary" TEXT,
    "resultFileUrl" TEXT,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "LabReferralLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaqEntry" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaqEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessExpense" (
    "id" TEXT NOT NULL,
    "level" "ExpenseLevel" NOT NULL,
    "storeId" TEXT,
    "category" "ExpenseCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "vendor" TEXT,
    "billNo" TEXT,
    "amountInPaise" INTEGER NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Doctor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "doctorType" "HomeopathicDoctorType" NOT NULL DEFAULT 'JUNIOR_DOCTOR',
    "specialtyFocus" "HomeopathicSpecialtyFocus",
    "specialty" TEXT NOT NULL,
    "registrationNo" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isOnline" BOOLEAN NOT NULL DEFAULT true,
    "clinicStoreId" TEXT,
    "employeeId" TEXT,
    "designation" TEXT,
    "department" TEXT,
    "joiningDate" TIMESTAMP(3),
    "probationEndDate" TIMESTAMP(3),
    "salaryPerMonth" INTEGER,
    "consultationFee" INTEGER,
    "compensationModel" "DoctorCompensationModel" NOT NULL DEFAULT 'HYBRID',
    "consultationSharePercent" INTEGER NOT NULL DEFAULT 60,
    "workShift" "WorkShift" NOT NULL DEFAULT 'FULL_DAY',
    "shiftStart" TEXT,
    "shiftEnd" TEXT,
    "weeklyOffDays" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "employeeStatus" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "phone" TEXT,
    "address" TEXT,
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "bio" TEXT,
    "showOnWebsite" BOOLEAN NOT NULL DEFAULT false,
    "websiteOrder" INTEGER,
    "yearsOfExperience" INTEGER,
    "focusAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "defaultMethodOptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Doctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeId" TEXT,
    "designation" TEXT NOT NULL DEFAULT 'HR Manager',
    "department" TEXT NOT NULL DEFAULT 'Human Resources',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HrProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HrStoreAccess" (
    "id" TEXT NOT NULL,
    "hrUserId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "grantedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HrStoreAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceptionistProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "employeeId" TEXT,
    "designation" TEXT NOT NULL DEFAULT 'Receptionist',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReceptionistProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicManagerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "employeeId" TEXT,
    "designation" TEXT NOT NULL DEFAULT 'Clinic Manager',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicManagerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountantProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeId" TEXT,
    "designation" TEXT NOT NULL DEFAULT 'Accountant',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountantProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarehouseManagerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "employeeId" TEXT,
    "designation" TEXT NOT NULL DEFAULT 'Warehouse Manager',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarehouseManagerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryExecutiveProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "employeeId" TEXT,
    "designation" TEXT NOT NULL DEFAULT 'Delivery Executive',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryExecutiveProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRequest" (
    "id" TEXT NOT NULL,
    "employeeType" "EmployeeType" NOT NULL,
    "doctorId" TEXT,
    "storeStaffId" TEXT,
    "type" "LeaveType" NOT NULL,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalDays" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "hrNote" TEXT,
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JoiningLetter" (
    "id" TEXT NOT NULL,
    "letterNumber" TEXT NOT NULL,
    "issuedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" JSONB NOT NULL,
    "staffId" TEXT,
    "doctorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JoiningLetter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorSlot" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isBooked" BOOLEAN NOT NULL DEFAULT false,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeSalary" (
    "id" TEXT NOT NULL,
    "employeeType" "EmployeeType" NOT NULL,
    "doctorId" TEXT,
    "storeStaffId" TEXT,
    "basicPaise" INTEGER NOT NULL DEFAULT 0,
    "hraPaise" INTEGER NOT NULL DEFAULT 0,
    "conveyancePaise" INTEGER NOT NULL DEFAULT 0,
    "medicalAllowancePaise" INTEGER NOT NULL DEFAULT 0,
    "specialAllowancePaise" INTEGER NOT NULL DEFAULT 0,
    "otherAllowancePaise" INTEGER NOT NULL DEFAULT 0,
    "employerPfPaise" INTEGER NOT NULL DEFAULT 0,
    "employeePfPaise" INTEGER NOT NULL DEFAULT 0,
    "employerEsiPaise" INTEGER NOT NULL DEFAULT 0,
    "employeeEsiPaise" INTEGER NOT NULL DEFAULT 0,
    "professionalTaxPaise" INTEGER NOT NULL DEFAULT 0,
    "tdsPaise" INTEGER NOT NULL DEFAULT 0,
    "otherDeductionPaise" INTEGER NOT NULL DEFAULT 0,
    "grossPaise" INTEGER NOT NULL DEFAULT 0,
    "netPaise" INTEGER NOT NULL DEFAULT 0,
    "ctcPaise" INTEGER NOT NULL DEFAULT 0,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeSalary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'IN_APP',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationBroadcast" (
    "id" TEXT NOT NULL,
    "templateId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "audienceRole" "Role",
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationBroadcast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InAppNotification" (
    "id" TEXT NOT NULL,
    "recipientUserId" TEXT,
    "recipientStoreStaffId" TEXT,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "metadata" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InAppNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchOwnerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "employeeId" TEXT,
    "designation" TEXT NOT NULL DEFAULT 'Branch Owner',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BranchOwnerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientCoordinatorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "employeeId" TEXT,
    "designation" TEXT NOT NULL DEFAULT 'Patient Coordinator',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientCoordinatorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallCenterProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeId" TEXT,
    "designation" TEXT NOT NULL DEFAULT 'Call Center Agent',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallCenterProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeId" TEXT,
    "designation" TEXT NOT NULL DEFAULT 'Marketing Manager',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorporateAccount" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactEmail" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorporateAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorporateWellnessProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "corporateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorporateWellnessProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorporateEnrollment" (
    "id" TEXT NOT NULL,
    "corporateId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CorporateEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsurancePartnerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsurancePartnerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceClaim" (
    "id" TEXT NOT NULL,
    "claimNumber" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "status" "InsuranceClaimStatus" NOT NULL DEFAULT 'SUBMITTED',
    "claimAmountInPaise" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsuranceClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,
    "methodOptionId" TEXT,
    "diagnosedDiseaseOptionId" TEXT,
    "caseAnalysisId" TEXT,
    "diagnosis" TEXT NOT NULL,
    "advice" TEXT,
    "notes" TEXT NOT NULL,
    "fileUrl" TEXT,
    "followUpDate" TIMESTAMP(3),
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionOption" (
    "id" TEXT NOT NULL,
    "type" "PrescriptionOptionType" NOT NULL,
    "label" TEXT NOT NULL,
    "normalizedLabel" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrescriptionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionItem" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "medicineName" TEXT NOT NULL,
    "strength" TEXT,
    "dose" TEXT,
    "frequency" TEXT,
    "duration" TEXT,
    "instructions" TEXT,
    "durationDays" INTEGER,
    "intakeTimes" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrescriptionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicineDoseEvent" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "prescriptionItemId" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "status" "DoseEventStatus" NOT NULL DEFAULT 'PENDING',
    "takenAt" TIMESTAMP(3),
    "skippedAt" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicineDoseEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionTemplate" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL DEFAULT '',
    "advice" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrescriptionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionTemplateItem" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "medicineName" TEXT NOT NULL,
    "strength" TEXT,
    "dose" TEXT,
    "frequency" TEXT,
    "duration" TEXT,
    "instructions" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PrescriptionTemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "HomeopathicRemedy" (
    "id" TEXT NOT NULL,
    "oorepRemedyId" INTEGER,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeopathicRemedy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MateriaMedicaSource" (
    "id" TEXT NOT NULL,
    "oorepMmInfoId" INTEGER,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "author" TEXT,
    "year" INTEGER,
    "license" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MateriaMedicaSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MateriaMedicaSection" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "remedyId" TEXT NOT NULL,
    "oorepSectionId" INTEGER,
    "depth" INTEGER NOT NULL DEFAULT 1,
    "heading" TEXT,
    "content" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MateriaMedicaSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepertoryRubric" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "externalId" INTEGER,
    "chapter" TEXT NOT NULL,
    "subchapter" TEXT,
    "text" TEXT NOT NULL,
    "normalizedText" TEXT NOT NULL,
    "parentPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepertoryRubric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepertoryRubricRemedy" (
    "id" TEXT NOT NULL,
    "rubricId" TEXT NOT NULL,
    "remedyId" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,

    CONSTRAINT "RepertoryRubricRemedy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseAnalysis" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT,
    "doctorId" TEXT NOT NULL,
    "sourceId" TEXT,
    "status" "CaseAnalysisStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "caseSheet" JSONB,
    "approachData" JSONB,
    "methodOptionId" TEXT,
    "selectedRemedyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseAnalysisRubric" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "rubricId" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "CaseAnalysisRubric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseAnalysisResult" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "remedyId" TEXT NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "coverage" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,

    CONSTRAINT "CaseAnalysisResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalMedia" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "caseAnalysisId" TEXT,
    "consultationId" TEXT,
    "diseaseId" TEXT,
    "conditionLabel" TEXT,
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "PatientReferralCode" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientReferralCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "PatientWallet" (
    "patientId" TEXT NOT NULL,
    "balanceInPaise" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientWallet_pkey" PRIMARY KEY ("patientId")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "SiteConfig" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteConfig_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "StaffProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "permissionCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "kind" "StoreKind" NOT NULL DEFAULT 'BRANCH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreStaff" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profileImageKey" TEXT,
    "staffCode" TEXT NOT NULL,
    "employeeId" TEXT,
    "pinHash" TEXT NOT NULL,
    "role" "StoreRole" NOT NULL DEFAULT 'STAFF',
    "storeId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "employeeStatus" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "designation" TEXT,
    "department" TEXT,
    "joiningDate" TIMESTAMP(3),
    "probationEndDate" TIMESTAMP(3),
    "salaryPerMonth" INTEGER,
    "workShift" "WorkShift" NOT NULL DEFAULT 'FULL_DAY',
    "shiftStart" TEXT,
    "shiftEnd" TEXT,
    "weeklyOffDays" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreRack" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "rackCode" TEXT NOT NULL,
    "shelfCode" TEXT NOT NULL,
    "boxCode" TEXT NOT NULL,
    "label" TEXT,
    "potencyColor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreRack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreMedicine" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "alternateName" TEXT,
    "manufacturer" TEXT,
    "potency" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "minStockLevel" INTEGER NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "qrCode" TEXT,
    "barcode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreMedicine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicineStock" (
    "id" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "rackId" TEXT,
    "currentQty" INTEGER NOT NULL DEFAULT 0,
    "status" "StockStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicineStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockBatch" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "manufacturer" TEXT,
    "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "purchasePricePerUnit" INTEGER NOT NULL,
    "sellingPricePerUnit" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "batchId" TEXT,
    "staffId" TEXT,
    "prescriptionId" TEXT,
    "type" "StockMovementType" NOT NULL,
    "qty" INTEGER NOT NULL,
    "amountInPaise" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "gstin" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "supplierNotes" TEXT,
    "expectedDeliveryDate" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderLine" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "qtyOrdered" INTEGER NOT NULL,
    "qtyReceived" INTEGER NOT NULL DEFAULT 0,
    "unitPriceInPaise" INTEGER NOT NULL,

    CONSTRAINT "PurchaseOrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceiptNote" (
    "id" TEXT NOT NULL,
    "grnNumber" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "receivedByStaffId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoodsReceiptNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceiptLine" (
    "id" TEXT NOT NULL,
    "grnId" TEXT NOT NULL,
    "purchaseOrderLineId" TEXT NOT NULL,
    "qtyReceived" INTEGER NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "purchasePricePerUnit" INTEGER NOT NULL,
    "sellingPricePerUnit" INTEGER NOT NULL,

    CONSTRAINT "GoodsReceiptLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "patientName" TEXT NOT NULL,
    "location" TEXT,
    "condition" TEXT,
    "duration" TEXT,
    "quote" TEXT NOT NULL,
    "stars" INTEGER NOT NULL DEFAULT 5,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransfer" (
    "id" TEXT NOT NULL,
    "transferNumber" TEXT NOT NULL,
    "fromStoreId" TEXT NOT NULL,
    "toStoreId" TEXT NOT NULL,
    "status" "StockTransferStatus" NOT NULL DEFAULT 'PENDING_DISPATCH',
    "notes" TEXT,
    "createdById" TEXT,
    "dispatchedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransferLine" (
    "id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "medicineId" TEXT NOT NULL,
    "qtyRequested" INTEGER NOT NULL,
    "qtyDispatched" INTEGER NOT NULL DEFAULT 0,
    "qtyReceived" INTEGER NOT NULL DEFAULT 0,
    "sourceBatchId" TEXT,
    "batchNumber" TEXT,
    "expiryDate" TIMESTAMP(3),
    "purchasePricePerUnit" INTEGER,
    "sellingPricePerUnit" INTEGER,

    CONSTRAINT "StockTransferLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteLead" (
    "id" TEXT NOT NULL,
    "source" "WebsiteLeadSource" NOT NULL,
    "followUpStatus" "WebsiteLeadFollowUp" NOT NULL DEFAULT 'NEW',
    "visitorName" TEXT,
    "visitorPhone" TEXT,
    "visitorEmail" TEXT,
    "concern" TEXT,
    "visitorIssue" TEXT,
    "notInterestedReason" TEXT,
    "entryPage" TEXT,
    "visitorKey" TEXT,
    "userId" TEXT,
    "chatSessionId" TEXT,
    "operatorNote" TEXT,
    "preferredCallbackTime" TEXT,
    "calledAt" TIMESTAMP(3),
    "calledById" TEXT,
    "registeredAt" TIMESTAMP(3),
    "bookedAt" TIMESTAMP(3),
    "consultationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebsiteLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductEvent_name_createdAt_idx" ON "ProductEvent"("name", "createdAt");

-- CreateIndex
CREATE INDEX "ProductEvent_category_createdAt_idx" ON "ProductEvent"("category", "createdAt");

-- CreateIndex
CREATE INDEX "ProductEvent_actorId_createdAt_idx" ON "ProductEvent"("actorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_patientCode_key" ON "User"("patientCode");

-- CreateIndex
CREATE INDEX "User_mobile_idx" ON "User"("mobile");

-- CreateIndex
CREATE INDEX "User_homeClinicStoreId_idx" ON "User"("homeClinicStoreId");

-- CreateIndex
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReminderPreference_userId_key" ON "ReminderPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_isPublished_category_idx" ON "BlogPost"("isPublished", "category");

-- CreateIndex
CREATE INDEX "BlogPost_slug_idx" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_publishedAt_idx" ON "BlogPost"("publishedAt");

-- CreateIndex
CREATE INDEX "JobVacancy_status_idx" ON "JobVacancy"("status");

-- CreateIndex
CREATE INDEX "JobVacancy_department_idx" ON "JobVacancy"("department");

-- CreateIndex
CREATE INDEX "JobVacancy_createdAt_idx" ON "JobVacancy"("createdAt");

-- CreateIndex
CREATE INDEX "ChatSession_status_idx" ON "ChatSession"("status");

-- CreateIndex
CREATE INDEX "ChatSession_createdAt_idx" ON "ChatSession"("createdAt");

-- CreateIndex
CREATE INDEX "ChatSession_userId_idx" ON "ChatSession"("userId");

-- CreateIndex
CREATE INDEX "ChatSession_visitorKey_idx" ON "ChatSession"("visitorKey");

-- CreateIndex
CREATE INDEX "ChatMessage_sessionId_createdAt_idx" ON "ChatMessage"("sessionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Disease_name_key" ON "Disease"("name");

-- CreateIndex
CREATE INDEX "Disease_publicCategory_idx" ON "Disease"("publicCategory");

-- CreateIndex
CREATE INDEX "DiseaseLocationFee_locationKey_idx" ON "DiseaseLocationFee"("locationKey");

-- CreateIndex
CREATE UNIQUE INDEX "DiseaseLocationFee_diseaseId_locationKey_key" ON "DiseaseLocationFee"("diseaseId", "locationKey");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_consultationId_key" ON "Payment"("consultationId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingPlan_code_key" ON "BillingPlan"("code");

-- CreateIndex
CREATE INDEX "SupportCaseNote_patientId_createdAt_idx" ON "SupportCaseNote"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "SupportCaseNote_consultationId_idx" ON "SupportCaseNote"("consultationId");

-- CreateIndex
CREATE INDEX "PatientAddress_patientId_isActive_idx" ON "PatientAddress"("patientId", "isActive");

-- CreateIndex
CREATE INDEX "PatientAddress_patientId_isDefault_idx" ON "PatientAddress"("patientId", "isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "MedicineDelivery_deliveryNumber_key" ON "MedicineDelivery"("deliveryNumber");

-- CreateIndex
CREATE INDEX "MedicineDelivery_storeId_status_idx" ON "MedicineDelivery"("storeId", "status");

-- CreateIndex
CREATE INDEX "MedicineDelivery_assignedExecutiveId_status_idx" ON "MedicineDelivery"("assignedExecutiveId", "status");

-- CreateIndex
CREATE INDEX "MedicineDelivery_patientId_idx" ON "MedicineDelivery"("patientId");

-- CreateIndex
CREATE INDEX "MedicineDeliveryLine_deliveryId_idx" ON "MedicineDeliveryLine"("deliveryId");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticCenter_code_key" ON "DiagnosticCenter"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticCenterProfile_userId_key" ON "DiagnosticCenterProfile"("userId");

-- CreateIndex
CREATE INDEX "DiagnosticCenterProfile_diagnosticCenterId_idx" ON "DiagnosticCenterProfile"("diagnosticCenterId");

-- CreateIndex
CREATE UNIQUE INDEX "LabReferral_referralNumber_key" ON "LabReferral"("referralNumber");

-- CreateIndex
CREATE INDEX "LabReferral_diagnosticCenterId_status_idx" ON "LabReferral"("diagnosticCenterId", "status");

-- CreateIndex
CREATE INDEX "LabReferral_storeId_status_idx" ON "LabReferral"("storeId", "status");

-- CreateIndex
CREATE INDEX "LabReferral_patientId_idx" ON "LabReferral"("patientId");

-- CreateIndex
CREATE INDEX "LabReferralLine_referralId_idx" ON "LabReferralLine"("referralId");

-- CreateIndex
CREATE INDEX "FaqEntry_isPublished_category_idx" ON "FaqEntry"("isPublished", "category");

-- CreateIndex
CREATE INDEX "BusinessExpense_level_expenseDate_idx" ON "BusinessExpense"("level", "expenseDate");

-- CreateIndex
CREATE INDEX "BusinessExpense_storeId_expenseDate_idx" ON "BusinessExpense"("storeId", "expenseDate");

-- CreateIndex
CREATE INDEX "BusinessExpense_category_idx" ON "BusinessExpense"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_userId_key" ON "Doctor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_employeeId_key" ON "Doctor"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "HrProfile_userId_key" ON "HrProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "HrProfile_employeeId_key" ON "HrProfile"("employeeId");

-- CreateIndex
CREATE INDEX "HrStoreAccess_hrUserId_idx" ON "HrStoreAccess"("hrUserId");

-- CreateIndex
CREATE INDEX "HrStoreAccess_storeId_idx" ON "HrStoreAccess"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "HrStoreAccess_hrUserId_storeId_key" ON "HrStoreAccess"("hrUserId", "storeId");

-- CreateIndex
CREATE UNIQUE INDEX "ReceptionistProfile_userId_key" ON "ReceptionistProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReceptionistProfile_employeeId_key" ON "ReceptionistProfile"("employeeId");

-- CreateIndex
CREATE INDEX "ReceptionistProfile_storeId_idx" ON "ReceptionistProfile"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicManagerProfile_userId_key" ON "ClinicManagerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicManagerProfile_employeeId_key" ON "ClinicManagerProfile"("employeeId");

-- CreateIndex
CREATE INDEX "ClinicManagerProfile_storeId_idx" ON "ClinicManagerProfile"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountantProfile_userId_key" ON "AccountantProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountantProfile_employeeId_key" ON "AccountantProfile"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseManagerProfile_userId_key" ON "WarehouseManagerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseManagerProfile_employeeId_key" ON "WarehouseManagerProfile"("employeeId");

-- CreateIndex
CREATE INDEX "WarehouseManagerProfile_warehouseId_idx" ON "WarehouseManagerProfile"("warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryExecutiveProfile_userId_key" ON "DeliveryExecutiveProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryExecutiveProfile_employeeId_key" ON "DeliveryExecutiveProfile"("employeeId");

-- CreateIndex
CREATE INDEX "DeliveryExecutiveProfile_storeId_idx" ON "DeliveryExecutiveProfile"("storeId");

-- CreateIndex
CREATE INDEX "LeaveRequest_employeeType_status_idx" ON "LeaveRequest"("employeeType", "status");

-- CreateIndex
CREATE INDEX "LeaveRequest_startDate_endDate_idx" ON "LeaveRequest"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "JoiningLetter_letterNumber_key" ON "JoiningLetter"("letterNumber");

-- CreateIndex
CREATE UNIQUE INDEX "JoiningLetter_staffId_key" ON "JoiningLetter"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "JoiningLetter_doctorUserId_key" ON "JoiningLetter"("doctorUserId");

-- CreateIndex
CREATE INDEX "DoctorSlot_doctorId_date_idx" ON "DoctorSlot"("doctorId", "date");

-- CreateIndex
CREATE INDEX "DoctorSlot_date_isBooked_idx" ON "DoctorSlot"("date", "isBooked");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorSlot_doctorId_date_startTime_key" ON "DoctorSlot"("doctorId", "date", "startTime");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeSalary_doctorId_key" ON "EmployeeSalary"("doctorId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeSalary_storeStaffId_key" ON "EmployeeSalary"("storeStaffId");

-- CreateIndex
CREATE INDEX "EmployeeSalary_employeeType_idx" ON "EmployeeSalary"("employeeType");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_code_key" ON "NotificationTemplate"("code");

-- CreateIndex
CREATE INDEX "NotificationBroadcast_createdAt_idx" ON "NotificationBroadcast"("createdAt");

-- CreateIndex
CREATE INDEX "InAppNotification_recipientUserId_readAt_createdAt_idx" ON "InAppNotification"("recipientUserId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "InAppNotification_recipientStoreStaffId_readAt_createdAt_idx" ON "InAppNotification"("recipientStoreStaffId", "readAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BranchOwnerProfile_userId_key" ON "BranchOwnerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BranchOwnerProfile_employeeId_key" ON "BranchOwnerProfile"("employeeId");

-- CreateIndex
CREATE INDEX "BranchOwnerProfile_storeId_idx" ON "BranchOwnerProfile"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "PatientCoordinatorProfile_userId_key" ON "PatientCoordinatorProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PatientCoordinatorProfile_employeeId_key" ON "PatientCoordinatorProfile"("employeeId");

-- CreateIndex
CREATE INDEX "PatientCoordinatorProfile_storeId_idx" ON "PatientCoordinatorProfile"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "CallCenterProfile_userId_key" ON "CallCenterProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CallCenterProfile_employeeId_key" ON "CallCenterProfile"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingProfile_userId_key" ON "MarketingProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingProfile_employeeId_key" ON "MarketingProfile"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "CorporateAccount_code_key" ON "CorporateAccount"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CorporateWellnessProfile_userId_key" ON "CorporateWellnessProfile"("userId");

-- CreateIndex
CREATE INDEX "CorporateWellnessProfile_corporateId_idx" ON "CorporateWellnessProfile"("corporateId");

-- CreateIndex
CREATE INDEX "CorporateEnrollment_corporateId_idx" ON "CorporateEnrollment"("corporateId");

-- CreateIndex
CREATE UNIQUE INDEX "CorporateEnrollment_corporateId_patientId_key" ON "CorporateEnrollment"("corporateId", "patientId");

-- CreateIndex
CREATE UNIQUE INDEX "InsurancePartnerProfile_userId_key" ON "InsurancePartnerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InsurancePartnerProfile_companyCode_key" ON "InsurancePartnerProfile"("companyCode");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceClaim_claimNumber_key" ON "InsuranceClaim"("claimNumber");

-- CreateIndex
CREATE INDEX "InsuranceClaim_partnerId_status_idx" ON "InsuranceClaim"("partnerId", "status");

-- CreateIndex
CREATE INDEX "Prescription_consultationId_isLatest_idx" ON "Prescription"("consultationId", "isLatest");

-- CreateIndex
CREATE INDEX "Prescription_caseAnalysisId_idx" ON "Prescription"("caseAnalysisId");

-- CreateIndex
CREATE UNIQUE INDEX "Prescription_consultationId_version_key" ON "Prescription"("consultationId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "PrescriptionOption_type_normalizedLabel_key" ON "PrescriptionOption"("type", "normalizedLabel");

-- CreateIndex
CREATE INDEX "MedicineDoseEvent_patientId_scheduledFor_idx" ON "MedicineDoseEvent"("patientId", "scheduledFor");

-- CreateIndex
CREATE UNIQUE INDEX "MedicineDoseEvent_prescriptionItemId_scheduledFor_key" ON "MedicineDoseEvent"("prescriptionItemId", "scheduledFor");

-- CreateIndex
CREATE INDEX "PrescriptionTemplate_doctorId_idx" ON "PrescriptionTemplate"("doctorId");

-- CreateIndex
CREATE UNIQUE INDEX "RepertorySource_code_key" ON "RepertorySource"("code");

-- CreateIndex
CREATE UNIQUE INDEX "HomeopathicRemedy_oorepRemedyId_key" ON "HomeopathicRemedy"("oorepRemedyId");

-- CreateIndex
CREATE UNIQUE INDEX "HomeopathicRemedy_normalizedName_key" ON "HomeopathicRemedy"("normalizedName");

-- CreateIndex
CREATE INDEX "HomeopathicRemedy_abbreviation_idx" ON "HomeopathicRemedy"("abbreviation");

-- CreateIndex
CREATE UNIQUE INDEX "MateriaMedicaSource_oorepMmInfoId_key" ON "MateriaMedicaSource"("oorepMmInfoId");

-- CreateIndex
CREATE UNIQUE INDEX "MateriaMedicaSource_code_key" ON "MateriaMedicaSource"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MateriaMedicaSection_oorepSectionId_key" ON "MateriaMedicaSection"("oorepSectionId");

-- CreateIndex
CREATE INDEX "MateriaMedicaSection_remedyId_sourceId_sortOrder_idx" ON "MateriaMedicaSection"("remedyId", "sourceId", "sortOrder");

-- CreateIndex
CREATE INDEX "RepertoryRubric_sourceId_chapter_idx" ON "RepertoryRubric"("sourceId", "chapter");

-- CreateIndex
CREATE INDEX "RepertoryRubric_normalizedText_idx" ON "RepertoryRubric"("normalizedText");

-- CreateIndex
CREATE UNIQUE INDEX "RepertoryRubric_sourceId_externalId_key" ON "RepertoryRubric"("sourceId", "externalId");

-- CreateIndex
CREATE INDEX "RepertoryRubricRemedy_remedyId_idx" ON "RepertoryRubricRemedy"("remedyId");

-- CreateIndex
CREATE UNIQUE INDEX "RepertoryRubricRemedy_rubricId_remedyId_key" ON "RepertoryRubricRemedy"("rubricId", "remedyId");

-- CreateIndex
CREATE INDEX "CaseAnalysis_consultationId_createdAt_idx" ON "CaseAnalysis"("consultationId", "createdAt");

-- CreateIndex
CREATE INDEX "CaseAnalysis_doctorId_idx" ON "CaseAnalysis"("doctorId");

-- CreateIndex
CREATE UNIQUE INDEX "CaseAnalysisRubric_analysisId_rubricId_key" ON "CaseAnalysisRubric"("analysisId", "rubricId");

-- CreateIndex
CREATE INDEX "CaseAnalysisResult_analysisId_rank_idx" ON "CaseAnalysisResult"("analysisId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "CaseAnalysisResult_analysisId_remedyId_key" ON "CaseAnalysisResult"("analysisId", "remedyId");

-- CreateIndex
CREATE INDEX "ClinicalMedia_patientId_createdAt_idx" ON "ClinicalMedia"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "ClinicalMedia_caseAnalysisId_createdAt_idx" ON "ClinicalMedia"("caseAnalysisId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RewardProgramRule_code_key" ON "RewardProgramRule"("code");

-- CreateIndex
CREATE UNIQUE INDEX "RewardProgramRule_promoCode_key" ON "RewardProgramRule"("promoCode");

-- CreateIndex
CREATE INDEX "RewardProgramRule_isActive_trigger_appliesTo_idx" ON "RewardProgramRule"("isActive", "trigger", "appliesTo");

-- CreateIndex
CREATE INDEX "RewardProgramRule_kind_isActive_idx" ON "RewardProgramRule"("kind", "isActive");

-- CreateIndex
CREATE INDEX "RewardRedemption_ruleId_patientId_idx" ON "RewardRedemption"("ruleId", "patientId");

-- CreateIndex
CREATE INDEX "RewardRedemption_patientId_createdAt_idx" ON "RewardRedemption"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "RewardRedemption_paymentId_idx" ON "RewardRedemption"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "PatientReferralCode_patientId_key" ON "PatientReferralCode"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "PatientReferralCode_code_key" ON "PatientReferralCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PatientReferral_referredUserId_key" ON "PatientReferral"("referredUserId");

-- CreateIndex
CREATE INDEX "PatientReferral_referrerId_status_idx" ON "PatientReferral"("referrerId", "status");

-- CreateIndex
CREATE INDEX "WalletLedgerEntry_patientId_createdAt_idx" ON "WalletLedgerEntry"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "SiteConfig_key_idx" ON "SiteConfig"("key");

-- CreateIndex
CREATE UNIQUE INDEX "StaffProfile_userId_key" ON "StaffProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Store_code_key" ON "Store"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StoreStaff_staffCode_key" ON "StoreStaff"("staffCode");

-- CreateIndex
CREATE UNIQUE INDEX "StoreStaff_employeeId_key" ON "StoreStaff"("employeeId");

-- CreateIndex
CREATE INDEX "StoreRack_storeId_idx" ON "StoreRack"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreRack_storeId_rackCode_shelfCode_boxCode_key" ON "StoreRack"("storeId", "rackCode", "shelfCode", "boxCode");

-- CreateIndex
CREATE UNIQUE INDEX "StoreMedicine_qrCode_key" ON "StoreMedicine"("qrCode");

-- CreateIndex
CREATE UNIQUE INDEX "StoreMedicine_barcode_key" ON "StoreMedicine"("barcode");

-- CreateIndex
CREATE INDEX "StoreMedicine_name_idx" ON "StoreMedicine"("name");

-- CreateIndex
CREATE INDEX "StoreMedicine_potency_idx" ON "StoreMedicine"("potency");

-- CreateIndex
CREATE INDEX "MedicineStock_storeId_status_idx" ON "MedicineStock"("storeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MedicineStock_medicineId_storeId_key" ON "MedicineStock"("medicineId", "storeId");

-- CreateIndex
CREATE INDEX "StockBatch_expiryDate_idx" ON "StockBatch"("expiryDate");

-- CreateIndex
CREATE INDEX "StockBatch_stockId_idx" ON "StockBatch"("stockId");

-- CreateIndex
CREATE INDEX "StockMovement_storeId_createdAt_idx" ON "StockMovement"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "StockMovement_stockId_idx" ON "StockMovement"("stockId");

-- CreateIndex
CREATE INDEX "StockMovement_prescriptionId_idx" ON "StockMovement"("prescriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_code_key" ON "Supplier"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierProfile_userId_key" ON "SupplierProfile"("userId");

-- CreateIndex
CREATE INDEX "SupplierProfile_supplierId_idx" ON "SupplierProfile"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_poNumber_key" ON "PurchaseOrder"("poNumber");

-- CreateIndex
CREATE INDEX "PurchaseOrder_supplierId_status_idx" ON "PurchaseOrder"("supplierId", "status");

-- CreateIndex
CREATE INDEX "PurchaseOrder_storeId_status_idx" ON "PurchaseOrder"("storeId", "status");

-- CreateIndex
CREATE INDEX "PurchaseOrderLine_purchaseOrderId_idx" ON "PurchaseOrderLine"("purchaseOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "GoodsReceiptNote_grnNumber_key" ON "GoodsReceiptNote"("grnNumber");

-- CreateIndex
CREATE INDEX "GoodsReceiptNote_purchaseOrderId_idx" ON "GoodsReceiptNote"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "GoodsReceiptNote_storeId_createdAt_idx" ON "GoodsReceiptNote"("storeId", "createdAt");

-- CreateIndex
CREATE INDEX "GoodsReceiptLine_grnId_idx" ON "GoodsReceiptLine"("grnId");

-- CreateIndex
CREATE INDEX "Testimonial_isPublished_idx" ON "Testimonial"("isPublished");

-- CreateIndex
CREATE INDEX "Testimonial_sortOrder_idx" ON "Testimonial"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "StockTransfer_transferNumber_key" ON "StockTransfer"("transferNumber");

-- CreateIndex
CREATE INDEX "StockTransfer_fromStoreId_status_idx" ON "StockTransfer"("fromStoreId", "status");

-- CreateIndex
CREATE INDEX "StockTransfer_toStoreId_status_idx" ON "StockTransfer"("toStoreId", "status");

-- CreateIndex
CREATE INDEX "StockTransferLine_transferId_idx" ON "StockTransferLine"("transferId");

-- CreateIndex
CREATE UNIQUE INDEX "WebsiteLead_chatSessionId_key" ON "WebsiteLead"("chatSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "WebsiteLead_consultationId_key" ON "WebsiteLead"("consultationId");

-- CreateIndex
CREATE INDEX "WebsiteLead_followUpStatus_idx" ON "WebsiteLead"("followUpStatus");

-- CreateIndex
CREATE INDEX "WebsiteLead_source_idx" ON "WebsiteLead"("source");

-- CreateIndex
CREATE INDEX "WebsiteLead_visitorPhone_idx" ON "WebsiteLead"("visitorPhone");

-- CreateIndex
CREATE INDEX "WebsiteLead_userId_idx" ON "WebsiteLead"("userId");

-- CreateIndex
CREATE INDEX "WebsiteLead_consultationId_idx" ON "WebsiteLead"("consultationId");

-- CreateIndex
CREATE INDEX "WebsiteLead_createdAt_idx" ON "WebsiteLead"("createdAt");

-- AddForeignKey
ALTER TABLE "ProductEvent" ADD CONSTRAINT "ProductEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_homeClinicStoreId_fkey" FOREIGN KEY ("homeClinicStoreId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referredByUserId_fkey" FOREIGN KEY ("referredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderPreference" ADD CONSTRAINT "ReminderPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobVacancy" ADD CONSTRAINT "JobVacancy_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiseaseLocationFee" ADD CONSTRAINT "DiseaseLocationFee_diseaseId_fkey" FOREIGN KEY ("diseaseId") REFERENCES "Disease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_diseaseId_fkey" FOREIGN KEY ("diseaseId") REFERENCES "Disease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_assignedDoctorId_fkey" FOREIGN KEY ("assignedDoctorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_clinicStoreId_fkey" FOREIGN KEY ("clinicStoreId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportCaseNote" ADD CONSTRAINT "SupportCaseNote_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportCaseNote" ADD CONSTRAINT "SupportCaseNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportCaseNote" ADD CONSTRAINT "SupportCaseNote_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientAddress" ADD CONSTRAINT "PatientAddress_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineDelivery" ADD CONSTRAINT "MedicineDelivery_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineDelivery" ADD CONSTRAINT "MedicineDelivery_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineDelivery" ADD CONSTRAINT "MedicineDelivery_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineDelivery" ADD CONSTRAINT "MedicineDelivery_assignedExecutiveId_fkey" FOREIGN KEY ("assignedExecutiveId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineDelivery" ADD CONSTRAINT "MedicineDelivery_patientAddressId_fkey" FOREIGN KEY ("patientAddressId") REFERENCES "PatientAddress"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineDeliveryLine" ADD CONSTRAINT "MedicineDeliveryLine_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "MedicineDelivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineDeliveryLine" ADD CONSTRAINT "MedicineDeliveryLine_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "StoreMedicine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticCenterProfile" ADD CONSTRAINT "DiagnosticCenterProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticCenterProfile" ADD CONSTRAINT "DiagnosticCenterProfile_diagnosticCenterId_fkey" FOREIGN KEY ("diagnosticCenterId") REFERENCES "DiagnosticCenter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabReferral" ADD CONSTRAINT "LabReferral_diagnosticCenterId_fkey" FOREIGN KEY ("diagnosticCenterId") REFERENCES "DiagnosticCenter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabReferral" ADD CONSTRAINT "LabReferral_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabReferral" ADD CONSTRAINT "LabReferral_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabReferral" ADD CONSTRAINT "LabReferral_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabReferralLine" ADD CONSTRAINT "LabReferralLine_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "LabReferral"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessExpense" ADD CONSTRAINT "BusinessExpense_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_clinicStoreId_fkey" FOREIGN KEY ("clinicStoreId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_defaultMethodOptionId_fkey" FOREIGN KEY ("defaultMethodOptionId") REFERENCES "PrescriptionOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrProfile" ADD CONSTRAINT "HrProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrStoreAccess" ADD CONSTRAINT "HrStoreAccess_hrUserId_fkey" FOREIGN KEY ("hrUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrStoreAccess" ADD CONSTRAINT "HrStoreAccess_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrStoreAccess" ADD CONSTRAINT "HrStoreAccess_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceptionistProfile" ADD CONSTRAINT "ReceptionistProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceptionistProfile" ADD CONSTRAINT "ReceptionistProfile_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicManagerProfile" ADD CONSTRAINT "ClinicManagerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicManagerProfile" ADD CONSTRAINT "ClinicManagerProfile_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountantProfile" ADD CONSTRAINT "AccountantProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseManagerProfile" ADD CONSTRAINT "WarehouseManagerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseManagerProfile" ADD CONSTRAINT "WarehouseManagerProfile_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryExecutiveProfile" ADD CONSTRAINT "DeliveryExecutiveProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryExecutiveProfile" ADD CONSTRAINT "DeliveryExecutiveProfile_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_storeStaffId_fkey" FOREIGN KEY ("storeStaffId") REFERENCES "StoreStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JoiningLetter" ADD CONSTRAINT "JoiningLetter_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StoreStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JoiningLetter" ADD CONSTRAINT "JoiningLetter_doctorUserId_fkey" FOREIGN KEY ("doctorUserId") REFERENCES "Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorSlot" ADD CONSTRAINT "DoctorSlot_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSalary" ADD CONSTRAINT "EmployeeSalary_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSalary" ADD CONSTRAINT "EmployeeSalary_storeStaffId_fkey" FOREIGN KEY ("storeStaffId") REFERENCES "StoreStaff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeSalary" ADD CONSTRAINT "EmployeeSalary_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationBroadcast" ADD CONSTRAINT "NotificationBroadcast_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "NotificationTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationBroadcast" ADD CONSTRAINT "NotificationBroadcast_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InAppNotification" ADD CONSTRAINT "InAppNotification_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InAppNotification" ADD CONSTRAINT "InAppNotification_recipientStoreStaffId_fkey" FOREIGN KEY ("recipientStoreStaffId") REFERENCES "StoreStaff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchOwnerProfile" ADD CONSTRAINT "BranchOwnerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchOwnerProfile" ADD CONSTRAINT "BranchOwnerProfile_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientCoordinatorProfile" ADD CONSTRAINT "PatientCoordinatorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientCoordinatorProfile" ADD CONSTRAINT "PatientCoordinatorProfile_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallCenterProfile" ADD CONSTRAINT "CallCenterProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingProfile" ADD CONSTRAINT "MarketingProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateWellnessProfile" ADD CONSTRAINT "CorporateWellnessProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateWellnessProfile" ADD CONSTRAINT "CorporateWellnessProfile_corporateId_fkey" FOREIGN KEY ("corporateId") REFERENCES "CorporateAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateEnrollment" ADD CONSTRAINT "CorporateEnrollment_corporateId_fkey" FOREIGN KEY ("corporateId") REFERENCES "CorporateAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateEnrollment" ADD CONSTRAINT "CorporateEnrollment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsurancePartnerProfile" ADD CONSTRAINT "InsurancePartnerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceClaim" ADD CONSTRAINT "InsuranceClaim_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "InsurancePartnerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceClaim" ADD CONSTRAINT "InsuranceClaim_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_methodOptionId_fkey" FOREIGN KEY ("methodOptionId") REFERENCES "PrescriptionOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_diagnosedDiseaseOptionId_fkey" FOREIGN KEY ("diagnosedDiseaseOptionId") REFERENCES "PrescriptionOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_caseAnalysisId_fkey" FOREIGN KEY ("caseAnalysisId") REFERENCES "CaseAnalysis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionOption" ADD CONSTRAINT "PrescriptionOption_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineDoseEvent" ADD CONSTRAINT "MedicineDoseEvent_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineDoseEvent" ADD CONSTRAINT "MedicineDoseEvent_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineDoseEvent" ADD CONSTRAINT "MedicineDoseEvent_prescriptionItemId_fkey" FOREIGN KEY ("prescriptionItemId") REFERENCES "PrescriptionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionTemplate" ADD CONSTRAINT "PrescriptionTemplate_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionTemplateItem" ADD CONSTRAINT "PrescriptionTemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PrescriptionTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MateriaMedicaSection" ADD CONSTRAINT "MateriaMedicaSection_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "MateriaMedicaSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MateriaMedicaSection" ADD CONSTRAINT "MateriaMedicaSection_remedyId_fkey" FOREIGN KEY ("remedyId") REFERENCES "HomeopathicRemedy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepertoryRubric" ADD CONSTRAINT "RepertoryRubric_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "RepertorySource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepertoryRubricRemedy" ADD CONSTRAINT "RepertoryRubricRemedy_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "RepertoryRubric"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepertoryRubricRemedy" ADD CONSTRAINT "RepertoryRubricRemedy_remedyId_fkey" FOREIGN KEY ("remedyId") REFERENCES "HomeopathicRemedy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseAnalysis" ADD CONSTRAINT "CaseAnalysis_methodOptionId_fkey" FOREIGN KEY ("methodOptionId") REFERENCES "PrescriptionOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseAnalysis" ADD CONSTRAINT "CaseAnalysis_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseAnalysis" ADD CONSTRAINT "CaseAnalysis_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseAnalysis" ADD CONSTRAINT "CaseAnalysis_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "RepertorySource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseAnalysis" ADD CONSTRAINT "CaseAnalysis_selectedRemedyId_fkey" FOREIGN KEY ("selectedRemedyId") REFERENCES "HomeopathicRemedy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseAnalysisRubric" ADD CONSTRAINT "CaseAnalysisRubric_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "CaseAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseAnalysisRubric" ADD CONSTRAINT "CaseAnalysisRubric_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "RepertoryRubric"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseAnalysisResult" ADD CONSTRAINT "CaseAnalysisResult_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "CaseAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseAnalysisResult" ADD CONSTRAINT "CaseAnalysisResult_remedyId_fkey" FOREIGN KEY ("remedyId") REFERENCES "HomeopathicRemedy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalMedia" ADD CONSTRAINT "ClinicalMedia_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalMedia" ADD CONSTRAINT "ClinicalMedia_caseAnalysisId_fkey" FOREIGN KEY ("caseAnalysisId") REFERENCES "CaseAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalMedia" ADD CONSTRAINT "ClinicalMedia_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalMedia" ADD CONSTRAINT "ClinicalMedia_diseaseId_fkey" FOREIGN KEY ("diseaseId") REFERENCES "Disease"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalMedia" ADD CONSTRAINT "ClinicalMedia_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "RewardProgramRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientReferralCode" ADD CONSTRAINT "PatientReferralCode_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientReferral" ADD CONSTRAINT "PatientReferral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientReferral" ADD CONSTRAINT "PatientReferral_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientReferral" ADD CONSTRAINT "PatientReferral_referralCodeId_fkey" FOREIGN KEY ("referralCodeId") REFERENCES "PatientReferralCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientWallet" ADD CONSTRAINT "PatientWallet_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletLedgerEntry" ADD CONSTRAINT "WalletLedgerEntry_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletLedgerEntry" ADD CONSTRAINT "WalletLedgerEntry_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "RewardProgramRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffProfile" ADD CONSTRAINT "StaffProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreStaff" ADD CONSTRAINT "StoreStaff_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreRack" ADD CONSTRAINT "StoreRack_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineStock" ADD CONSTRAINT "MedicineStock_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "StoreMedicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineStock" ADD CONSTRAINT "MedicineStock_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicineStock" ADD CONSTRAINT "MedicineStock_rackId_fkey" FOREIGN KEY ("rackId") REFERENCES "StoreRack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockBatch" ADD CONSTRAINT "StockBatch_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "MedicineStock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "MedicineStock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "StockBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StoreStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierProfile" ADD CONSTRAINT "SupplierProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierProfile" ADD CONSTRAINT "SupplierProfile_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderLine" ADD CONSTRAINT "PurchaseOrderLine_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderLine" ADD CONSTRAINT "PurchaseOrderLine_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "StoreMedicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptNote" ADD CONSTRAINT "GoodsReceiptNote_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptNote" ADD CONSTRAINT "GoodsReceiptNote_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptNote" ADD CONSTRAINT "GoodsReceiptNote_receivedByStaffId_fkey" FOREIGN KEY ("receivedByStaffId") REFERENCES "StoreStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptLine" ADD CONSTRAINT "GoodsReceiptLine_grnId_fkey" FOREIGN KEY ("grnId") REFERENCES "GoodsReceiptNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptLine" ADD CONSTRAINT "GoodsReceiptLine_purchaseOrderLineId_fkey" FOREIGN KEY ("purchaseOrderLineId") REFERENCES "PurchaseOrderLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_fromStoreId_fkey" FOREIGN KEY ("fromStoreId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_toStoreId_fkey" FOREIGN KEY ("toStoreId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransferLine" ADD CONSTRAINT "StockTransferLine_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "StockTransfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransferLine" ADD CONSTRAINT "StockTransferLine_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "StoreMedicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteLead" ADD CONSTRAINT "WebsiteLead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteLead" ADD CONSTRAINT "WebsiteLead_chatSessionId_fkey" FOREIGN KEY ("chatSessionId") REFERENCES "ChatSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteLead" ADD CONSTRAINT "WebsiteLead_calledById_fkey" FOREIGN KEY ("calledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteLead" ADD CONSTRAINT "WebsiteLead_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
