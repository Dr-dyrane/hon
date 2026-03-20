import { revalidatePath } from "next/cache";
import { Readable } from "node:stream";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { createPaymentProof, getPortalOrderDetail } from "@/lib/db/repositories/orders-repository";
import { getStorageBucket, uploadToS3 } from "@/lib/storage/s3";

export async function submitPaymentProofAction(formData: FormData) {
  const orderId = formData.get("orderId")?.toString();
  const paymentId = formData.get("paymentId")?.toString();
  const file = formData.get("proof") as File | null;

  if (!orderId || !paymentId || !file) {
    throw new Error("Missing file or order reference.");
  }

  const session = await requireAuthenticatedSession(`/account/orders/${orderId}`);

  const order = await getPortalOrderDetail(session.email, orderId);

  if (!order || order.paymentId !== paymentId) {
    throw new Error("Order not found or mismatched payment.");
  }

  const storageConfig = getStorageBucket();

  if (!storageConfig) {
    throw new Error("Storage bucket is not configured.");
  }

  const safeName = file.name.replace(/\s+/g, "_");
  const key = `${storageConfig.prefix}/payment-proofs/${orderId}/${Date.now()}-${safeName}`;
  const data = Buffer.from(await file.arrayBuffer());
  const stream = Readable.from(data);
  const publicUrl = await uploadToS3({
    key,
    body: stream,
    contentType: file.type || "application/octet-stream",
  });

  await createPaymentProof(paymentId, key, publicUrl, file.type || "application/octet-stream", session.email);

  revalidatePath(`/account/orders/${orderId}`);
}
