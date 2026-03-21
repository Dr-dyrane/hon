import "server-only";

import { isDatabaseConfigured, query, withTransaction } from "@/lib/db/client";
import { ensureUserByEmail } from "@/lib/db/repositories/user-repository";
import type {
  WorkspaceNotification,
  WorkspaceNotificationPreference,
} from "@/lib/db/types";

const DEFAULT_PREFERENCE: WorkspaceNotificationPreference = {
  workspaceEmailEnabled: true,
  workspaceInAppEnabled: true,
  workspacePushEnabled: false,
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function resolveUserId(email: string) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !isDatabaseConfigured()) {
    return null;
  }

  const result = await query<{ userId: string }>(
    `
      select id as "userId"
      from app.users
      where lower(email::text) = $1
      limit 1
    `,
    [normalizedEmail]
  );

  return result.rows[0]?.userId ?? null;
}

export async function getWorkspaceNotificationPreference(email: string) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !isDatabaseConfigured()) {
    return DEFAULT_PREFERENCE;
  }

  const result = await query<WorkspaceNotificationPreference>(
    `
      with matched_user as (
        select id
        from app.users
        where lower(email::text) = $1
        limit 1
      )
      select
        np.workspace_email_enabled as "workspaceEmailEnabled",
        np.workspace_in_app_enabled as "workspaceInAppEnabled",
        np.workspace_push_enabled as "workspacePushEnabled"
      from matched_user mu
      left join app.notification_preferences np
        on np.user_id = mu.id
      limit 1
    `,
    [normalizedEmail]
  );

  return result.rows[0] ?? DEFAULT_PREFERENCE;
}

export async function saveWorkspaceNotificationPreference(
  email: string,
  input: WorkspaceNotificationPreference,
  role: "customer" | "admin" = "customer"
) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !isDatabaseConfigured()) {
    throw new Error("Notification preferences are unavailable.");
  }

  const user = await ensureUserByEmail(normalizedEmail);

  if (!user) {
    throw new Error("Notification preferences are unavailable.");
  }

  await withTransaction(async (queryFn) => {
    await queryFn(
      `
        insert into app.notification_preferences (
          user_id,
          workspace_email_enabled,
          workspace_in_app_enabled,
          workspace_push_enabled
        )
        values ($1, $2, $3, $4)
        on conflict (user_id)
        do update set
          workspace_email_enabled = excluded.workspace_email_enabled,
          workspace_in_app_enabled = excluded.workspace_in_app_enabled,
          workspace_push_enabled = excluded.workspace_push_enabled,
          updated_at = timezone('utc', now())
      `,
      [
        user.userId,
        input.workspaceEmailEnabled,
        input.workspaceInAppEnabled,
        input.workspacePushEnabled,
      ]
    );
  }, {
    actor: {
      userId: user.userId,
      email: normalizedEmail,
      role,
    },
  });
}

export async function applyWorkspaceNotificationState(
  email: string,
  notifications: Array<Omit<WorkspaceNotification, "isRead">>
) {
  const preference = await getWorkspaceNotificationPreference(email);

  if (!preference.workspaceInAppEnabled) {
    return [] as WorkspaceNotification[];
  }

  const userId = await resolveUserId(email);

  if (!userId || notifications.length === 0) {
    return notifications.map((notification) => ({
      ...notification,
      isRead: false,
    }));
  }

  const notificationIds = notifications.map((notification) => notification.notificationId);
  const readResult = await query<{ notificationId: string }>(
    `
      select notification_id as "notificationId"
      from app.notification_reads
      where user_id = $1
        and notification_id = any($2::text[])
    `,
    [userId, notificationIds]
  );

  const readIds = new Set(readResult.rows.map((row) => row.notificationId));

  return notifications.map((notification) => ({
    ...notification,
    isRead: readIds.has(notification.notificationId),
  }));
}

export async function markWorkspaceNotificationsRead(
  email: string,
  notificationIds: string[],
  role: "customer" | "admin" = "customer"
) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !isDatabaseConfigured() || notificationIds.length === 0) {
    return;
  }

  const user = await ensureUserByEmail(normalizedEmail);

  if (!user) {
    return;
  }

  await query(
    `
      insert into app.notification_reads (user_id, notification_id)
      select $1, unnest($2::text[])
      on conflict (user_id, notification_id)
      do update set
        read_at = timezone('utc', now())
    `,
    [user.userId, Array.from(new Set(notificationIds))],
    {
      actor: {
        userId: user.userId,
        email: normalizedEmail,
        role,
      },
    }
  );
}
