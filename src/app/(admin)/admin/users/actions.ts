"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/guards";
import { ensureUserByEmail } from "@/lib/db/repositories/user-repository";
import {
  createAdminUser,
  deleteAdminUser,
  updateAdminUser,
} from "@/lib/db/repositories/admin-user-repository";

async function getAdminActor() {
  const session = await requireAdminSession("/admin/users");
  const user = await ensureUserByEmail(session.email);

  return {
    actorUserId: user?.userId ?? null,
    actorEmail: session.email,
  };
}

function revalidateUsers() {
  revalidatePath("/admin/users");
}

export async function createAdminUserAction(formData: FormData) {
  try {
    const actor = await getAdminActor();
    await createAdminUser({
      email: formData.get("email")?.toString() ?? "",
      fullName: formData.get("fullName")?.toString() ?? null,
      phone: formData.get("phone")?.toString() ?? null,
      status: formData.get("status")?.toString() ?? "invited",
      isAdmin: formData.get("isAdmin") === "true",
      ...actor,
    });
    revalidateUsers();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to create user.",
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
    revalidateUsers();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to save user.",
    };
  }
}

export async function deleteAdminUserAction(userId: string) {
  try {
    const actor = await getAdminActor();
    await deleteAdminUser(userId, actor);
    revalidateUsers();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to delete user.",
    };
  }
}
