export type BillingPlan = {
  id: "free" | "family" | "family-plus";
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
      childProfiles: 2,
      smartPresets: 3,
      auditHistoryDays: 7,
    },
  },
  {
    id: "family",
    monthlyPrice: 9,
    yearlyPrice: 90,
    limits: {
      childProfiles: 6,
      smartPresets: 999,
      auditHistoryDays: 90,
    },
  },
  {
    id: "family-plus",
    monthlyPrice: 17,
    yearlyPrice: 170,
    limits: {
      childProfiles: 10,
      smartPresets: 999,
      auditHistoryDays: 365,
    },
  },
];
