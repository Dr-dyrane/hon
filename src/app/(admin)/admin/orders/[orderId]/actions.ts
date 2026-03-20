import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/guards";
import { ensureUserByEmail } from "@/lib/db/repositories/user-repository";
import { reviewPayment } from "@/lib/db/repositories/orders-repository";

export async function reviewPaymentAction(formData: FormData) {
  const orderId = formData.get("orderId")?.toString();
  const paymentId = formData.get("paymentId")?.toString();
  const action = formData.get("action")?.toString();
  const note = formData.get("note")?.toString().trim() || null;

  if (!orderId || !paymentId || !action) {
    throw new Error("Missing required payment review information.");
  }

  const session = await requireAdminSession(`/admin/orders/${orderId}`);
  const actor = await ensureUserByEmail(session.email);

  if (!["submitted", "under_review", "confirmed", "rejected"].includes(action)) {
    throw new Error("Unsupported action");
  }

  await reviewPayment(
    paymentId,
    action as "submitted" | "under_review" | "confirmed" | "rejected",
    session.email,
    actor?.userId ?? null,
    note
  );

  revalidatePath(`/admin/orders/${orderId}`);
}
