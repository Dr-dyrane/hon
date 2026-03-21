"use client";

import { Package2, ShoppingBag, Sparkles } from "lucide-react";
import { useCommerce } from "@/components/providers/CommerceProvider";
import { formatNgn } from "@/lib/commerce";
import type { PublishedCatalogProduct } from "@/lib/db/types";

export function PortalStoreShelf({
  products,
}: {
  products: PublishedCatalogProduct[];
}) {
  const { addItem } = useCommerce();
  const availableProducts = products.filter((product) => product.isAvailable);

  if (availableProducts.length === 0) {
    return (
      <div className="rounded-[28px] bg-system-fill/42 px-5 py-6 text-sm text-secondary-label">
        Store is being stocked.
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {availableProducts.map((product) => {
        const title = product.productMarketingName || product.productName;
        const detail = product.productTagline || product.shortDescription;
        const isFeatured = product.merchandisingState === "featured";

        return (
          <article
            key={product.productId}
            className="glass-morphism rounded-[32px] bg-system-background/78 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-system-fill/60 text-label">
                {isFeatured ? (
                  <Sparkles className="h-5 w-5" strokeWidth={1.8} />
                ) : (
                  <Package2 className="h-5 w-5" strokeWidth={1.8} />
                )}
              </div>

              <div className="rounded-full bg-system-fill px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                {isFeatured ? "Featured" : "Available"}
              </div>
            </div>

            <div className="mt-5">
              <h2 className="text-xl font-semibold tracking-tight text-label">{title}</h2>
              <p className="mt-2 text-sm text-secondary-label">{detail}</p>
            </div>

            <div className="mt-6 flex items-end justify-between gap-4">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                  Price
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-tight text-label">
                  {formatNgn(product.priceNgn)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => addItem(product.productSlug)}
                className="button-primary min-h-[44px] gap-2 px-5 text-[10px] font-semibold uppercase tracking-[0.16em]"
              >
                <ShoppingBag className="h-4 w-4" strokeWidth={1.8} />
                Add
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
