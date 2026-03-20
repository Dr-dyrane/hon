"use server";

import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { preparePortalReorder } from "@/lib/db/repositories/orders-repository";

export async function prepareReorderAction(orderId: string) {
  const session = await requireAuthenticatedSession("/account/reorder");

  try {
    const result = await preparePortalReorder(session.email, orderId);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
