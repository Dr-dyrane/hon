"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { moderateReviewAction } from "@/app/(admin)/admin/reviews/actions";
import { INITIAL_REVIEW_ACTION_STATE } from "@/lib/reviews/action-state";

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
    <form action={formAction} className="mt-4 flex flex-wrap items-center gap-2">
      <input type="hidden" name="reviewId" value={reviewId} />

      {status !== "approved" ? (
        <button
          type="submit"
          name="action"
          value="approve"
          disabled={pending}
          className="button-secondary min-h-[40px] px-4 text-[10px] font-semibold uppercase tracking-headline disabled:translate-y-0 disabled:shadow-none"
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
          className="rounded-full bg-system-background px-4 py-2 text-[10px] font-semibold uppercase tracking-headline text-secondary-label transition-colors duration-300 hover:text-label disabled:text-secondary-label"
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
          className="rounded-full bg-system-background px-4 py-2 text-[10px] font-semibold uppercase tracking-headline text-secondary-label transition-colors duration-300 hover:text-label disabled:text-secondary-label"
        >
          {isFeatured ? "Unfeature" : "Feature"}
        </button>
      ) : null}

      {state.message ? (
        <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
          {state.message}
        </div>
      ) : null}
    </form>
  );
}
