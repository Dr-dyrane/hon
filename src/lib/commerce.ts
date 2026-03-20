import type { MarketingProduct, ProductId } from "@/lib/marketing/types";

export type ProductLookup = Record<ProductId, MarketingProduct>;

export const FX_REFERENCE = {
  usdToNgn: 1357.81,
  verifiedAt: "2026-03-19",
  sourceLabel: "Wise USD/NGN reference rate",
  sourceUrl: "https://wise.com/us/currency-converter/usd-to-ngn-rate",
} as const;

export const SHOT_BUNDLE = {
  label: "Shot Bundle",
  shortLabel: "4 for NGN 4,499",
  bundlePriceNgn: 4499,
  unitCount: 4,
  description: "Any 4 health shots in one order are priced at NGN 4,499.",
} as const;

export function getProductDisplayName(
  productsById: ProductLookup,
  productId: ProductId
) {
  const product = productsById[productId];
  if (product.flavor) {
    return `${product.name} (${product.flavor})`;
  }

  return product.name;
}

export function isShotProduct(productsById: ProductLookup, productId: ProductId) {
  return productsById[productId]?.categoryId === "shots";
}

export function convertUsdToNgn(amountUsd: number) {
  return amountUsd * FX_REFERENCE.usdToNgn;
}

export function convertNgnToUsd(amountNgn: number) {
  return amountNgn / FX_REFERENCE.usdToNgn;
}

export function formatUsd(amountUsd: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountUsd);
}

export function formatNgn(amountNgn: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountNgn);
}

export function formatFxRate(amountNgn: number) {
  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountNgn);
}

export function getProductPriceSnapshot(
  productsById: ProductLookup,
  productId: ProductId
) {
  const product = productsById[productId];
  const originalNgn = product.priceNgn;
  const originalUsd = convertNgnToUsd(originalNgn);

  return {
    originalUsd,
    currentUsd: originalUsd,
    savingsUsd: 0,
    originalNgn,
    currentNgn: originalNgn,
    savingsNgn: 0,
  };
}

export function getShotBundlePricing(
  shotQuantity: number,
  shotUnitPriceNgn: number
) {
  const normalizedQuantity = Math.max(0, Math.floor(shotQuantity));
  const bundleCount = Math.floor(normalizedQuantity / SHOT_BUNDLE.unitCount);
  const baseSetPriceNgn = shotUnitPriceNgn * SHOT_BUNDLE.unitCount;
  const bundleBaseTotalNgn = baseSetPriceNgn * bundleCount;
  const bundleActualTotalNgn = SHOT_BUNDLE.bundlePriceNgn * bundleCount;
  const discountNgn = bundleBaseTotalNgn - bundleActualTotalNgn;

  return {
    bundleCount,
    discountNgn,
    discountUsd: convertNgnToUsd(discountNgn),
  };
}
