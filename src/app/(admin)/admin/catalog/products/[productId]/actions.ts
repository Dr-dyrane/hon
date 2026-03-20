"use server";

import { revalidatePath } from "next/cache";
import { 
  updateAdminCatalogProduct, 
  updateAdminCatalogInventory,
  setAdminCatalogProductAvailability,
  setAdminCatalogProductMerchandising
} from "@/lib/db/repositories/catalog-admin-repository";

export async function updateProductAction(formData: FormData) {
  const productId = formData.get("productId") as string;
  const categoryId = formData.get("categoryId") as string || null;
  const productName = formData.get("productName") as string;
  const marketingName = formData.get("marketingName") as string || null;
  const tagline = formData.get("tagline") as string || null;
  const shortDescription = formData.get("shortDescription") as string;
  const longDescription = formData.get("longDescription") as string || null;
  const status = formData.get("status") as string;
  const merchandisingState = formData.get("merchandisingState") as string;
  const isAvailable = formData.get("isAvailable") === "true";
  const sortOrder = parseInt(formData.get("sortOrder") as string, 10);
  
  const variantName = formData.get("variantName") as string;
  const sizeLabel = formData.get("sizeLabel") as string || null;
  const unitLabel = formData.get("unitLabel") as string || null;
  const priceNgn = formData.get("priceNgn") as string;
  const compareAtPriceNgn = formData.get("compareAtPriceNgn") as string || null;
  const variantStatus = formData.get("variantStatus") as string || undefined;
  
  const inventoryOnHand = formData.get("inventoryOnHand") as string || undefined;
  const reorderThreshold = formData.get("reorderThreshold") as string || undefined;

  try {
    await updateAdminCatalogProduct({
      productId,
      categoryId,
      productName,
      marketingName,
      tagline,
      shortDescription,
      longDescription,
      status,
      merchandisingState,
      isAvailable,
      sortOrder,
      variantName,
      sizeLabel,
      unitLabel,
      priceNgn,
      compareAtPriceNgn,
      variantStatus,
      inventoryOnHand,
      reorderThreshold,
    });

    revalidatePath("/admin/catalog/products");
    revalidatePath(`/admin/catalog/products/${productId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function toggleProductAvailabilityAction(productId: string, isAvailable: boolean) {
  try {
    await setAdminCatalogProductAvailability(productId, isAvailable);
    revalidatePath("/admin/catalog/products");
    revalidatePath(`/admin/catalog/products/${productId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function updateInventoryAction(variantId: string, onHand: number, reorderThreshold?: number | null) {
  try {
    await updateAdminCatalogInventory(variantId, { onHand, reorderThreshold });
    revalidatePath("/admin/catalog/products");
    // Note: revalidating by productId would be better if we had it here, but revalidatePath works on the route
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
