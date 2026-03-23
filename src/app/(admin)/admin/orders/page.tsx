import Link from "next/link";
import { CircleEllipsis, Clock3, Landmark, PackageCheck, RotateCcw } from "lucide-react";
import { MetricRail } from "@/components/admin/MetricRail";
import {
  OrderListScene,
  type OrderListBannerState,
  type OrderListEntry,
  type OrderListSection,
} from "@/components/orders/OrderListScene";
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

export default async function AdminOrdersPage() {
  const session = await requireAdminSession("/admin/orders");
  const [orders, openReturns] = await Promise.all([
    listOrdersForAdmin(50, session.email),
    listOpenOrderReturnCasesForAdmin(12, session.email),
  ]);

  const requests = orders.filter((order) => order.status === "checkout_draft").length;
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
    <div className="space-y-6 pb-20 md:space-y-8">
      <section className="space-y-5">
        <div className="rounded-[24px] bg-system-fill/42 p-1.5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] md:inline-flex">
          <div className="grid grid-cols-2 gap-1.5">
            <QuickLink href="/admin/orders" label="Orders" />
            <QuickLink href="/admin/payments" label="Payments" />
          </div>
        </div>

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
      </section>

      <OrderListScene
        banner={bannerState}
        sections={sections}
        emptyStateText="No orders available yet."
        wideMetaGrid
      />

      {openReturns.length > 0 ? (
        <section className={styles.section}>
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
                    <Link href={`/admin/orders/${returnCase.orderId}`} className={styles.actionButton}>
                      Open case
                    </Link>
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

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-[40px] items-center justify-center rounded-[18px] px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-label transition-colors duration-200 hover:bg-[color:var(--surface)] hover:shadow-soft"
    >
      {label}
    </Link>
  );
}

