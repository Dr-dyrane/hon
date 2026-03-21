type StorefrontProduct = {
  status?: string | null;
  isAvailable?: boolean | null;
  merchandisingState?: string | null;
};

export function isStorefrontVisibleProduct(product: StorefrontProduct) {
  const statusOk = product.status == null || product.status === "active";
  const availabilityOk = product.isAvailable !== false;
  const merchandisingOk = product.merchandisingState !== "hidden";

  return statusOk && availabilityOk && merchandisingOk;
}
