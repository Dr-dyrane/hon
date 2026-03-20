import Link from "next/link";
import { WorkspaceContextPanel } from "@/components/shell/WorkspaceContextPanel";
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

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { orderId: string };
}) {
  await requireAdminSession(`/admin/orders/${params.orderId}`);
  const [order, events, reviews, proofs] = await Promise.all([
    getAdminOrderDetail(params.orderId),
    listOrderStatusEvents(params.orderId),
    listPaymentReviewEvents(params.orderId),
    listPaymentProofs(params.orderId),
  ]);

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

  return (
    <div className="space-y-8">
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
            value: order.customerEmail ? `${order.customerName} · ${order.customerEmail}` : order.customerName,
          },
          {
            label: "Contact",
            value: order.customerPhone,
          },
          {
            label: "Total",
            value: `${formatNgn(order.totalNgn)} · ${formatTimestamp(order.placedAt)}`,
          },
          {
            label: "Transfer",
            value: order.transferReference,
          },
          {
            label: "Deadline",
            value: formatTimestamp(order.transferDeadlineAt),
          },
        ]}
      />

      <section className="glass-morphism rounded-[32px] bg-system-background/78 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-headline text-secondary-label">
            Actions
          </p>
          <span className="text-xs font-semibold uppercase tracking-headline text-secondary-label">
            Payment #{order.paymentId ?? "n/a"}
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {["confirmed", "under_review", "rejected"].map((action) => (
            <form
              key={action}
              action={reviewPaymentAction}
              className="flex flex-col gap-2"
            >
              <input type="hidden" name="orderId" value={order.orderId} />
              <input type="hidden" name="paymentId" value={order.paymentId ?? ""} />
              <button
                type="submit"
                name="action"
                value={action}
                className="button-secondary min-h-[44px] text-xs font-semibold uppercase tracking-headline"
              >
                {action === "confirmed"
                  ? "Confirm"
                  : action === "under_review"
                    ? "Under Review"
                    : "Reject"}
              </button>
            </form>
          ))}
        </div>
      </section>

      <section className="glass-morphism rounded-[32px] bg-system-background/78 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-headline text-secondary-label">
          Timeline
        </p>
        <div className="mt-4 space-y-3 text-sm text-secondary-label">
          {events.map((event) => (
            <div key={event.eventId} className="flex justify-between">
              <span>{statusLabelMap[event.toStatus] ?? event.toStatus}</span>
              <span>{formatTimestamp(event.createdAt)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-morphism rounded-[32px] bg-system-background/78 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-headline text-secondary-label">
          Payment reviews
        </p>
        <div className="mt-4 space-y-3 text-sm text-secondary-label">
          {reviews.map((review) => (
            <div key={review.eventId} className="flex justify-between gap-4">
              <span>
                {review.action.replace(/_/g, " ")}
                {review.note ? ` - ${review.note}` : ""}
              </span>
              <span>{formatTimestamp(review.createdAt)}</span>
            </div>
          ))}
          {reviews.length === 0 && <div>No events yet.</div>}
        </div>
      </section>

      <section className="glass-morphism rounded-[32px] bg-system-background/78 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-headline text-secondary-label">
          Proofs
        </p>
        <div className="mt-4 space-y-2 text-sm text-secondary-label">
          {proofs.map((proof) => (
            <Link
              key={proof.proofId}
              href={proof.publicUrl ?? "#"}
              className="text-xs font-semibold uppercase tracking-headline text-secondary-label underline-offset-4 hover:text-label"
              target="_blank"
              rel="noreferrer"
            >
              {proof.mimeType} · {formatTimestamp(proof.createdAt)}
            </Link>
          ))}
          {proofs.length === 0 && <div>No proofs uploaded.</div>}
        </div>
      </section>
    </div>
  );
}
