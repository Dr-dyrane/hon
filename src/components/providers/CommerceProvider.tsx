"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { BRAND, PRODUCTS, type ProductId } from "@/lib/data";
import {
  SHOT_BUNDLE,
  formatNgn,
  getProductDisplayName,
  getProductPriceSnapshot,
  getShotBundlePricing,
  isShotProduct,
} from "@/lib/commerce";

const CART_STORAGE_KEY = "hop-cart-v1";

type CartItem = {
  productId: ProductId;
  quantity: number;
};

type CheckoutField = "fullName" | "phoneNumber" | "deliveryLocation" | "notes";

type CheckoutFormState = {
  fullName: string;
  phoneNumber: string;
  deliveryLocation: string;
  notes: string;
};

type CartLine = {
  productId: ProductId;
  category: string;
  isShot: boolean;
  quantity: number;
  displayName: string;
  originalUnitUsd: number;
  currentUnitUsd: number;
  savingsUnitUsd: number;
  originalUnitNgn: number;
  currentUnitNgn: number;
  savingsUnitNgn: number;
  lineOriginalUsd: number;
  lineCurrentUsd: number;
  lineSavingsUsd: number;
  lineOriginalNgn: number;
  lineCurrentNgn: number;
  lineSavingsNgn: number;
};

type CommerceContextType = {
  cartItems: CartItem[];
  cartLines: CartLine[];
  itemCount: number;
  isCartOpen: boolean;
  checkoutForm: CheckoutFormState;
  shotBundleCount: number;
  subtotalUsd: number;
  subtotalNgn: number;
  discountUsd: number;
  discountNgn: number;
  totalUsd: number;
  totalNgn: number;
  addItem: (productId: ProductId, quantity?: number) => void;
  setQuantity: (productId: ProductId, quantity: number) => void;
  removeItem: (productId: ProductId) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  updateCheckoutField: (field: CheckoutField, value: string) => void;
  canCheckout: boolean;
  checkoutToWhatsApp: () => void;
};

const CommerceContext = createContext<CommerceContextType | undefined>(undefined);

const cartListeners = new Set<() => void>();
const emptyCartSnapshot: CartItem[] = [];
let cartSnapshotCache: { raw: string | null; parsed: CartItem[] } = {
  raw: null,
  parsed: emptyCartSnapshot,
};

const emptyCheckoutForm: CheckoutFormState = {
  fullName: "",
  phoneNumber: "",
  deliveryLocation: "",
  notes: "",
};

function sanitizeCartItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) {
    return emptyCartSnapshot;
  }

  const parsedItems = value
    .map((item) => {
      if (
        typeof item !== "object" ||
        item === null ||
        !("productId" in item) ||
        !("quantity" in item)
      ) {
        return null;
      }

      const productId = item.productId;
      const quantity = item.quantity;

      if (
        typeof productId !== "string" ||
        !(productId in PRODUCTS) ||
        typeof quantity !== "number" ||
        !Number.isFinite(quantity)
      ) {
        return null;
      }

      return {
        productId: productId as ProductId,
        quantity: Math.max(1, Math.floor(quantity)),
      };
    })
    .filter((item): item is CartItem => item !== null);

  return parsedItems.length > 0 ? parsedItems : emptyCartSnapshot;
}

function getServerCartSnapshot() {
  return emptyCartSnapshot;
}

function readCartSnapshot() {
  if (typeof window === "undefined") {
    return emptyCartSnapshot;
  }

  const rawValue = window.localStorage.getItem(CART_STORAGE_KEY);

  if (rawValue === cartSnapshotCache.raw) {
    return cartSnapshotCache.parsed;
  }

  if (!rawValue) {
    cartSnapshotCache = { raw: null, parsed: emptyCartSnapshot };
    return emptyCartSnapshot;
  }

  try {
    const parsedItems = sanitizeCartItems(JSON.parse(rawValue));
    cartSnapshotCache = { raw: rawValue, parsed: parsedItems };

    return parsedItems;
  } catch {
    cartSnapshotCache = { raw: rawValue, parsed: emptyCartSnapshot };
    return emptyCartSnapshot;
  }
}

function emitCartStoreChange() {
  cartListeners.forEach((listener) => listener());
}

function writeCartSnapshot(items: CartItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  const sanitizedItems = sanitizeCartItems(items);

  if (sanitizedItems.length === 0) {
    cartSnapshotCache = { raw: null, parsed: emptyCartSnapshot };
    window.localStorage.removeItem(CART_STORAGE_KEY);
    emitCartStoreChange();
    return;
  }

  const serializedItems = JSON.stringify(sanitizedItems);
  cartSnapshotCache = { raw: serializedItems, parsed: sanitizedItems };
  window.localStorage.setItem(CART_STORAGE_KEY, serializedItems);
  emitCartStoreChange();
}

function subscribeToCartStore(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === CART_STORAGE_KEY) {
      listener();
    }
  };

  cartListeners.add(listener);
  window.addEventListener("storage", handleStorage);

  return () => {
    cartListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function getWhatsAppPhoneNumber() {
  const primaryNumber = BRAND.contact.whatsapp[0] ?? "";
  const digits = primaryNumber.replace(/\D/g, "");

  if (digits.startsWith("0")) {
    return `234${digits.slice(1)}`;
  }

  return digits;
}

export function CommerceProvider({ children }: { children: ReactNode }) {
  const cartItems = useSyncExternalStore(
    subscribeToCartStore,
    readCartSnapshot,
    getServerCartSnapshot
  );
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState(emptyCheckoutForm);

  const cartLines = useMemo(() => {
    return cartItems.map((item) => {
      const pricing = getProductPriceSnapshot(item.productId);
      const product = PRODUCTS[item.productId];

      return {
        productId: item.productId,
        category: product.category,
        isShot: isShotProduct(item.productId),
        quantity: item.quantity,
        displayName: getProductDisplayName(item.productId),
        originalUnitUsd: pricing.originalUsd,
        currentUnitUsd: pricing.currentUsd,
        savingsUnitUsd: pricing.savingsUsd,
        originalUnitNgn: pricing.originalNgn,
        currentUnitNgn: pricing.currentNgn,
        savingsUnitNgn: pricing.savingsNgn,
        lineOriginalUsd: pricing.originalUsd * item.quantity,
        lineCurrentUsd: pricing.currentUsd * item.quantity,
        lineSavingsUsd: pricing.savingsUsd * item.quantity,
        lineOriginalNgn: pricing.originalNgn * item.quantity,
        lineCurrentNgn: pricing.currentNgn * item.quantity,
        lineSavingsNgn: pricing.savingsNgn * item.quantity,
      };
    });
  }, [cartItems]);

  const itemCount = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems]
  );
  const shotQuantity = useMemo(
    () =>
      cartItems.reduce(
        (total, item) => total + (isShotProduct(item.productId) ? item.quantity : 0),
        0
      ),
    [cartItems]
  );
  const shotBundlePricing = useMemo(
    () => getShotBundlePricing(shotQuantity),
    [shotQuantity]
  );
  const shotBundleCount = shotBundlePricing.bundleCount;

  const subtotalUsd = useMemo(
    () => cartLines.reduce((total, line) => total + line.lineOriginalUsd, 0),
    [cartLines]
  );
  const subtotalNgn = useMemo(
    () => cartLines.reduce((total, line) => total + line.lineOriginalNgn, 0),
    [cartLines]
  );
  const discountUsd = shotBundlePricing.discountUsd;
  const discountNgn = shotBundlePricing.discountNgn;
  const totalUsd = useMemo(
    () => Math.max(0, subtotalUsd - discountUsd),
    [discountUsd, subtotalUsd]
  );
  const totalNgn = useMemo(
    () => Math.max(0, subtotalNgn - discountNgn),
    [discountNgn, subtotalNgn]
  );

  const addItem = useCallback((productId: ProductId, quantity = 1) => {
    const normalizedQuantity = Math.max(1, Math.floor(quantity));
    const existingItem = cartItems.find((item) => item.productId === productId);

    if (existingItem) {
      writeCartSnapshot(
        cartItems.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + normalizedQuantity }
            : item
        )
      );
    } else {
      writeCartSnapshot([...cartItems, { productId, quantity: normalizedQuantity }]);
    }

    setIsCartOpen(true);
  }, [cartItems]);

  const setQuantity = useCallback((productId: ProductId, quantity: number) => {
    const normalizedQuantity = Math.floor(quantity);

    if (normalizedQuantity <= 0) {
      writeCartSnapshot(cartItems.filter((item) => item.productId !== productId));
      return;
    }

    writeCartSnapshot(
      cartItems.map((item) =>
        item.productId === productId
          ? { ...item, quantity: normalizedQuantity }
          : item
      )
    );
  }, [cartItems]);

  const removeItem = useCallback((productId: ProductId) => {
    writeCartSnapshot(cartItems.filter((item) => item.productId !== productId));
  }, [cartItems]);

  const clearCart = useCallback(() => {
    writeCartSnapshot([]);
  }, []);

  const openCart = useCallback(() => {
    setIsCartOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  const toggleCart = useCallback(() => {
    setIsCartOpen((current) => !current);
  }, []);

  const updateCheckoutField = useCallback((field: CheckoutField, value: string) => {
    setCheckoutForm((current) => ({
      ...current,
      [field]: value,
    }));
  }, []);

  const canCheckout =
    cartItems.length > 0 &&
    checkoutForm.fullName.trim().length > 1 &&
    checkoutForm.phoneNumber.trim().length > 6 &&
    checkoutForm.deliveryLocation.trim().length > 2;

  const checkoutToWhatsApp = useCallback(() => {
    if (!canCheckout) {
      return;
    }

    const lines = cartLines
      .map((line, index) => {
        return [
          `${index + 1}. ${line.displayName} x${line.quantity}`,
          `   ${formatNgn(line.currentUnitNgn)} each`,
          `   Line total: ${formatNgn(line.lineCurrentNgn)}`,
        ].join("\n");
      })
      .join("\n");

    const message = [
      "Hello House of Prax, I want to place this order.",
      "",
      "Customer Details",
      `- Name: ${checkoutForm.fullName.trim()}`,
      `- Phone: ${checkoutForm.phoneNumber.trim()}`,
      `- Delivery Area: ${checkoutForm.deliveryLocation.trim()}`,
      checkoutForm.notes.trim()
        ? `- Notes: ${checkoutForm.notes.trim()}`
        : "- Notes: None",
      "",
      "Order Summary",
      lines,
      "",
      "Pricing",
      `- Subtotal: ${formatNgn(subtotalNgn)}`,
      ...(shotBundleCount > 0
        ? [
            `- ${SHOT_BUNDLE.label} (${shotBundleCount} x ${SHOT_BUNDLE.unitCount} shots): -${formatNgn(discountNgn)}`,
          ]
        : []),
      `- Total: ${formatNgn(totalNgn)}`,
      "",
      "Please confirm availability, delivery timeline, and payment instructions.",
    ].join("\n");

    const phoneNumber = getWhatsAppPhoneNumber();
    const checkoutUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    const checkoutWindow = window.open(
      checkoutUrl,
      "_blank",
      "noopener,noreferrer"
    );

    if (!checkoutWindow) {
      return;
    }

    checkoutWindow.focus();
    writeCartSnapshot([]);
    setCheckoutForm(emptyCheckoutForm);
    setIsCartOpen(false);
  }, [
    canCheckout,
    cartLines,
    checkoutForm.deliveryLocation,
    checkoutForm.fullName,
    checkoutForm.notes,
    checkoutForm.phoneNumber,
    discountNgn,
    shotBundleCount,
    subtotalNgn,
    totalNgn,
  ]);

  const value = useMemo<CommerceContextType>(
    () => ({
      cartItems,
      cartLines,
      itemCount,
      isCartOpen,
      checkoutForm,
      shotBundleCount,
      subtotalUsd,
      subtotalNgn,
      discountUsd,
      discountNgn,
      totalUsd,
      totalNgn,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
      openCart,
      closeCart,
      toggleCart,
      updateCheckoutField,
      canCheckout,
      checkoutToWhatsApp,
    }),
    [
      addItem,
      canCheckout,
      cartItems,
      cartLines,
      checkoutForm,
      clearCart,
      closeCart,
      discountNgn,
      discountUsd,
      isCartOpen,
      itemCount,
      openCart,
      removeItem,
      setQuantity,
      shotBundleCount,
      subtotalNgn,
      subtotalUsd,
      toggleCart,
      totalNgn,
      totalUsd,
      updateCheckoutField,
      checkoutToWhatsApp,
    ]
  );

  return (
    <CommerceContext.Provider value={value}>{children}</CommerceContext.Provider>
  );
}

export function useCommerce() {
  const context = useContext(CommerceContext);

  if (!context) {
    throw new Error("useCommerce must be used within CommerceProvider");
  }

  return context;
}
