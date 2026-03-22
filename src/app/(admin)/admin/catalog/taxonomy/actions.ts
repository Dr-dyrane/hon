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

export type CatalogTaxonomyType = "category" | "ingredient";
type TaxonomyActionResult =
  | { success: true; redirectTo?: string }
  | { success: false; error: string };
type TaxonomyMutationResult = { success: true } | { success: false; error: string };

function normalizeTaxonomyType(value: string | null | undefined) {
  if (value === "category" || value === "ingredient") {
    return value;
  }

  return null;
}

async function getAdminActor(returnTo: string) {
  const session = await requireAdminSession(returnTo);
  const user = await ensureUserByEmail(session.email);

  return {
    userId: user?.userId ?? null,
    email: session.email,
  };
}

function revalidateCatalogTaxonomyPaths(
  taxonomyType?: CatalogTaxonomyType,
  taxonomyId?: string
) {
  revalidatePath("/");
  revalidatePath("/admin/catalog/products");
  revalidatePath("/admin/catalog/taxonomy");
  revalidatePath("/admin/catalog/taxonomy/new");

  if (taxonomyType && taxonomyId) {
    revalidatePath(`/admin/catalog/taxonomy/${taxonomyType}/${taxonomyId}`);
  }
}

function cloneFormData(formData: FormData) {
  const payload = new FormData();

  for (const [key, value] of formData.entries()) {
    payload.append(key, value);
  }

  return payload;
}

export async function createTaxonomyEntryAction(
  formData: FormData
): Promise<TaxonomyActionResult> {
  const taxonomyType = normalizeTaxonomyType(
    formData.get("taxonomyType")?.toString()
  );

  if (!taxonomyType) {
    return { success: false, error: "Choose a taxonomy type." };
  }

  try {
    const actor = await getAdminActor("/admin/catalog/taxonomy/new");

    if (taxonomyType === "category") {
      const categoryId = await createAdminCatalogCategory({
        categoryName: formData.get("categoryName")?.toString() ?? "",
        imagePath: formData.get("imagePath")?.toString() ?? null,
        sortOrder: formData.get("sortOrder")?.toString() ?? "0",
        actorUserId: actor.userId,
        actorEmail: actor.email,
      });

      if (!categoryId) {
        return { success: false, error: "Unable to create category." };
      }

      revalidateCatalogTaxonomyPaths("category", categoryId);
      return {
        success: true,
        redirectTo: `/admin/catalog/taxonomy/category/${categoryId}`,
      };
    }

    const ingredientId = await createAdminCatalogIngredient({
      ingredientName: formData.get("ingredientName")?.toString() ?? "",
      detail: formData.get("detail")?.toString() ?? "",
      benefit: formData.get("benefit")?.toString() ?? null,
      imagePath: formData.get("imagePath")?.toString() ?? null,
      aliases: formData.get("aliases")?.toString() ?? null,
      sortOrder: formData.get("sortOrder")?.toString() ?? "0",
      actorUserId: actor.userId,
      actorEmail: actor.email,
    });

    if (!ingredientId) {
      return { success: false, error: "Unable to create ingredient." };
    }

    revalidateCatalogTaxonomyPaths("ingredient", ingredientId);
    return {
      success: true,
      redirectTo: `/admin/catalog/taxonomy/ingredient/${ingredientId}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to create taxonomy.",
    };
  }
}

export async function updateTaxonomyEntryAction(
  formData: FormData
): Promise<TaxonomyMutationResult> {
  const taxonomyType = normalizeTaxonomyType(
    formData.get("taxonomyType")?.toString()
  );

  if (!taxonomyType) {
    return { success: false, error: "Choose a taxonomy type." };
  }

  const taxonomyId =
    taxonomyType === "category"
      ? formData.get("categoryId")?.toString() ?? ""
      : formData.get("ingredientId")?.toString() ?? "";

  if (!taxonomyId) {
    return { success: false, error: "Taxonomy reference is required." };
  }

  try {
    const actor = await getAdminActor(
      `/admin/catalog/taxonomy/${taxonomyType}/${taxonomyId}`
    );

    if (taxonomyType === "category") {
      await updateAdminCatalogCategory({
        categoryId: taxonomyId,
        categoryName: formData.get("categoryName")?.toString() ?? "",
        imagePath: formData.get("imagePath")?.toString() ?? null,
        sortOrder: formData.get("sortOrder")?.toString() ?? "0",
        actorUserId: actor.userId,
        actorEmail: actor.email,
      });
    } else {
      await updateAdminCatalogIngredient({
        ingredientId: taxonomyId,
        ingredientName: formData.get("ingredientName")?.toString() ?? "",
        detail: formData.get("detail")?.toString() ?? "",
        benefit: formData.get("benefit")?.toString() ?? null,
        imagePath: formData.get("imagePath")?.toString() ?? null,
        aliases: formData.get("aliases")?.toString() ?? null,
        sortOrder: formData.get("sortOrder")?.toString() ?? "0",
        actorUserId: actor.userId,
        actorEmail: actor.email,
      });
    }

    revalidateCatalogTaxonomyPaths(taxonomyType, taxonomyId);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to save taxonomy.",
    };
  }
}

export async function deleteTaxonomyEntryAction(
  taxonomyType: CatalogTaxonomyType,
  taxonomyId: string
): Promise<TaxonomyActionResult> {
  if (!taxonomyId) {
    return { success: false, error: "Taxonomy reference is required." };
  }

  try {
    const actor = await getAdminActor(
      `/admin/catalog/taxonomy/${taxonomyType}/${taxonomyId}`
    );

    if (taxonomyType === "category") {
      await deleteAdminCatalogCategory(taxonomyId, actor);
    } else {
      await deleteAdminCatalogIngredient(taxonomyId, actor);
    }

    revalidateCatalogTaxonomyPaths(taxonomyType, taxonomyId);
    return { success: true, redirectTo: "/admin/catalog/taxonomy" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to delete taxonomy.",
    };
  }
}

// Compatibility wrappers for existing taxonomy manager usage.
export async function createCatalogCategoryAction(formData: FormData) {
  const payload = cloneFormData(formData);
  payload.set("taxonomyType", "category");
  const result = await createTaxonomyEntryAction(payload);

  if (result.success) {
    return { success: true } satisfies TaxonomyMutationResult;
  }

  return { success: false, error: result.error } satisfies TaxonomyMutationResult;
}

export async function updateCatalogCategoryAction(formData: FormData) {
  const payload = cloneFormData(formData);
  payload.set("taxonomyType", "category");
  return updateTaxonomyEntryAction(payload);
}

export async function deleteCatalogCategoryAction(categoryId: string) {
  return deleteTaxonomyEntryAction("category", categoryId);
}

export async function createCatalogIngredientAction(formData: FormData) {
  const payload = cloneFormData(formData);
  payload.set("taxonomyType", "ingredient");
  const result = await createTaxonomyEntryAction(payload);

  if (result.success) {
    return { success: true } satisfies TaxonomyMutationResult;
  }

  return { success: false, error: result.error } satisfies TaxonomyMutationResult;
}

export async function updateCatalogIngredientAction(formData: FormData) {
  const payload = cloneFormData(formData);
  payload.set("taxonomyType", "ingredient");
  return updateTaxonomyEntryAction(payload);
}

export async function deleteCatalogIngredientAction(ingredientId: string) {
  return deleteTaxonomyEntryAction("ingredient", ingredientId);
}
