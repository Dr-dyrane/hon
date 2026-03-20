"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Pencil, Sparkles, Tag } from "lucide-react";
import { useState, useTransition } from "react";
import type { AdminCatalogProduct } from "@/lib/db/types";
import { cn } from "@/lib/utils";
import { formatNgn } from "@/lib/commerce";
import {
  setProductMerchandisingAction,
  toggleProductAvailabilityAction,
} from "@/app/(admin)/admin/catalog/products/[productId]/actions";

const statusTone = {
  active: "bg-emerald-500/10 text-emerald-600",
  draft: "bg-amber-500/10 text-amber-600",
  archived: "bg-system-fill/52 text-secondary-label",
} as const;

export function CatalogProductBoard({
  products,
}: {
  products: AdminCatalogProduct[];
}) {
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runQuickAction(
    key: string,
    run: () => Promise<{ success: boolean; error?: string }>
  ) {
    setBusyKey(key);
    setMessage(null);

    startTransition(async () => {
      const result = await run();

      if (!result.success) {
        setMessage(result.error || "Update failed.");
        setBusyKey(null);
        return;
      }

      setBusyKey(null);
      router.refresh();
    });
  }

  if (products.length === 0) {
    return (
      <section className="rounded-[28px] bg-system-background/86 p-6 text-sm text-secondary-label shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
        No products yet.
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {message ? <p className="text-sm text-red-500">{message}</p> : null}

      <div className="grid gap-3 min-[1500px]:grid-cols-[minmax(0,1fr)_288px]">
        <div className="space-y-3">
          {products.map((product) => {
            const name = product.productMarketingName ?? product.productName;
            const availabilityKey = `${product.productId}:availability`;
            const merchandisingKey = `${product.productId}:merchandising`;

            return (
              <article
                key={product.productId}
                className="rounded-[28px] bg-system-background/86 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-5"
              >
                <div className="flex flex-col gap-4 min-[1500px]:flex-row min-[1500px]:items-center">
                  <Link
                    href={`/admin/catalog/products/${product.productId}`}
                    className="flex min-w-0 flex-1 items-start gap-4"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-system-fill/46">
                      <Tag size={18} className="text-accent" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-lg font-semibold tracking-tight text-label">
                          {name}
                        </h2>
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em]",
                            statusTone[product.status]
                          )}
                        >
                          {product.status}
                        </span>
                        {product.merchandisingState === "featured" ? (
                          <span className="inline-flex rounded-full bg-accent/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-accent">
                            featured
                          </span>
                        ) : null}
                        {!product.isAvailable ? (
                          <span className="inline-flex rounded-full bg-system-fill/46 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                            hidden
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-medium uppercase tracking-[0.16em] text-secondary-label">
                        <span>{product.categoryName ?? "uncategorized"}</span>
                        <span>{product.sku}</span>
                        <span>{product.ingredientCount} ing</span>
                      </div>
                    </div>
                  </Link>

                  <div className="grid grid-cols-3 gap-2 min-[1500px]:min-w-[292px]">
                    <MetricChip label="Price" value={formatNgn(product.priceNgn)} />
                    <MetricChip
                      label="Stock"
                      value={`${product.inventoryOnHand ?? 0}`}
                    />
                    <MetricChip label="Sort" value={`${product.sortOrder}`} />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <QuickActionButton
                    icon={product.isAvailable ? EyeOff : Eye}
                    label={product.isAvailable ? "Hide" : "Live"}
                    pending={isPending && busyKey === availabilityKey}
                    onClick={() =>
                      runQuickAction(availabilityKey, () =>
                        toggleProductAvailabilityAction(
                          product.productId,
                          !product.isAvailable
                        )
                      )
                    }
                  />
                  <QuickActionButton
                    icon={Sparkles}
                    label={
                      product.merchandisingState === "featured"
                        ? "Standard"
                        : "Feature"
                    }
                    pending={isPending && busyKey === merchandisingKey}
                    onClick={() =>
                      runQuickAction(merchandisingKey, () =>
                        setProductMerchandisingAction(
                          product.productId,
                          product.merchandisingState === "featured"
                            ? "standard"
                            : "featured"
                        )
                      )
                    }
                  />
                  <Link
                    href={`/admin/catalog/products/${product.productId}`}
                    className="flex min-h-[40px] items-center gap-2 rounded-[18px] bg-system-fill/42 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-label transition-all hover:bg-system-fill/58"
                  >
                    <Pencil size={14} />
                    <span>Edit</span>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="hidden space-y-3 min-[1500px]:block">
          <SupportCard
            label="Live"
            value={products.filter((product) => product.isAvailable).length.toString()}
            detail="Available now"
          />
          <SupportCard
            label="Featured"
            value={
              products.filter((product) => product.merchandisingState === "featured")
                .length.toString()
            }
            detail="Homepage ready"
          />
          <SupportCard
            label="Hidden"
            value={
              products.filter((product) => !product.isAvailable).length.toString()
            }
            detail="Off catalog"
          />
        </aside>
      </div>
    </div>
  );
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-system-fill/42 px-3 py-2.5">
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-label">{value}</p>
    </div>
  );
}

function QuickActionButton({
  icon: Icon,
  label,
  onClick,
  pending,
}: {
  icon: typeof Eye;
  label: string;
  onClick: () => void;
  pending: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={cn(
        "flex min-h-[40px] items-center gap-2 rounded-[18px] bg-system-fill/42 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-label transition-all hover:bg-system-fill/58",
        pending && "opacity-50"
      )}
    >
      <Icon size={14} />
      <span>{pending ? "..." : label}</span>
    </button>
  );
}

function SupportCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[28px] bg-system-background/86 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
        {label}
      </p>
      <p className="mt-3 text-4xl font-semibold tracking-tight text-label">{value}</p>
      <p className="mt-2 text-xs text-secondary-label">{detail}</p>
    </div>
  );
}
