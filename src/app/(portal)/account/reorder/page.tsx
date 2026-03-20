import { History, Repeat2, ShoppingBag } from "lucide-react";
import { MetricRail } from "@/components/admin/MetricRail";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { listOrdersForPortal } from "@/lib/db/repositories/orders-repository";
import { ReorderBoard } from "@/components/account/ReorderBoard";

export default async function ReorderPage() {
  const session = await requireAuthenticatedSession("/account/reorder");
  const orders = await listOrdersForPortal(session.email);
  const activeOrders = orders.filter((order) => order.active).length;
  const completedOrders = orders.length - activeOrders;

  return (
    <div className="space-y-8 pb-20 md:space-y-10">
      <MetricRail
        items={[
          {
            label: "History",
            value: `${orders.length}`,
            detail: "Total",
            icon: History,
          },
          {
            label: "Ready",
            value: `${completedOrders}`,
            detail: "Reload",
            icon: Repeat2,
            tone: "success",
          },
          {
            label: "Active",
            value: `${activeOrders}`,
            detail: "Live",
            icon: ShoppingBag,
          },
        ]}
        columns={3}
      />

      <ReorderBoard orders={orders} />
    </div>
  );
}
