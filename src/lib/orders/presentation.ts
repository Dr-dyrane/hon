import { resolveOrderLedgerState } from "@/lib/orders/ledger-policy";

export type OrderStageTone = "default" | "success" | "muted";

export type OrderStagePresentation = {
  key:
    | "requested"
    | "awaiting_transfer"
    | "money_sent"
    | "preparing"
    | "ready_for_dispatch"
    | "out_for_delivery"
    | "delivered"
    | "cancelled"
    | "expired";
  label: string;
  detail: string;
  nextAction: string;
  tone: OrderStageTone;
};

const STATUS_LABELS: Record<string, string> = {
  checkout_draft: "Request received",
  awaiting_transfer: "Awaiting transfer",
  payment_submitted: "Money sent",
  payment_under_review: "Money sent",
  payment_confirmed: "Preparing order",
  preparing: "Preparing order",
  ready_for_dispatch: "Ready for dispatch",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  expired: "Transfer window closed",
  submitted: "Money sent",
  under_review: "Money sent",
  confirmed: "Payment confirmed",
  rejected: "Awaiting transfer",
  pending: "Pending",
};

const PAYMENT_REVIEW_ACTION_LABELS: Record<string, string> = {
  submitted: "Money sent",
  marked_under_review: "Checked payment",
  under_review: "Checked payment",
  confirmed: "Payment confirmed",
  rejected: "Payment rejected",
  expired: "Transfer window closed",
};

const PAYMENT_REVIEW_BUTTON_LABELS: Record<string, string> = {
  submitted: "Mark money sent",
  under_review: "Check payment",
  confirmed: "Confirm payment",
  rejected: "Reject payment",
};

export function getOrderStagePresentation(input: {
  status?: string | null;
  paymentStatus?: string | null;
  fulfillmentStatus?: string | null;
}): OrderStagePresentation {
  const status = input.status ?? null;
  const paymentStatus = input.paymentStatus ?? null;
  const fulfillmentStatus = input.fulfillmentStatus ?? null;

  if (status === "checkout_draft") {
    return {
      key: "requested",
      label: "Request received",
      detail: "Waiting for approval",
      nextAction: "Accept request",
      tone: "default",
    };
  }

  if (status === "cancelled" || fulfillmentStatus === "cancelled") {
    return {
      key: "cancelled",
      label: "Cancelled",
      detail: "Order closed",
      nextAction: "Closed",
      tone: "muted",
    };
  }

  if (status === "expired" || paymentStatus === "expired") {
    return {
      key: "expired",
      label: "Transfer window closed",
      detail: "Start a fresh order",
      nextAction: "Closed",
      tone: "muted",
    };
  }

  if (fulfillmentStatus === "delivered" || status === "delivered") {
    return {
      key: "delivered",
      label: "Delivered",
      detail: "Completed",
      nextAction: "Completed",
      tone: "success",
    };
  }

  if (
    fulfillmentStatus === "out_for_delivery" ||
    status === "out_for_delivery"
  ) {
    return {
      key: "out_for_delivery",
      label: "Out for delivery",
      detail: "On the way",
      nextAction: "Mark delivered",
      tone: "success",
    };
  }

  if (fulfillmentStatus === "ready_for_dispatch") {
    return {
      key: "ready_for_dispatch",
      label: "Ready for dispatch",
      detail: "Queued for rider assignment",
      nextAction: "Dispatch to rider",
      tone: "default",
    };
  }

  if (
    fulfillmentStatus === "preparing" ||
    status === "preparing" ||
    status === "payment_confirmed" ||
    paymentStatus === "confirmed"
  ) {
    return {
      key: "preparing",
      label: "Preparing order",
      detail: "Payment confirmed",
      nextAction: "Start preparing",
      tone: "default",
    };
  }

  if (paymentStatus === "under_review" || status === "payment_under_review") {
    return {
      key: "money_sent",
      label: "Money sent",
      detail: "Checking transfer",
      nextAction: "Confirm payment",
      tone: "default",
    };
  }

  if (paymentStatus === "submitted" || status === "payment_submitted") {
    return {
      key: "money_sent",
      label: "Money sent",
      detail: "Waiting for confirmation",
      nextAction: "Confirm payment",
      tone: "default",
    };
  }

  if (paymentStatus === "rejected") {
    return {
      key: "awaiting_transfer",
      label: "Awaiting transfer",
      detail: "Send payment again",
      nextAction: "Wait for transfer",
      tone: "default",
    };
  }

  return {
    key: "awaiting_transfer",
    label: "Awaiting transfer",
    detail: "Send payment",
    nextAction: "Wait for transfer",
    tone: "default",
  };
}

export function getPaymentStatusPresentation(status?: string | null) {
  switch (status) {
    case "submitted":
      return {
        label: "Money sent",
        detail: "Waiting for confirmation",
        tone: "default" as const,
      };
    case "under_review":
      return {
        label: "Money sent",
        detail: "Checking transfer",
        tone: "default" as const,
      };
    case "confirmed":
      return {
        label: "Payment confirmed",
        detail: "Preparing can start",
        tone: "default" as const,
      };
    case "rejected":
      return {
        label: "Awaiting transfer",
        detail: "Send payment again",
        tone: "default" as const,
      };
    case "expired":
      return {
        label: "Transfer window closed",
        detail: "Start a fresh order",
        tone: "muted" as const,
      };
    default:
      return {
        label: "Awaiting transfer",
        detail: "Waiting for customer",
        tone: "default" as const,
      };
  }
}

export function formatFlowStatusLabel(value: string) {
  return STATUS_LABELS[value] ?? value.replace(/_/g, " ");
}

export function formatPaymentReviewActionLabel(value: string) {
  return PAYMENT_REVIEW_ACTION_LABELS[value] ?? value.replace(/_/g, " ");
}

export function getPaymentReviewActionLabel(value: string) {
  return PAYMENT_REVIEW_BUTTON_LABELS[value] ?? value.replace(/_/g, " ");
}

export type PortalOrderEntryAction = {
  label: "Pay now" | "Continue" | "Track" | "Open";
  hrefKind: "detail" | "track";
  emphasis: "primary" | "secondary";
};

export type PortalOrderLifecycleBucket =
  | "action_required"
  | "in_progress"
  | "history";

export type AdminOrderEntryAction = {
  label: "Review request" | "Review payment" | "Await transfer" | "Open";
  emphasis: "primary" | "secondary";
};

export type AdminOrderLifecycleBucket =
  | "needs_attention"
  | "in_progress"
  | "history";

export function getPortalOrderEntryAction(input: {
  status?: string | null;
  paymentStatus?: string | null;
  fulfillmentStatus?: string | null;
}): PortalOrderEntryAction {
  const ledger = resolveOrderLedgerState(input);

  if (ledger.key === "awaiting_transfer") {
    return {
      label: "Pay now",
      hrefKind: "detail",
      emphasis: "primary",
    };
  }

  if (ledger.key === "payment_submitted" || ledger.key === "payment_under_review") {
    return {
      label: "Continue",
      hrefKind: "detail",
      emphasis: "secondary",
    };
  }

  if (["ready_for_dispatch", "out_for_delivery"].includes(input.fulfillmentStatus ?? "")) {
    return {
      label: "Track",
      hrefKind: "track",
      emphasis: "secondary",
    };
  }

  return {
    label: "Open",
    hrefKind: "detail",
    emphasis: "secondary",
  };
}

export function getPortalOrderLifecycleBucket(input: {
  status?: string | null;
  paymentStatus?: string | null;
  fulfillmentStatus?: string | null;
}): PortalOrderLifecycleBucket {
  const ledger = resolveOrderLedgerState(input);

  if (ledger.key === "awaiting_transfer") {
    return "action_required";
  }

  if (ledger.key === "delivered" || ledger.key === "closed") {
    return "history";
  }

  return "in_progress";
}

export function getPortalOrderBucketFootnote(bucket: PortalOrderLifecycleBucket) {
  if (bucket === "action_required") return "Needs action";
  if (bucket === "in_progress") return "In progress";
  return "Completed";
}

export function getAdminOrderEntryAction(input: {
  status?: string | null;
  paymentStatus?: string | null;
  fulfillmentStatus?: string | null;
}): AdminOrderEntryAction {
  const ledger = resolveOrderLedgerState(input);

  if (ledger.key === "request_received") {
    return { label: "Review request", emphasis: "primary" };
  }

  if (ledger.key === "payment_submitted" || ledger.key === "payment_under_review") {
    return { label: "Review payment", emphasis: "primary" };
  }

  if (ledger.key === "awaiting_transfer") {
    return { label: "Await transfer", emphasis: "secondary" };
  }

  return { label: "Open", emphasis: "secondary" };
}

export function getAdminOrderLifecycleBucket(input: {
  status?: string | null;
  paymentStatus?: string | null;
  fulfillmentStatus?: string | null;
}): AdminOrderLifecycleBucket {
  const ledger = resolveOrderLedgerState(input);

  if (
    [
      "request_received",
      "awaiting_transfer",
      "payment_submitted",
      "payment_under_review",
    ].includes(ledger.key)
  ) {
    return "needs_attention";
  }

  if (ledger.key === "delivered" || ledger.key === "closed") {
    return "history";
  }

  return "in_progress";
}

export function getAdminOrderBucketFootnote(bucket: AdminOrderLifecycleBucket) {
  if (bucket === "needs_attention") return "Needs attention";
  if (bucket === "in_progress") return "In progress";
  return "History";
}
