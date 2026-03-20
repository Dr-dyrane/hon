import Image from "next/image";
import Link from "next/link";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { formatNgn } from "@/lib/commerce";
import {
  getPortalOrderDetail,
  listOrderStatusEvents,
  listPaymentProofs,
} from "@/lib/db/repositories/orders-repository";
import { submitPaymentProofAction } from "./actions";

const mapToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

function formatTimestamp(value?: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getTrackingCoords(snapshot: Record<string, unknown>) {
  const latCandidates = ["latitude", "lat"];
  const lngCandidates = ["longitude", "lng"];

  const lat =
    latCandidates
      .map((key) => snapshot[key])
      .find((value) => typeof value === "number") ?? null;
  const lng =
    lngCandidates
      .map((key) => snapshot[key])
      .find((value) => typeof value === "number") ?? null;

  if (typeof lat === "number" && typeof lng === "number") {
    return { lat, lng };
  }

  return null;
}

function buildMapUrl(lat: number, lng: number) {
  if (!mapToken) {
    return null;
  }

  const style = "mapbox/light-v10";
  const pin = `pin-s+0f0(${lng},${lat})`;
  return `https://api.mapbox.com/styles/v1/${style}/static/${pin}/${lng},${lat},14/600x300@2x?access_token=${mapToken}`;
}

export default async function OrderDetailPage({
  params,
}: {
  params: { orderId: string };
}) {
  const session = await requireAuthenticatedSession(`/account/orders/${params.orderId}`);
  const [order, timeline, proofs] = await Promise.all([
    getPortalOrderDetail(session.email, params.orderId),
    listOrderStatusEvents(params.orderId),
    listPaymentProofs(params.orderId),
  ]);

  if (!order) {
    return (
      <div className="glass-morphism rounded-[32px] bg-system-background/80 p-6 text-sm text-secondary-label shadow-soft">
        Order not found.
        <div className="mt-4">
          <Link
            href="/account/orders"
            className="text-xs font-semibold uppercase tracking-headline text-secondary-label underline-offset-4 hover:text-label"
          >
            Back
          </Link>
        </div>
      </div>
    );
  }

  const coords = getTrackingCoords(order.deliveryAddressSnapshot);
  const mapSrc = coords ? buildMapUrl(coords.lat, coords.lng) : null;

  return (
    <div className="space-y-8">
      <section className="glass-morphism rounded-[36px] bg-system-background/86 p-6 shadow-[0_28px_90px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
              Order
            </p>
            <h2 className="text-3xl font-semibold tracking-title text-label">
              #{order.orderNumber}
            </h2>
          </div>
          <div className="text-xs text-secondary-label">
            {order.status.replace(/_/g, " ")} · {order.paymentStatus.replace(/_/g, " ")}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3 text-sm text-secondary-label">
          <div>
            <p className="font-semibold text-label">Total</p>
            <p>{formatNgn(order.totalNgn)}</p>
          </div>
          <div>
            <p className="font-semibold text-label">Placed</p>
            <p>{formatTimestamp(order.placedAt)}</p>
          </div>
          <div>
            <p className="font-semibold text-label">Transfer</p>
            <p>{order.transferReference}</p>
            <p className="text-xs">
              {order.transferDeadlineAt ? formatTimestamp(order.transferDeadlineAt) : "No deadline"}
            </p>
          </div>
        </div>
      </section>

      <section className="glass-morphism rounded-[32px] bg-system-background/78 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-headline text-secondary-label">
          Items
        </p>
        <div className="mt-3 grid gap-3">
          {order.items.map((item) => (
            <div key={item.sku} className="rounded-[24px] bg-system-fill/70 p-4 text-sm text-secondary-label">
              <div className="flex justify-between">
                <span>{item.title}</span>
                <span>
                  {item.quantity} × {formatNgn(item.unitPriceNgn)}
                </span>
              </div>
              <div className="text-xs text-secondary-label">Total {formatNgn(item.lineTotalNgn)}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-morphism rounded-[32px] bg-system-background/78 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-headline text-secondary-label">
            Upload proof
          </p>
          <span className="text-xs text-secondary-label">
            Payment {order.paymentId ?? "n/a"}
          </span>
        </div>
        <form action={submitPaymentProofAction} className="mt-4 flex flex-col gap-3">
          <input type="hidden" name="orderId" value={order.orderId} />
          <input type="hidden" name="paymentId" value={order.paymentId ?? ""} />
          <input
            type="file"
            name="proof"
            required
            className="rounded-[24px] border border-system-fill/60 bg-system-fill/20 px-3 py-2 text-xs text-label file:rounded-full file:bg-accent file:px-3 file:py-1 file:text-[10px] file:font-semibold"
          />
          <button
            type="submit"
            className="button-primary min-h-[44px] text-xs font-semibold uppercase tracking-headline"
          >
            Upload proof
          </button>
        </form>
        {proofs.length > 0 && (
          <div className="mt-4 space-y-2 text-xs text-secondary-label">
            {proofs.map((proof) => (
              <Link
                key={proof.proofId}
                href={proof.publicUrl ?? "#"}
                className="underline-offset-4 hover:text-label"
                target="_blank"
                rel="noreferrer"
              >
                Proof {formatTimestamp(proof.createdAt)}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="glass-morphism rounded-[32px] bg-system-background/78 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-headline text-secondary-label">
          Timeline
        </p>
        <div className="mt-4 grid gap-2 text-sm text-secondary-label">
          {timeline.map((event) => (
            <div key={event.eventId} className="flex justify-between">
              <span>{event.toStatus.replace(/_/g, " ")}</span>
              <span>{formatTimestamp(event.createdAt)}</span>
            </div>
          ))}
        </div>
      </section>

      {mapSrc && (
        <section className="glass-morphism rounded-[32px] bg-system-background/78 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-headline text-secondary-label">
            Tracking
          </p>
          <div className="mt-4 flex justify-center">
            <Image
              src={mapSrc}
              alt="Delivery location"
              width={600}
              height={300}
              className="rounded-[28px]"
              priority
            />
          </div>
        </section>
      )}
    </div>
  );
}
