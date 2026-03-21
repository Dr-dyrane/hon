import "server-only";

import { isDatabaseConfigured, query, withTransaction } from "@/lib/db/client";
import { getPhoneValidationMessage, normalizePhoneToE164 } from "@/lib/phone";
import type { AdminUserInviteTarget, AdminUserSummary } from "@/lib/db/types";

function normalizeOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeUserStatus(value: string) {
  if (!["active", "invited", "suspended"].includes(value)) {
    throw new Error("Unsupported user status.");
  }

  return value as "active" | "invited" | "suspended";
}

async function resolveAdminRoleId(queryFn: typeof query) {
  const result = await queryFn<{ roleId: string }>(
    `
      select id as "roleId"
      from app.roles
      where slug = 'admin'
      limit 1
    `
  );

  const roleId = result.rows[0]?.roleId;

  if (!roleId) {
    throw new Error("Admin role is not configured.");
  }

  return roleId;
}

async function setAdminRole(
  queryFn: typeof query,
  userId: string,
  isAdmin: boolean,
  actorUserId: string | null
) {
  const roleId = await resolveAdminRoleId(queryFn);

  if (isAdmin) {
    await queryFn(
      `
        insert into app.user_roles (user_id, role_id, granted_by_user_id)
        values ($1, $2, $3)
        on conflict (user_id, role_id)
        do nothing
      `,
      [userId, roleId, actorUserId]
    );
    return;
  }

  await queryFn(
    `
      delete from app.user_roles
      where user_id = $1
        and role_id = $2
    `,
    [userId, roleId]
  );
}

export async function listAdminUsers(limit = 50, actorEmail?: string | null) {
  if (!isDatabaseConfigured()) {
    return [] satisfies AdminUserSummary[];
  }

  const result = await query<AdminUserSummary>(
    `
      select
        u.id as "userId",
        u.email::text as email,
        p.full_name as "fullName",
        coalesce(p.preferred_phone_e164, u.phone_e164) as phone,
        u.status,
        exists (
          select 1
          from app.user_roles ur
          join app.roles r
            on r.id = ur.role_id
          where ur.user_id = u.id
            and r.slug = 'admin'
        ) as "isAdmin",
        count(distinct o.id)::int as "orderCount",
        count(distinct a.id)::int as "addressCount",
        u.last_signed_in_at as "lastSignedInAt",
        u.created_at as "createdAt"
      from app.users u
      left join app.profiles p
        on p.user_id = u.id
      left join app.orders o
        on o.user_id = u.id
      left join app.addresses a
        on a.user_id = u.id
      group by
        u.id,
        u.email,
        p.full_name,
        p.preferred_phone_e164,
        u.phone_e164,
        u.status,
        u.last_signed_in_at,
        u.created_at
      order by u.created_at desc
      limit $1
    `,
    [limit],
    {
      actor: {
        email: actorEmail?.trim().toLowerCase() ?? null,
        role: "admin",
      },
    }
  );

  return result.rows;
}

export async function createAdminUser(input: {
  email: string;
  fullName?: string | null;
  phone?: string | null;
  status: string;
  isAdmin: boolean;
  actorUserId?: string | null;
  actorEmail?: string | null;
}) {
  if (!isDatabaseConfigured()) {
    throw new Error("Database is not configured.");
  }

  const email = input.email.trim().toLowerCase();
  const fullName = normalizeOptionalText(input.fullName);
  const status = normalizeUserStatus(input.status);
  const phone = normalizeOptionalText(input.phone);
  const phoneE164 = phone ? normalizePhoneToE164(phone) : null;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email.");
  }

  if (phone && !phoneE164) {
    throw new Error(getPhoneValidationMessage());
  }

  return withTransaction(async (queryFn) => {
    const existingResult = await queryFn<{ userId: string }>(
      `
        select id as "userId"
        from app.users
        where lower(email::text) = $1
        limit 1
      `,
      [email]
    );

    if (existingResult.rows[0]) {
      throw new Error("User already exists.");
    }

    const userResult = await queryFn<{ userId: string }>(
      `
        insert into app.users (email, phone_e164, status)
        values ($1, $2, $3)
        returning id as "userId"
      `,
      [email, phoneE164, status]
    );

    const userId = userResult.rows[0]?.userId;

    if (!userId) {
      throw new Error("Unable to create user.");
    }

    if (fullName) {
      await queryFn(
        `
          insert into app.profiles (
            user_id,
            full_name,
            preferred_phone_e164,
            marketing_opt_in
          )
          values ($1, $2, $3, false)
          on conflict (user_id)
          do update set
            full_name = excluded.full_name,
            preferred_phone_e164 = excluded.preferred_phone_e164,
            updated_at = timezone('utc', now())
        `,
        [userId, fullName, phoneE164]
      );
    }

    await setAdminRole(queryFn, userId, input.isAdmin, input.actorUserId ?? null);

    return {
      userId,
      email,
      fullName,
      isAdmin: input.isAdmin,
      status,
    } satisfies AdminUserInviteTarget;
  }, {
    actor: {
      userId: input.actorUserId ?? null,
      email: input.actorEmail ?? null,
      role: "admin",
    },
  });
}

export async function updateAdminUser(input: {
  userId: string;
  fullName?: string | null;
  phone?: string | null;
  status: string;
  isAdmin: boolean;
  actorUserId?: string | null;
  actorEmail?: string | null;
}) {
  if (!isDatabaseConfigured()) {
    throw new Error("Database is not configured.");
  }

  const userId = input.userId;
  const fullName = normalizeOptionalText(input.fullName);
  const status = normalizeUserStatus(input.status);
  const phone = normalizeOptionalText(input.phone);
  const phoneE164 = phone ? normalizePhoneToE164(phone) : null;

  if (!userId) {
    throw new Error("User is required.");
  }

  if (input.actorUserId && input.actorUserId === userId) {
    if (!input.isAdmin) {
      throw new Error("You cannot remove your own admin access.");
    }

    if (status !== "active") {
      throw new Error("You cannot suspend your own account.");
    }
  }

  if (phone && !phoneE164) {
    throw new Error(getPhoneValidationMessage());
  }

  await withTransaction(async (queryFn) => {
    const userResult = await queryFn<{ userId: string }>(
      `
        select id as "userId"
        from app.users
        where id = $1
        limit 1
      `,
      [userId]
    );

    if (!userResult.rows[0]) {
      throw new Error("User not found.");
    }

    await queryFn(
      `
        update app.users
        set
          phone_e164 = $1,
          status = $2
        where id = $3
      `,
      [phoneE164, status, userId]
    );

    await queryFn(
      `
        insert into app.profiles (
          user_id,
          full_name,
          preferred_phone_e164,
          marketing_opt_in
        )
        values ($1, coalesce($2, ''), $3, false)
        on conflict (user_id)
        do update set
          full_name = excluded.full_name,
          preferred_phone_e164 = excluded.preferred_phone_e164,
          updated_at = timezone('utc', now())
      `,
      [userId, fullName ?? "", phoneE164]
    );

    await setAdminRole(queryFn, userId, input.isAdmin, input.actorUserId ?? null);
  }, {
    actor: {
      userId: input.actorUserId ?? null,
      email: input.actorEmail ?? null,
      role: "admin",
    },
  });
}

export async function getAdminUserInviteTarget(
  userId: string,
  actorEmail?: string | null
) {
  if (!isDatabaseConfigured() || !userId) {
    return null;
  }

  const result = await query<AdminUserInviteTarget>(
    `
      select
        u.id as "userId",
        u.email::text as email,
        p.full_name as "fullName",
        exists (
          select 1
          from app.user_roles ur
          join app.roles r
            on r.id = ur.role_id
          where ur.user_id = u.id
            and r.slug = 'admin'
        ) as "isAdmin",
        u.status
      from app.users u
      left join app.profiles p
        on p.user_id = u.id
      where u.id = $1
      limit 1
    `,
    [userId],
    {
      actor: {
        email: actorEmail?.trim().toLowerCase() ?? null,
        role: "admin",
      },
    }
  );

  return result.rows[0] ?? null;
}

export async function deleteAdminUser(
  userId: string,
  actor: {
    actorUserId?: string | null;
    actorEmail?: string | null;
  }
) {
  if (!isDatabaseConfigured()) {
    throw new Error("Database is not configured.");
  }

  if (!userId) {
    throw new Error("User is required.");
  }

  if (actor.actorUserId && actor.actorUserId === userId) {
    throw new Error("You cannot delete your own account.");
  }

  await withTransaction(async (queryFn) => {
    const usageResult = await queryFn<{ orderCount: number }>(
      `
        select count(*)::int as "orderCount"
        from app.orders
        where user_id = $1
      `,
      [userId]
    );

    if ((usageResult.rows[0]?.orderCount ?? 0) > 0) {
      throw new Error("Orders exist for this user. Suspend instead of deleting.");
    }

    await queryFn(
      `
        delete from app.users
        where id = $1
      `,
      [userId]
    );
  }, {
    actor: {
      userId: actor.actorUserId ?? null,
      email: actor.actorEmail ?? null,
      role: "admin",
    },
  });
}
