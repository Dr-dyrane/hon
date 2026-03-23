import Link from "next/link";
import { AdminReviewModerationCard } from "@/components/reviews/AdminReviewModerationCard";
import { requireAdminSession } from "@/lib/auth/guards";
import { listReviewsForAdmin } from "@/lib/db/repositories/review-repository";
import styles from "./reviews-page.module.css";

type ReviewsTone = "idle" | "active" | "overloaded";
type AdminReviewEntry = Awaited<ReturnType<typeof listReviewsForAdmin>>[number];

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

function resolveTone(pendingCount: number): ReviewsTone {
  if (pendingCount >= 6) {
    return "overloaded";
  }

  if (pendingCount > 0) {
    return "active";
  }

  return "idle";
}

function getHeroState(input: {
  tone: ReviewsTone;
  pendingCount: number;
  approvedCount: number;
  featuredCount: number;
}) {
  const { tone, pendingCount, approvedCount, featuredCount } = input;

  if (tone === "overloaded") {
    return {
      title: "Moderation queue pressure is high.",
      detail: `${pendingCount} reviews are waiting. Approve or hide submissions before queue freshness drops.`,
      primaryActionHref: "#moderation-queue",
      primaryActionLabel: "Moderate now",
      pill: "Escalated review queue",
    };
  }

  if (tone === "active") {
    return {
      title: `${pendingCount} review${pendingCount === 1 ? "" : "s"} need moderation.`,
      detail: "Process pending reviews first, then tune featured picks.",
      primaryActionHref: "#moderation-queue",
      primaryActionLabel: "Open moderation queue",
      pill: "Moderation queue active",
    };
  }

  if (approvedCount > 0 || featuredCount > 0) {
    return {
      title: "Moderation queue is clear.",
      detail: "Published reviews are stable. Keep featured picks aligned with storefront priorities.",
      primaryActionHref: "#review-archive",
      primaryActionLabel: "Open published reviews",
      pill: "No pending moderation",
    };
  }

  return {
    title: "No reviews yet.",
    detail: "Published customer feedback will appear here after delivered orders are rated.",
    primaryActionHref: "/admin/orders",
    primaryActionLabel: "Open order board",
    pill: "Awaiting first reviews",
  };
}

function getWorkflowState(input: {
  tone: ReviewsTone;
  pendingCount: number;
}) {
  const { tone, pendingCount } = input;

  if (tone === "overloaded") {
    return {
      title: "Triage moderation queue.",
      detail: "Work through pending feedback first, then return to featured curation.",
      badge: "Overload",
      emptyDetail: "No pending reviews right now. Continue with featured and visibility checks.",
    };
  }

  if (tone === "active") {
    return {
      title: "Process pending reviews.",
      detail: "Approve high-quality feedback and hide anything that should stay off storefront surfaces.",
      badge: "Active",
      emptyDetail: "No pending reviews right now. Continue with featured and visibility checks.",
    };
  }

  return {
    title: "No moderation queue.",
    detail:
      pendingCount === 0
        ? "You can focus on featured selection and catalog quality."
        : "Queue activity is low.",
    badge: "Clear",
    emptyDetail: "No pending reviews right now. Continue with featured and visibility checks.",
  };
}

function getStatusTone(status: string) {
  if (status === "pending") {
    return "priority" as const;
  }

  if (status === "approved") {
    return "success" as const;
  }

  return "default" as const;
}

export default async function AdminReviewsPage() {
  const session = await requireAdminSession("/admin/reviews");
  const reviews = await listReviewsForAdmin(session.email);

  const moderationQueue = reviews.filter((review) => review.status === "pending");
  const archiveReviews = reviews.filter((review) => review.status !== "pending");

  const pendingCount = moderationQueue.length;
  const approvedCount = reviews.filter((review) => review.status === "approved").length;
  const featuredCount = reviews.filter((review) => review.isFeatured).length;
  const hiddenCount = reviews.filter((review) => review.status === "hidden").length;

  const tone = resolveTone(pendingCount);
  const heroState = getHeroState({ tone, pendingCount, approvedCount, featuredCount });
  const workflowState = getWorkflowState({ tone, pendingCount });
  const queueSummary = `${pendingCount} pending - ${approvedCount} approved - ${featuredCount} featured`;

  return (
    <div className={styles.page}>
      <section
        className={`${styles.hero} ${tone === "overloaded" ? styles.heroOverloaded : tone === "active" ? styles.heroActive : styles.heroIdle}`}
      >
        <p className={styles.heroEyebrow}>Reviews overview</p>
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
            href="#moderation-queue"
            label="Pending"
            detail="Waiting moderation"
            value={`${pendingCount}`}
            actionLabel="Open"
          />
          <QueueAction
            href="#review-archive"
            label="Approved"
            detail="Published feedback"
            value={`${approvedCount}`}
            actionLabel="Review"
          />
          <QueueAction
            href="#review-archive"
            label="Featured"
            detail="Promoted picks"
            value={`${featuredCount}`}
            actionLabel="Tune"
          />
        </div>
      </section>

      <section id="moderation-queue" className={styles.queueSection}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Moderation queue</h2>
          <span className={styles.sectionCount}>{pendingCount}</span>
        </header>

        {pendingCount === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>{workflowState.emptyDetail}</p>
            <div className={styles.emptyActions}>
              <Link href="#review-archive" className={styles.emptyAction}>
                Open published reviews
              </Link>
              <Link href="/admin/orders" className={styles.emptyAction}>
                Open order board
              </Link>
            </div>
          </div>
        ) : (
          <div className={styles.cardGrid}>
            {moderationQueue.map((review) => (
              <ReviewCard key={review.reviewId} review={review} priority />
            ))}
          </div>
        )}
      </section>

      <section id="review-archive" className={styles.archiveSection}>
        {archiveReviews.length === 0 ? (
          <div className={styles.emptyArchive}>No published or hidden reviews yet.</div>
        ) : (
          <details className={styles.archiveDisclosure} open={pendingCount === 0}>
            <summary className={styles.archiveSummary}>
              <span className={styles.archiveTitle}>Published and hidden</span>
              <span className={styles.archiveBadge}>{archiveReviews.length}</span>
            </summary>

            <div className={styles.archiveMetaRow}>
              <ArchiveMetaItem label="Approved" value={`${approvedCount}`} />
              <ArchiveMetaItem label="Hidden" value={`${hiddenCount}`} />
              <ArchiveMetaItem label="Featured" value={`${featuredCount}`} />
            </div>

            <div className={styles.cardGrid}>
              {archiveReviews.map((review) => (
                <ReviewCard key={review.reviewId} review={review} />
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

function ReviewCard({
  review,
  priority = false,
}: {
  review: AdminReviewEntry;
  priority?: boolean;
}) {
  const statusTone = getStatusTone(review.status);

  return (
    <article className={`${styles.reviewCard} ${priority ? styles.reviewCardPriority : ""}`}>
      <div className={styles.reviewHead}>
        <div>
          <p className={styles.reviewOrder}>#{review.orderNumber}</p>
          <p className={styles.reviewRating}>{review.rating}/5</p>
        </div>

        <div className={styles.reviewTags}>
          <span
            className={`${styles.reviewTag} ${statusTone === "priority" ? styles.reviewTagPriority : statusTone === "success" ? styles.reviewTagSuccess : styles.reviewTagDefault}`}
          >
            {formatStatusLabel(review.status)}
          </span>
          {review.isFeatured ? <span className={styles.reviewTag}>Featured</span> : null}
        </div>
      </div>

      <div className={styles.metaGrid}>
        <MetaItem label="Customer" value={review.customerName} />
        <MetaItem label="Email" value={review.customerEmail ?? "No email"} />
        <MetaItem label="Created" value={formatTimestamp(review.createdAt)} />
        <MetaItem
          label="Moderated"
          value={review.moderatedAt ? formatTimestamp(review.moderatedAt) : "-"}
        />
      </div>

      {review.title ? <p className={styles.reviewTitle}>{review.title}</p> : null}
      {review.body ? <p className={styles.reviewBody}>{review.body}</p> : null}

      <div className={styles.reviewFooter}>
        <Link href={`/admin/orders/${review.orderId}`} className={styles.openOrderAction}>
          Open order
        </Link>
        <div className={styles.moderationWrap}>
          <AdminReviewModerationCard
            reviewId={review.reviewId}
            status={review.status}
            isFeatured={review.isFeatured}
          />
        </div>
      </div>
    </article>
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

function ArchiveMetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.archiveMetaItem}>
      <p className={styles.archiveMetaLabel}>{label}</p>
      <p className={styles.archiveMetaValue}>{value}</p>
    </div>
  );
}
