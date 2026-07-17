export type BillingPlan = {
  id: "free" | "family-plus";
  monthlyPrice: number;
  yearlyPrice: number;
  limits: {
    childProfiles: number;
    smartPresets: number;
    auditHistoryDays: number;
  };
};

export const billingPlans: BillingPlan[] = [
  {
    id: "free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    limits: {
      childProfiles: 1,
      smartPresets: 3,
      auditHistoryDays: 7,
    },
  },
  {
    id: "family-plus",
    monthlyPrice: 9,
    yearlyPrice: 90,
    limits: {
      childProfiles: 10,
      smartPresets: 999,
      auditHistoryDays: 365,
    },
  },
];
