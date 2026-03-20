import { NextResponse } from "next/server";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { getPortalTrackingSnapshot } from "@/lib/db/repositories/delivery-repository";
import { createSseResponse } from "@/lib/realtime/sse";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await context.params;
  const session = await requireAuthenticatedSession(`/account/tracking/${orderId}`);
  const initialSnapshot = await getPortalTrackingSnapshot(session.email, orderId);

  if (!initialSnapshot) {
    return NextResponse.json(
      {
        ok: false,
        error: "Tracking not found.",
      },
      { status: 404 }
    );
  }

  return createSseResponse({
    request,
    event: "tracking",
    intervalMs: 10000,
    load: async () => {
      const snapshot = await getPortalTrackingSnapshot(session.email, orderId);

      if (!snapshot) {
        throw new Error("Tracking not found.");
      }

      return snapshot;
    },
  });
}
