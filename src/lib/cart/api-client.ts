"use client";

import type { CartSnapshot } from "@/lib/db/types";

type JsonResponse<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

export type CartCheckoutDefaults = {
  fullName: string;
  email: string;
  phoneNumber: string;
  deliveryLocation: string;
  notes: string;
  latitude: string;
  longitude: string;
  hasSavedDetails: boolean;
  sourceLabel: string | null;
};

async function readJson<T>(response: Response) {
  const payload = (await response.json()) as JsonResponse<T>;

  if (!response.ok || !payload.ok || payload.data === undefined) {
    throw new Error(payload.error || "Request failed.");
  }

  return payload.data;
}

async function readJsonAllowNull<T>(response: Response) {
  const payload = (await response.json()) as JsonResponse<T | null>;

  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || "Request failed.");
  }

  return payload.data ?? null;
}

export async function fetchCartSnapshot() {
  const response = await fetch("/api/cart", {
    credentials: "same-origin",
    cache: "no-store",
  });

  return readJson<CartSnapshot>(response);
}

export async function fetchCartCheckoutDefaults(options?: {
  signal?: AbortSignal;
}) {
  const response = await fetch("/api/cart/defaults", {
    credentials: "same-origin",
    cache: "no-store",
    signal: options?.signal,
  });

  return readJsonAllowNull<CartCheckoutDefaults>(response);
}

export async function replaceRemoteCartItems(
  items: Array<{ productId: string; quantity: number }>
) {
  const response = await fetch("/api/cart", {
    method: "PUT",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ items }),
  });

  return readJson<CartSnapshot>(response);
}

export async function clearRemoteCart() {
  const response = await fetch("/api/cart", {
    method: "DELETE",
    credentials: "same-origin",
  });

  return readJson<CartSnapshot>(response);
}

export async function addRemoteCartItem(productId: string, quantity: number) {
  const response = await fetch("/api/cart/items", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ productId, quantity }),
  });

  return readJson<CartSnapshot>(response);
}

export async function setRemoteCartItemQuantity(
  productId: string,
  quantity: number
) {
  const response = await fetch("/api/cart/items", {
    method: "PATCH",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ productId, quantity }),
  });

  return readJson<CartSnapshot>(response);
}

export async function removeRemoteCartItem(productId: string) {
  const response = await fetch("/api/cart/items", {
    method: "DELETE",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ productId }),
  });

  return readJson<CartSnapshot>(response);
}

export async function submitCheckoutOrder(payload: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryLocation: string;
  notes: string;
  latitude: number | null;
  longitude: number | null;
}) {
  const response = await fetch("/api/cart/checkout", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return readJson<{
    redirectTo: string;
    orderId: string;
    orderNumber: string;
  }>(response);
}
