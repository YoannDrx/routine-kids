-- CreateEnum
CREATE TYPE "HouseholdRole" AS ENUM ('OWNER', 'PARENT', 'CAREGIVER', 'VIEWER');

-- CreateEnum
CREATE TYPE "BillingProvider" AS ENUM ('NONE', 'STRIPE', 'APPLE');

-- CreateEnum
CREATE TYPE "BillingEnvironment" AS ENUM ('TEST', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "RewardLedgerKind" AS ENUM ('EARNED', 'REDEEMED', 'ADJUSTED');

-- CreateEnum
CREATE TYPE "NotificationPlatform" AS ENUM ('WEB', 'IOS');

-- AlterTable
ALTER TABLE "Household" ADD COLUMN     "timeZone" TEXT NOT NULL DEFAULT 'Europe/Paris';

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "environment" "BillingEnvironment" NOT NULL DEFAULT 'TEST',
ADD COLUMN     "gracePeriodEndsAt" TIMESTAMP(3),
ADD COLUMN     "householdId" TEXT,
ADD COLUMN     "lastProviderEventAt" TIMESTAMP(3),
ADD COLUMN     "originalTransactionId" TEXT,
ADD COLUMN     "productId" TEXT,
ADD COLUMN     "provider" "BillingProvider" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "providerCustomerId" TEXT,
ADD COLUMN     "providerSubscriptionId" TEXT,
ADD COLUMN     "revokedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "RateLimit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "lastRequest" BIGINT NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" "BillingProvider" NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "payloadHash" TEXT,
    "outcome" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseholdMember" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "HouseholdRole" NOT NULL DEFAULT 'PARENT',
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HouseholdMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseholdInvite" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "HouseholdRole" NOT NULL DEFAULT 'PARENT',
    "tokenHash" TEXT NOT NULL,
    "invitedByUserId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HouseholdInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DayCompletion" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "childProfileId" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "timeZone" TEXT NOT NULL,
    "requiredTaskCount" INTEGER NOT NULL,
    "completedTaskCount" INTEGER NOT NULL,
    "streakSnapshot" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DayCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutineScheduleException" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "isSkipped" BOOLEAN NOT NULL DEFAULT false,
    "startTime" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoutineScheduleException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardDefinition" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "childProfileId" TEXT,
    "title" TEXT NOT NULL,
    "pointsCost" INTEGER NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardLedgerEntry" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "childProfileId" TEXT NOT NULL,
    "rewardId" TEXT,
    "kind" "RewardLedgerKind" NOT NULL,
    "pointsDelta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceRegistration" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "NotificationPlatform" NOT NULL,
    "deviceId" TEXT NOT NULL,
    "pushTokenHash" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'fr',
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientMutation" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "deviceId" TEXT,
    "mutationType" TEXT NOT NULL,
    "resultMetadata" JSONB,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientMutation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "pathname" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "contentHash" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RateLimit_key_key" ON "RateLimit"("key");

-- CreateIndex
CREATE INDEX "WebhookEvent_processedAt_idx" ON "WebhookEvent"("processedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_provider_externalEventId_key" ON "WebhookEvent"("provider", "externalEventId");

-- CreateIndex
CREATE INDEX "HouseholdMember_userId_idx" ON "HouseholdMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "HouseholdMember_householdId_userId_key" ON "HouseholdMember"("householdId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "HouseholdInvite_tokenHash_key" ON "HouseholdInvite"("tokenHash");

-- CreateIndex
CREATE INDEX "HouseholdInvite_householdId_email_idx" ON "HouseholdInvite"("householdId", "email");

-- CreateIndex
CREATE INDEX "HouseholdInvite_expiresAt_idx" ON "HouseholdInvite"("expiresAt");

-- CreateIndex
CREATE INDEX "DayCompletion_householdId_dayKey_idx" ON "DayCompletion"("householdId", "dayKey");

-- CreateIndex
CREATE INDEX "DayCompletion_childProfileId_completedAt_idx" ON "DayCompletion"("childProfileId", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DayCompletion_childProfileId_routineId_dayKey_key" ON "DayCompletion"("childProfileId", "routineId", "dayKey");

-- CreateIndex
CREATE UNIQUE INDEX "RoutineScheduleException_routineId_dayKey_key" ON "RoutineScheduleException"("routineId", "dayKey");

-- CreateIndex
CREATE INDEX "RewardDefinition_householdId_isArchived_idx" ON "RewardDefinition"("householdId", "isArchived");

-- CreateIndex
CREATE INDEX "RewardLedgerEntry_childProfileId_createdAt_idx" ON "RewardLedgerEntry"("childProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "DeviceRegistration_householdId_lastSeenAt_idx" ON "DeviceRegistration"("householdId", "lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceRegistration_userId_deviceId_key" ON "DeviceRegistration"("userId", "deviceId");

-- CreateIndex
CREATE INDEX "ClientMutation_householdId_appliedAt_idx" ON "ClientMutation"("householdId", "appliedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_pathname_key" ON "MediaAsset"("pathname");

-- CreateIndex
CREATE INDEX "MediaAsset_householdId_deletedAt_idx" ON "MediaAsset"("householdId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_householdId_key" ON "Subscription"("householdId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_originalTransactionId_key" ON "Subscription"("originalTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_provider_providerSubscriptionId_key" ON "Subscription"("provider", "providerSubscriptionId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdMember" ADD CONSTRAINT "HouseholdMember_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdMember" ADD CONSTRAINT "HouseholdMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseholdInvite" ADD CONSTRAINT "HouseholdInvite_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DayCompletion" ADD CONSTRAINT "DayCompletion_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DayCompletion" ADD CONSTRAINT "DayCompletion_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DayCompletion" ADD CONSTRAINT "DayCompletion_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutineScheduleException" ADD CONSTRAINT "RoutineScheduleException_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardDefinition" ADD CONSTRAINT "RewardDefinition_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardDefinition" ADD CONSTRAINT "RewardDefinition_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardLedgerEntry" ADD CONSTRAINT "RewardLedgerEntry_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardLedgerEntry" ADD CONSTRAINT "RewardLedgerEntry_childProfileId_fkey" FOREIGN KEY ("childProfileId") REFERENCES "ChildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardLedgerEntry" ADD CONSTRAINT "RewardLedgerEntry_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "RewardDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceRegistration" ADD CONSTRAINT "DeviceRegistration_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceRegistration" ADD CONSTRAINT "DeviceRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientMutation" ADD CONSTRAINT "ClientMutation_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
