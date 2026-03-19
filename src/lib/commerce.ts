import { PRODUCTS, type ProductId } from "@/lib/data";

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

export function getProductDisplayName(productId: ProductId) {
  const product = PRODUCTS[productId];
  if ("flavor" in product) {
    return `${product.name} (${product.flavor})`;
  }

  return product.name;
}

export function isShotProduct(productId: ProductId) {
  return PRODUCTS[productId].category === "shots";
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

export function getProductPriceSnapshot(productId: ProductId) {
  const product = PRODUCTS[productId];
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

export function getShotBundlePricing(shotQuantity: number) {
  const normalizedQuantity = Math.max(0, Math.floor(shotQuantity));
  const bundleCount = Math.floor(normalizedQuantity / SHOT_BUNDLE.unitCount);
  const baseSetPriceNgn = PRODUCTS.shot_glow.priceNgn * SHOT_BUNDLE.unitCount;
  const bundleBaseTotalNgn = baseSetPriceNgn * bundleCount;
  const bundleActualTotalNgn = SHOT_BUNDLE.bundlePriceNgn * bundleCount;
  const discountNgn = bundleBaseTotalNgn - bundleActualTotalNgn;

  return {
    bundleCount,
    discountNgn,
    discountUsd: convertNgnToUsd(discountNgn),
  };
}
