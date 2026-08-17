export type UpdateParentSecurityState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<
    Record<"currentPin" | "newPin" | "confirmPin" | "stepUpMinutes", string>
  >;
};

export const updateParentSecurityInitialState: UpdateParentSecurityState = {
  status: "idle",
};
