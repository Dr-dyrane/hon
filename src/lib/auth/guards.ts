import "server-only";

import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { resolveWorkspaceHome, sanitizeReturnTo } from "@/lib/auth/navigation";

export async function redirectAuthenticatedUserFromAuth(
  returnTo?: string | null
) {
  const session = await getCurrentSession();

  if (!session) {
    return null;
  }

  redirect(returnTo ? sanitizeReturnTo(returnTo) : resolveWorkspaceHome(session));
}

export async function requireAuthenticatedSession(returnTo = "/account") {
  const session = await getCurrentSession();

  if (!session) {
    redirect(`/auth/sign-in?returnTo=${encodeURIComponent(sanitizeReturnTo(returnTo))}`);
  }

  return session;
}

export async function requireAdminSession(returnTo = "/admin") {
  const session = await requireAuthenticatedSession(returnTo);

  if (session.role !== "admin") {
    redirect("/account");
  }

  return session;
}
