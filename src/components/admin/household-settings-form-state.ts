export type UpdateHouseholdSettingsState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"name" | "locale", string>>;
};

export const updateHouseholdSettingsInitialState: UpdateHouseholdSettingsState = {
  status: "idle",
};
