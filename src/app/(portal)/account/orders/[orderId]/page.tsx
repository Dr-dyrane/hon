import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { OrderDetailView } from "@/components/orders/OrderDetailView";
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
  const [timeline, proofs] = await Promise.all([
    listOrderStatusEvents(params.orderId, customerActor),
    listPaymentProofs(order?.paymentId ?? "", customerActor),
  ]);

  return (
    <OrderDetailView
      order={order}
      timeline={timeline}
      proofs={proofs}
      backHref="/account/orders"
    />
  );
}
