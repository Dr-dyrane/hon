export type AuthRole = "customer" | "admin";

export type AuthSession = {
  email: string;
  role: AuthRole;
  issuedAt: string;
  expiresAt: string;
};

export type AuthChallenge = {
  email: string;
  code: string;
  returnTo: string;
  issuedAt: string;
  expiresAt: string;
};

export type AuthActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  redirectTo?: string;
  developmentOtpCode?: string;
};
