"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useCommerce } from "@/components/providers/CommerceProvider";
import {
  SHOT_BUNDLE,
  formatNgn,
} from "@/lib/commerce";
import { cn } from "@/lib/utils";
import { MapboxAddressAutocomplete } from "@/components/maps/MapboxAddressAutocomplete";
import { MapboxLocationPicker } from "@/components/maps/MapboxLocationPicker";
import { useOverlayPresence } from "@/components/providers/UIProvider";

const fieldClassName =
  "w-full rounded-[28px] bg-system-fill/80 px-4 py-3 text-sm text-label placeholder:text-secondary-label transition-colors duration-300 focus:bg-system-fill dark:bg-white/[0.05] dark:focus:bg-white/[0.08]";

export function CartDrawer() {
  const {
    canCheckout,
    cartLines,
    checkoutError,
    checkoutForm,
    isCartReady,
    isRefreshingCart,
    isSubmittingCheckout,
    submitCheckout,
    clearCart,
    closeCart,
    discountNgn,
    isCartOpen,
    itemCount,
    removeItem,
    refreshCart,
    setQuantity,
    shotBundleCount,
    subtotalNgn,
    totalNgn,
    updateCheckoutField,
  } = useCommerce();

  const showLoadingState = !isCartReady && cartLines.length === 0;
  const showEmptyState = isCartReady && cartLines.length === 0;
  const canRefreshCart =
    checkoutError === "Cart refreshed." || checkoutError === "Cart is empty.";
  const [showLocationPin, setShowLocationPin] = useState(() =>
    Boolean(checkoutForm.latitude || checkoutForm.longitude)
  );
  const [showNotesField, setShowNotesField] = useState(() =>
    Boolean(checkoutForm.notes)
  );
  useOverlayPresence("commerce-cart", isCartOpen);

  useEffect(() => {
    if (!isCartOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeCart();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeCart, isCartOpen]);

  return (
    <>
      <div
        className={cn(
          "z-layer-sheet-backdrop fixed inset-0 transition-opacity duration-300",
          isCartOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        )}
      >
        <button
          type="button"
          aria-label="Close cart"
          onClick={closeCart}
          className="absolute inset-0 bg-black/48 backdrop-blur-md"
        />
      </div>

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        aria-hidden={!isCartOpen}
        className={cn(
          "z-layer-sheet fixed inset-x-0 bottom-0 top-auto max-h-[calc(100svh-0.75rem)] w-full transition-transform duration-500 ease-[var(--ease-premium)] sm:inset-x-auto sm:right-0 sm:top-0 sm:h-[100svh] sm:max-h-none sm:w-full sm:max-w-[480px]",
          isCartOpen ? "translate-y-0 sm:translate-x-0 sm:translate-y-0" : "translate-y-full sm:translate-x-full sm:translate-y-0"
        )}
      >
        <div className="flex h-full max-h-[inherit] flex-col overflow-hidden rounded-t-[34px] bg-[color:var(--system-background)] p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-[0_-22px_60px_rgba(0,0,0,0.18)] sm:rounded-l-[36px] sm:rounded-tr-none sm:p-5 sm:shadow-[0_32px_120px_rgba(0,0,0,0.22)]">
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-system-fill/90 sm:hidden" />

          <div className="flex items-start justify-between gap-4 px-1 pb-4 pt-1 sm:pb-5 sm:pt-2">
            <div>
              <span className="inline-flex items-center rounded-full bg-accent/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-headline text-accent dark:bg-accent/15">
                {SHOT_BUNDLE.shortLabel}
              </span>
              <h2 className="mt-3 text-2xl font-headline font-bold tracking-display text-label sm:mt-4 sm:text-3xl">
                Your Cart
              </h2>
            </div>

            <button
              type="button"
              onClick={closeCart}
              className="motion-press-soft flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-system-fill/80 text-label transition-colors duration-300 hover:bg-system-fill"
              aria-label="Close cart"
            >
              <Icon name="close" size={24} />
            </button>
          </div>

          {showLoadingState ? (
            <div className="flex flex-1 flex-col gap-4 px-1 pt-2">
              <div className="card-soft squircle animate-pulse p-5">
                <div className="h-3 w-16 rounded-full bg-system-fill" />
                <div className="mt-4 h-8 w-32 rounded-full bg-system-fill" />
              </div>
              <div className="card-soft squircle animate-pulse p-5">
                <div className="h-3 w-20 rounded-full bg-system-fill" />
                <div className="mt-4 h-16 rounded-[24px] bg-system-fill" />
              </div>
              <div className="card-soft squircle animate-pulse p-5">
                <div className="h-3 w-24 rounded-full bg-system-fill" />
                <div className="mt-4 h-48 rounded-[28px] bg-system-fill" />
              </div>
            </div>
          ) : showEmptyState ? (
            <div className="flex flex-1 flex-col items-center justify-center px-3 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-system-fill/80 text-accent shadow-soft">
                <Icon name="bag" size={48} />
              </div>
              <h3 className="mt-8 text-2xl font-headline font-semibold tracking-title text-label">
                Cart is empty.
              </h3>
              {checkoutError ? (
                <p className="mt-3 text-sm tracking-body text-secondary-label">
                  {checkoutError}
                </p>
              ) : null}
              <div className="mt-8 flex w-full flex-col gap-3">
                <Link
                  href="/#shop"
                  onClick={closeCart}
                  className="button-primary min-h-[56px] w-full justify-center text-xs font-semibold uppercase tracking-headline"
                >
                  Browse Products
                </Link>
                {canRefreshCart ? (
                  <button
                    type="button"
                    onClick={() => void refreshCart()}
                    disabled={isRefreshingCart}
                    className="button-secondary min-h-[48px] w-full justify-center text-xs font-semibold uppercase tracking-headline disabled:translate-y-0 disabled:shadow-none"
                  >
                    {isRefreshingCart ? "Refreshing" : "Refresh"}
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <>
              <div className="scrollbar-hide flex-1 overflow-y-auto pr-1 pb-2">
                <div className="space-y-3">
                  {cartLines.map((line) => (
                    <article
                      key={line.productId}
                      className="card-soft squircle overflow-hidden p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-lg font-headline font-semibold tracking-title text-label">
                            {line.displayName}
                          </h3>
                          <p className="mt-2 text-sm font-medium tracking-tight text-label">
                            {formatNgn(line.currentUnitNgn)}
                          </p>
                          {line.isShot ? (
                            <p className="mt-2 text-xs tracking-body text-secondary-label">
                              {SHOT_BUNDLE.shortLabel}
                            </p>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(line.productId)}
                          className="motion-press-soft flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-system-fill/80 text-secondary-label transition-colors duration-300 hover:bg-system-fill hover:text-label"
                          aria-label={`Remove ${line.displayName}`}
                        >
                          <Icon name="trash" size={18} />
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 rounded-full bg-system-fill/80 p-1">
                          <button
                            type="button"
                            onClick={() =>
                              setQuantity(line.productId, line.quantity - 1)
                            }
                            className="motion-press-soft flex h-9 w-9 items-center justify-center rounded-full bg-system-background text-label transition-transform duration-300 hover:scale-[1.03]"
                            aria-label={`Decrease ${line.displayName}`}
                          >
                            <Icon name="minus" size={16} />
                          </button>
                          <span className="min-w-[2rem] text-center text-sm font-semibold text-label">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setQuantity(line.productId, line.quantity + 1)
                            }
                            className="motion-press-soft flex h-9 w-9 items-center justify-center rounded-full bg-system-background text-label transition-transform duration-300 hover:scale-[1.03]"
                            aria-label={`Increase ${line.displayName}`}
                          >
                            <Icon name="plus" size={16} />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-semibold tracking-tight text-label">
                            {formatNgn(line.lineCurrentNgn)}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="card-soft squircle mt-5 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                        Summary
                      </p>
                      <h3 className="mt-2 text-xl font-headline font-semibold tracking-title text-label">
                        {itemCount} item{itemCount > 1 ? "s" : ""} ready
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={clearCart}
                      className="motion-press-soft rounded-full bg-system-fill/80 px-4 py-2 text-[10px] font-semibold uppercase tracking-headline text-secondary-label transition-colors duration-300 hover:bg-system-fill hover:text-label"
                    >
                      Clear Cart
                    </button>
                  </div>

                  <div className="mt-5 space-y-3 text-sm tracking-body">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-secondary-label">Subtotal</span>
                      <span className="text-right font-medium text-label">
                        {formatNgn(subtotalNgn)}
                      </span>
                    </div>

                    {shotBundleCount > 0 ? (
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-secondary-label">
                          {SHOT_BUNDLE.label} ({shotBundleCount} set
                          {shotBundleCount > 1 ? "s" : ""})
                        </span>
                        <span className="text-right font-medium text-accent">
                          -{formatNgn(discountNgn)}
                        </span>
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between gap-4 pt-3 text-base font-semibold tracking-tight text-label">
                      <span>Total</span>
                      <span className="text-right">{formatNgn(totalNgn)}</span>
                    </div>
                  </div>
                </div>

                <div className="card-soft squircle mt-5 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xl font-headline font-semibold tracking-title text-label">
                      Checkout
                    </h3>
                    <div className="rounded-full bg-system-fill px-3 py-2 text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                      Request
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 rounded-[24px] bg-system-fill/42 px-4 py-3">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                        Account
                      </div>
                      <div className="mt-1 text-sm text-label">Use saved details</div>
                    </div>
                    <Link
                      href="/account"
                      onClick={closeCart}
                      className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label transition-colors duration-300 hover:text-label"
                    >
                      Open
                    </Link>
                  </div>

                  <div className="mt-5 grid gap-3">
                    <label className="grid gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                        Name
                      </span>
                      <input
                        type="text"
                        value={checkoutForm.fullName}
                        onChange={(event) =>
                          updateCheckoutField("fullName", event.target.value)
                        }
                        className={fieldClassName}
                        placeholder="Full name"
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                        Email
                      </span>
                      <input
                        type="email"
                        value={checkoutForm.email}
                        onChange={(event) =>
                          updateCheckoutField("email", event.target.value)
                        }
                        className={fieldClassName}
                        placeholder="Optional"
                      />
                    </label>

                    <label className="grid gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                        Phone
                      </span>
                      <input
                        type="tel"
                        value={checkoutForm.phoneNumber}
                        onChange={(event) =>
                          updateCheckoutField("phoneNumber", event.target.value)
                        }
                        className={fieldClassName}
                        placeholder="080..."
                      />
                      <span className="px-1 text-[10px] text-secondary-label">
                        Any working number is fine.
                      </span>
                    </label>

                    <div className="grid gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                        Delivery Address
                      </span>
                      <MapboxAddressAutocomplete
                        value={checkoutForm.deliveryLocation}
                        onChange={(value) => {
                          updateCheckoutField("deliveryLocation", value);
                          updateCheckoutField("latitude", "");
                          updateCheckoutField("longitude", "");
                        }}
                        onSelect={(suggestion) => {
                          updateCheckoutField("deliveryLocation", suggestion.label);
                          updateCheckoutField("latitude", String(suggestion.latitude));
                          updateCheckoutField("longitude", String(suggestion.longitude));
                        }}
                        inputClassName={fieldClassName}
                        placeholder="House, street, area, landmark"
                        proximity={
                          checkoutForm.latitude && checkoutForm.longitude
                            ? {
                                latitude: Number(checkoutForm.latitude),
                                longitude: Number(checkoutForm.longitude),
                              }
                            : null
                        }
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 md:hidden">
                      <button
                        type="button"
                        onClick={() => setShowLocationPin((current) => !current)}
                        className="motion-press-soft rounded-full bg-system-fill/46 px-4 py-2 text-[10px] font-semibold uppercase tracking-headline text-secondary-label transition-colors duration-300 hover:bg-system-fill/70 hover:text-label"
                      >
                        {showLocationPin ? "Hide pin" : "Pin location"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNotesField((current) => !current)}
                        className="motion-press-soft rounded-full bg-system-fill/46 px-4 py-2 text-[10px] font-semibold uppercase tracking-headline text-secondary-label transition-colors duration-300 hover:bg-system-fill/70 hover:text-label"
                      >
                        {showNotesField ? "Hide note" : "Add note"}
                      </button>
                    </div>

                    <div className={cn(!showLocationPin && "hidden md:block")}>
                      <MapboxLocationPicker
                        latitude={
                          checkoutForm.latitude
                            ? Number(checkoutForm.latitude)
                            : null
                        }
                        longitude={
                          checkoutForm.longitude
                            ? Number(checkoutForm.longitude)
                            : null
                        }
                        onChange={({ latitude, longitude }) => {
                          updateCheckoutField(
                            "latitude",
                            latitude == null ? "" : String(latitude)
                          );
                          updateCheckoutField(
                            "longitude",
                            longitude == null ? "" : String(longitude)
                          );
                        }}
                        onResolveAddress={(suggestion) => {
                          updateCheckoutField("deliveryLocation", suggestion.label);
                          updateCheckoutField("latitude", String(suggestion.latitude));
                          updateCheckoutField("longitude", String(suggestion.longitude));
                        }}
                        className="h-[152px] sm:h-[170px]"
                        isVisible={isCartOpen}
                      />
                    </div>

                    <label className={cn("grid gap-2", !showNotesField && "hidden md:grid")}>
                      <span className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                        Notes
                      </span>
                      <textarea
                        rows={4}
                        value={checkoutForm.notes}
                        onChange={(event) =>
                          updateCheckoutField("notes", event.target.value)
                        }
                        className={fieldClassName}
                        placeholder="Gate, floor, landmark"
                      />
                    </label>
                  </div>

                {checkoutError ? (
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <p className="rounded-full bg-system-fill px-3 py-2 text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                        {checkoutError}
                      </p>
                      {canRefreshCart ? (
                        <button
                          type="button"
                          onClick={() => void refreshCart()}
                          disabled={isRefreshingCart}
                          className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label transition-colors duration-300 hover:text-label disabled:text-secondary-label"
                        >
                          {isRefreshingCart ? "Refreshing" : "Refresh"}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="pt-4 sm:pt-5">
                <button
                  type="button"
                  onClick={() => void submitCheckout()}
                  disabled={!canCheckout || !isCartReady}
                  className="button-primary min-h-[60px] w-full justify-center text-xs font-semibold uppercase tracking-headline disabled:translate-y-0 disabled:shadow-none"
                >
                  {isSubmittingCheckout ? "Placing order" : "Place order"}
                </button>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
