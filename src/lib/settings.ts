import {
  BillingPlan,
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

export function isPremiumSubscription(
  plan: BillingPlan | null | undefined,
  status: SubscriptionStatus | null | undefined,
) {
  if (!plan || plan === BillingPlan.FREE) {
    return false;
  }

  return status == null || status === SubscriptionStatus.ACTIVE || status === SubscriptionStatus.TRIALING;
}
