"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/guards";
import { updateAdminCatalogInventory } from "@/lib/db/repositories/catalog-admin-repository";
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

function buildOrderAdminSuccess(message: string): OrderAdminActionState {
  return {
    status: "success",
    message,
  };
}

function buildOrderAdminError(error: unknown, fallback: string): OrderAdminActionState {
  return {
    status: "error",
    message: error instanceof Error ? error.message : fallback,
  };
}

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

function revalidateCatalogInventorySurfaces(productId?: string | null) {
  revalidatePath("/admin/catalog/products");

  if (productId) {
    revalidatePath(`/admin/catalog/products/${productId}`);
  }
}

async function performAcceptOrderRequestAction(
  formData: FormData
): Promise<OrderAdminActionState> {
  const orderId = formData.get("orderId")?.toString();
  const note = formData.get("note")?.toString().trim() || null;

  if (!orderId) {
    return buildOrderAdminError(null, "Request is unavailable.");
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

    return buildOrderAdminSuccess("Request accepted. Customer can complete payment now.");
  } catch (error) {
    return buildOrderAdminError(error, "Unable to accept request.");
  }
}

export async function submitAcceptOrderRequestAction(
  formData: FormData
): Promise<OrderAdminActionState> {
  return performAcceptOrderRequestAction(formData);
}

export async function acceptOrderRequestAction(
  _previousState: OrderAdminActionState,
  formData: FormData
): Promise<OrderAdminActionState> {
  return performAcceptOrderRequestAction(formData);
}

export async function updateOrderInventoryAction(input: {
  orderId: string;
  productId?: string | null;
  variantId: string;
  onHand: number;
  reorderThreshold?: number | null;
}) {
  if (!input.orderId || !input.variantId) {
    return {
      success: false,
      error: "Inventory update is incomplete.",
    };
  }

  try {
    const session = await requireAdminSession(`/admin/orders/${input.orderId}`);
    const actor = await ensureUserByEmail(session.email);

    await updateAdminCatalogInventory(input.variantId, {
      onHand: input.onHand,
      reorderThreshold: input.reorderThreshold,
      actorUserId: actor?.userId ?? null,
      actorEmail: session.email,
    });

    revalidateOrderManagementSurfaces(input.orderId);
    revalidateCatalogInventorySurfaces(input.productId);

    return {
      success: true,
      message: "Stock updated.",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to update stock.",
    };
  }
}

export async function reviewPaymentAction(formData: FormData) {
  const orderId = formData.get("orderId")?.toString();
  const paymentId = formData.get("paymentId")?.toString();
  const action = formData.get("action")?.toString();
  const note = formData.get("note")?.toString().trim() || null;

  if (!orderId || !paymentId || !action) {
    return buildOrderAdminError(null, "Missing required payment review information.");
  }

  try {
    const session = await requireAdminSession(`/admin/orders/${orderId}`);
    const actor = await ensureUserByEmail(session.email);

    if (!["submitted", "under_review", "confirmed", "rejected"].includes(action)) {
      return buildOrderAdminError(null, "Unsupported action.");
    }

    await reviewPayment(
      paymentId,
      action as "submitted" | "under_review" | "confirmed" | "rejected",
      session.email,
      actor?.userId ?? null,
      note
    );

    revalidateOrderManagementSurfaces(orderId);

    const message =
      action === "confirmed"
        ? "Payment confirmed. Order can move into preparation."
        : action === "rejected"
          ? "Payment rejected. Customer needs a new transfer step."
          : action === "under_review"
            ? "Payment moved into review."
            : "Payment marked as sent.";

    return buildOrderAdminSuccess(message);
  } catch (error) {
    return buildOrderAdminError(error, "Unable to update payment.");
  }
}

export async function cancelOrderAction(
  formData: FormData
): Promise<OrderAdminActionState> {
  const orderId = formData.get("orderId")?.toString();
  const note = formData.get("note")?.toString().trim() || "Cancelled from console.";

  if (!orderId) {
    return buildOrderAdminError(null, "Missing order.");
  }

  try {
    const session = await requireAdminSession(`/admin/orders/${orderId}`);
    const actor = await ensureUserByEmail(session.email);

    await cancelOrderByAdmin(
      orderId,
      session.email,
      actor?.userId ?? null,
      note
    );

    revalidateOrderManagementSurfaces(orderId);
    return buildOrderAdminSuccess("Order cancelled.");
  } catch (error) {
    return buildOrderAdminError(error, "Unable to cancel order.");
  }
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

export async function markReadyForDispatchAction(
  formData: FormData
): Promise<OrderAdminActionState> {
  const orderId = formData.get("orderId")?.toString();
  const note = formData.get("note")?.toString().trim() || null;

  if (!orderId) {
    return buildOrderAdminError(null, "Order is required.");
  }

  try {
    const session = await requireAdminSession(`/admin/orders/${orderId}`);
    const actor = await ensureUserByEmail(session.email);

    await markOrderReadyForDispatch({
      orderId,
      actorUserId: actor?.userId ?? null,
      actorEmail: session.email,
      note,
    });

    revalidateOrderManagementSurfaces(orderId);
    return buildOrderAdminSuccess("Order moved to the dispatch queue.");
  } catch (error) {
    return buildOrderAdminError(error, "Unable to move order to dispatch.");
  }
}

export async function assignOrderRiderAction(
  formData: FormData
): Promise<OrderAdminActionState> {
  const orderId = formData.get("orderId")?.toString();
  const riderId = formData.get("riderId")?.toString();
  const note = formData.get("note")?.toString().trim() || null;

  if (!orderId || !riderId) {
    return buildOrderAdminError(null, "Order and rider are required.");
  }

  try {
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
    return buildOrderAdminSuccess("Rider assigned.");
  } catch (error) {
    return buildOrderAdminError(error, "Unable to assign rider.");
  }
}

export async function updateOrderAssignmentStatusAction(
  formData: FormData
): Promise<OrderAdminActionState> {
  const orderId = formData.get("orderId")?.toString();
  const assignmentId = formData.get("assignmentId")?.toString();
  const nextStatus = formData.get("nextStatus")?.toString();
  const note = formData.get("note")?.toString().trim() || null;

  if (!orderId || !assignmentId || !nextStatus) {
    return buildOrderAdminError(null, "Assignment update is incomplete.");
  }

  try {
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

    const message =
      nextStatus === "picked_up"
        ? "Pickup confirmed."
        : nextStatus === "out_for_delivery"
          ? "Delivery is now live."
          : nextStatus === "delivered"
            ? "Delivery closed as delivered."
            : nextStatus === "failed"
              ? "Delivery marked as failed."
              : nextStatus === "returned"
                ? "Order returned to the dispatch queue."
                : nextStatus === "unassigned"
                  ? "Rider removed."
                  : nextStatus === "assigned"
                    ? "Order moved back to assigned."
                    : "Assignment updated.";

    return buildOrderAdminSuccess(message);
  } catch (error) {
    return buildOrderAdminError(error, "Unable to update assignment.");
  }
}
