UPDATE "Subscription" AS subscription
SET
  "householdId" = household."id",
  "provider" = CASE
    WHEN subscription."stripeSubscriptionId" IS NOT NULL THEN 'STRIPE'::"BillingProvider"
    ELSE subscription."provider"
  END,
  "providerCustomerId" = COALESCE(
    subscription."providerCustomerId",
    subscription."stripeCustomerId"
  ),
  "providerSubscriptionId" = COALESCE(
    subscription."providerSubscriptionId",
    subscription."stripeSubscriptionId"
  )
FROM "Household" AS household
WHERE household."ownerUserId" = subscription."referenceId";

INSERT INTO "HouseholdMember" (
  "id",
  "householdId",
  "userId",
  "role",
  "acceptedAt",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  household."id",
  household."ownerUserId",
  'OWNER'::"HouseholdRole",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Household" AS household
ON CONFLICT ("householdId", "userId") DO UPDATE
SET "role" = 'OWNER'::"HouseholdRole", "updatedAt" = CURRENT_TIMESTAMP;
