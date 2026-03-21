import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { OrderDetailView } from "@/components/orders/OrderDetailView";
import {
  getLatestOrderReturnCase,
  listOrderReturnEvents,
} from "@/lib/db/repositories/order-returns-repository";
import {
  getPortalOrderDetail,
  listOrderStatusEvents,
  listPaymentProofs,
} from "@/lib/db/repositories/orders-repository";

export default async function OrderDetailPage({
  params,
}: {
  params: { orderId: string };
}) {
  const session = await requireAuthenticatedSession(`/account/orders/${params.orderId}`);
  const order = await getPortalOrderDetail(session.email, params.orderId);
  const customerActor = {
    email: session.email,
    role: "customer" as const,
  };
  const [timeline, proofs, returnCase, returnEvents] = await Promise.all([
    listOrderStatusEvents(params.orderId, customerActor),
    listPaymentProofs(order?.paymentId ?? "", customerActor),
    getLatestOrderReturnCase(params.orderId, customerActor),
    listOrderReturnEvents(params.orderId, customerActor),
  ]);

  return (
    <OrderDetailView
      order={order}
      timeline={timeline}
      proofs={proofs}
      returnCase={returnCase}
      returnEvents={returnEvents}
      backHref="/account/orders"
      trackingHref={`/account/tracking/${params.orderId}`}
    />
  );
}
