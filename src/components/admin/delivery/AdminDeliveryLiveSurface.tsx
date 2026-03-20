"use client";

import Image from "next/image";
import { Bike, Clock3, Truck } from "lucide-react";
import { MetricRail } from "@/components/admin/MetricRail";
import { useSseResource } from "@/hooks/useSseResource";
import type { AdminDeliveryLiveSnapshot } from "@/lib/delivery/snapshot";

function formatTimestamp(value?: string | null) {
  if (!value) {
    return "Waiting";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AdminDeliveryLiveSurface({
  initialSnapshot,
  fallbackUrl,
  streamUrl,
}: {
  initialSnapshot: AdminDeliveryLiveSnapshot;
  fallbackUrl: string;
  streamUrl: string;
}) {
  const { data, error } = useSseResource<AdminDeliveryLiveSnapshot>({
    initialData: initialSnapshot,
    event: "delivery-live",
    streamUrl,
    fallbackUrl,
  });

  return (
    <div className="space-y-4">
      <MetricRail
        items={[
          {
            label: "Preparing",
            value: `${data.preparingCount}`,
            detail: "Kitchen side",
            icon: Clock3,
          },
          {
            label: "Ready",
            value: `${data.readyCount}`,
            detail: "Waiting rider",
            icon: Bike,
          },
          {
            label: "Live",
            value: `${data.liveCount}`,
            detail: "On road",
            icon: Truck,
            tone: "success",
          },
        ]}
        columns={3}
      />

      <section className="glass-morphism rounded-[32px] bg-system-background/78 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold tracking-tight text-label">Map</h3>
          <span className="rounded-full bg-system-fill px-3 py-1 text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
            {data.busyRiderCount}/{data.riderCount} busy
          </span>
        </div>

        {data.mapOrder?.mapUrl ? (
          <div className="mt-4 overflow-hidden rounded-[28px]">
            <Image
              src={data.mapOrder.mapUrl}
              alt={`Delivery map for order ${data.mapOrder.orderNumber}`}
              width={1000}
              height={720}
              className="h-auto w-full"
              priority
            />
            <div className="bg-system-fill/70 px-4 py-3 text-sm text-secondary-label">
              <div className="font-semibold text-label">#{data.mapOrder.orderNumber}</div>
              <div>{data.mapOrder.addressLine}</div>
              <div className="mt-2 text-[11px]">{formatTimestamp(data.mapOrder.trackedAt)}</div>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-[28px] bg-system-fill/60 px-4 py-12 text-sm text-secondary-label">
            No live location.
          </div>
        )}

        {error ? <p className="mt-3 text-xs text-secondary-label">{error}</p> : null}
      </section>
    </div>
  );
}
