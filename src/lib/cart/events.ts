export type CommerceCartItemPayload = {
  productId: string;
  quantity: number;
};

export const COMMERCE_OPEN_CART_EVENT = "commerce:open-cart";
export const COMMERCE_SYNC_CART_EVENT = "commerce:sync-cart";
export const COMMERCE_REFRESH_CHECKOUT_DEFAULTS_EVENT =
  "commerce:refresh-checkout-defaults";

export function dispatchCommerceOpenCart() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(COMMERCE_OPEN_CART_EVENT));
}

export function dispatchCommerceCartSync(items: CommerceCartItemPayload[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<{ items: CommerceCartItemPayload[] }>(
      COMMERCE_SYNC_CART_EVENT,
      {
        detail: { items },
      }
    )
  );
}

export function dispatchCommerceRefreshCheckoutDefaults() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(COMMERCE_REFRESH_CHECKOUT_DEFAULTS_EVENT));
}
