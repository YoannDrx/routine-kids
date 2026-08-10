ALTER TABLE "User" ADD COLUMN "appAccountToken" TEXT;

UPDATE "User"
SET "appAccountToken" = gen_random_uuid()::text
WHERE "appAccountToken" IS NULL;

ALTER TABLE "User" ALTER COLUMN "appAccountToken" SET NOT NULL;

CREATE UNIQUE INDEX "User_appAccountToken_key" ON "User"("appAccountToken");
