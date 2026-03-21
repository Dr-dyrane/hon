"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/guards";
import { hasEmailDeliveryConfig } from "@/lib/config/server";
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUserInviteTarget,
  updateAdminUser,
} from "@/lib/db/repositories/admin-user-repository";
import { ensureUserByEmail } from "@/lib/db/repositories/user-repository";
import { sendWorkspaceInviteEmail } from "@/lib/email/users";

async function getAdminActor() {
  const session = await requireAdminSession("/admin/settings/team");
  const user = await ensureUserByEmail(session.email);

  return {
    actorUserId: user?.userId ?? null,
    actorEmail: session.email,
  };
}

function revalidateTeam() {
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/team");
  revalidatePath("/admin/users");
}

export async function createAdminUserAction(formData: FormData) {
  try {
    const actor = await getAdminActor();
    const createdUser = await createAdminUser({
      email: formData.get("email")?.toString() ?? "",
      fullName: formData.get("fullName")?.toString() ?? null,
      phone: formData.get("phone")?.toString() ?? null,
      status: formData.get("status")?.toString() ?? "invited",
      isAdmin: formData.get("isAdmin") === "true",
      ...actor,
    });

    let message = "Created.";

    if (createdUser.status === "invited") {
      if (!hasEmailDeliveryConfig) {
        message = "Created. Invite email is not configured yet.";
      } else {
        await sendWorkspaceInviteEmail({
          email: createdUser.email,
          fullName: createdUser.fullName,
          isAdmin: createdUser.isAdmin,
        });
        message = "Created and invited.";
      }
    }

    revalidateTeam();
    return { success: true, message };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to create teammate.",
    };
  }
}

export async function resendAdminUserInviteAction(userId: string) {
  try {
    const actor = await getAdminActor();

    if (!hasEmailDeliveryConfig) {
      return {
        success: false,
        error: "Email delivery is not configured.",
      };
    }

    const user = await getAdminUserInviteTarget(userId, actor.actorEmail);

    if (!user) {
      return {
        success: false,
        error: "Teammate not found.",
      };
    }

    await sendWorkspaceInviteEmail({
      email: user.email,
      fullName: user.fullName,
      isAdmin: user.isAdmin,
    });

    return { success: true, message: "Invite sent." };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to send invite.",
    };
  }
}

export async function updateAdminUserAction(formData: FormData) {
  try {
    const actor = await getAdminActor();
    await updateAdminUser({
      userId: formData.get("userId")?.toString() ?? "",
      fullName: formData.get("fullName")?.toString() ?? null,
      phone: formData.get("phone")?.toString() ?? null,
      status: formData.get("status")?.toString() ?? "active",
      isAdmin: formData.get("isAdmin") === "true",
      ...actor,
    });
    revalidateTeam();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to save teammate.",
    };
  }
}

export async function deleteAdminUserAction(userId: string) {
  try {
    const actor = await getAdminActor();
    await deleteAdminUser(userId, actor);
    revalidateTeam();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to delete teammate.",
    };
  }
}
