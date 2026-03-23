"use client";

import { Suspense, lazy } from "react";
import { useCommerce } from "@/components/providers/CommerceProvider";

const CartDrawer = lazy(() =>
  import("@/components/commerce/CartDrawer").then((module) => ({
    default: module.CartDrawer,
  }))
);

export function LazyCartDrawer() {
  const { isCartOpen } = useCommerce();

  if (!isCartOpen) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <CartDrawer />
    </Suspense>
  );
}
