import type { ReactNode } from "react";
import Link from "next/link";
import { WorkspaceContextPanel } from "@/components/shell/WorkspaceContextPanel";
import { QuietValueStrip } from "@/components/ui/QuietValueStrip";
import { formatNgn } from "@/lib/commerce";
import { requireAdminSession } from "@/lib/auth/guards";
import {
  getAdminOrderDetail,
  listOrderStatusEvents,
  listPaymentProofs,
  listPaymentReviewEvents,
} from "@/lib/db/repositories/orders-repository";
import { reviewPaymentAction } from "./actions";

const statusLabelMap: Record<string, string> = {
  awaiting_transfer: "Awaiting transfer",
  payment_submitted: "Payment submitted",
  payment_under_review: "Under review",
  payment_confirmed: "Confirmed",
  preparing: "Preparing",
  ready_for_dispatch: "Ready for dispatch",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  expired: "Expired",
};

function formatTimestamp(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getDeliveryLine(snapshot: Record<string, unknown>) {
  const preferredKeys = ["formatted", "line1", "label"];

  for (const key of preferredKeys) {
    const value = snapshot[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return "Pending";
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { orderId: string };
}) {
  const session = await requireAdminSession(`/admin/orders/${params.orderId}`);
  const order = await getAdminOrderDetail(params.orderId, session.email);

  if (!order) {
    return (
      <div className="glass-morphism rounded-[32px] bg-system-background/80 p-6 text-sm text-secondary-label shadow-soft">
        Order not found.
        <div className="mt-4">
          <Link
            href="/admin/orders"
            className="text-xs font-semibold uppercase tracking-headline text-secondary-label underline-offset-4 hover:text-label"
          >
            Back to orders
          </Link>
        </div>
      </div>
    );
  }

  const adminActor = {
    email: session.email,
    role: "admin" as const,
  };
  const [events, reviews, proofs] = await Promise.all([
    listOrderStatusEvents(params.orderId, adminActor),
    order.paymentId ? listPaymentReviewEvents(order.paymentId, session.email) : [],
    order.paymentId ? listPaymentProofs(order.paymentId, adminActor) : [],
  ]);

  return (
    <div className="space-y-6">
      <WorkspaceContextPanel
        title={`#${order.orderNumber}`}
        detail={order.customerName}
        tags={[
          { label: statusLabelMap[order.paymentStatus] ?? order.paymentStatus },
          { label: statusLabelMap[order.status] ?? order.status },
        ]}
        meta={[
          {
            label: "Customer",
            value: order.customerEmail
              ? `${order.customerName} / ${order.customerEmail}`
              : order.customerName,
          },
          {
            label: "Contact",
            value: order.customerPhone,
          },
          {
            label: "Total",
            value: `${formatNgn(order.totalNgn)} / ${formatTimestamp(order.placedAt)}`,
          },
          {
            label: "Transfer",
            value: order.transferReference,
          },
          {
            label: "Deadline",
            value: formatTimestamp(order.transferDeadlineAt),
          },
          {
            label: "Drop",
            value: getDeliveryLine(order.deliveryAddressSnapshot),
          },
        ]}
      />

      <QuietValueStrip
        items={[
          {
            label: "Due",
            value: formatNgn(order.payment?.expectedAmountNgn ?? order.totalNgn),
            detail: order.payment
              ? statusLabelMap[order.payment.status] ?? order.payment.status
              : "Pending",
          },
          {
            label: "Proofs",
            value: `${proofs.length}`,
            detail: proofs.length > 0 ? "Received" : "Waiting",
          },
          {
            label: "Reviews",
            value: `${reviews.length}`,
            detail: reviews.length > 0 ? "Logged" : "Quiet",
          },
          {
            label: "Timeline",
            value: `${events.length}`,
            detail: events.length > 0 ? "Events" : "Waiting",
          },
        ]}
        columns={4}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)]">
        <div className="space-y-4">
          <DetailSurface
            title="Payment"
            action={
              <span className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                #{order.paymentId ?? "pending"}
              </span>
            }
          >
            <div className="space-y-3">
              <div className="text-[28px] font-semibold tracking-tight text-label">
                {formatNgn(order.payment?.expectedAmountNgn ?? order.totalNgn)}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <SurfaceMeta label="Bank" value={order.payment?.bankName ?? "Pending"} />
                <SurfaceMeta label="Name" value={order.payment?.accountName ?? "Pending"} />
              </div>
              <div className="rounded-[24px] bg-system-fill/42 px-4 py-4">
                <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                  Number
                </div>
                <div className="mt-1 text-lg font-semibold tracking-tight text-label">
                  {order.payment?.accountNumber ?? "Pending"}
                </div>
              </div>
            </div>
          </DetailSurface>

          <DetailSurface title="Actions">
            {order.paymentId ? (
              <div className="grid gap-3 sm:grid-cols-3">
                {["confirmed", "under_review", "rejected"].map((action) => (
                  <form key={action} action={reviewPaymentAction} className="flex">
                    <input type="hidden" name="orderId" value={order.orderId} />
                    <input type="hidden" name="paymentId" value={order.paymentId ?? ""} />
                    <button
                      type="submit"
                      name="action"
                      value={action}
                      className="button-secondary min-h-[44px] w-full text-xs font-semibold uppercase tracking-headline"
                    >
                      {action === "confirmed"
                        ? "Confirm"
                        : action === "under_review"
                          ? "Review"
                          : "Reject"}
                    </button>
                  </form>
                ))}
              </div>
            ) : (
              <div className="rounded-[24px] bg-system-fill/42 px-4 py-4 text-sm text-secondary-label">
                Waiting for payment.
              </div>
            )}
          </DetailSurface>

          <DetailSurface title="Timeline">
            <div className="grid gap-2 text-sm text-secondary-label">
              {events.length === 0 ? (
                <div className="rounded-[22px] bg-system-fill/36 px-4 py-3">Waiting.</div>
              ) : (
                events.map((event) => (
                  <div
                    key={event.eventId}
                    className="flex items-center justify-between gap-4 rounded-[22px] bg-system-fill/36 px-4 py-3"
                  >
                    <span className="text-label">
                      {statusLabelMap[event.toStatus] ?? event.toStatus}
                    </span>
                    <span>{formatTimestamp(event.createdAt)}</span>
                  </div>
                ))
              )}
            </div>
          </DetailSurface>
        </div>

        <div className="space-y-4">
          <DetailSurface title="Reviews">
            <div className="grid gap-2 text-sm text-secondary-label">
              {reviews.length === 0 ? (
                <div className="rounded-[22px] bg-system-fill/36 px-4 py-3">Quiet.</div>
              ) : (
                reviews.map((review) => (
                  <div
                    key={review.eventId}
                    className="rounded-[22px] bg-system-fill/36 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-label">
                        {review.action.replace(/_/g, " ")}
                      </span>
                      <span>{formatTimestamp(review.createdAt)}</span>
                    </div>
                    {review.note ? (
                      <div className="mt-1 text-xs text-secondary-label">{review.note}</div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </DetailSurface>

          <DetailSurface title="Proofs">
            <div className="grid gap-2 text-sm text-secondary-label">
              {proofs.length === 0 ? (
                <div className="rounded-[22px] bg-system-fill/36 px-4 py-3">No proof.</div>
              ) : (
                proofs.map((proof) => (
                  <Link
                    key={proof.proofId}
                    href={proof.publicUrl ?? "#"}
                    className="flex items-center justify-between gap-4 rounded-[22px] bg-system-fill/36 px-4 py-3 text-xs font-semibold uppercase tracking-headline text-secondary-label transition-colors duration-300 hover:text-label"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>{proof.mimeType}</span>
                    <span>{formatTimestamp(proof.createdAt)}</span>
                  </Link>
                ))
              )}
            </div>
          </DetailSurface>
        </div>
      </div>
    </div>
  );
}

function DetailSurface({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="glass-morphism rounded-[32px] bg-system-background/78 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] md:p-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
          {title}
        </p>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SurfaceMeta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[22px] bg-system-fill/42 px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-label">{value}</div>
    </div>
  );
}
