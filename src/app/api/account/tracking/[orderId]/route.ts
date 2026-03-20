import { NextResponse } from "next/server";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { getPortalTrackingSnapshot } from "@/lib/db/repositories/delivery-repository";

export async function GET(
  _request: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await context.params;
  const session = await requireAuthenticatedSession(`/account/tracking/${orderId}`);
  const snapshot = await getPortalTrackingSnapshot(session.email, orderId);

  if (!snapshot) {
    return NextResponse.json(
      {
        ok: false,
        error: "Tracking not found.",
      },
      { status: 404 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      data: snapshot,
    },
    { status: 200 }
  );
}
