export type BillingPlan = {
  id: "free" | "family-plus";
  monthlyPrice: number;
  yearlyPrice: number;
  limits: {
    childProfiles: number;
    tasksPerRoutine: number;
  };
};

export const billingPlans: BillingPlan[] = [
  {
    id: "free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    limits: {
      childProfiles: 1,
      tasksPerRoutine: 4,
    },
  },
  {
    id: "family-plus",
    monthlyPrice: 4.99,
    yearlyPrice: 39.99,
    limits: {
      childProfiles: 6,
      tasksPerRoutine: 20,
    },
  },
];
