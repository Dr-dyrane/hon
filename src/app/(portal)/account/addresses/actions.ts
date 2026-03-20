"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import {
  deletePortalAddress,
  savePortalAddress,
  setPortalAddressDefault,
} from "@/lib/db/repositories/account-repository";

function revalidateAddressPaths() {
  revalidatePath("/account");
  revalidatePath("/account/addresses");
}

export async function saveAddressAction(formData: FormData) {
  const session = await requireAuthenticatedSession("/account/addresses");

  try {
    await savePortalAddress(session.email, {
      addressId: formData.get("addressId")?.toString() ?? "",
      label: formData.get("label")?.toString() ?? "",
      recipientName: formData.get("recipientName")?.toString() ?? "",
      phone: formData.get("phone")?.toString() ?? "",
      line1: formData.get("line1")?.toString() ?? "",
      line2: formData.get("line2")?.toString() ?? "",
      landmark: formData.get("landmark")?.toString() ?? "",
      city: formData.get("city")?.toString() ?? "",
      state: formData.get("state")?.toString() ?? "",
      postalCode: formData.get("postalCode")?.toString() ?? "",
      deliveryNotes: formData.get("deliveryNotes")?.toString() ?? "",
      latitude: formData.get("latitude")?.toString() ?? "",
      longitude: formData.get("longitude")?.toString() ?? "",
      isDefault: formData.get("isDefault")?.toString() === "true",
    });

    revalidateAddressPaths();

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

export async function setDefaultAddressAction(addressId: string) {
  const session = await requireAuthenticatedSession("/account/addresses");

  try {
    await setPortalAddressDefault(session.email, addressId);
    revalidateAddressPaths();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

export async function deleteAddressAction(addressId: string) {
  const session = await requireAuthenticatedSession("/account/addresses");

  try {
    await deletePortalAddress(session.email, addressId);
    revalidateAddressPaths();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
