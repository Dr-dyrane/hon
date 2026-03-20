import Link from "next/link";
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
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function OrderStatusChip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-system-fill/70 px-3 py-1 text-[11px] font-semibold tracking-tight text-secondary-label">
      {label}
    </span>
  );
}

export default async function AdminOrdersPage() {
  await requireAdminSession("/admin/orders");
  const orders = await listOrdersForAdmin(40);
  const awaitingTransfer = orders.filter(
    (order) => order.paymentStatus === "awaiting_transfer"
  ).length;
  const activeOrders = orders.filter(
    (order) => !["delivered", "cancelled", "expired"].includes(order.status)
  ).length;

  return (
    <div className="space-y-8">
      <section className="glass-morphism overflow-hidden rounded-[36px] bg-system-background/86 p-6 shadow-[0_28px_90px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
            Orders Console
          </p>
          <h2 className="text-3xl font-bold tracking-display text-label">
            Operational order board
          </h2>
          <p className="text-sm leading-relaxed text-secondary-label">
            Track what is pending, what is paid, and what still needs manual handling
            before dispatch.
          </p>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          <article className="rounded-[28px] bg-system-fill/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <p className="text-sm font-semibold tracking-headline text-secondary-label uppercase">
              Active
            </p>
            <p className="mt-2 text-4xl font-semibold text-label">{activeOrders}</p>
            <p className="text-xs leading-snug text-secondary-label">
              Orders still in progress.
            </p>
          </article>
          <article className="rounded-[28px] bg-system-fill/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <p className="text-sm font-semibold tracking-headline text-secondary-label uppercase">
              Awaiting transfer
            </p>
            <p className="mt-2 text-4xl font-semibold text-label">{awaitingTransfer}</p>
            <p className="text-xs leading-snug text-secondary-label">
              Require manual confirmation.
            </p>
          </article>
          <article className="rounded-[28px] bg-system-fill/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <p className="text-sm font-semibold tracking-headline text-secondary-label uppercase">
              Queue size
            </p>
            <p className="mt-2 text-4xl font-semibold text-label">{orders.length}</p>
            <p className="text-xs leading-snug text-secondary-label">
              Showing most recent 40 orders.
            </p>
          </article>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
              Orders
            </p>
            <h3 className="text-2xl font-semibold tracking-title text-label">
              Priority queue
            </h3>
          </div>
          <div className="text-sm text-secondary-label">
            Tap an order to inspect its payment and delivery context.
          </div>
        </div>

        <div className="grid gap-4">
          {orders.map((order) => (
            <article
              key={order.orderId}
              className="glass-morphism rounded-[32px] bg-system-background/72 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold tracking-headline text-secondary-label uppercase">
                    Order
                  </p>
                  <p className="text-2xl font-semibold tracking-tight text-label">
                    {order.orderNumber}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <OrderStatusChip
                    label={
                      friendlyStatusLabel[order.status] ?? order.status.replace(/_/g, " ")
                    }
                  />
                  <OrderStatusChip
                    label={
                      friendlyStatusLabel[order.paymentStatus] ??
                      order.paymentStatus.replace(/_/g, " ")
                    }
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2 text-sm text-secondary-label">
                  <p>
                    <span className="font-semibold text-label">Customer</span>
                    <br />
                    {order.customerName}
                    <br />
                    <span className="text-xs">{order.customerEmail ?? "No email"}</span>
                    <br />
                    <span className="text-xs">{order.customerPhone}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-label">Placed</span>
                    <br />
                    {formatTimestamp(order.placedAt)}
                  </p>
                </div>

                <div className="space-y-2 text-sm text-secondary-label">
                  <p>
                    <span className="font-semibold text-label">Total</span>
                    <br />
                    {formatNgn(order.totalNgn)}
                  </p>
                  <p>
                    <span className="font-semibold text-label">Transfer deadline</span>
                    <br />
                    {formatTimestamp(order.transferDeadlineAt)}
                  </p>
                  <p>
                    <span className="font-semibold text-label">Line items</span>
                    <br />
                    {order.itemCount}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-headline text-secondary-label">
                  {order.orderNumber} feeds the payment queue until confirmed.
                </span>
                <Link
                  href="/admin/payments"
                  className="text-xs font-semibold uppercase tracking-headline text-secondary-label underline-offset-4 hover:text-label"
                >
                  Jump to payments
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
