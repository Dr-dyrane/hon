"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { moderateReviewAction } from "@/app/(admin)/admin/reviews/actions";
import { INITIAL_REVIEW_ACTION_STATE } from "@/lib/reviews/action-state";
import styles from "./AdminReviewModerationCard.module.css";

export function AdminReviewModerationCard({
  reviewId,
  status,
  isFeatured,
}: {
  reviewId: string;
  status: string;
  isFeatured: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    moderateReviewAction,
    INITIAL_REVIEW_ACTION_STATE
  );

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <form action={formAction} className={styles.form}>
      <input type="hidden" name="reviewId" value={reviewId} />

      {status !== "approved" ? (
        <button
          type="submit"
          name="action"
          value="approve"
          disabled={pending}
          className={`${styles.button} ${styles.primaryButton}`}
        >
          Approve
        </button>
      ) : null}

      {status !== "hidden" ? (
        <button
          type="submit"
          name="action"
          value="hide"
          disabled={pending}
          className={`${styles.button} ${styles.secondaryButton}`}
        >
          Hide
        </button>
      ) : null}

      {status === "approved" ? (
        <button
          type="submit"
          name="action"
          value={isFeatured ? "unfeature" : "feature"}
          disabled={pending}
          className={`${styles.button} ${styles.secondaryButton}`}
        >
          {isFeatured ? "Unfeature" : "Feature"}
        </button>
      ) : null}

      {state.message ? <p className={styles.message}>{state.message}</p> : null}
    </form>
  );
}
