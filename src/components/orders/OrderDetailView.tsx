import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { PaymentProofUploadCard } from "@/components/orders/PaymentProofUploadCard";
import { WorkspaceContextPanel } from "@/components/shell/WorkspaceContextPanel";
import { QuietValueStrip } from "@/components/ui/QuietValueStrip";
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
  trackingHref,
}: {
  order: PortalOrderDetail | null;
  timeline: OrderStatusEventRow[];
  proofs: PaymentProofRow[];
  backHref: string;
  accessToken?: string;
  trackingHref?: string | null;
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
            label: "Ref",
            value: order.transferReference,
          },
          {
            label: "Drop",
            value: getDeliveryLine(order.deliveryAddressSnapshot),
          },
        ]}
      />

      <QuietValueStrip
        items={[
          {
            label: "Due",
            value: formatNgn(order.payment?.expectedAmountNgn ?? order.totalNgn),
            detail: order.payment?.status
              ? formatStatusLabel(order.payment.status)
              : "Pending",
          },
          {
            label: "Deadline",
            value: order.transferDeadlineAt
              ? formatTimestamp(order.transferDeadlineAt)
              : "Open",
          },
          {
            label: "Items",
            value: `${order.items.length}`,
            detail: `${order.items.reduce((total, item) => total + item.quantity, 0)} units`,
          },
          {
            label: "Proofs",
            value: `${proofs.length}`,
            detail: proofs.length > 0 ? "Received" : "Waiting",
          },
        ]}
        columns={4}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
        <div className="space-y-4">
          <OrderSurface title="Pay">
            <div className="space-y-3">
              <div className="text-[28px] font-semibold tracking-tight text-label">
                {formatNgn(order.payment?.expectedAmountNgn ?? order.totalNgn)}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <SurfaceMeta
                  label="Bank"
                  value={order.payment?.bankName ?? "Pending"}
                />
                <SurfaceMeta
                  label="Name"
                  value={order.payment?.accountName ?? "Pending"}
                />
              </div>
              <div className="rounded-[24px] bg-system-fill/42 px-4 py-4">
                <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                  Number
                </div>
                <div className="mt-2 text-[26px] font-semibold tracking-tight text-label">
                  {order.payment?.accountNumber ?? "Pending"}
                </div>
                {order.payment?.instructions ? (
                  <div className="mt-2 text-sm text-secondary-label">
                    {order.payment.instructions}
                  </div>
                ) : null}
              </div>
            </div>
          </OrderSurface>

          <OrderSurface title="Items">
            <div className="grid gap-3">
              {order.items.map((item) => (
                <div
                  key={`${item.sku}-${item.title}`}
                  className="rounded-[24px] bg-system-fill/42 px-4 py-4 text-sm text-secondary-label"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-label">{item.title}</div>
                      <div className="mt-1 text-xs">
                        {item.quantity} x {formatNgn(item.unitPriceNgn)}
                      </div>
                    </div>
                    <div className="shrink-0 text-right font-medium text-label">
                      {formatNgn(item.lineTotalNgn)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </OrderSurface>
        </div>

        <div className="space-y-4">
          <OrderSurface
            title="Delivery"
            action={
              trackingHref &&
              ["ready_for_dispatch", "out_for_delivery", "delivered"].includes(
                order.fulfillmentStatus
              ) ? (
                <Link
                  href={trackingHref}
                  className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label transition-colors duration-300 hover:text-label"
                >
                  Track
                </Link>
              ) : null
            }
          >
            <div className="space-y-3 text-sm text-secondary-label">
              <div className="text-label">{getDeliveryLine(order.deliveryAddressSnapshot)}</div>
              <div>{order.customerPhone}</div>
              {order.notes ? <div>{order.notes}</div> : null}
            </div>
          </OrderSurface>

          <OrderSurface
            title="Proof"
            action={
              <span className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                {order.payment?.status ? formatStatusLabel(order.payment.status) : "Pending"}
              </span>
            }
          >
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
          </OrderSurface>

          <OrderSurface title="Updates">
            <div className="grid gap-2 text-sm text-secondary-label">
              {timeline.length === 0 ? (
                <div>Waiting.</div>
              ) : (
                timeline.map((event) => (
                  <div
                    key={event.eventId}
                    className="flex items-center justify-between gap-4 rounded-[22px] bg-system-fill/36 px-4 py-3"
                  >
                    <span className="text-label">{formatStatusLabel(event.toStatus)}</span>
                    <span>{formatTimestamp(event.createdAt)}</span>
                  </div>
                ))
              )}
            </div>
          </OrderSurface>

          {mapSrc ? (
            <OrderSurface title="Map">
              <div className="overflow-hidden rounded-[26px]">
                <Image
                  src={mapSrc}
                  alt="Delivery location"
                  width={600}
                  height={300}
                  className="h-auto w-full"
                  priority
                />
              </div>
            </OrderSurface>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function OrderSurface({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="glass-morphism rounded-[32px] bg-system-background/78 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] md:p-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
          {title}
        </p>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SurfaceMeta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[22px] bg-system-fill/42 px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-label">{value}</div>
    </div>
  );
}
