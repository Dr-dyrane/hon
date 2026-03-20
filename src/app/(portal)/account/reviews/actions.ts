"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { submitPortalReview } from "@/lib/db/repositories/review-repository";
import type { ReviewActionState } from "@/lib/reviews/action-state";

export async function submitReviewAction(
  _previousState: ReviewActionState,
  formData: FormData
): Promise<ReviewActionState> {
  const session = await requireAuthenticatedSession("/account/reviews");
  const orderId = formData.get("orderId")?.toString();
  const rating = Number(formData.get("rating")?.toString() ?? "");
  const title = formData.get("title")?.toString() ?? null;
  const body = formData.get("body")?.toString() ?? null;

  if (!orderId) {
    return {
      status: "error",
      message: "Review is unavailable.",
    };
  }

  try {
    await submitPortalReview({
      email: session.email,
      orderId,
      rating,
      title,
      body,
    });

    revalidatePath("/account");
    revalidatePath("/account/reviews");
    revalidatePath("/admin/reviews");

    return {
      status: "success",
      message: "Saved.",
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unable to save review.",
    };
  }
}
