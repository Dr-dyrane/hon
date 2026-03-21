"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/guards";
import { reviewPayment } from "@/lib/db/repositories/orders-repository";
import { ensureUserByEmail } from "@/lib/db/repositories/user-repository";

export async function reviewPaymentQueueAction(formData: FormData) {
  const orderId = formData.get("orderId")?.toString();
  const paymentId = formData.get("paymentId")?.toString();
  const action = formData.get("action")?.toString();

  if (!orderId || !paymentId || !action) {
    throw new Error("Missing required payment review information.");
  }

  const session = await requireAdminSession("/admin/payments");
  const actor = await ensureUserByEmail(session.email);

  if (!["submitted", "under_review", "confirmed", "rejected"].includes(action)) {
    throw new Error("Unsupported action");
  }

  await reviewPayment(
    paymentId,
    action as "submitted" | "under_review" | "confirmed" | "rejected",
    session.email,
    actor?.userId ?? null,
    null
  );

  revalidatePath("/admin/payments");
  revalidatePath(`/admin/orders/${orderId}`);
}
