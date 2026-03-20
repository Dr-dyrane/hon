import Link from "next/link";
import { Clock3, Landmark, PackageCheck } from "lucide-react";
import { MetricRail } from "@/components/admin/MetricRail";
import { requireAdminSession } from "@/lib/auth/guards";
import { formatNgn } from "@/lib/commerce";
import { listOrdersForAdmin } from "@/lib/db/repositories/orders-repository";

const friendlyStatusLabel: Record<string, string> = {
  awaiting_transfer: "Awaiting transfer",
  payment_submitted: "Payment submitted",
  payment_under_review: "Under review",
  payment_confirmed: "Payment confirmed",
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

function formatStatusLabel(value: string) {
  return friendlyStatusLabel[value] ?? value.replace(/_/g, " ");
}

export default async function AdminOrdersPage() {
  const session = await requireAdminSession("/admin/orders");
  const orders = await listOrdersForAdmin(40, session.email);
  const awaitingTransfer = orders.filter(
    (order) => order.paymentStatus === "awaiting_transfer"
  ).length;
  const activeOrders = orders.filter(
    (order) => !["delivered", "cancelled", "expired"].includes(order.status)
  ).length;
  const dispatchReady = orders.filter(
    (order) => ["payment_confirmed", "ready_for_dispatch"].includes(order.status)
  ).length;

  return (
    <div className="space-y-8 pb-20 md:space-y-10">
      <section className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/payments"
            className="button-secondary min-h-[40px] px-4 text-[11px] font-semibold uppercase tracking-[0.16em]"
          >
            Payments
          </Link>
        </div>

        <MetricRail
          items={[
            {
              label: "Active",
              value: `${activeOrders}`,
              detail: "Live",
              icon: Clock3,
            },
            {
              label: "Awaiting",
              value: `${awaitingTransfer}`,
              detail: "Transfer",
              icon: Landmark,
            },
            {
              label: "Ready",
              value: `${dispatchReady}`,
              detail: "Dispatch",
              icon: PackageCheck,
              tone: "success",
            },
          ]}
          columns={3}
        />
      </section>

      <section className="grid gap-4">
        {orders.map((order) => (
          <article
            key={order.orderId}
            className="glass-morphism rounded-[32px] bg-system-background/72 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
          >
            <div className="flex flex-col gap-4 min-[980px]:flex-row min-[980px]:items-start min-[980px]:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-lg font-semibold tracking-tight text-label">
                    #{order.orderNumber}
                  </div>
                  <span className="rounded-full bg-system-fill/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                    {formatStatusLabel(order.status)}
                  </span>
                  <span className="rounded-full bg-system-fill/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                    {formatStatusLabel(order.paymentStatus)}
                  </span>
                </div>

                <div className="mt-3 grid gap-3 text-sm text-secondary-label sm:grid-cols-2 xl:grid-cols-4">
                  <MetaItem label="Customer" value={order.customerName} />
                  <MetaItem label="Phone" value={order.customerPhone} />
                  <MetaItem label="Placed" value={formatTimestamp(order.placedAt)} />
                  <MetaItem label="Deadline" value={formatTimestamp(order.transferDeadlineAt)} />
                </div>
              </div>

              <div className="min-w-[150px] shrink-0">
                <div className="text-right text-sm text-secondary-label">
                  <div className="text-lg font-semibold text-label">{formatNgn(order.totalNgn)}</div>
                  <div className="mt-1">
                    {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <Link
                    href={`/admin/orders/${order.orderId}`}
                    className="button-secondary min-h-[40px] px-4 text-[10px] font-semibold uppercase tracking-[0.16em]"
                  >
                    Open
                  </Link>
                  <Link
                    href="/admin/payments"
                    className="rounded-full bg-system-fill/56 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label transition-colors duration-200 hover:text-label"
                  >
                    Payments
                  </Link>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] bg-system-fill/42 px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
        {label}
      </div>
      <div className="mt-1 truncate text-sm font-medium text-label">{value}</div>
    </div>
  );
}
