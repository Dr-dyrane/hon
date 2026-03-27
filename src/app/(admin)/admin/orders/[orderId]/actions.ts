"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/guards";
import { advanceOrderReturnCase } from "@/lib/db/repositories/order-returns-repository";
import { ensureUserByEmail } from "@/lib/db/repositories/user-repository";
import {
  assignRiderToOrder,
  markOrderReadyForDispatch,
  updateDeliveryAssignmentStatus,
} from "@/lib/db/repositories/delivery-repository";
import {
  acceptOrderRequestByAdmin,
  cancelOrderByAdmin,
  reviewPayment,
} from "@/lib/db/repositories/orders-repository";
import type { OrderAdminActionState } from "@/lib/orders/action-state";

function revalidateOrderManagementSurfaces(orderId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/payments");
  revalidatePath("/admin/delivery");
  revalidatePath("/account");
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath(`/account/tracking/${orderId}`);
  revalidatePath(`/checkout/orders/${orderId}`);
}

export async function acceptOrderRequestAction(
  _previousState: OrderAdminActionState,
  formData: FormData
): Promise<OrderAdminActionState> {
  const orderId = formData.get("orderId")?.toString();
  const note = formData.get("note")?.toString().trim() || null;

  if (!orderId) {
    return {
      status: "error",
      message: "Request is unavailable.",
    };
  }

  try {
    const session = await requireAdminSession(`/admin/orders/${orderId}`);
    const actor = await ensureUserByEmail(session.email);

    await acceptOrderRequestByAdmin(
      orderId,
      session.email,
      actor?.userId ?? null,
      note
    );

    revalidateOrderManagementSurfaces(orderId);

    return {
      status: "success",
      message: "Accepted.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to accept request.",
    };
  }
}

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

  revalidateOrderManagementSurfaces(orderId);
}

export async function cancelOrderAction(formData: FormData) {
  const orderId = formData.get("orderId")?.toString();
  const note = formData.get("note")?.toString().trim() || "Cancelled from console.";

  if (!orderId) {
    throw new Error("Missing order.");
  }

  const session = await requireAdminSession(`/admin/orders/${orderId}`);
  const actor = await ensureUserByEmail(session.email);

  await cancelOrderByAdmin(
    orderId,
    session.email,
    actor?.userId ?? null,
    note
  );

  revalidateOrderManagementSurfaces(orderId);
}

export async function advanceReturnCaseAction(formData: FormData) {
  const orderId = formData.get("orderId")?.toString();
  const returnCaseId = formData.get("returnCaseId")?.toString();
  const action = formData.get("action")?.toString();
  const note = formData.get("note")?.toString().trim() || null;
  const refundReference = formData.get("refundReference")?.toString().trim() || null;

  if (!orderId || !returnCaseId || !action) {
    throw new Error("Missing return details.");
  }

  if (!["approved", "rejected", "received", "refunded"].includes(action)) {
    throw new Error("Unsupported return action.");
  }

  const session = await requireAdminSession(`/admin/orders/${orderId}`);
  const actor = await ensureUserByEmail(session.email);

  await advanceOrderReturnCase({
    returnCaseId,
    action: action as "approved" | "rejected" | "received" | "refunded",
    actorEmail: session.email,
    actorUserId: actor?.userId ?? null,
    note,
    refundReference,
  });

  revalidateOrderManagementSurfaces(orderId);
}

export async function markReadyForDispatchAction(formData: FormData) {
  const orderId = formData.get("orderId")?.toString();
  const note = formData.get("note")?.toString().trim() || null;

  if (!orderId) {
    throw new Error("Order is required.");
  }

  const session = await requireAdminSession(`/admin/orders/${orderId}`);
  const actor = await ensureUserByEmail(session.email);

  await markOrderReadyForDispatch({
    orderId,
    actorUserId: actor?.userId ?? null,
    actorEmail: session.email,
    note,
  });

  revalidateOrderManagementSurfaces(orderId);
}

export async function assignOrderRiderAction(formData: FormData) {
  const orderId = formData.get("orderId")?.toString();
  const riderId = formData.get("riderId")?.toString();
  const note = formData.get("note")?.toString().trim() || null;

  if (!orderId || !riderId) {
    throw new Error("Order and rider are required.");
  }

  const session = await requireAdminSession(`/admin/orders/${orderId}`);
  const actor = await ensureUserByEmail(session.email);

  await assignRiderToOrder({
    orderId,
    riderId,
    actorUserId: actor?.userId ?? null,
    actorEmail: session.email,
    note,
  });

  revalidateOrderManagementSurfaces(orderId);
}

export async function updateOrderAssignmentStatusAction(formData: FormData) {
  const orderId = formData.get("orderId")?.toString();
  const assignmentId = formData.get("assignmentId")?.toString();
  const nextStatus = formData.get("nextStatus")?.toString();
  const note = formData.get("note")?.toString().trim() || null;

  if (!orderId || !assignmentId || !nextStatus) {
    throw new Error("Assignment update is incomplete.");
  }

  const session = await requireAdminSession(`/admin/orders/${orderId}`);
  const actor = await ensureUserByEmail(session.email);

  await updateDeliveryAssignmentStatus({
    assignmentId,
    nextStatus,
    actorUserId: actor?.userId ?? null,
    actorEmail: session.email,
    note,
  });

  revalidateOrderManagementSurfaces(orderId);
}
