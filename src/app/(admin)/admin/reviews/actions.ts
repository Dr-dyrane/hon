"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/guards";
import { ensureUserByEmail } from "@/lib/db/repositories/user-repository";
import { moderateReview } from "@/lib/db/repositories/review-repository";
import type { ReviewActionState } from "@/lib/reviews/action-state";

export async function moderateReviewAction(
  _previousState: ReviewActionState,
  formData: FormData
): Promise<ReviewActionState> {
  const session = await requireAdminSession("/admin/reviews");
  const reviewId = formData.get("reviewId")?.toString();
  const action = formData.get("action")?.toString();

  if (!reviewId || !action) {
    return {
      status: "error",
      message: "Review is unavailable.",
    };
  }

  if (!["approve", "hide", "feature", "unfeature"].includes(action)) {
    return {
      status: "error",
      message: "Unsupported action.",
    };
  }

  try {
    const actor = await ensureUserByEmail(session.email);

    await moderateReview({
      reviewId,
      action: action as "approve" | "hide" | "feature" | "unfeature",
      actorUserId: actor?.userId ?? null,
      actorEmail: session.email,
    });

    revalidatePath("/account");
    revalidatePath("/account/reviews");
    revalidatePath("/admin/reviews");

    return {
      status: "success",
      message: "Updated.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to update review.",
    };
  }
}
