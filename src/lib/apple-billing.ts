import "server-only";

import {
  Environment,
  SignedDataVerifier,
  Status,
  type JWSTransactionDecodedPayload,
} from "@apple/app-store-server-library";

type VerifierEnvironment = Environment.PRODUCTION | Environment.SANDBOX;

function getRootCertificates() {
  const raw = process.env.APPLE_ROOT_CERTIFICATES_BASE64;
  if (!raw) {
    throw new Error("APPLE_ROOT_CERTIFICATES_BASE64 is not configured.");
  }

  const values = JSON.parse(raw) as unknown;
  if (!Array.isArray(values) || values.some((value) => typeof value !== "string")) {
    throw new Error("APPLE_ROOT_CERTIFICATES_BASE64 must be a JSON string array.");
  }

  return values.map((value) => Buffer.from(value, "base64"));
}

function createVerifier(environment: VerifierEnvironment) {
  const bundleId = process.env.APPLE_APP_BUNDLE_ID;
  if (!bundleId) throw new Error("APPLE_APP_BUNDLE_ID is not configured.");

  const appAppleId = process.env.APPLE_APP_ID
    ? Number(process.env.APPLE_APP_ID)
    : undefined;
  if (environment === Environment.PRODUCTION && !appAppleId) {
    throw new Error("APPLE_APP_ID is required for production verification.");
  }

  return new SignedDataVerifier(
    getRootCertificates(),
    true,
    environment,
    bundleId,
    appAppleId,
  );
}

export async function verifyAppleTransaction(signedTransaction: string) {
  let productionError: unknown;
  try {
    return {
      environment: Environment.PRODUCTION,
      transaction: await createVerifier(
        Environment.PRODUCTION,
      ).verifyAndDecodeTransaction(signedTransaction),
    };
  } catch (error) {
    productionError = error;
  }

  try {
    return {
      environment: Environment.SANDBOX,
      transaction: await createVerifier(
        Environment.SANDBOX,
      ).verifyAndDecodeTransaction(signedTransaction),
    };
  } catch {
    throw productionError;
  }
}

export async function verifyAppleNotification(signedPayload: string) {
  let productionError: unknown;
  try {
    return {
      environment: Environment.PRODUCTION,
      notification: await createVerifier(
        Environment.PRODUCTION,
      ).verifyAndDecodeNotification(signedPayload),
    };
  } catch (error) {
    productionError = error;
  }

  try {
    return {
      environment: Environment.SANDBOX,
      notification: await createVerifier(
        Environment.SANDBOX,
      ).verifyAndDecodeNotification(signedPayload),
    };
  } catch {
    throw productionError;
  }
}

export function getAppleProductIds() {
  return new Set(
    [
      process.env.APPLE_FAMILY_PLUS_MONTHLY_PRODUCT_ID,
      process.env.APPLE_FAMILY_PLUS_YEARLY_PRODUCT_ID,
    ].filter((value): value is string => Boolean(value)),
  );
}

export function isActiveAppleTransaction(
  transaction: JWSTransactionDecodedPayload,
) {
  return Boolean(
    transaction.expiresDate &&
      transaction.expiresDate > Date.now() &&
      !transaction.revocationDate &&
      transaction.productId &&
      getAppleProductIds().has(transaction.productId),
  );
}

export function toAppleSubscriptionStatus(status?: Status | number) {
  switch (status) {
    case Status.ACTIVE:
      return "ACTIVE" as const;
    case Status.BILLING_GRACE_PERIOD:
    case Status.BILLING_RETRY:
      return "PAST_DUE" as const;
    case Status.EXPIRED:
    case Status.REVOKED:
    default:
      return "CANCELED" as const;
  }
}
