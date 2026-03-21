import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { markWorkspaceNotificationsRead } from "@/lib/db/repositories/notification-preferences-repository";

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { notificationIds?: string[]; notificationId?: string }
    | null;
  const notificationIds = Array.from(
    new Set(
      [
        ...(body?.notificationIds ?? []),
        ...(body?.notificationId ? [body.notificationId] : []),
      ].filter(Boolean)
    )
  );

  if (notificationIds.length === 0) {
    return NextResponse.json({ ok: false, error: "Notification reference required." }, { status: 400 });
  }

  await markWorkspaceNotificationsRead(session.email, notificationIds, session.role);

  return NextResponse.json({ ok: true });
}
