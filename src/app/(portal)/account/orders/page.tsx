import Link from "next/link";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { formatNgn } from "@/lib/commerce";
import type { PortalOrderListRow } from "@/lib/db/types";
import { listOrdersForPortal } from "@/lib/db/repositories/orders-repository";
import {
  getOrderStagePresentation,
  type PortalOrderEntryAction,
  getPortalOrderEntryAction,
  getPortalOrderBucketFootnote,
  getPortalOrderLifecycleBucket,
  type PortalOrderLifecycleBucket,
} from "@/lib/orders/presentation";
import { cn } from "@/lib/utils";
import styles from "./orders-page.module.css";

type OrderEntry = {
  order: PortalOrderListRow;
  stage: ReturnType<typeof getOrderStagePresentation>;
  action: PortalOrderEntryAction;
  bucket: PortalOrderLifecycleBucket;
  href: string;
};

type BannerTone = "idle" | "active" | "action";

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
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value));
}

function getBannerState(input: {
  activeCount: number;
  needsActionCount: number;
}) {
  const { activeCount, needsActionCount } = input;
  if (activeCount === 0) {
    return {
      title: "All caught up",
      detail: "No active orders right now.",
      tone: "idle" as BannerTone,
    };
  }

  if (needsActionCount > 0) {
    return {
      title: `${needsActionCount} order${needsActionCount === 1 ? "" : "s"} need action`,
      detail: "Complete required steps first.",
      tone: "action" as BannerTone,
    };
  }

  return {
    title: `${activeCount} order${activeCount === 1 ? "" : "s"} in progress`,
    detail: "Track progress or open details.",
    tone: "active" as BannerTone,
  };
}

export default async function OrdersPage() {
  const session = await requireAuthenticatedSession("/account/orders");
  const orders = await listOrdersForPortal(session.email);

  const entries = orders.map((order) => {
    const stage = getOrderStagePresentation(order);
    const action = getPortalOrderEntryAction(order);
    const bucket = getPortalOrderLifecycleBucket(order);
    const href =
      action.hrefKind === "track"
        ? `/account/tracking/${order.orderId}`
        : `/account/orders/${order.orderId}`;

    return {
      order,
      stage,
      action,
      bucket,
      href,
    };
  });

  const lifecycleRank: Record<PortalOrderLifecycleBucket, number> = {
    action_required: 0,
    in_progress: 1,
    history: 2,
  };

  const sortedEntries = [...entries].sort((left, right) => {
    const rank = lifecycleRank[left.bucket] - lifecycleRank[right.bucket];
    if (rank !== 0) return rank;

    return (
      new Date(right.order.placedAt).getTime() - new Date(left.order.placedAt).getTime()
    );
  });

  const activeEntries = sortedEntries.filter((entry) => entry.bucket !== "history");
  const completedEntries = sortedEntries.filter((entry) => entry.bucket === "history");
  const needsActionCount = entries.filter((entry) => entry.bucket === "action_required").length;

  const bannerState = getBannerState({
    activeCount: activeEntries.length,
    needsActionCount,
  });

  return (
    <div className={styles.page}>
      <section
        className={cn(
          styles.stateBanner,
          bannerState.tone === "action"
            ? styles.bannerAction
            : bannerState.tone === "active"
              ? styles.bannerActive
              : styles.bannerIdle
        )}
      >
        <h1 className={styles.bannerTitle}>{bannerState.title}</h1>
        <p className={styles.bannerText}>{bannerState.detail}</p>
      </section>

      {orders.length === 0 ? (
        <section className={styles.emptyState}>
          When you place an order, it appears here.
        </section>
      ) : (
        <div className={styles.sectionStack}>
          {activeEntries.length > 0 ? (
            <OrderSection title="In progress" entries={activeEntries} />
          ) : null}

          {completedEntries.length > 0 ? (
            <OrderSection
              title={activeEntries.length === 0 ? "Orders" : "Completed"}
              entries={completedEntries}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

function OrderSection({
  title,
  entries,
}: {
  title: string;
  entries: OrderEntry[];
}) {
  return (
    <section className={styles.section}>
      <header className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <span className={styles.sectionCount}>{entries.length}</span>
      </header>

      <div className={styles.mobileBladeList}>
        {entries.map((entry) => (
          <details
            key={entry.order.orderId}
            className={cn(
              styles.blade,
              entry.bucket === "action_required" && styles.bladePriority
            )}
            open={entry.bucket === "action_required"}
          >
            <summary className={styles.bladeSummary}>
              <div className={styles.bladeMain}>
                <p className={styles.orderLabel}>Order #{entry.order.orderNumber}</p>
                <p className={styles.bladeStatus}>{entry.stage.label}</p>
              </div>
              <div className={styles.bladeSide}>
                <p className={styles.bladeTotal}>{formatNgn(entry.order.totalNgn)}</p>
                <p className={styles.bladeDate}>{formatDate(entry.order.placedAt)}</p>
              </div>
            </summary>

            <div className={styles.bladeContent}>
              <OrderEntryBody entry={entry} />
            </div>
          </details>
        ))}
      </div>

      <div className={styles.desktopGrid}>
        {entries.map((entry) => (
          <article
            key={entry.order.orderId}
            className={cn(
              styles.card,
              entry.bucket === "action_required" && styles.cardPriority
            )}
          >
            <div className={styles.cardHeader}>
              <div>
                <p className={styles.orderLabel}>Order #{entry.order.orderNumber}</p>
                <p className={styles.orderTotal}>{formatNgn(entry.order.totalNgn)}</p>
              </div>
              <OrderStatusBadge label={entry.stage.label} tone={entry.stage.tone} />
            </div>

            <OrderEntryBody entry={entry} />
          </article>
        ))}
      </div>
    </section>
  );
}

function OrderEntryBody({ entry }: { entry: OrderEntry }) {
  return (
    <div className={styles.entryBody}>
      <p className={styles.stageDetail}>{entry.stage.detail}</p>

      <div className={styles.metaRow}>
        <CompactOrderStat label="Placed" value={formatTimestamp(entry.order.placedAt)} />
        <CompactOrderStat
          label="Items"
          value={`${entry.order.itemCount} item${entry.order.itemCount === 1 ? "" : "s"}`}
        />
      </div>

      <div className={styles.cardFooter}>
        <span className={styles.footerState}>
          {getPortalOrderBucketFootnote(entry.bucket)} - {formatDate(entry.order.placedAt)}
        </span>
        <Link
          href={entry.href}
          className={cn(
            styles.actionButton,
            entry.action.emphasis === "primary"
              ? styles.actionButtonPrimary
              : styles.actionButtonSecondary
          )}
        >
          {entry.action.label}
        </Link>
      </div>
    </div>
  );
}

function CompactOrderStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className={styles.metaItem}>
      <div className={styles.metaLabel}>{label}</div>
      <div className={styles.metaValue}>{value}</div>
    </div>
  );
}

function OrderStatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "default" | "success" | "muted";
}) {
  const toneClass =
    tone === "success"
      ? styles.statusSuccess
      : tone === "muted"
        ? styles.statusMuted
        : styles.statusDefault;

  return (
    <span className={cn(styles.statusBadge, toneClass)}>
      {label}
    </span>
  );
}
