export type ReviewActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const INITIAL_REVIEW_ACTION_STATE: ReviewActionState = {
  status: "idle",
};
