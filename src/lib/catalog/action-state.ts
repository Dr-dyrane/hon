export type CatalogActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  redirectTo?: string;
};

export const INITIAL_CATALOG_ACTION_STATE: CatalogActionState = {
  status: "idle",
};
