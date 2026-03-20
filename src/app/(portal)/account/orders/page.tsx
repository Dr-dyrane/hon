import Link from "next/link";
import { Clock3, PackageCheck } from "lucide-react";
import { MetricRail } from "@/components/admin/MetricRail";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { formatNgn } from "@/lib/commerce";
import { listOrdersForPortal } from "@/lib/db/repositories/orders-repository";

function formatTimestamp(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function OrderStatusBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-[11px] font-semibold tracking-tight ${
        active ? "bg-accent/15 text-accent" : "bg-system-fill/70 text-secondary-label"
      }`}
    >
      {label}
    </span>
  );
}

export default async function OrdersPage() {
  const session = await requireAuthenticatedSession("/account/orders");
  const orders = await listOrdersForPortal(session.email);
  const activeOrders = orders.filter(
    (order) => !["delivered", "cancelled", "expired"].includes(order.status)
  ).length;

  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
            Orders
          </p>
          <h2 className="text-3xl font-bold tracking-display text-label">Your orders</h2>
        </div>

        <MetricRail
          items={[
            {
              label: "Active",
              value: `${activeOrders}`,
              detail: "In progress",
              icon: Clock3,
            },
            {
              label: "Total",
              value: `${orders.length}`,
              detail: "All orders",
              icon: PackageCheck,
              tone: "success",
            },
          ]}
          columns={2}
        />
      </section>

      <section className="space-y-4">
        {orders.length === 0 ? (
          <div className="glass-morphism rounded-[32px] bg-system-background/80 p-6 text-sm text-secondary-label shadow-soft">
            No orders yet.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <article
                key={order.orderId}
                className="glass-morphism rounded-[32px] bg-system-background/78 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-headline text-secondary-label">
                      Order #{order.orderNumber}
                    </p>
                    <p className="text-2xl font-semibold text-label">
                      {formatNgn(order.totalNgn)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <OrderStatusBadge
                      label={order.paymentStatus.replace(/_/g, " ")}
                      active={
                        order.paymentStatus === "confirmed" ||
                        order.paymentStatus === "submitted"
                      }
                    />
                    <OrderStatusBadge
                      label={order.fulfillmentStatus.replace(/_/g, " ")}
                      active={!["delivered", "cancelled"].includes(order.fulfillmentStatus)}
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-4 text-sm text-secondary-label md:grid-cols-2">
                  <div>{formatTimestamp(order.placedAt)}</div>
                  <div className="md:text-right">
                    {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Link
                    href={`/account/orders/${order.orderId}`}
                    className="button-secondary min-h-[44px] text-xs font-semibold uppercase tracking-headline"
                  >
                    Open
                  </Link>
                  <span className="text-xs font-semibold uppercase tracking-headline text-secondary-label">
                    {order.active ? "In progress" : "Complete"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
