"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/guards";
import { ensureUserByEmail } from "@/lib/db/repositories/user-repository";
import {
  updateAdminDefaultBankAccount,
  updateAdminDeliveryDefaults,
  updateAdminLayoutPreview,
} from "@/lib/db/repositories/settings-repository";
import { saveWorkspaceNotificationPreference } from "@/lib/db/repositories/notification-preferences-repository";

async function getAdminActor() {
  const session = await requireAdminSession("/admin/settings");
  const user = await ensureUserByEmail(session.email);

  return {
    userId: user?.userId ?? null,
    email: session.email,
  };
}

function revalidateSettingsPaths() {
  revalidatePath("/admin/settings");
}

export async function updateBankAccountAction(formData: FormData) {
  try {
    const actor = await getAdminActor();

    await updateAdminDefaultBankAccount(
      {
        bankName: formData.get("bankName")?.toString() ?? "",
        accountName: formData.get("accountName")?.toString() ?? "",
        accountNumber: formData.get("accountNumber")?.toString() ?? "",
        instructions: formData.get("instructions")?.toString() ?? null,
      },
      actor
    );

    revalidateSettingsPaths();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to save bank details.",
    };
  }
}

export async function updateDeliveryDefaultsAction(formData: FormData) {
  try {
    const actor = await getAdminActor();

    await updateAdminDeliveryDefaults(
      {
        trackingEnabled: formData.get("trackingEnabled") === "true",
        staleTransferWindowMinutes:
          formData.get("staleTransferWindowMinutes")?.toString() ?? "",
      },
      actor
    );

    revalidateSettingsPaths();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to save delivery defaults.",
    };
  }
}

export async function updateLayoutPreviewAction(formData: FormData) {
  try {
    const actor = await getAdminActor();

    await updateAdminLayoutPreview(
      {
        mode: formData.get("mode")?.toString() ?? "simulated",
      },
      actor
    );

    revalidateSettingsPaths();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to save preview mode.",
    };
  }
}

export async function updateNotificationPreferenceAction(formData: FormData) {
  try {
    const actor = await getAdminActor();

    await saveWorkspaceNotificationPreference(
      actor.email,
      {
        workspaceEmailEnabled:
          formData.get("workspaceEmailEnabled")?.toString() === "true",
        workspaceInAppEnabled:
          formData.get("workspaceInAppEnabled")?.toString() === "true",
        workspacePushEnabled:
          formData.get("workspacePushEnabled")?.toString() === "true",
      },
      "admin"
    );

    revalidateSettingsPaths();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to save notification preferences.",
    };
  }
}
