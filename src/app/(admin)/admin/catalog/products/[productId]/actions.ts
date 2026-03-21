"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/guards";
import { ensureUserByEmail } from "@/lib/db/repositories/user-repository";
import { 
  createAdminCatalogProduct,
  deleteAdminCatalogProductMedia,
  setAdminCatalogProductMediaPrimary,
  updateAdminCatalogProduct, 
  updateAdminCatalogProductMedia,
  updateAdminCatalogInventory,
  setAdminCatalogProductAvailability,
  setAdminCatalogProductMerchandising
} from "@/lib/db/repositories/catalog-admin-repository";
import { deleteFromS3 } from "@/lib/storage/s3";

function revalidateCatalogPaths(productId?: string) {
  revalidatePath("/");
  revalidatePath("/admin/catalog/products");

  if (productId) {
    revalidatePath(`/admin/catalog/products/${productId}`);
  }
}

async function getAdminActor(returnTo: string) {
  const session = await requireAdminSession(returnTo);
  const user = await ensureUserByEmail(session.email);

  return {
    userId: user?.userId ?? null,
    email: session.email,
  };
}

export async function createProductAction(formData: FormData) {
  const categoryId = (formData.get("categoryId") as string) || null;
  const productName = formData.get("productName") as string;
  const marketingName = (formData.get("marketingName") as string) || null;
  const variantName = (formData.get("variantName") as string) || null;
  const priceNgn = formData.get("priceNgn") as string;

  try {
    const actor = await getAdminActor("/admin/catalog/products/new");
    const productId = await createAdminCatalogProduct({
      categoryId,
      productName,
      marketingName,
      variantName,
      priceNgn,
      actorUserId: actor.userId,
      actorEmail: actor.email,
    });

    revalidateCatalogPaths(productId);

    return {
      success: true,
      redirectTo: `/admin/catalog/products/${productId}`,
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

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
    const actor = await getAdminActor(`/admin/catalog/products/${productId}`);
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
      actorUserId: actor.userId,
      actorEmail: actor.email,
    });

    revalidateCatalogPaths(productId);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function toggleProductAvailabilityAction(productId: string, isAvailable: boolean) {
  try {
    const actor = await getAdminActor(`/admin/catalog/products/${productId}`);
    await setAdminCatalogProductAvailability(productId, isAvailable, actor);
    revalidateCatalogPaths(productId);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function setProductMerchandisingAction(
  productId: string,
  merchandisingState: "standard" | "featured" | "hidden"
) {
  try {
    const actor = await getAdminActor(`/admin/catalog/products/${productId}`);
    await setAdminCatalogProductMerchandising(productId, merchandisingState, actor);
    revalidateCatalogPaths(productId);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function updateInventoryAction(variantId: string, onHand: number, reorderThreshold?: number | null) {
  try {
    const actor = await getAdminActor("/admin/catalog/products");
    await updateAdminCatalogInventory(variantId, {
      onHand,
      reorderThreshold,
      actorUserId: actor.userId,
      actorEmail: actor.email,
    });
    revalidateCatalogPaths();
    // Note: revalidating by productId would be better if we had it here, but revalidatePath works on the route
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

function isManagedBucketKey(storageKey: string) {
  return !/^https?:\/\//i.test(storageKey) && !storageKey.startsWith("/");
}

export async function updateProductMediaAction(formData: FormData) {
  const productId = formData.get("productId")?.toString();
  const mediaId = formData.get("mediaId")?.toString();

  if (!productId || !mediaId) {
    return { success: false, error: "Media reference is incomplete." };
  }

  try {
    const actor = await getAdminActor(`/admin/catalog/products/${productId}`);
    await updateAdminCatalogProductMedia({
      productId,
      mediaId,
      altText: formData.get("altText")?.toString() ?? null,
      sortOrder: formData.get("sortOrder")?.toString() ?? null,
      actorUserId: actor.userId,
      actorEmail: actor.email,
    });
    revalidateCatalogPaths(productId);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function setProductMediaPrimaryAction(formData: FormData) {
  const productId = formData.get("productId")?.toString();
  const mediaId = formData.get("mediaId")?.toString();

  if (!productId || !mediaId) {
    return { success: false, error: "Media reference is incomplete." };
  }

  try {
    const actor = await getAdminActor(`/admin/catalog/products/${productId}`);
    await setAdminCatalogProductMediaPrimary({
      productId,
      mediaId,
      actorUserId: actor.userId,
      actorEmail: actor.email,
    });
    revalidateCatalogPaths(productId);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteProductMediaAction(formData: FormData) {
  const productId = formData.get("productId")?.toString();
  const mediaId = formData.get("mediaId")?.toString();

  if (!productId || !mediaId) {
    return { success: false, error: "Media reference is incomplete." };
  }

  try {
    const actor = await getAdminActor(`/admin/catalog/products/${productId}`);
    const storageKey = await deleteAdminCatalogProductMedia({
      productId,
      mediaId,
      actorUserId: actor.userId,
      actorEmail: actor.email,
    });

    if (storageKey && isManagedBucketKey(storageKey)) {
      await deleteFromS3(storageKey);
    }

    revalidateCatalogPaths(productId);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
