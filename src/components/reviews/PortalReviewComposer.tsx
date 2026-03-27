"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { submitReviewAction } from "@/app/(portal)/account/reviews/actions";
import { useFeedback } from "@/components/providers/FeedbackProvider";
import { ActionStatusMessage } from "@/components/ui/ActionStatusMessage";
import { INITIAL_REVIEW_ACTION_STATE } from "@/lib/reviews/action-state";
import styles from "./PortalReviewComposer.module.css";

export function PortalReviewComposer({
  orderId,
  orderNumber,
  completedAt,
}: {
  orderId: string;
  orderNumber: string;
  completedAt: string;
}) {
  const router = useRouter();
  const feedback = useFeedback();
  const [state, formAction, pending] = useActionState(
    submitReviewAction,
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
      className={styles.card}
      onSubmitCapture={() => feedback.selection()}
    >
      <input type="hidden" name="orderId" value={orderId} />

      <div className={styles.head}>
        <div>
          <p className={styles.orderNumber}>#{orderNumber}</p>
          <p className={styles.completedAt}>{completedAt}</p>
        </div>
        <select name="rating" defaultValue="5" className={styles.ratingSelect}>
          <option value="5">5 stars</option>
          <option value="4">4 stars</option>
          <option value="3">3 stars</option>
          <option value="2">2 stars</option>
          <option value="1">1 star</option>
        </select>
      </div>

      <div className={styles.fieldGrid}>
        <input type="text" name="title" placeholder="Title" className={styles.field} />
        <textarea
          name="body"
          rows={3}
          placeholder="Optional note"
          className={styles.field}
        />
      </div>

      {pending ? (
        <ActionStatusMessage tone="info">Submitting review...</ActionStatusMessage>
      ) : state.message ? (
        <ActionStatusMessage tone={state.status === "error" ? "error" : "success"}>
          {state.message}
        </ActionStatusMessage>
      ) : null}

      <div className={styles.footer}>
        <p className={styles.statusText}>
          {pending ? "Submitting..." : state.message ?? "Review"}
        </p>
        <button type="submit" disabled={pending} className={styles.submitButton}>
          {pending ? "Saving" : "Submit"}
        </button>
      </div>
    </form>
  );
}
