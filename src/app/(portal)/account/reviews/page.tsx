import Link from "next/link";
import { PortalReviewComposer } from "@/components/reviews/PortalReviewComposer";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import {
  listPendingReviewsForPortal,
  listReviewsForPortal,
} from "@/lib/db/repositories/review-repository";
import styles from "./reviews-page.module.css";

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

export default async function ReviewsPage() {
  const session = await requireAuthenticatedSession("/account/reviews");
  const [pendingReviews, reviews] = await Promise.all([
    listPendingReviewsForPortal(session.email),
    listReviewsForPortal(session.email),
  ]);
  const approvedCount = reviews.filter((review) => review.status === "approved").length;

  const heroTitle =
    pendingReviews.length > 0
      ? `${pendingReviews.length} review${pendingReviews.length === 1 ? "" : "s"} ready to submit.`
      : reviews.length > 0
        ? "Reviews are up to date."
        : "No reviews yet.";
  const heroDetail =
    pendingReviews.length > 0
      ? "Share feedback for completed orders while details are fresh."
      : reviews.length > 0
        ? "You can review new completed orders as they appear."
        : "Complete an order first, then submit your first review.";
  const activitySummary = `${pendingReviews.length} pending - ${reviews.length} sent - ${approvedCount} approved`;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.heroEyebrow}>Reviews</p>
        <h1 className={styles.heroTitle}>{heroTitle}</h1>
        <p className={styles.heroDetail}>{heroDetail}</p>

        <div className={styles.heroActions}>
          <Link
            href={
              pendingReviews.length > 0
                ? "/account/reviews#pending-reviews"
                : "/account/orders"
            }
            className={styles.primaryAction}
          >
            {pendingReviews.length > 0 ? "Review now" : "Open orders"}
          </Link>
          <Link href="/account/orders" className={styles.secondaryAction}>
            Order flow
          </Link>
        </div>

        <div className={styles.activityPill}>{activitySummary}</div>
      </section>

      <section id="pending-reviews" className={styles.workflow}>
        <div className={styles.workflowHead}>
          <div>
            <p className={styles.panelEyebrow}>Primary workflow</p>
            <h2 className={styles.workflowTitle}>
              {pendingReviews.length > 0 ? "Submit pending reviews." : "No pending reviews."}
            </h2>
            <p className={styles.workflowDetail}>
              {pendingReviews.length > 0
                ? "Rate completed orders and leave optional notes."
                : "New review prompts will appear after delivered orders."}
            </p>
          </div>
          <span className={styles.workflowBadge}>
            {pendingReviews.length > 0 ? "Needs action" : "Clear"}
          </span>
        </div>

        {pendingReviews.length === 0 ? (
          <div className={styles.emptyWorkflow}>
            <p className={styles.emptyWorkflowText}>Nothing to rate right now.</p>
            <Link href="/account/orders" className={styles.emptyWorkflowAction}>
              View orders
            </Link>
          </div>
        ) : (
          <div className={styles.pendingGrid}>
            {pendingReviews.map((request) => (
              <PortalReviewComposer
                key={request.requestId}
                orderId={request.orderId}
                orderNumber={request.orderNumber}
                completedAt={formatTimestamp(request.completedAt)}
              />
            ))}
          </div>
        )}
      </section>

      <section className={styles.archiveSection}>
        <header className={styles.archiveHead}>
          <h2 className={styles.archiveTitle}>Sent reviews</h2>
          <span className={styles.archiveBadge}>{reviews.length}</span>
        </header>

        {reviews.length === 0 ? (
          <div className={styles.emptyArchive}>No reviews submitted yet.</div>
        ) : (
          <div className={styles.archiveGrid}>
            {reviews.map((review) => (
              <article key={review.reviewId} className={styles.reviewCard}>
                <div className={styles.reviewCardHead}>
                  <div>
                    <p className={styles.reviewOrder}>#{review.orderNumber}</p>
                    <p className={styles.reviewRating}>{review.rating}/5</p>
                  </div>
                  <div className={styles.reviewTags}>
                    <span className={styles.reviewTag}>{formatStatusLabel(review.status)}</span>
                    {review.isFeatured ? (
                      <span className={styles.reviewTag}>Featured</span>
                    ) : null}
                  </div>
                </div>

                {review.title ? <p className={styles.reviewTitle}>{review.title}</p> : null}
                {review.body ? <p className={styles.reviewBody}>{review.body}</p> : null}
                <p className={styles.reviewTime}>{formatTimestamp(review.createdAt)}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

