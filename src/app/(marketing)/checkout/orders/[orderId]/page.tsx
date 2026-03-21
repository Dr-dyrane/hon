import Link from "next/link";
import { OrderDetailView } from "@/components/orders/OrderDetailView";
import {
  getLatestOrderReturnCase,
  listOrderReturnCaseItems,
  listOrderReturnEvents,
  listOrderReturnProofs,
} from "@/lib/db/repositories/order-returns-repository";
import {
  getOrderReview,
  getOrderReviewRequest,
} from "@/lib/db/repositories/review-repository";
import { verifyGuestOrderAccessToken } from "@/lib/orders/access";
import {
  getGuestOrderDetail,
  listOrderStatusEvents,
  listPaymentProofs,
} from "@/lib/db/repositories/orders-repository";

export default async function GuestCheckoutOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ access?: string }>;
}) {
  const [{ orderId }, { access: accessToken }] = await Promise.all([
    params,
    searchParams,
  ]);

  if (!verifyGuestOrderAccessToken(accessToken, orderId)) {
    return (
      <main className="mx-auto min-h-[100svh] w-full max-w-[1160px] px-3 pb-20 pt-4 sm:px-6 sm:pt-6">
        <div className="glass-morphism rounded-[32px] bg-system-background/80 p-6 text-sm text-secondary-label shadow-soft">
          Link expired.
          <div className="mt-4">
            <Link
              href="/"
              className="text-xs font-semibold uppercase tracking-headline text-secondary-label underline-offset-4 hover:text-label"
            >
              Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const order = await getGuestOrderDetail(orderId);
  const guestActor = {
    role: "customer" as const,
    guestOrderId: orderId,
  };
  const [timeline, proofs, reviewRequest, review, returnCase, returnEvents, returnProofs] = await Promise.all([
    listOrderStatusEvents(orderId, guestActor),
    listPaymentProofs(order?.paymentId ?? "", guestActor),
    getOrderReviewRequest(orderId, guestActor),
    getOrderReview(orderId, guestActor),
    getLatestOrderReturnCase(orderId, guestActor),
    listOrderReturnEvents(orderId, guestActor),
    listOrderReturnProofs(orderId, guestActor),
  ]);
  const returnItems = returnCase
    ? await listOrderReturnCaseItems(returnCase.returnCaseId, guestActor)
    : [];

  return (
    <main className="mx-auto min-h-[100svh] w-full max-w-[1160px] px-3 pb-20 pt-4 sm:px-6 sm:pt-6">
      <div className="glass-morphism mb-4 flex flex-col gap-3 rounded-[24px] bg-system-background/80 px-4 py-4 shadow-soft sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:rounded-[28px]">
        <div className="space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
            House of Prax
          </div>
          <div className="text-lg font-semibold tracking-tight text-label">Guest order</div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/"
            className="rounded-full bg-system-fill/46 px-4 py-2 text-[10px] font-semibold uppercase tracking-headline text-secondary-label transition-colors duration-300 hover:bg-system-fill/70 hover:text-label"
          >
            Home
          </Link>
          <Link
            href="/auth/sign-in?returnTo=/account/orders"
            className="rounded-full bg-system-fill/46 px-4 py-2 text-[10px] font-semibold uppercase tracking-headline text-secondary-label transition-colors duration-300 hover:bg-system-fill/70 hover:text-label"
          >
            Sign in
          </Link>
        </div>
      </div>

      <OrderDetailView
        order={order}
        timeline={timeline}
        proofs={proofs}
        reviewRequest={reviewRequest}
        review={review}
        returnCase={returnCase}
        returnItems={returnItems}
        returnEvents={returnEvents}
        returnProofs={returnProofs}
        backHref="/"
        accessToken={accessToken}
        trackingHref={
          accessToken
            ? `/checkout/orders/${orderId}/tracking?access=${encodeURIComponent(accessToken)}`
            : null
        }
      />
    </main>
  );
}
