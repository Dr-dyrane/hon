"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  MapPin,
  Navigation,
  Package,
  PackageCheck,
  RotateCcw,
  Route,
  Truck,
  UserCheck2,
  type LucideIcon,
} from "lucide-react";
import { WorkspaceContextPanel } from "@/components/shell/WorkspaceContextPanel";
import { useSseResource } from "@/hooks/useSseResource";
import type { DeliveryTimelineEvent, PortalTrackingSnapshot } from "@/lib/db/types";
import {
  buildTrackingMapUrl,
  formatRouteDistance,
  formatRouteDuration,
  getTrackingCoords,
  getTrackingFreshness,
} from "@/lib/delivery/tracking";
import { formatFlowStatusLabel } from "@/lib/orders/presentation";
import { cn } from "@/lib/utils";
import styles from "./portal-tracking-experience.module.css";

type TrackingBannerTone = "default" | "success" | "muted";
type TimelineTone = "default" | "success" | "warning" | "muted";

type SummaryMetric = {
  label: string;
  value: string;
  detail?: string;
};

function formatTimestamp(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatStatusLabel(value: string) {
  return formatFlowStatusLabel(value);
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

function getStatusTagTone(value: string): "default" | "success" | "muted" {
  const normalized = value.trim().toLowerCase();

  if (["delivered", "completed", "returned"].includes(normalized)) {
    return "success";
  }

  if (["cancelled", "failed", "expired"].includes(normalized)) {
    return "muted";
  }

  return "default";
}

function resolveBannerState(input: {
  snapshot: PortalTrackingSnapshot;
  freshness: ReturnType<typeof getTrackingFreshness>;
  deliveredAt: string | null;
}): {
  title: string;
  detail: string;
  tone: TrackingBannerTone;
} {
  const { snapshot, freshness, deliveredAt } = input;
  const delivered =
    snapshot.status === "delivered" || snapshot.fulfillmentStatus === "delivered";

  if (delivered) {
    return {
      title: deliveredAt ? `Delivered · ${formatDate(deliveredAt)}` : "Delivered",
      detail: "This order has been successfully completed.",
      tone: "success",
    };
  }

  if (!snapshot.trackingEnabled) {
    return {
      title: "Tracking paused",
      detail: "Location updates are currently off.",
      tone: "muted",
    };
  }

  if (!snapshot.latestPoint) {
    return {
      title: "Waiting for rider signal",
      detail: "No location point yet.",
      tone: "default",
    };
  }

  if (freshness.tone === "live") {
    return {
      title: "Live tracking",
      detail: `Last update ${freshness.ageMinutes ?? 0} min ago.`,
      tone: "success",
    };
  }

  if (freshness.tone === "recent") {
    return {
      title: "Tracking active",
      detail: `Last update ${freshness.ageMinutes ?? 0} min ago.`,
      tone: "default",
    };
  }

  return {
    title: "Signal stale",
    detail: `Last update ${freshness.ageMinutes ?? 0} min ago.`,
    tone: "muted",
  };
}

function getTimelineEventPresentation(eventType: string): {
  label: string;
  icon: LucideIcon;
  tone: TimelineTone;
} {
  const normalized = eventType.trim().toLowerCase();

  switch (normalized) {
    case "marked_ready":
      return { label: "Ready for dispatch", icon: PackageCheck, tone: "default" };
    case "assigned":
      return { label: "Rider assigned", icon: UserCheck2, tone: "default" };
    case "reassigned":
      return { label: "Rider reassigned", icon: UserCheck2, tone: "default" };
    case "picked_up":
      return { label: "Picked up", icon: Package, tone: "default" };
    case "tracking_started":
      return { label: "Tracking started", icon: Navigation, tone: "default" };
    case "out_for_delivery":
      return { label: "Out for delivery", icon: Truck, tone: "default" };
    case "delivered":
      return { label: "Delivered", icon: CheckCircle2, tone: "success" };
    case "failed":
      return { label: "Delivery failed", icon: AlertTriangle, tone: "warning" };
    case "returned":
      return { label: "Returned", icon: RotateCcw, tone: "muted" };
    default:
      return {
        label: formatStatusLabel(eventType),
        icon: CircleDot,
        tone: "default",
      };
  }
}

function findDeliveredTimestamp(events: DeliveryTimelineEvent[]) {
  const deliveredEvent = events.find(
    (event) => event.eventType.trim().toLowerCase() === "delivered"
  );

  return deliveredEvent?.createdAt ?? null;
}

function buildContextTags(input: {
  snapshot: PortalTrackingSnapshot;
  freshnessLabel: string;
  freshnessTone: "default" | "success" | "muted";
}) {
  const { snapshot, freshnessLabel, freshnessTone } = input;
  const tags: Array<{ label: string; tone?: "default" | "success" | "muted" }> = [];
  const seen = new Set<string>();

  function pushUnique(tag: { label: string; tone?: "default" | "success" | "muted" }) {
    const signature = tag.label.trim().toLowerCase();
    if (seen.has(signature)) {
      return;
    }

    seen.add(signature);
    tags.push(tag);
  }

  pushUnique({
    label: formatStatusLabel(snapshot.fulfillmentStatus),
    tone: getStatusTagTone(snapshot.fulfillmentStatus),
  });

  if (snapshot.assignmentStatus) {
    pushUnique({
      label: formatStatusLabel(snapshot.assignmentStatus),
      tone: getStatusTagTone(snapshot.assignmentStatus),
    });
  }

  pushUnique({
    label: freshnessLabel,
    tone: freshnessTone,
  });

  return tags;
}

function buildContextMeta(input: {
  snapshot: PortalTrackingSnapshot;
  deliveredAt: string | null;
  latestUpdateAt: string | null;
}) {
  const { snapshot, deliveredAt, latestUpdateAt } = input;
  const meta: Array<{ label: string; value: string }> = [];

  if (deliveredAt) {
    meta.push({ label: "Delivered", value: formatTimestamp(deliveredAt) });
  } else if (latestUpdateAt) {
    meta.push({ label: "Update", value: formatTimestamp(latestUpdateAt) });
  }

  meta.push({ label: "Contact", value: snapshot.customerPhone });

  return meta;
}

function buildSummaryMetrics(input: {
  snapshot: PortalTrackingSnapshot;
  delivered: boolean;
  deliveredAt: string | null;
  latestUpdateAt: string | null;
  freshness: ReturnType<typeof getTrackingFreshness>;
  etaLabel: string;
  distanceLabel: string;
}) {
  const {
    snapshot,
    delivered,
    deliveredAt,
    latestUpdateAt,
    freshness,
    etaLabel,
    distanceLabel,
  } = input;

  if (delivered) {
    const metrics: SummaryMetric[] = [
      {
        label: "Delivered",
        value: deliveredAt ? formatTimestamp(deliveredAt) : "Completed",
        detail: deliveredAt ? "Completion time" : undefined,
      },
      {
        label: "Rider",
        value: snapshot.riderName ?? "Pending",
        detail: snapshot.riderVehicleType ?? "Assignment",
      },
    ];

    if (latestUpdateAt && latestUpdateAt !== deliveredAt) {
      metrics.push({
        label: "Last update",
        value: formatTimestamp(latestUpdateAt),
      });
    }

    return metrics;
  }

  return [
    {
      label: "Signal",
      value: snapshot.trackingEnabled ? freshness.label : "Off",
      detail: snapshot.trackingEnabled
        ? freshness.ageMinutes == null
          ? "Waiting"
          : `${freshness.ageMinutes} min ago`
        : "Paused",
    },
    {
      label: "ETA",
      value: etaLabel,
      detail: snapshot.routeEstimate
        ? snapshot.routeEstimate.source === "mapbox"
          ? "Route"
          : "Estimate"
        : snapshot.latestPoint
          ? "Route"
          : "Pending",
    },
    {
      label: "Distance",
      value: distanceLabel,
      detail: snapshot.latestPoint ? "To stop" : "Waiting",
    },
    {
      label: "Rider",
      value: snapshot.riderName ?? "Pending",
      detail: snapshot.riderVehicleType ?? "Assignment pending",
    },
  ];
}

export function PortalTrackingExperience({
  initialSnapshot,
  pollUrl,
  streamUrl,
  backHref,
}: {
  initialSnapshot: PortalTrackingSnapshot;
  pollUrl: string;
  streamUrl: string;
  backHref?: string;
}) {
  const { data: snapshot, error } = useSseResource<PortalTrackingSnapshot>({
    initialData: initialSnapshot,
    event: "tracking",
    streamUrl,
    fallbackUrl: pollUrl,
  });

  const mapCoords = snapshot.latestPoint
    ? {
        lat: snapshot.latestPoint.latitude,
        lng: snapshot.latestPoint.longitude,
      }
    : snapshot.trackingEnabled
      ? getTrackingCoords(snapshot.deliveryAddressSnapshot)
      : null;

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
  const freshnessLabel = snapshot.trackingEnabled ? freshness.label : "Tracking off";

  const delivered =
    snapshot.status === "delivered" || snapshot.fulfillmentStatus === "delivered";
  const deliveredAt = findDeliveredTimestamp(snapshot.events);
  const latestUpdateAt = snapshot.latestPoint?.recordedAt ?? snapshot.events[0]?.createdAt ?? null;

  const etaLabel = snapshot.routeEstimate
    ? formatRouteDuration(snapshot.routeEstimate.durationMinutes)
    : snapshot.latestPoint
      ? "Calculating"
      : "Waiting";
  const distanceLabel = snapshot.routeEstimate
    ? formatRouteDistance(snapshot.routeEstimate.distanceKilometers)
    : snapshot.latestPoint
      ? "Calculating"
      : "Waiting";

  const banner = resolveBannerState({
    snapshot,
    freshness,
    deliveredAt,
  });
  const contextTags = buildContextTags({
    snapshot,
    freshnessLabel,
    freshnessTone: snapshot.trackingEnabled ? freshnessTone : "muted",
  });
  const contextMeta = buildContextMeta({
    snapshot,
    deliveredAt,
    latestUpdateAt,
  });
  const summaryMetrics = buildSummaryMetrics({
    snapshot,
    delivered,
    deliveredAt,
    latestUpdateAt,
    freshness,
    etaLabel,
    distanceLabel,
  });
  const currentEventId = snapshot.events[0]?.eventId ?? null;
  const mapFallbackText = delivered
    ? "Live location is unavailable after delivery."
    : !snapshot.trackingEnabled
      ? "Tracking is off."
      : snapshot.latestPoint
        ? "Map unavailable."
        : "Waiting for first location update.";
  const showMapMeta = !delivered && Boolean(snapshot.latestPoint || snapshot.routeEstimate);

  return (
    <div className={styles.page}>
      <WorkspaceContextPanel
        title={`#${snapshot.orderNumber}`}
        detail={getDeliveryLine(snapshot.deliveryAddressSnapshot)}
        tags={contextTags}
        meta={contextMeta}
        titleAction={
          <Link
            href={backHref ?? `/account/orders/${snapshot.orderId}`}
            className="inline-flex min-h-[40px] items-center rounded-[18px] bg-system-fill/42 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-label"
          >
            View order
          </Link>
        }
      />

      <section
        className={cn(
          styles.banner,
          banner.tone === "success"
            ? styles.bannerSuccess
            : banner.tone === "muted"
              ? styles.bannerMuted
              : styles.bannerDefault
        )}
      >
        <h2 className={styles.bannerTitle}>{banner.title}</h2>
        <p className={styles.bannerDetail}>{banner.detail}</p>
      </section>

      <section
        className={cn(
          styles.metricGrid,
          summaryMetrics.length <= 2 && styles.metricGridCompact
        )}
      >
        {summaryMetrics.map((metric) => (
          <MetricTile
            key={`${metric.label}-${metric.value}`}
            label={metric.label}
            value={metric.value}
            detail={metric.detail}
          />
        ))}
      </section>

      <section className={styles.layout}>
        <TrackingSurface title="Journey" icon={Route} className={styles.timelineSurface}>
          {snapshot.events.length === 0 ? (
            <p className={styles.emptyTimeline}>Waiting.</p>
          ) : (
            <div className={styles.timelineList}>
              {snapshot.events.map((event) => {
                const eventUi = getTimelineEventPresentation(event.eventType);
                const EventIcon = eventUi.icon;
                const isCurrent = event.eventId === currentEventId;

                return (
                  <div
                    key={event.eventId}
                    className={cn(
                      styles.timelineItem,
                      isCurrent ? styles.timelineCurrent : styles.timelinePast
                    )}
                  >
                    <div
                      className={cn(
                        styles.timelineIcon,
                        eventUi.tone === "success"
                          ? styles.timelineIconSuccess
                          : eventUi.tone === "warning"
                            ? styles.timelineIconWarning
                            : eventUi.tone === "muted"
                              ? styles.timelineIconMuted
                              : styles.timelineIconDefault
                      )}
                    >
                      <EventIcon size={14} strokeWidth={1.9} />
                    </div>

                    <div className={styles.timelineBody}>
                      <div className={styles.timelineHeader}>
                        <p className={styles.timelineTitle}>{eventUi.label}</p>
                        {isCurrent ? <span className={styles.currentPill}>Current</span> : null}
                      </div>
                      {event.note ? <p className={styles.timelineNote}>{event.note}</p> : null}
                      <p className={styles.timelineTime}>{formatTimestamp(event.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TrackingSurface>

        <div className={styles.sideColumn}>
          <TrackingSurface title="Map" icon={MapPin}>
            {mapSrc ? (
              <div className={styles.mapStack}>
                <div
                  className={cn(
                    styles.mapFrame,
                    !snapshot.latestPoint && styles.mapFramePassive
                  )}
                >
                  <Image
                    src={mapSrc}
                    alt={`Tracking map for order ${snapshot.orderNumber}`}
                    width={960}
                    height={540}
                    className={styles.mapImage}
                    priority
                  />
                </div>

                {showMapMeta ? (
                  <div className={styles.mapMetaGrid}>
                    <MetricTile label="ETA" value={etaLabel} />
                    <MetricTile label="Distance" value={distanceLabel} />
                    <MetricTile
                      label="Update"
                      value={formatTimestamp(snapshot.latestPoint?.recordedAt ?? null)}
                    />
                  </div>
                ) : null}
              </div>
            ) : (
              <div
                className={cn(
                  styles.mapPlaceholder,
                  !snapshot.latestPoint && styles.mapPlaceholderCompact
                )}
              >
                {mapFallbackText}
              </div>
            )}
          </TrackingSurface>

          <TrackingSurface title="Delivery" icon={MapPin}>
            <div className={styles.deliveryStack}>
              <div className={styles.deliveryGroup}>
                <p className={styles.deliveryLine}>{getDeliveryLine(snapshot.deliveryAddressSnapshot)}</p>
              </div>

              <div className={styles.deliveryGroup}>
                <p className={styles.deliveryMetaStrong}>{snapshot.customerName}</p>
              </div>

              <div className={styles.deliveryGroup}>
                <p className={styles.deliveryMeta}>{snapshot.customerPhone}</p>
                {snapshot.riderPhone ? (
                  <p className={styles.deliveryMetaStrong}>{snapshot.riderPhone}</p>
                ) : null}
              </div>
            </div>
          </TrackingSurface>
        </div>
      </section>

      {error ? <p className={styles.errorText}>{error}</p> : null}
    </div>
  );
}

function TrackingSurface({
  title,
  icon: Icon = MapPin,
  children,
  className,
}: {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(styles.surface, className)}>
      <header className={styles.surfaceHeader}>
        <div className={styles.surfaceTitle}>
          <Icon size={14} strokeWidth={1.8} />
          <span>{title}</span>
        </div>
      </header>
      <div className={styles.surfaceBody}>{children}</div>
    </section>
  );
}

function MetricTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className={styles.metricCard}>
      <p className={styles.metricLabel}>{label}</p>
      <p className={styles.metricValue}>{value}</p>
      {detail ? <p className={styles.metricDetail}>{detail}</p> : null}
    </div>
  );
}
