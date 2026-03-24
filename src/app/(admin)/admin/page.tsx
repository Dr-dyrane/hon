import type { ReactNode } from "react";
import Link from "next/link";
import { Landmark } from "lucide-react";
import { requireAdminSession } from "@/lib/auth/guards";
import { formatNgn } from "@/lib/commerce";
import {
  getAdminOverviewSnapshot,
  getAdminOverviewMetrics,
} from "@/lib/db/repositories/admin-repository";
import { listAllAdminCatalogProducts } from "@/lib/db/repositories/catalog-admin-repository";
import { listOrdersForAdmin } from "@/lib/db/repositories/orders-repository";
import { getOrderStagePresentation } from "@/lib/orders/presentation";
import { cn } from "@/lib/utils";
import styles from "./overview-page.module.css";

type OverviewTone = "idle" | "active" | "overloaded";

const PRIORITY_STATUSES = new Set([
  "checkout_draft",
  "payment_submitted",
  "payment_under_review",
]);

function resolvePrimaryAction(input: {
  requestQueue: number;
  paymentReviewQueue: number;
  dispatchQueue: number;
}) {
  if (input.requestQueue > 0) {
    return {
      href: "/admin/orders",
      label: "Review requests",
    };
  }

  if (input.paymentReviewQueue > 0) {
    return {
      href: "/admin/payments",
      label: "Review payments",
    };
  }

  if (input.dispatchQueue > 0) {
    return {
      href: "/admin/delivery",
      label: "Open dispatch",
    };
  }

  return {
    href: "/admin/orders",
    label: "Open order board",
  };
}

function resolveOverviewTone(needsActionCount: number): OverviewTone {
  if (needsActionCount >= 8) {
    return "overloaded";
  }

  if (needsActionCount > 0) {
    return "active";
  }

  return "idle";
}

function getHeroState(tone: OverviewTone, needsActionCount: number) {
  if (tone === "overloaded") {
    return {
      title: "Queue pressure is high.",
      detail: `${needsActionCount} items are blocking flow. Triage requests and payment checks before dispatch.`,
      pill: "Escalated queue",
    };
  }

  if (tone === "active") {
    return {
      title: `${needsActionCount} queue item${needsActionCount === 1 ? "" : "s"} need action.`,
      detail: "Clear requests and payment checks first, then move through dispatch.",
      pill: "Queue active",
    };
  }

  return {
    title: "All systems clear.",
    detail: "No pending requests, payments, or dispatch activity.",
    pill: "No pending queue",
  };
}

function getWorkflowState(tone: OverviewTone) {
  if (tone === "overloaded") {
    return {
      title: "Triage queue pressure now.",
      detail: "Work requests, payment review, and dispatch in sequence until pressure drops.",
      badge: "Overload",
      emptyDetail:
        "No urgent orders are pinned right now. Keep catalog and layout updates ready while monitoring queue changes.",
    };
  }

  if (tone === "active") {
    return {
      title: "Process the queue now.",
      detail: "Prioritize request approvals and payment checks before dispatch actions.",
      badge: "Active",
      emptyDetail:
        "No urgent orders are pinned right now. Continue with catalog and layout quality checks.",
    };
  }

  return {
    title: "Queue is clear.",
    detail: "You can proceed with catalog updates or layout adjustments.",
    badge: "Clear",
    emptyDetail:
      "No urgent orders right now. Continue with catalog and layout quality checks.",
  };
}

export default async function AdminPage() {
  const session = await requireAdminSession("/admin");
  const [metrics, snapshot, products, orders] = await Promise.all([
    getAdminOverviewMetrics(),
    getAdminOverviewSnapshot(),
    listAllAdminCatalogProducts(),
    listOrdersForAdmin(20, session.email),
  ]);

  const requestQueue = snapshot.requestQueue;
  const paymentReviewQueue = snapshot.paymentReviewQueue;
  const preparingQueue = snapshot.preparingQueue;
  const outForDeliveryQueue = snapshot.outForDeliveryQueue;
  const dispatchQueue = preparingQueue + outForDeliveryQueue;
  const needsActionCount = requestQueue + paymentReviewQueue + dispatchQueue;
  const awaitingTransferAmountNgn = snapshot.awaitingTransferAmountNgn;
  const reviewAmountNgn = snapshot.reviewAmountNgn;
  const queueValueNgn = awaitingTransferAmountNgn + reviewAmountNgn;
  const liveCatalogCount = products.filter((product) => product.isAvailable).length;
  const featuredCount = products.filter(
    (product) => product.merchandisingState === "featured"
  ).length;
  const primaryAction = resolvePrimaryAction({
    requestQueue,
    paymentReviewQueue,
    dispatchQueue,
  });
  const priorityOrders = orders
    .filter((order) => PRIORITY_STATUSES.has(order.status))
    .slice(0, 3);
  const overviewTone = resolveOverviewTone(needsActionCount);
  const heroState = getHeroState(overviewTone, needsActionCount);
  const workflowState = getWorkflowState(overviewTone);
  const queueSummary = `${requestQueue} requests - ${paymentReviewQueue} payments - ${dispatchQueue} dispatch`;

  return (
    <div className={styles.page}>
      <section
        className={cn(
          styles.hero,
          overviewTone === "overloaded"
            ? styles.heroOverloaded
            : overviewTone === "active"
              ? styles.heroActive
              : styles.heroIdle
        )}
      >
        <p className={styles.heroEyebrow}>Operations overview</p>
        <h1 className={styles.heroTitle}>{heroState.title}</h1>
        <p className={styles.heroDetail}>{heroState.detail}</p>

        <div className={styles.heroActions}>
          <Link
            href={primaryAction.href}
            className={styles.primaryAction}
            data-tour-id="admin-overview-primary-action"
          >
            {primaryAction.label}
          </Link>
          <Link href="/admin/delivery" className={styles.secondaryAction}>
            Delivery board
          </Link>
        </div>

        <div className={styles.activityPill}>
          {overviewTone === "idle" ? heroState.pill : queueSummary}
        </div>
      </section>

      <section
        className={cn(
          styles.primaryWorkflow,
          overviewTone === "overloaded"
            ? styles.workflowOverloaded
            : overviewTone === "active"
              ? styles.workflowActive
              : styles.workflowIdle
        )}
      >
        <div className={styles.workflowHead}>
          <div>
            <p className={styles.panelEyebrow}>Primary workflow</p>
            <h2 className={styles.workflowTitle}>{workflowState.title}</h2>
            <p className={styles.workflowDetail}>{workflowState.detail}</p>
          </div>
          <span className={styles.workflowBadge}>{workflowState.badge}</span>
        </div>

        <div className={styles.workflowActionGrid} data-tour-id="admin-overview-queue-grid">
          <QueueAction
            href="/admin/orders"
            label="Requests"
            detail="Waiting approval"
            value={`${requestQueue}`}
            actionLabel="View board"
          />
          <QueueAction
            href="/admin/payments"
            label="Payments"
            detail="Waiting review"
            value={`${paymentReviewQueue}`}
            actionLabel="Open review"
          />
          <QueueAction
            href="/admin/delivery"
            label="Dispatch"
            detail="Preparing and out"
            value={`${dispatchQueue}`}
            actionLabel="Open delivery"
          />
        </div>

        {priorityOrders.length > 0 ? (
          <>
            <p className={styles.prioritySectionTitle}>Priority orders</p>
            <div className={styles.priorityStack}>
              {priorityOrders.map((order) => {
                const stage = getOrderStagePresentation(order);

                return (
                  <Link
                    key={order.orderId}
                    href={`/admin/orders/${order.orderId}`}
                    className={styles.priorityOrder}
                  >
                    <div className={styles.priorityOrderMain}>
                      <p className={styles.priorityOrderLabel}>#{order.orderNumber}</p>
                      <p className={styles.priorityOrderStage}>{stage.label}</p>
                    </div>
                    <span className={styles.priorityOrderMeta}>Open</span>
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          <div className={styles.emptyWorkflow}>
            <p className={styles.emptyWorkflowText}>{workflowState.emptyDetail}</p>
            <div className={styles.emptyWorkflowActions}>
              <Link href="/admin/catalog/products" className={styles.emptyWorkflowAction}>
                Open catalog
              </Link>
              <Link href="/admin/layout" className={styles.emptyWorkflowAction}>
                Open layout
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className={styles.archiveGrid}>
        <OverviewPanel title="Cash" badge="Snapshot">
          <div className={styles.cashHeadline}>
            <p className={styles.cashValue}>{formatNgn(snapshot.grossLast7dNgn)}</p>
            <p className={styles.cashCaption}>Last 7 days gross</p>
          </div>

          <details className={styles.disclosure}>
            <summary className={styles.disclosureSummary}>Details</summary>
            <div className={styles.disclosureBody}>
              <StatRow label="Last 24h gross" value={formatNgn(snapshot.grossLast24hNgn)} />
              <StatRow label="Queue value" value={formatNgn(queueValueNgn)} />
              <StatRow
                label="Awaiting transfer"
                value={formatNgn(awaitingTransferAmountNgn)}
              />
              <StatRow label="In review" value={formatNgn(reviewAmountNgn)} />
            </div>
          </details>

          <Link href="/admin/payments" className={styles.archiveAction}>
            <span className={styles.surfaceActionLabel}>Open payments</span>
            <Landmark className={styles.surfaceActionIcon} />
          </Link>
        </OverviewPanel>

        <OverviewPanel title="Control center" badge={`${needsActionCount}`}>
          <div className={styles.controlMetricGrid}>
            <ActionMetricRow
              href="/admin/catalog/products"
              label="Catalog"
              value={`${liveCatalogCount} available`}
              action="Manage"
            />
            <ActionMetricRow
              href="/admin/catalog/products?merchandising=featured"
              label="Featured"
              value={`${featuredCount} picks`}
              action="Edit"
            />
            <ActionMetricRow
              href="/admin/layout"
              label="Layout"
              value={`${metrics.enabledHomeSections} sections live`}
              action="Open"
            />

            <StatRow
              label="Home version"
              value={metrics.homeVersionLabel?.trim() || "Unlabeled"}
            />
          </div>

          <div className={styles.archiveSubGrid}>
            <Link href="/admin/catalog/taxonomy" className={styles.archiveSubAction}>
              <span className={styles.surfaceActionLabel}>Taxonomy</span>
              <span className={styles.surfaceActionMeta}>Stack page</span>
            </Link>
            <Link href="/admin/settings/team" className={styles.archiveSubAction}>
              <span className={styles.surfaceActionLabel}>Team</span>
              <span className={styles.surfaceActionMeta}>Stack page</span>
            </Link>
          </div>
        </OverviewPanel>
      </section>
    </div>
  );
}

function OverviewPanel({
  title,
  badge,
  children,
}: {
  title: string;
  badge: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.archivePanel}>
      <div className={styles.archivePanelHead}>
        <h2 className={styles.archivePanelTitle}>{title}</h2>
        <span className={styles.archivePanelBadge}>{badge}</span>
      </div>
      <div className={styles.archivePanelBody}>{children}</div>
    </section>
  );
}

function QueueAction({
  href,
  label,
  detail,
  value,
  actionLabel,
}: {
  href: string;
  label: string;
  detail: string;
  value: string;
  actionLabel: string;
}) {
  return (
    <Link href={href} className={styles.workflowAction}>
      <div className={styles.workflowActionMain}>
        <p className={styles.workflowActionLabel}>{label}</p>
        <p className={styles.workflowActionDetail}>{detail}</p>
      </div>
      <div className={styles.workflowActionSide}>
        <span className={styles.workflowActionValue}>{value}</span>
        <span className={styles.workflowActionMeta}>{actionLabel}</span>
      </div>
    </Link>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.statRow}>
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statValue}>{value}</p>
    </div>
  );
}

function ActionMetricRow({
  href,
  label,
  value,
  action,
}: {
  href: string;
  label: string;
  value: string;
  action: string;
}) {
  return (
    <Link href={href} className={styles.actionMetricRow}>
      <div className={styles.actionMetricMain}>
        <p className={styles.actionMetricLabel}>{label}</p>
        <p className={styles.actionMetricValue}>{value}</p>
      </div>
      <span className={styles.actionMetricMeta}>{action}</span>
    </Link>
  );
}
