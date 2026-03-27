import type { ReactNode } from "react";
import Link from "next/link";
import { CircleEllipsis, Clock3, Landmark, PackageCheck, RotateCcw } from "lucide-react";
import { MetricRail } from "@/components/admin/MetricRail";
import {
  OrderListScene,
  type OrderListBannerState,
  type OrderListEntry,
  type OrderListSection,
} from "@/components/orders/OrderListScene";
import { RouteFeedbackLink } from "@/components/ui/RouteFeedbackLink";
import { requireAdminSession } from "@/lib/auth/guards";
import { formatNgn } from "@/lib/commerce";
import { listOpenOrderReturnCasesForAdmin } from "@/lib/db/repositories/order-returns-repository";
import { listOrdersForAdmin } from "@/lib/db/repositories/orders-repository";
import {
  type AdminOrderEntryAction,
  type AdminOrderLifecycleBucket,
  getAdminOrderBucketFootnote,
  getAdminOrderEntryAction,
  getAdminOrderLifecycleBucket,
  getOrderStagePresentation,
} from "@/lib/orders/presentation";
import { cn } from "@/lib/utils";
import styles from "./orders-page.module.css";

type AdminOrderRow = Awaited<ReturnType<typeof listOrdersForAdmin>>[number];
type OrdersTone = "idle" | "active" | "overloaded";

type OrderEntry = {
  order: AdminOrderRow;
  stage: ReturnType<typeof getOrderStagePresentation>;
  bucket: AdminOrderLifecycleBucket;
  action: AdminOrderEntryAction;
  href: string;
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
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value));
}

function formatStatusLabel(value: string) {
  return value.replace(/_/g, " ");
}

function resolveOrdersTone(input: {
  needsAttentionCount: number;
  activeCount: number;
  openReturnsCount: number;
}): OrdersTone {
  if (input.needsAttentionCount >= 8) {
    return "overloaded";
  }

  if (
    input.needsAttentionCount > 0 ||
    input.activeCount > 0 ||
    input.openReturnsCount > 0
  ) {
    return "active";
  }

  return "idle";
}

function getBannerState(input: {
  activeCount: number;
  needsAttentionCount: number;
}): OrderListBannerState {
  const { activeCount, needsAttentionCount } = input;

  if (activeCount === 0) {
    return {
      title: "No active orders",
      detail: "Queue is clear right now.",
      tone: "idle",
    };
  }

  if (needsAttentionCount > 0) {
    return {
      title: `${needsAttentionCount} order${needsAttentionCount === 1 ? "" : "s"} need attention`,
      detail: "Process requests and payment checks first.",
      tone: "action",
    };
  }

  return {
    title: `${activeCount} order${activeCount === 1 ? "" : "s"} in progress`,
    detail: "Fulfillment is moving.",
    tone: "active",
  };
}

function mapAdminEntryToListSceneEntry(entry: OrderEntry): OrderListEntry {
  return {
    entryId: entry.order.orderId,
    orderNumber: entry.order.orderNumber,
    totalNgn: entry.order.totalNgn,
    placedAt: entry.order.placedAt,
    stageLabel: entry.stage.label,
    stageDetail: entry.stage.detail,
    stageTone: entry.stage.tone,
    footnote: getAdminOrderBucketFootnote(entry.bucket),
    priority: entry.bucket === "needs_attention",
    href: entry.href,
    actionLabel: entry.action.label,
    actionEmphasis: entry.action.emphasis,
    meta: [
      {
        label: "Customer",
        value: entry.order.customerName,
      },
      {
        label: "Phone",
        value: entry.order.customerPhone,
      },
      {
        label: "Items",
        value: `${entry.order.itemCount} item${entry.order.itemCount === 1 ? "" : "s"}`,
      },
      {
        label: "Placed",
        value: formatTimestamp(entry.order.placedAt),
      },
    ],
  };
}

function getHeroState(input: {
  tone: OrdersTone;
  activeCount: number;
  needsAttentionCount: number;
  openReturnsCount: number;
  paymentReviewCount: number;
  nextAttentionEntry: OrderEntry | null;
  nextLiveEntry: OrderEntry | null;
}) {
  const {
    tone,
    activeCount,
    needsAttentionCount,
    openReturnsCount,
    paymentReviewCount,
    nextAttentionEntry,
    nextLiveEntry,
  } = input;

  if (tone === "overloaded") {
    return {
      title: "Order queue pressure is high.",
      detail: nextAttentionEntry
        ? `Start with #${nextAttentionEntry.order.orderNumber}. Clear requests and payment checks before prep slips.`
        : "Clear requests and payment checks before prep slips.",
      primaryActionHref: nextAttentionEntry?.href ?? "#needs_attention",
      primaryActionLabel: nextAttentionEntry?.action.label ?? "Open queue",
      secondaryActionHref:
        paymentReviewCount > 0 ? "/admin/payments" : "#needs_attention",
      secondaryActionLabel:
        paymentReviewCount > 0 ? "Open payments" : "Open queue",
      pill: "Escalated queue",
    };
  }

  if (needsAttentionCount > 0) {
    return {
      title: `${needsAttentionCount} order${needsAttentionCount === 1 ? "" : "s"} need attention.`,
      detail: nextAttentionEntry
        ? `Start with #${nextAttentionEntry.order.orderNumber}, then move back into prep and dispatch.`
        : "Clear blockers first, then move back into prep and dispatch.",
      primaryActionHref: nextAttentionEntry?.href ?? "#needs_attention",
      primaryActionLabel: nextAttentionEntry?.action.label ?? "Open queue",
      secondaryActionHref:
        paymentReviewCount > 0 ? "/admin/payments" : "#in_progress",
      secondaryActionLabel:
        paymentReviewCount > 0 ? "Open payments" : "Live queue",
      pill: "Attention queue active",
    };
  }

  if (activeCount > 0) {
    return {
      title: `${activeCount} order${activeCount === 1 ? "" : "s"} in motion.`,
      detail: nextLiveEntry
        ? `Fulfillment is moving. Jump into #${nextLiveEntry.order.orderNumber} and keep the queue tight.`
        : "Fulfillment is moving. Keep preparation and dispatch moving.",
      primaryActionHref: nextLiveEntry?.href ?? "#in_progress",
      primaryActionLabel: nextLiveEntry ? "Open live order" : "Open live queue",
      secondaryActionHref:
        openReturnsCount > 0 ? "#open-returns" : "/admin/payments",
      secondaryActionLabel:
        openReturnsCount > 0 ? "Open returns" : "Open payments",
      pill: "Fulfillment active",
    };
  }

  if (openReturnsCount > 0) {
    return {
      title: `${openReturnsCount} return${openReturnsCount === 1 ? "" : "s"} still open.`,
      detail: "Order flow is clear, but return follow-through still needs attention.",
      primaryActionHref: "#open-returns",
      primaryActionLabel: "Open returns",
      secondaryActionHref: "/admin/catalog/products",
      secondaryActionLabel: "Open catalog",
      pill: "Return queue active",
    };
  }

  return {
    title: "Order queue is clear.",
    detail: "No active orders right now. Keep payments and catalog ready for the next request.",
    primaryActionHref: "/admin/catalog/products",
    primaryActionLabel: "Open catalog",
    secondaryActionHref: "/admin/payments",
    secondaryActionLabel: "Open payments",
    pill: "No active queue",
  };
}

export default async function AdminOrdersPage() {
  const session = await requireAdminSession("/admin/orders");
  const [orders, openReturns] = await Promise.all([
    listOrdersForAdmin(50, session.email),
    listOpenOrderReturnCasesForAdmin(12, session.email),
  ]);

  const requests = orders.filter((order) => order.status === "checkout_draft").length;
  const paymentReviewCount = orders.filter(
    (order) =>
      order.status === "payment_submitted" || order.status === "payment_under_review"
  ).length;
  const awaitingTransfer = orders.filter(
    (order) =>
      order.status !== "checkout_draft" &&
      order.paymentStatus === "awaiting_transfer"
  ).length;
  const activeOrders = orders.filter(
    (order) => !["delivered", "cancelled", "expired"].includes(order.status)
  ).length;
  const preparingOrders = orders.filter(
    (order) => getOrderStagePresentation(order).key === "preparing"
  ).length;

  const entries: OrderEntry[] = orders.map((order) => {
    const stage = getOrderStagePresentation(order);
    const bucket = getAdminOrderLifecycleBucket(order);
    const action = getAdminOrderEntryAction(order);

    return {
      order,
      stage,
      bucket,
      action,
      href: `/admin/orders/${order.orderId}`,
    };
  });

  const lifecycleRank: Record<AdminOrderLifecycleBucket, number> = {
    needs_attention: 0,
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
  const needsAttentionEntries = sortedEntries.filter(
    (entry) => entry.bucket === "needs_attention"
  );
  const inProgressEntries = sortedEntries.filter(
    (entry) => entry.bucket === "in_progress"
  );
  const historyEntries = sortedEntries.filter((entry) => entry.bucket === "history");
  const bannerState = getBannerState({
    activeCount: activeEntries.length,
    needsAttentionCount: needsAttentionEntries.length,
  });
  const tone = resolveOrdersTone({
    needsAttentionCount: needsAttentionEntries.length,
    activeCount: activeEntries.length,
    openReturnsCount: openReturns.length,
  });
  const heroState = getHeroState({
    tone,
    activeCount: activeEntries.length,
    needsAttentionCount: needsAttentionEntries.length,
    openReturnsCount: openReturns.length,
    paymentReviewCount,
    nextAttentionEntry: needsAttentionEntries[0] ?? null,
    nextLiveEntry: inProgressEntries[0] ?? null,
  });
  const queueSummary = `${requests} requests - ${paymentReviewCount} payment checks - ${preparingOrders} preparing`;
  const activityPillText =
    activeEntries.length === 0 && openReturns.length > 0
      ? `${openReturns.length} return${openReturns.length === 1 ? "" : "s"} open`
      : tone === "idle"
        ? heroState.pill
        : queueSummary;

  const sections: OrderListSection[] = [
    {
      sectionKey: "needs_attention",
      title: "Needs attention",
      entries: needsAttentionEntries.map(mapAdminEntryToListSceneEntry),
    },
    {
      sectionKey: "in_progress",
      title: "In progress",
      entries: inProgressEntries.map(mapAdminEntryToListSceneEntry),
    },
    {
      sectionKey: "history",
      title: activeEntries.length === 0 ? "Orders" : "History",
      entries: historyEntries.map(mapAdminEntryToListSceneEntry),
    },
  ];

  return (
    <div className={styles.page}>
      <section
        className={cn(
          styles.hero,
          tone === "overloaded"
            ? styles.heroOverloaded
            : tone === "active"
              ? styles.heroActive
              : styles.heroIdle
        )}
      >
        <div>
          <p className={styles.heroEyebrow}>Order workflow</p>
          <h1 className={styles.heroTitle}>{heroState.title}</h1>
          <p className={styles.heroDetail}>{heroState.detail}</p>
        </div>

        <div className={styles.heroActions}>
          <SurfaceLink href={heroState.primaryActionHref} className={styles.primaryAction}>
            {heroState.primaryActionLabel}
          </SurfaceLink>
          <SurfaceLink
            href={heroState.secondaryActionHref}
            className={styles.secondaryAction}
          >
            {heroState.secondaryActionLabel}
          </SurfaceLink>
        </div>

        <div className={styles.activityPill}>{activityPillText}</div>

        <div className={styles.mobileQueueStrip}>
          <QueueAction
            href={needsAttentionEntries[0]?.href ?? "#needs_attention"}
            label="Needs attention"
            detail={
              needsAttentionEntries[0]
                ? `#${needsAttentionEntries[0].order.orderNumber}`
                : "Queue clear"
            }
            value={`${needsAttentionEntries.length}`}
            meta={needsAttentionEntries[0]?.action.label ?? "Open queue"}
            priority={needsAttentionEntries.length > 0}
          />
          <QueueAction
            href="/admin/payments"
            label="Payments"
            detail={
              paymentReviewCount > 0 ? "Money sent" : `${awaitingTransfer} awaiting`
            }
            value={`${paymentReviewCount}`}
            meta={paymentReviewCount > 0 ? "Review" : "Monitor"}
          />
          <QueueAction
            href={inProgressEntries[0]?.href ?? "#in_progress"}
            label="Live queue"
            detail={
              preparingOrders > 0 ? `${preparingOrders} preparing` : "Prep and dispatch"
            }
            value={`${inProgressEntries.length}`}
            meta={inProgressEntries[0] ? "Open" : "Queue"}
            priority={needsAttentionEntries.length === 0 && inProgressEntries.length > 0}
          />
        </div>
      </section>

      <div className="hidden md:block">
        <MetricRail
          items={[
            {
              label: "Active",
              value: `${activeOrders}`,
              detail: "Live",
              icon: Clock3,
            },
            {
              label: "Requests",
              value: `${requests}`,
              detail: "Pending",
              icon: CircleEllipsis,
            },
            {
              label: "Awaiting",
              value: `${awaitingTransfer}`,
              detail: "Transfer",
              icon: Landmark,
            },
            {
              label: "Preparing",
              value: `${preparingOrders}`,
              detail: "Orders",
              icon: PackageCheck,
              tone: "success",
            },
            {
              label: "Returns",
              value: `${openReturns.length}`,
              detail: "Open",
              icon: RotateCcw,
            },
          ]}
          columns={4}
        />
      </div>

      <OrderListScene
        banner={bannerState}
        sections={sections}
        emptyStateText="No orders available yet."
        wideMetaGrid
      />

      {openReturns.length > 0 ? (
        <section id="open-returns" className={styles.section}>
          <header className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Open returns</h2>
            <span className={styles.sectionCount}>{openReturns.length}</span>
          </header>

          <div className="grid gap-2 md:grid-cols-2 md:gap-3">
            {openReturns.map((returnCase) => (
              <article key={returnCase.returnCaseId} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <p className={styles.orderLabel}>Order #{returnCase.orderNumber}</p>
                    <p className={styles.orderTotal}>
                      {formatNgn(
                        returnCase.approvedRefundAmountNgn ??
                          returnCase.requestedRefundAmountNgn
                      )}
                    </p>
                  </div>
                  <span className={cn(styles.statusBadge, styles.statusDefault)}>
                    {formatStatusLabel(returnCase.status)}
                  </span>
                </div>

                <div className={styles.entryBody}>
                  <p className={styles.stageDetail}>{returnCase.reason}</p>
                  <div className={styles.metaRow}>
                    <CompactOrderStat label="Customer" value={returnCase.customerName} />
                    <CompactOrderStat label="Phone" value={returnCase.customerPhone} />
                  </div>

                  <div className={styles.cardFooter}>
                    <span className={styles.footerState}>
                      {formatDate(returnCase.requestedAt)}
                    </span>
                    <SurfaceLink
                      href={`/admin/orders/${returnCase.orderId}`}
                      className={styles.actionButton}
                    >
                      Open case
                    </SurfaceLink>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
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

function QueueAction({
  href,
  label,
  detail,
  value,
  meta,
  priority = false,
}: {
  href: string;
  label: string;
  detail: string;
  value: string;
  meta: string;
  priority?: boolean;
}) {
  return (
    <SurfaceLink
      href={href}
      className={cn(styles.queueAction, priority && styles.queueActionPriority)}
    >
      <div>
        <p className={styles.queueActionLabel}>{label}</p>
        <p className={styles.queueActionDetail}>{detail}</p>
      </div>
      <div>
        <p className={styles.queueActionValue}>{value}</p>
        <p className={styles.queueActionMeta}>{meta}</p>
      </div>
    </SurfaceLink>
  );
}

function SurfaceLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: ReactNode;
}) {
  if (href.startsWith("#")) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <RouteFeedbackLink href={href} className={className}>
      {children}
    </RouteFeedbackLink>
  );
}

