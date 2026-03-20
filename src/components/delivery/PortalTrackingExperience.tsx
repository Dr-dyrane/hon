"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useEffectEvent, useState } from "react";
import { WorkspaceContextPanel } from "@/components/shell/WorkspaceContextPanel";
import type { PortalTrackingSnapshot } from "@/lib/db/types";
import {
  buildTrackingMapUrl,
  getTrackingCoords,
  getTrackingFreshness,
} from "@/lib/delivery/tracking";

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

function buildStatusTag(value: string) {
  return { label: formatStatusLabel(value) };
}

export function PortalTrackingExperience({
  initialSnapshot,
  pollUrl,
}: {
  initialSnapshot: PortalTrackingSnapshot;
  pollUrl: string;
}) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [error, setError] = useState<string | null>(null);

  const refreshSnapshot = useEffectEvent(async () => {
    const response = await fetch(pollUrl, {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });

    if (!response.ok) {
      setError("Tracking unavailable.");
      return;
    }

    const payload = (await response.json()) as {
      ok: boolean;
      data?: PortalTrackingSnapshot;
      error?: string;
    };

    if (!payload.ok || !payload.data) {
      setError(payload.error || "Tracking unavailable.");
      return;
    }

    setSnapshot(payload.data);
    setError(null);
  });

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshSnapshot();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [pollUrl]);

  const mapCoords = snapshot.latestPoint
    ? {
        lat: snapshot.latestPoint.latitude,
        lng: snapshot.latestPoint.longitude,
      }
    : getTrackingCoords(snapshot.deliveryAddressSnapshot);
  const mapSrc = mapCoords
    ? buildTrackingMapUrl({
        latitude: mapCoords.lat,
        longitude: mapCoords.lng,
        width: 960,
        height: 540,
        zoom: snapshot.latestPoint ? 14 : 12,
      })
    : null;
  const freshness = getTrackingFreshness(snapshot.latestPoint?.recordedAt ?? null);
  const freshnessTone =
    freshness.tone === "live" ? "success" : freshness.tone === "muted" ? "muted" : "default";

  return (
    <div className="space-y-6 pb-20">
      <WorkspaceContextPanel
        title={`#${snapshot.orderNumber}`}
        detail={snapshot.customerName}
        tags={[
          buildStatusTag(snapshot.fulfillmentStatus),
          ...(snapshot.assignmentStatus ? [buildStatusTag(snapshot.assignmentStatus)] : []),
          { label: freshness.label, tone: freshnessTone },
        ]}
        meta={[
          {
            label: "Last update",
            value: formatTimestamp(snapshot.latestPoint?.recordedAt ?? null),
          },
          {
            label: "Rider",
            value: snapshot.riderName ?? "Pending",
          },
        ]}
        actions={
          <Link
            href={`/account/orders/${snapshot.orderId}`}
            className="flex min-h-[40px] items-center rounded-[18px] bg-system-fill/42 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-label"
          >
            Order
          </Link>
        }
      />

      <section className="grid gap-4 min-[1100px]:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
        <div className="rounded-[32px] bg-system-background/86 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-5">
          {mapSrc ? (
            <div className="overflow-hidden rounded-[26px]">
              <Image
                src={mapSrc}
                alt={`Tracking map for order ${snapshot.orderNumber}`}
                width={960}
                height={540}
                className="h-auto w-full"
                priority
              />
            </div>
          ) : (
            <div className="flex min-h-[280px] items-center justify-center rounded-[26px] bg-system-fill/42 text-sm text-secondary-label">
              No location yet.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <section className="rounded-[32px] bg-system-background/86 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <div className="grid gap-3 sm:grid-cols-2 min-[1100px]:grid-cols-1">
              <MetricCard
                label="Last update"
                value={formatTimestamp(snapshot.latestPoint?.recordedAt ?? null)}
                detail={
                  freshness.ageMinutes == null ? "Waiting" : `${freshness.ageMinutes} min ago`
                }
              />
              <MetricCard
                label="Rider"
                value={snapshot.riderName ?? "Pending"}
                detail={snapshot.riderVehicleType ?? snapshot.riderPhone ?? "Assignment pending"}
              />
            </div>
          </section>

          <section className="rounded-[32px] bg-system-background/86 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
              Delivery
            </p>
            <div className="mt-3 space-y-1 text-sm text-secondary-label">
              <p className="text-label">{snapshot.customerName}</p>
              <p>{snapshot.customerPhone}</p>
            </div>
          </section>

          <section className="rounded-[32px] bg-system-background/86 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
              Timeline
            </p>
            <div className="mt-4 space-y-3">
              {snapshot.events.length === 0 ? (
                <p className="text-sm text-secondary-label">No updates.</p>
              ) : (
                snapshot.events.map((event) => (
                  <div key={event.eventId} className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-label">
                        {formatStatusLabel(event.eventType)}
                      </p>
                      {event.note ? (
                        <p className="mt-1 text-xs text-secondary-label">{event.note}</p>
                      ) : null}
                    </div>
                    <p className="shrink-0 text-[11px] text-secondary-label">
                      {formatTimestamp(event.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </section>

      {error ? <p className="text-sm text-amber-600">{error}</p> : null}
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[24px] bg-system-fill/42 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold tracking-tight text-label">{value}</p>
      <p className="mt-1 text-xs text-secondary-label">{detail}</p>
    </div>
  );
}
