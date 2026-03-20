"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { updatePortalProfile } from "@/lib/db/repositories/account-repository";

export async function updateProfileAction(formData: FormData) {
  const session = await requireAuthenticatedSession("/account/profile");

  try {
    await updatePortalProfile(session.email, {
      fullName: formData.get("fullName")?.toString() ?? "",
      firstName: formData.get("firstName")?.toString() ?? "",
      lastName: formData.get("lastName")?.toString() ?? "",
      preferredPhone: formData.get("preferredPhone")?.toString() ?? "",
      marketingOptIn: formData.get("marketingOptIn")?.toString() === "true",
    });

    revalidatePath("/account");
    revalidatePath("/account/profile");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
