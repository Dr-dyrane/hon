"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { moderateReviewAction } from "@/app/(admin)/admin/reviews/actions";
import { useFeedback } from "@/components/providers/FeedbackProvider";
import { ActionStatusMessage } from "@/components/ui/ActionStatusMessage";
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
  const feedback = useFeedback();
  const [state, formAction, pending] = useActionState(
    moderateReviewAction,
    INITIAL_REVIEW_ACTION_STATE
  );

  useEffect(() => {
    if (state.status === "success") {
      feedback.success();
      router.refresh();
      return;
    }

    if (state.status === "error") {
      feedback.blocked();
    }
  }, [feedback, router, state.status]);

  return (
    <form
      action={formAction}
      className={styles.form}
      onSubmitCapture={() => feedback.selection()}
    >
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

      {pending ? (
        <ActionStatusMessage tone="info">Saving moderation update...</ActionStatusMessage>
      ) : state.message ? (
        <ActionStatusMessage tone={state.status === "error" ? "error" : "success"}>
          {state.message}
        </ActionStatusMessage>
      ) : null}
    </form>
  );
}
