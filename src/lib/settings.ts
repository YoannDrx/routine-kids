import {
  BillingEnvironment,
  BillingPlan,
  BillingProvider,
  SubscriptionStatus,
} from "@prisma/client";

export type RoutineKidsSettingsSnapshot = {
  locale: "fr" | "en";
  soundsEnabled: boolean;
  morningStart: string;
  morningEnd: string;
  eveningStart: string;
  eveningEnd: string;
  premiumActive: boolean;
};

export type ParentSecuritySummary = {
  pinConfigured: boolean;
  stepUpMinutes: number;
  stepUpActive: boolean;
};

export function isSupportedLocale(value: string): value is "fr" | "en" {
  return value === "fr" || value === "en";
}

export type PremiumSubscriptionSnapshot = {
  plan: BillingPlan | null | undefined;
  status: SubscriptionStatus | null | undefined;
  provider: BillingProvider | null | undefined;
  environment: BillingEnvironment | null | undefined;
  periodEnd: Date | string | null | undefined;
  revokedAt?: Date | string | null | undefined;
};

export function isProductionRuntime() {
  return process.env.VERCEL_ENV === "production";
}

export function isPremiumSubscription(
  subscription: PremiumSubscriptionSnapshot | null | undefined,
  options: {
    now?: Date;
    productionRuntime?: boolean;
  } = {},
) {
  if (!subscription || subscription.plan !== BillingPlan.FAMILY_PLUS) {
    return false;
  }

  if (
    subscription.provider !== BillingProvider.STRIPE &&
    subscription.provider !== BillingProvider.APPLE
  ) {
    return false;
  }

  if (
    subscription.status !== SubscriptionStatus.ACTIVE &&
    subscription.status !== SubscriptionStatus.TRIALING
  ) {
    return false;
  }

  if (subscription.revokedAt) {
    return false;
  }

  const now = options.now ?? new Date();
  if (subscription.periodEnd) {
    const periodEnd = new Date(subscription.periodEnd);
    if (Number.isNaN(periodEnd.getTime()) || periodEnd <= now) {
      return false;
    }
  }

  const productionRuntime =
    options.productionRuntime ?? isProductionRuntime();
  if (
    productionRuntime &&
    subscription.provider === BillingProvider.STRIPE &&
    subscription.environment !== BillingEnvironment.PRODUCTION
  ) {
    return false;
  }

  return true;
}
