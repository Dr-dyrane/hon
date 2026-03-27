import "server-only";

import { serverEnv } from "@/lib/config/server";
import { createGuestOrderAccessToken } from "@/lib/orders/access";

export type CustomerLinkScope = "account" | "guest";

function resolveGuestAccessToken(orderId: string, accessToken?: string | null) {
  const normalizedToken = accessToken?.trim();

  if (normalizedToken) {
    return normalizedToken;
  }

  return createGuestOrderAccessToken(orderId);
}

export function buildCustomerOrderLink(input: {
  orderId: string;
  scope: CustomerLinkScope;
  accessToken?: string | null;
}) {
  if (input.scope === "account") {
    return `${serverEnv.public.appUrl}/account/orders/${input.orderId}`;
  }

  const accessToken = resolveGuestAccessToken(input.orderId, input.accessToken);
  return `${serverEnv.public.appUrl}/checkout/orders/${input.orderId}?access=${encodeURIComponent(accessToken)}`;
}

export function buildCustomerTrackingLink(input: {
  orderId: string;
  scope: CustomerLinkScope;
  accessToken?: string | null;
}) {
  if (input.scope === "account") {
    return `${serverEnv.public.appUrl}/account/tracking/${input.orderId}`;
  }

  const accessToken = resolveGuestAccessToken(input.orderId, input.accessToken);
  return `${serverEnv.public.appUrl}/checkout/orders/${input.orderId}/tracking?access=${encodeURIComponent(accessToken)}`;
}
