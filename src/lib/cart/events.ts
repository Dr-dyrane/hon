export type CommerceCartItemPayload = {
  productId: string;
  quantity: number;
};

const OPEN_CART_EVENT = "commerce:open-cart";
const SYNC_CART_EVENT = "commerce:sync-cart";

export function dispatchCommerceOpenCart() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(OPEN_CART_EVENT));
}

export function dispatchCommerceCartSync(items: CommerceCartItemPayload[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<{ items: CommerceCartItemPayload[] }>(SYNC_CART_EVENT, {
      detail: { items },
    })
  );
}
