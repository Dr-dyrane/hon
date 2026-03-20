import "server-only";

import { cookies } from "next/headers";
import {
  AUTH_CHALLENGE_COOKIE_NAME,
  AUTH_CHALLENGE_TTL_SECONDS,
  AUTH_SESSION_COOKIE_NAME,
  AUTH_SESSION_TTL_SECONDS,
} from "@/lib/auth/constants";
import type { AuthChallenge, AuthRole, AuthSession } from "@/lib/auth/types";
import { createSignedToken, readSignedToken } from "@/lib/auth/tokens";
import { serverEnv } from "@/lib/config/server";

function hasExpired(isoDate: string) {
  return new Date(isoDate).getTime() <= Date.now();
}

function getCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: serverEnv.isProduction,
    path: "/",
    maxAge,
  };
}

function resolveRole(email: string): AuthRole {
  return serverEnv.auth.adminEmails.includes(email) ? "admin" : "customer";
}

export function isConfiguredAdminEmail(email: string) {
  return serverEnv.auth.adminEmails.includes(email.toLowerCase());
}

export async function getPendingAuthChallenge() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_CHALLENGE_COOKIE_NAME)?.value;
  const challenge = readSignedToken<AuthChallenge>(token);

  if (!challenge || hasExpired(challenge.expiresAt)) {
    return null;
  }

  return challenge;
}

export async function setPendingAuthChallenge({
  email,
  code,
  returnTo,
}: {
  email: string;
  code: string;
  returnTo: string;
}) {
  const issuedAt = new Date();
  const expiresAt = new Date(
    issuedAt.getTime() + AUTH_CHALLENGE_TTL_SECONDS * 1000
  );
  const challenge: AuthChallenge = {
    email,
    code,
    returnTo,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
  const cookieStore = await cookies();

  cookieStore.set(
    AUTH_CHALLENGE_COOKIE_NAME,
    createSignedToken(challenge),
    getCookieOptions(AUTH_CHALLENGE_TTL_SECONDS)
  );

  return challenge;
}

export async function clearPendingAuthChallenge() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_CHALLENGE_COOKIE_NAME);
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value;
  const session = readSignedToken<AuthSession>(token);

  if (!session || hasExpired(session.expiresAt)) {
    return null;
  }

  return session;
}

export async function setCurrentSession(email: string) {
  const issuedAt = new Date();
  const expiresAt = new Date(
    issuedAt.getTime() + AUTH_SESSION_TTL_SECONDS * 1000
  );
  const session: AuthSession = {
    email,
    role: resolveRole(email),
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
  const cookieStore = await cookies();

  cookieStore.set(
    AUTH_SESSION_COOKIE_NAME,
    createSignedToken(session),
    getCookieOptions(AUTH_SESSION_TTL_SECONDS)
  );

  return session;
}

export async function clearCurrentSession() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_SESSION_COOKIE_NAME);
}
