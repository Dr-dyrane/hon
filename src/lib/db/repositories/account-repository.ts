import "server-only";

import { isDatabaseConfigured, query } from "@/lib/db/client";
import type { PortalAccountSummary } from "@/lib/db/types";

export async function getPortalAccountSummary(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return {
      userId: null,
      email: "",
      fullName: null,
      totalOrders: 0,
      activeOrders: 0,
      addressCount: 0,
      reviewCount: 0,
      latestOrderNumber: null,
      latestOrderStatus: null,
    } satisfies PortalAccountSummary;
  }

  if (!isDatabaseConfigured()) {
    return {
      userId: null,
      email: normalizedEmail,
      fullName: null,
      totalOrders: 0,
      activeOrders: 0,
      addressCount: 0,
      reviewCount: 0,
      latestOrderNumber: null,
      latestOrderStatus: null,
    } satisfies PortalAccountSummary;
  }

  const result = await query<PortalAccountSummary>(
    `
      with matched_user as (
        select id, email
        from app.users
        where lower(email) = $1
        limit 1
      ),
      latest_order as (
        select
          o.user_id,
          o.public_order_number,
          o.status
        from app.orders o
        inner join matched_user mu
          on mu.id = o.user_id
        order by o.placed_at desc nulls last, o.created_at desc
        limit 1
      )
      select
        mu.id as "userId",
        mu.email as email,
        p.full_name as "fullName",
        count(distinct o.id)::int as "totalOrders",
        (count(distinct o.id) filter (
          where o.status not in ('delivered', 'cancelled', 'expired')
        ))::int as "activeOrders",
        count(distinct a.id)::int as "addressCount",
        count(distinct r.id)::int as "reviewCount",
        lo.public_order_number as "latestOrderNumber",
        lo.status as "latestOrderStatus"
      from matched_user mu
      left join app.profiles p
        on p.user_id = mu.id
      left join app.orders o
        on o.user_id = mu.id
      left join app.addresses a
        on a.user_id = mu.id
      left join app.reviews r
        on r.user_id = mu.id
      left join latest_order lo
        on lo.user_id = mu.id
      group by
        mu.id,
        mu.email,
        p.full_name,
        lo.public_order_number,
        lo.status
    `,
    [normalizedEmail]
  );

  return (
    result.rows[0] ??
    ({
      userId: null,
      email: normalizedEmail,
      fullName: null,
      totalOrders: 0,
      activeOrders: 0,
      addressCount: 0,
      reviewCount: 0,
      latestOrderNumber: null,
      latestOrderStatus: null,
    } satisfies PortalAccountSummary)
  );
}
