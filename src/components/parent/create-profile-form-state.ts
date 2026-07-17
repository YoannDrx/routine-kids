export type CreateChildProfileState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"name" | "age" | "headline", string>>;
};

export const createChildProfileInitialState: CreateChildProfileState = {
  status: "idle",
};
