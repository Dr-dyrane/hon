import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/guards";
import { getAdminDeliveryBoardSnapshot } from "@/lib/db/repositories/delivery-repository";
import { buildAdminDeliveryLiveSnapshot } from "@/lib/delivery/snapshot";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAdminSession("/admin/delivery");
  const snapshot = await getAdminDeliveryBoardSnapshot({
    actorEmail: session.email,
  });

  return NextResponse.json(
    {
      ok: true,
      data: buildAdminDeliveryLiveSnapshot(snapshot),
    },
    { status: 200 }
  );
}
