import Link from "next/link";
import { requireAdminSession } from "@/lib/auth/guards";
import { formatNgn } from "@/lib/commerce";
import { listPaymentsForAdmin } from "@/lib/db/repositories/orders-repository";
import {
  getPaymentReviewActionLabel,
  getPaymentStatusPresentation,
} from "@/lib/orders/presentation";
import { reviewPaymentQueueAction } from "./actions";
import styles from "./payments-page.module.css";

type PaymentsTone = "idle" | "active" | "overloaded";

type PaymentQueueEntry = Awaited<ReturnType<typeof listPaymentsForAdmin>>[number];

function formatTimestamp(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function availablePaymentActions(status: string) {
  if (status === "submitted") {
    return ["under_review", "confirmed", "rejected"] as const;
  }

  if (status === "under_review") {
    return ["confirmed", "rejected"] as const;
  }

  return [] as const;
}

function resolveTone(reviewQueueCount: number): PaymentsTone {
  if (reviewQueueCount >= 8) {
    return "overloaded";
  }

  if (reviewQueueCount > 0) {
    return "active";
  }

  return "idle";
}

function getHeroState(input: {
  tone: PaymentsTone;
  reviewQueueCount: number;
  awaitingTransferCount: number;
}) {
  const { tone, reviewQueueCount, awaitingTransferCount } = input;

  if (tone === "overloaded") {
    return {
      title: "Payment queue pressure is high.",
      detail: `${reviewQueueCount} payment${reviewQueueCount === 1 ? "" : "s"} need review right now. Confirm or reject before dispatch starts to lag.`,
      primaryActionHref: "#payment-queue",
      primaryActionLabel: "Review queue now",
      pill: "Escalated review queue",
    };
  }

  if (tone === "active") {
    return {
      title: `${reviewQueueCount} payment${reviewQueueCount === 1 ? "" : "s"} need review.`,
      detail: "Process money-sent items first, then monitor transfer windows.",
      primaryActionHref: "#payment-queue",
      primaryActionLabel: "Open review queue",
      pill: "Review queue active",
    };
  }

  if (awaitingTransferCount > 0) {
    return {
      title: "Review queue is clear.",
      detail: "No pending confirmations. Keep transfer windows visible in case new proofs arrive.",
      primaryActionHref: "#awaiting-transfer",
      primaryActionLabel: "View transfer windows",
      pill: "No pending review",
    };
  }

  return {
    title: "All payment flow clear.",
    detail: "No pending transfers or payment reviews right now.",
    primaryActionHref: "/admin/orders",
    primaryActionLabel: "Open order board",
    pill: "No payment queue",
  };
}

function getWorkflowState(input: {
  tone: PaymentsTone;
  reviewQueueCount: number;
}) {
  const { tone, reviewQueueCount } = input;

  if (tone === "overloaded") {
    return {
      title: "Triage confirmation queue.",
      detail: "Work from newest money-sent proofs through under-review items until the queue drops.",
      badge: "Overload",
      emptyDetail: "No review items right now. Keep an eye on newly submitted proofs.",
    };
  }

  if (tone === "active") {
    return {
      title: "Process payment confirmations.",
      detail: "Validate transfer details and push each payment to confirmed or rejected.",
      badge: "Active",
      emptyDetail: "No review items right now. Keep an eye on newly submitted proofs.",
    };
  }

  return {
    title: "No review queue.",
    detail: reviewQueueCount === 0
      ? "You can keep transfers monitored while focusing on requests and delivery."
      : "Queue activity is low.",
    badge: "Clear",
    emptyDetail: "No review items right now. Keep an eye on newly submitted proofs.",
  };
}

export default async function AdminPaymentsPage() {
  const session = await requireAdminSession("/admin/payments");
  const payments = await listPaymentsForAdmin(60, session.email);

  const reviewQueue = payments.filter(
    (payment) => payment.status === "submitted" || payment.status === "under_review"
  );
  const awaitingTransfer = payments.filter(
    (payment) => payment.status === "awaiting_transfer"
  );

  const underReviewCount = payments.filter((payment) => payment.status === "under_review").length;
  const submittedCount = payments.filter((payment) => payment.status === "submitted").length;
  const awaitingTransferCount = awaitingTransfer.length;
  const reviewQueueCount = reviewQueue.length;
  const tone = resolveTone(reviewQueueCount);
  const heroState = getHeroState({ tone, reviewQueueCount, awaitingTransferCount });
  const workflowState = getWorkflowState({ tone, reviewQueueCount });
  const queueSummary = `${underReviewCount} under review - ${submittedCount} submitted - ${awaitingTransferCount} awaiting transfer`;

  return (
    <div className={styles.page}>
      <section
        className={`${styles.hero} ${tone === "overloaded" ? styles.heroOverloaded : tone === "active" ? styles.heroActive : styles.heroIdle}`}
      >
        <p className={styles.heroEyebrow}>Payments overview</p>
        <h1 className={styles.heroTitle}>{heroState.title}</h1>
        <p className={styles.heroDetail}>{heroState.detail}</p>

        <div className={styles.heroActions}>
          <Link href={heroState.primaryActionHref} className={styles.primaryAction}>
            {heroState.primaryActionLabel}
          </Link>
          <Link href="/admin/orders" className={styles.secondaryAction}>
            Open orders
          </Link>
        </div>

        <div className={styles.activityPill}>
          {tone === "idle" ? heroState.pill : queueSummary}
        </div>
      </section>

      <section
        className={`${styles.primaryWorkflow} ${tone === "overloaded" ? styles.workflowOverloaded : tone === "active" ? styles.workflowActive : styles.workflowIdle}`}
      >
        <div className={styles.workflowHead}>
          <div>
            <p className={styles.panelEyebrow}>Primary workflow</p>
            <h2 className={styles.workflowTitle}>{workflowState.title}</h2>
            <p className={styles.workflowDetail}>{workflowState.detail}</p>
          </div>
          <span className={styles.workflowBadge}>{workflowState.badge}</span>
        </div>

        <div className={styles.workflowActionGrid}>
          <QueueAction
            href="#payment-queue"
            label="Review queue"
            detail="Submitted and under review"
            value={`${reviewQueueCount}`}
            actionLabel="Open"
          />
          <QueueAction
            href="#awaiting-transfer"
            label="Awaiting transfer"
            detail="Payment window still open"
            value={`${awaitingTransferCount}`}
            actionLabel="Monitor"
          />
          <QueueAction
            href="/admin/orders"
            label="Orders"
            detail="Accept and prep flow"
            value={`${payments.length}`}
            actionLabel="Open"
          />
        </div>
      </section>

      <section id="payment-queue" className={styles.queueSection}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Review queue</h2>
          <span className={styles.sectionCount}>{reviewQueueCount}</span>
        </header>

        {reviewQueueCount === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>{workflowState.emptyDetail}</p>
            <div className={styles.emptyActions}>
              <Link href="/admin/orders" className={styles.emptyAction}>
                Open order board
              </Link>
              <Link href="#awaiting-transfer" className={styles.emptyAction}>
                Check transfer windows
              </Link>
            </div>
          </div>
        ) : (
          <div className={styles.queueGrid}>
            {reviewQueue.map((payment) => (
              <PaymentCard key={payment.paymentId} payment={payment} />
            ))}
          </div>
        )}
      </section>

      <section id="awaiting-transfer" className={styles.archiveSection}>
        {awaitingTransferCount === 0 ? (
          <div className={styles.emptyArchive}>No transfer windows are open.</div>
        ) : (
          <details className={styles.archiveDisclosure} open={reviewQueueCount === 0}>
            <summary className={styles.archiveSummary}>
              <span className={styles.archiveTitle}>Awaiting transfer</span>
              <span className={styles.archiveBadge}>{awaitingTransferCount}</span>
            </summary>

            <div className={styles.queueGrid}>
              {awaitingTransfer.map((payment) => (
                <PaymentCard key={payment.paymentId} payment={payment} />
              ))}
            </div>
          </details>
        )}
      </section>
    </div>
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

function PaymentCard({ payment }: { payment: PaymentQueueEntry }) {
  const paymentState = getPaymentStatusPresentation(payment.status);
  const actions = availablePaymentActions(payment.status);

  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <p className={styles.cardOrder}>#{payment.orderNumber}</p>
          <p className={styles.cardStatusDetail}>{paymentState.detail}</p>
        </div>
        <span className={styles.statusBadge}>{paymentState.label}</span>
      </div>

      <div className={styles.amountRow}>
        <AmountStat label="Due" value={formatNgn(payment.expectedAmountNgn)} />
        <AmountStat
          label="Sent"
          value={
            payment.submittedAmountNgn !== null
              ? formatNgn(payment.submittedAmountNgn)
              : "Waiting"
          }
        />
      </div>

      <div className={styles.metaGrid}>
        <MetaItem
          label="Account"
          value={
            [payment.bankName, payment.accountNumber].filter(Boolean).join(" / ") || "Pending"
          }
        />
        <MetaItem label="Payer" value={payment.payerName ?? "Waiting for receipt"} />
        <MetaItem label="Submitted" value={formatTimestamp(payment.submittedAt)} />
        <MetaItem label="Deadline" value={formatTimestamp(payment.expiresAt)} />
      </div>

      <div className={styles.actionRow}>
        {actions.map((action) => (
          <form key={action} action={reviewPaymentQueueAction} className={styles.actionForm}>
            <input type="hidden" name="orderId" value={payment.orderId} />
            <input type="hidden" name="paymentId" value={payment.paymentId} />
            <button
              type="submit"
              name="action"
              value={action}
              className={
                action === "confirmed"
                  ? styles.primaryButton
                  : styles.secondaryButton
              }
            >
              {getPaymentReviewActionLabel(action)}
            </button>
          </form>
        ))}

        <Link href={`/admin/orders/${payment.orderId}`} className={styles.secondaryButton}>
          Open order
        </Link>
      </div>
    </article>
  );
}

function AmountStat({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.amountStat}>
      <p className={styles.amountLabel}>{label}</p>
      <p className={styles.amountValue}>{value}</p>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.metaItem}>
      <p className={styles.metaLabel}>{label}</p>
      <p className={styles.metaValue}>{value}</p>
    </div>
  );
}
