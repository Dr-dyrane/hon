"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/guards";
import { ensureUserByEmail } from "@/lib/db/repositories/user-repository";
import { 
  ensureLayoutDraft, 
  publishLayoutVersion, 
  updateLayoutSection 
} from "@/lib/db/repositories/layout-repository";

async function getAdminActor(returnTo: string) {
  const session = await requireAdminSession(returnTo);
  const user = await ensureUserByEmail(session.email);

  return {
    userId: user?.userId ?? null,
    email: session.email,
  };
}

export async function createDraftAction() {
  try {
    const actor = await getAdminActor("/admin/layout");
    await ensureLayoutDraft("home", {
      userId: actor.userId,
      email: actor.email,
      role: "admin",
    });
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
  const body = formData.get("body") as string | null;
  const isEnabled = formData.get("isEnabled") === "true";

  if (!sectionId) return { success: false, error: "Missing section ID" };

  try {
    const actor = await getAdminActor(`/admin/layout/sections/${sectionId}`);
    await updateLayoutSection(sectionId, {
      eyebrow: eyebrow || null,
      heading: heading || null,
      body: body || null,
      isEnabled,
    }, {
      userId: actor.userId,
      email: actor.email,
      role: "admin",
    });
    revalidatePath("/admin/layout");
    revalidatePath(`/admin/layout/sections/${sectionId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to update section:", error);
    return { success: false, error: "Failed to update layout section." };
  }
}

export async function publishDraftAction(versionId: string) {
  if (!versionId) return { success: false, error: "Missing version ID" };

  try {
    const actor = await getAdminActor("/admin/layout");
    await publishLayoutVersion(versionId, {
      userId: actor.userId,
      email: actor.email,
      role: "admin",
    });
    revalidatePath("/admin/layout");
    revalidatePath("/"); // Revalidate marketing home
    return { success: true };
  } catch (error) {
    console.error("Failed to publish version:", error);
    return { success: false, error: "Failed to publish layout version." };
  }
}

export async function restoreLayoutVersionAction(versionId: string) {
  if (!versionId) return { success: false, error: "Missing version ID" };

  try {
    const actor = await getAdminActor("/admin/layout");
    await publishLayoutVersion(versionId, {
      userId: actor.userId,
      email: actor.email,
      role: "admin",
    });
    revalidatePath("/admin/layout");
    revalidatePath("/"); // Revalidate marketing home
    return { success: true };
  } catch (error) {
    console.error("Failed to restore version:", error);
    return { success: false, error: "Failed to restore this version." };
  }
}
