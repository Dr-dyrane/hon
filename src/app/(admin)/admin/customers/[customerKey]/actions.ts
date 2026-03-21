"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/guards";
import { updateAdminCustomerProfile, saveAdminCustomerAddress, deleteAdminCustomerAddress } from "@/lib/db/repositories/admin-customer-repository";
import { ensureUserByEmail } from "@/lib/db/repositories/user-repository";

async function getAdminActor() {
  const session = await requireAdminSession("/admin/customers");
  const user = await ensureUserByEmail(session.email);

  return {
    actorUserId: user?.userId ?? null,
    actorEmail: session.email,
  };
}

function revalidateCustomer(customerKey: string) {
  const encodedKey = encodeURIComponent(customerKey);
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${encodedKey}`);
}

export async function updateAdminCustomerProfileAction(customerKey: string, formData: FormData) {
  try {
    const actor = await getAdminActor();

    await updateAdminCustomerProfile({
      userId: formData.get("userId")?.toString() ?? "",
      fullName: formData.get("fullName")?.toString() ?? "",
      preferredPhone: formData.get("preferredPhone")?.toString() ?? "",
      ...actor,
    });

    revalidateCustomer(customerKey);
    return { success: true, message: "Customer updated." };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to update customer.",
    };
  }
}

export async function saveAdminCustomerAddressAction(customerKey: string, formData: FormData) {
  try {
    const actor = await getAdminActor();

    await saveAdminCustomerAddress({
      userId: formData.get("userId")?.toString() ?? "",
      addressId: formData.get("addressId")?.toString() ?? null,
      label: formData.get("label")?.toString() ?? "",
      recipientName: formData.get("recipientName")?.toString() ?? "",
      phone: formData.get("phone")?.toString() ?? "",
      line1: formData.get("line1")?.toString() ?? "",
      line2: formData.get("line2")?.toString() ?? null,
      landmark: formData.get("landmark")?.toString() ?? null,
      city: formData.get("city")?.toString() ?? "",
      state: formData.get("state")?.toString() ?? "",
      postalCode: formData.get("postalCode")?.toString() ?? null,
      deliveryNotes: formData.get("deliveryNotes")?.toString() ?? null,
      latitude: formData.get("latitude")?.toString() ?? null,
      longitude: formData.get("longitude")?.toString() ?? null,
      isDefault: formData.get("isDefault") === "true",
      ...actor,
    });

    revalidateCustomer(customerKey);
    return { success: true, message: "Address saved." };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to save address.",
    };
  }
}

export async function deleteAdminCustomerAddressAction(customerKey: string, userId: string, addressId: string) {
  try {
    const actor = await getAdminActor();

    await deleteAdminCustomerAddress({
      userId,
      addressId,
      ...actor,
    });

    revalidateCustomer(customerKey);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to delete address.",
    };
  }
}
