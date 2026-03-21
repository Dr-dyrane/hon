import "server-only";

import { isDatabaseConfigured, query } from "@/lib/db/client";
import { serverEnv } from "@/lib/config/server";
import type { AuthRole } from "@/lib/auth/types";

type UserIdentityRow = {
  userId: string;
  email: string;
};

export async function ensureUserByEmail(
  email: string,
  options: { markSignedIn?: boolean } = {}
) {
  const normalizedEmail = email.trim().toLowerCase();
  const markSignedIn = options.markSignedIn ?? false;

  if (!normalizedEmail || !isDatabaseConfigured()) {
    return null;
  }

  const result = await query<UserIdentityRow>(
    `
      insert into app.users (email, status, last_signed_in_at)
      values ($1, 'active', ${markSignedIn ? "timezone('utc', now())" : "null"})
      on conflict (email)
      do update set
        status = 'active',
        last_signed_in_at = case
          when $2::boolean then timezone('utc', now())
          else app.users.last_signed_in_at
        end,
        updated_at = timezone('utc', now())
      returning id as "userId", email
    `,
    [normalizedEmail, markSignedIn]
  );

  return result.rows[0] ?? null;
}

export async function resolveAuthRoleForEmail(email: string): Promise<AuthRole> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return "customer";
  }

  if (serverEnv.auth.adminEmails.includes(normalizedEmail)) {
    return "admin";
  }

  if (!isDatabaseConfigured()) {
    return "customer";
  }

  const result = await query<{ isAdmin: boolean }>(
    `
      select exists (
        select 1
        from app.users u
        inner join app.user_roles ur
          on ur.user_id = u.id
        inner join app.roles r
          on r.id = ur.role_id
        where lower(u.email::text) = $1
          and r.slug = 'admin'
      ) as "isAdmin"
    `,
    [normalizedEmail]
  );

  return result.rows[0]?.isAdmin ? "admin" : "customer";
}
