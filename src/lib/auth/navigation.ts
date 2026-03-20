import type { AuthSession } from "@/lib/auth/types";

export function sanitizeReturnTo(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/account";
  }

  return value;
}

export function resolveWorkspaceHome(session: AuthSession) {
  return session.role === "admin" ? "/admin" : "/account";
}

export function resolvePostSignInRedirect(
  session: AuthSession,
  returnTo: string | null | undefined
) {
  const safeReturnTo = sanitizeReturnTo(returnTo);

  if (safeReturnTo === "/account" || safeReturnTo === "/admin") {
    return session.role === "admin" && safeReturnTo === "/admin"
      ? safeReturnTo
      : resolveWorkspaceHome(session);
  }

  if (safeReturnTo.startsWith("/admin") && session.role !== "admin") {
    return resolveWorkspaceHome(session);
  }

  return safeReturnTo;
}

export function maskEmailAddress(email: string) {
  const [localPart, domainPart] = email.split("@");

  if (!localPart || !domainPart) {
    return email;
  }

  const first = localPart.slice(0, 1);
  const last = localPart.length > 1 ? localPart.slice(-1) : "";

  return `${first}${"*".repeat(Math.max(localPart.length - 2, 1))}${last}@${domainPart}`;
}
