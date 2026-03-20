"use server";

import { revalidatePath } from "next/cache";
import { 
  ensureLayoutDraft, 
  publishLayoutVersion, 
  updateLayoutSection 
} from "@/lib/db/repositories/layout-repository";

export async function createDraftAction() {
  try {
    await ensureLayoutDraft("home");
    revalidatePath("/admin/layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to create draft:", error);
    return { success: false, error: "Failed to create layout draft." };
  }
}

export async function updateSectionAction(formData: FormData) {
  const sectionId = formData.get("sectionId") as string;
  const eyebrow = formData.get("eyebrow") as string | null;
  const heading = formData.get("heading") as string | null;
  const isEnabled = formData.get("isEnabled") === "true";

  if (!sectionId) return { success: false, error: "Missing section ID" };

  try {
    await updateLayoutSection(sectionId, {
      eyebrow: eyebrow || null,
      heading: heading || null,
      isEnabled,
    });
    revalidatePath("/admin/layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to update section:", error);
    return { success: false, error: "Failed to update layout section." };
  }
}

export async function publishDraftAction(versionId: string) {
  if (!versionId) return { success: false, error: "Missing version ID" };

  try {
    await publishLayoutVersion(versionId);
    revalidatePath("/admin/layout");
    revalidatePath("/"); // Revalidate marketing home
    return { success: true };
  } catch (error) {
    console.error("Failed to publish version:", error);
    return { success: false, error: "Failed to publish layout version." };
  }
}
