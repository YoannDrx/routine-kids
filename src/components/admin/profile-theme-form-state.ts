export type UpdateChildProfileThemeState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const updateChildProfileThemeInitialState: UpdateChildProfileThemeState = {
  status: "idle",
};
