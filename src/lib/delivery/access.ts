import "server-only";

import { createSignedToken, readSignedToken } from "@/lib/auth/tokens";
import { publicEnv } from "@/lib/config/public";

const COURIER_ACCESS_TTL_MS = 1000 * 60 * 60 * 24 * 14;

type CourierAccessPayload = {
  assignmentId: string;
  orderId: string;
  riderId: string | null;
  issuedAt: string;
  expiresAt: string;
};

function hasExpired(value: string) {
  return new Date(value).getTime() <= Date.now();
}

export function createCourierAccessToken(input: {
  assignmentId: string;
  orderId: string;
  riderId: string | null;
}) {
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + COURIER_ACCESS_TTL_MS);

  return createSignedToken({
    assignmentId: input.assignmentId,
    orderId: input.orderId,
    riderId: input.riderId,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  } satisfies CourierAccessPayload);
}

export function readCourierAccessToken(token: string | undefined) {
  const payload = readSignedToken<CourierAccessPayload>(token);

  if (!payload || hasExpired(payload.expiresAt)) {
    return null;
  }

  return payload;
}

export function buildCourierAccessUrl(token: string) {
  return new URL(`/courier/${token}`, publicEnv.appUrl).toString();
}
