"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/guards";
import { ensureUserByEmail } from "@/lib/db/repositories/user-repository";
import {
  createAdminCatalogCategory,
  createAdminCatalogIngredient,
  deleteAdminCatalogCategory,
  deleteAdminCatalogIngredient,
  updateAdminCatalogCategory,
  updateAdminCatalogIngredient,
} from "@/lib/db/repositories/catalog-admin-repository";

async function getAdminActor() {
  const session = await requireAdminSession("/admin/catalog/taxonomy");
  const user = await ensureUserByEmail(session.email);

  return {
    userId: user?.userId ?? null,
    email: session.email,
  };
}

function revalidateCatalogTaxonomy() {
  revalidatePath("/");
  revalidatePath("/admin/catalog/products");
  revalidatePath("/admin/catalog/taxonomy");
}

export async function createCatalogCategoryAction(formData: FormData) {
  try {
    const actor = await getAdminActor();

    await createAdminCatalogCategory({
      categoryName: formData.get("categoryName")?.toString() ?? "",
      sortOrder: formData.get("sortOrder")?.toString() ?? "0",
      actorUserId: actor.userId,
      actorEmail: actor.email,
    });

    revalidateCatalogTaxonomy();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to create category.",
    };
  }
}

export async function updateCatalogCategoryAction(formData: FormData) {
  try {
    const actor = await getAdminActor();

    await updateAdminCatalogCategory({
      categoryId: formData.get("categoryId")?.toString() ?? "",
      categoryName: formData.get("categoryName")?.toString() ?? "",
      sortOrder: formData.get("sortOrder")?.toString() ?? "0",
      actorUserId: actor.userId,
      actorEmail: actor.email,
    });

    revalidateCatalogTaxonomy();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to save category.",
    };
  }
}

export async function deleteCatalogCategoryAction(categoryId: string) {
  try {
    const actor = await getAdminActor();
    await deleteAdminCatalogCategory(categoryId, actor);
    revalidateCatalogTaxonomy();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to delete category.",
    };
  }
}

export async function createCatalogIngredientAction(formData: FormData) {
  try {
    const actor = await getAdminActor();

    await createAdminCatalogIngredient({
      ingredientName: formData.get("ingredientName")?.toString() ?? "",
      detail: formData.get("detail")?.toString() ?? "",
      benefit: formData.get("benefit")?.toString() ?? null,
      imagePath: formData.get("imagePath")?.toString() ?? null,
      aliases: formData.get("aliases")?.toString() ?? null,
      sortOrder: formData.get("sortOrder")?.toString() ?? "0",
      actorUserId: actor.userId,
      actorEmail: actor.email,
    });

    revalidateCatalogTaxonomy();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to create ingredient.",
    };
  }
}

export async function updateCatalogIngredientAction(formData: FormData) {
  try {
    const actor = await getAdminActor();

    await updateAdminCatalogIngredient({
      ingredientId: formData.get("ingredientId")?.toString() ?? "",
      ingredientName: formData.get("ingredientName")?.toString() ?? "",
      detail: formData.get("detail")?.toString() ?? "",
      benefit: formData.get("benefit")?.toString() ?? null,
      imagePath: formData.get("imagePath")?.toString() ?? null,
      aliases: formData.get("aliases")?.toString() ?? null,
      sortOrder: formData.get("sortOrder")?.toString() ?? "0",
      actorUserId: actor.userId,
      actorEmail: actor.email,
    });

    revalidateCatalogTaxonomy();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to save ingredient.",
    };
  }
}

export async function deleteCatalogIngredientAction(ingredientId: string) {
  try {
    const actor = await getAdminActor();
    await deleteAdminCatalogIngredient(ingredientId, actor);
    revalidateCatalogTaxonomy();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to delete ingredient.",
    };
  }
}
