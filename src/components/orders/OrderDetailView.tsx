import Image from "next/image";
import Link from "next/link";
import { PaymentProofUploadCard } from "@/components/orders/PaymentProofUploadCard";
import { WorkspaceContextPanel } from "@/components/shell/WorkspaceContextPanel";
import { formatNgn } from "@/lib/commerce";
import type {
  OrderStatusEventRow,
  PaymentProofRow,
  PortalOrderDetail,
} from "@/lib/db/types";

const mapToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

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
  return value.replace(/_/g, " ");
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

function buildStatusTag(value: string) {
  return { label: formatStatusLabel(value) };
}

export function OrderDetailView({
  order,
  timeline,
  proofs,
  backHref,
  accessToken,
}: {
  order: PortalOrderDetail | null;
  timeline: OrderStatusEventRow[];
  proofs: PaymentProofRow[];
  backHref: string;
  accessToken?: string;
}) {
  if (!order) {
    return (
      <div className="glass-morphism rounded-[32px] bg-system-background/80 p-6 text-sm text-secondary-label shadow-soft">
        Order not found.
        <div className="mt-4">
          <Link
            href={backHref}
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
    <div className="space-y-6">
      <WorkspaceContextPanel
        title={`#${order.orderNumber}`}
        detail={formatNgn(order.totalNgn)}
        tags={[
          buildStatusTag(order.status),
          buildStatusTag(order.paymentStatus),
          buildStatusTag(order.fulfillmentStatus),
        ]}
        meta={[
          {
            label: "Placed",
            value: formatTimestamp(order.placedAt),
          },
          {
            label: "Transfer",
            value: order.transferReference,
          },
          {
            label: "Deadline",
            value: order.transferDeadlineAt
              ? formatTimestamp(order.transferDeadlineAt)
              : "No deadline",
          },
        ]}
      />

      <section className="glass-morphism rounded-[32px] bg-system-background/78 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
              Transfer
            </p>
            <div className="text-lg font-semibold tracking-tight text-label">
              {formatNgn(order.payment?.expectedAmountNgn ?? order.totalNgn)}
            </div>
            <div className="grid gap-1 text-sm">
              <div className="text-secondary-label">
                {order.payment?.bankName ?? "Bank pending"}
              </div>
              <div className="text-label">
                {order.payment?.accountName ?? "Account pending"}
              </div>
              <div className="text-xl font-semibold tracking-tight text-label">
                {order.payment?.accountNumber ?? "Pending"}
              </div>
            </div>
            {order.payment?.instructions ? (
              <div className="text-sm text-secondary-label">
                {order.payment.instructions}
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
              Delivery
            </p>
            <div className="text-sm text-label">
              {getDeliveryLine(order.deliveryAddressSnapshot)}
            </div>
            <div className="text-sm text-secondary-label">{order.customerPhone}</div>
            {["ready_for_dispatch", "out_for_delivery", "delivered"].includes(
              order.fulfillmentStatus
            ) ? (
              <div className="pt-1">
                <Link
                  href={`/account/tracking/${order.orderId}`}
                  className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label transition-colors duration-300 hover:text-label"
                >
                  Track
                </Link>
              </div>
            ) : null}
            {order.notes ? (
              <div className="text-sm text-secondary-label">{order.notes}</div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="glass-morphism rounded-[32px] bg-system-background/78 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <p className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
          Items
        </p>
        <div className="mt-4 grid gap-3">
          {order.items.map((item) => (
            <div
              key={`${item.sku}-${item.title}`}
              className="rounded-[24px] bg-system-fill/70 p-4 text-sm text-secondary-label"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="text-label">{item.title}</div>
                <div className="text-right">
                  <div className="text-label">
                    {item.quantity} x {formatNgn(item.unitPriceNgn)}
                  </div>
                  <div>{formatNgn(item.lineTotalNgn)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-morphism rounded-[32px] bg-system-background/78 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
            Proof
          </p>
          <span className="text-xs text-secondary-label">
            {order.payment?.status ? formatStatusLabel(order.payment.status) : "Pending"}
          </span>
        </div>

        <PaymentProofUploadCard
          orderId={order.orderId}
          paymentId={order.paymentId}
          accessToken={accessToken}
        />

        {proofs.length > 0 ? (
          <div className="mt-4 grid gap-2 text-xs text-secondary-label">
            {proofs.map((proof) => (
              <Link
                key={proof.proofId}
                href={proof.publicUrl ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="underline-offset-4 hover:text-label"
              >
                {formatTimestamp(proof.createdAt)}
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <section className="glass-morphism rounded-[32px] bg-system-background/78 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <p className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
          Timeline
        </p>
        <div className="mt-4 grid gap-2 text-sm text-secondary-label">
          {timeline.length === 0 ? (
            <div>No updates.</div>
          ) : (
            timeline.map((event) => (
              <div
                key={event.eventId}
                className="flex items-center justify-between gap-4"
              >
                <span>{formatStatusLabel(event.toStatus)}</span>
                <span>{formatTimestamp(event.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      </section>

      {mapSrc ? (
        <section className="glass-morphism rounded-[32px] bg-system-background/78 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <p className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
            Tracking
          </p>
          <div className="mt-4 overflow-hidden rounded-[28px]">
            <Image
              src={mapSrc}
              alt="Delivery location"
              width={600}
              height={300}
              className="h-auto w-full"
              priority
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
