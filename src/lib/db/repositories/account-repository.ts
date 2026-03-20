import "server-only";

import {
  isDatabaseConfigured,
  query,
  type DatabaseActorContext,
  withTransaction,
} from "@/lib/db/client";
import { normalizePhoneToE164 } from "@/lib/phone";
import { ensureUserByEmail } from "@/lib/db/repositories/user-repository";
import type {
  PortalAccountSummary,
  PortalAddress,
  PortalProfile,
} from "@/lib/db/types";

function buildCustomerActor(email: string): DatabaseActorContext | undefined {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return undefined;
  }

  return {
    email: normalizedEmail,
    role: "customer",
  };
}

function emptyProfile(email: string) {
  return {
    userId: null,
    email,
    fullName: "",
    firstName: "",
    lastName: "",
    preferredPhoneE164: "",
    marketingOptIn: false,
  } satisfies PortalProfile;
}

function normalizeOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

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
    [normalizedEmail],
    { actor: buildCustomerActor(normalizedEmail) }
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

export async function getPortalProfile(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return emptyProfile("");
  }

  if (!isDatabaseConfigured()) {
    return emptyProfile(normalizedEmail);
  }

  const result = await query<PortalProfile>(
    `
      with matched_user as (
        select id, email, phone_e164
        from app.users
        where lower(email) = $1
        limit 1
      )
      select
        mu.id as "userId",
        mu.email as email,
        coalesce(p.full_name, '') as "fullName",
        coalesce(p.first_name, '') as "firstName",
        coalesce(p.last_name, '') as "lastName",
        coalesce(p.preferred_phone_e164, mu.phone_e164, '') as "preferredPhoneE164",
        coalesce(p.marketing_opt_in, false) as "marketingOptIn"
      from matched_user mu
      left join app.profiles p
        on p.user_id = mu.id
      limit 1
    `,
    [normalizedEmail],
    { actor: buildCustomerActor(normalizedEmail) }
  );

  return result.rows[0] ?? emptyProfile(normalizedEmail);
}

export async function updatePortalProfile(email: string, input: {
  fullName: string;
  firstName?: string | null;
  lastName?: string | null;
  preferredPhone: string;
  marketingOptIn: boolean;
}) {
  const normalizedEmail = email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  const preferredPhoneE164 = normalizePhoneToE164(input.preferredPhone);
  const firstName = normalizeOptionalText(input.firstName);
  const lastName = normalizeOptionalText(input.lastName);
  const marketingOptIn = Boolean(input.marketingOptIn);

  if (!normalizedEmail || !isDatabaseConfigured()) {
    throw new Error("Profile is unavailable.");
  }

  if (fullName.length < 2) {
    throw new Error("Enter your name.");
  }

  if (!preferredPhoneE164) {
    throw new Error("Enter a valid phone.");
  }

  const user = await ensureUserByEmail(normalizedEmail);

  if (!user) {
    throw new Error("Profile is unavailable.");
  }

  await withTransaction(async (queryFn) => {
    await queryFn(
      `
        update app.users
        set
          phone_e164 = $1,
          updated_at = timezone('utc', now())
        where id = $2
      `,
      [preferredPhoneE164, user.userId]
    );

    await queryFn(
      `
        insert into app.profiles (
          user_id,
          full_name,
          first_name,
          last_name,
          preferred_phone_e164,
          marketing_opt_in
        )
        values ($1, $2, $3, $4, $5, $6)
        on conflict (user_id)
        do update set
          full_name = excluded.full_name,
          first_name = excluded.first_name,
          last_name = excluded.last_name,
          preferred_phone_e164 = excluded.preferred_phone_e164,
          marketing_opt_in = excluded.marketing_opt_in,
          updated_at = timezone('utc', now())
      `,
      [user.userId, fullName, firstName, lastName, preferredPhoneE164, marketingOptIn]
    );
  }, {
    actor: {
      userId: user.userId,
      email: normalizedEmail,
      role: "customer",
    },
  });
}

export async function listPortalAddresses(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !isDatabaseConfigured()) {
    return [] satisfies PortalAddress[];
  }

  const result = await query<PortalAddress>(
    `
      with matched_user as (
        select id
        from app.users
        where lower(email) = $1
        limit 1
      )
      select
        a.id as "addressId",
        a.label,
        a.recipient_name as "recipientName",
        a.phone_e164 as "phoneE164",
        a.line_1 as "line1",
        a.line_2 as "line2",
        a.landmark,
        a.city,
        a.state,
        a.postal_code as "postalCode",
        a.delivery_notes as "deliveryNotes",
        a.latitude::float8 as latitude,
        a.longitude::float8 as longitude,
        a.is_default as "isDefault"
      from matched_user mu
      inner join app.addresses a
        on a.user_id = mu.id
      order by a.is_default desc, a.updated_at desc, a.created_at desc
    `,
    [normalizedEmail],
    { actor: buildCustomerActor(normalizedEmail) }
  );

  return result.rows;
}

export async function savePortalAddress(email: string, input: {
  addressId?: string | null;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  postalCode?: string | null;
  deliveryNotes?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  isDefault: boolean;
}) {
  const normalizedEmail = email.trim().toLowerCase();
  const label = input.label.trim();
  const recipientName = input.recipientName.trim();
  const phoneE164 = normalizePhoneToE164(input.phone);
  const line1 = input.line1.trim();
  const line2 = normalizeOptionalText(input.line2);
  const landmark = normalizeOptionalText(input.landmark);
  const city = input.city.trim();
  const state = input.state.trim();
  const postalCode = normalizeOptionalText(input.postalCode);
  const deliveryNotes = normalizeOptionalText(input.deliveryNotes);
  const addressId = normalizeOptionalText(input.addressId);
  const latitude =
    input.latitude == null || input.latitude === ""
      ? null
      : Number(input.latitude);
  const longitude =
    input.longitude == null || input.longitude === ""
      ? null
      : Number(input.longitude);
  const isDefault = Boolean(input.isDefault);

  if (!normalizedEmail || !isDatabaseConfigured()) {
    throw new Error("Address book is unavailable.");
  }

  if (label.length < 2 || recipientName.length < 2 || line1.length < 3 || city.length < 2 || state.length < 2) {
    throw new Error("Complete the address.");
  }

  if (!phoneE164) {
    throw new Error("Enter a valid phone.");
  }

  if (latitude != null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) {
    throw new Error("Invalid latitude.");
  }

  if (longitude != null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) {
    throw new Error("Invalid longitude.");
  }

  const user = await ensureUserByEmail(normalizedEmail);

  if (!user) {
    throw new Error("Address book is unavailable.");
  }

  await withTransaction(async (queryFn) => {
    if (isDefault) {
      await queryFn(
        `
          update app.addresses
          set is_default = false
          where user_id = $1
            and ($2::uuid is null or id <> $2::uuid)
        `,
        [user.userId, addressId]
      );
    }

    if (addressId) {
      const result = await queryFn<{ addressId: string }>(
        `
          update app.addresses
          set
            label = $1,
            recipient_name = $2,
            phone_e164 = $3,
            line_1 = $4,
            line_2 = $5,
            landmark = $6,
            city = $7,
            state = $8,
            postal_code = $9,
            delivery_notes = $10,
            latitude = $11,
            longitude = $12,
            is_default = $13
          where id = $14
            and user_id = $15
          returning id as "addressId"
        `,
        [
          label,
          recipientName,
          phoneE164,
          line1,
          line2,
          landmark,
          city,
          state,
          postalCode,
          deliveryNotes,
          latitude,
          longitude,
          isDefault,
          addressId,
          user.userId,
        ]
      );

      if (!result.rows[0]) {
        throw new Error("Address not found.");
      }

      return;
    }

    const shouldDefault =
      isDefault ||
      (
        await queryFn<{ count: number }>(
          `
            select count(*)::int as count
            from app.addresses
            where user_id = $1
          `,
          [user.userId]
        )
      ).rows[0]?.count === 0;

    await queryFn(
      `
        insert into app.addresses (
          user_id,
          label,
          recipient_name,
          phone_e164,
          line_1,
          line_2,
          landmark,
          city,
          state,
          postal_code,
          delivery_notes,
          latitude,
          longitude,
          is_default
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `,
      [
        user.userId,
        label,
        recipientName,
        phoneE164,
        line1,
        line2,
        landmark,
        city,
        state,
        postalCode,
        deliveryNotes,
        latitude,
        longitude,
        shouldDefault,
      ]
    );
  }, {
    actor: {
      userId: user.userId,
      email: normalizedEmail,
      role: "customer",
    },
  });
}

export async function setPortalAddressDefault(email: string, addressId: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !addressId || !isDatabaseConfigured()) {
    throw new Error("Address book is unavailable.");
  }

  const user = await ensureUserByEmail(normalizedEmail);

  if (!user) {
    throw new Error("Address book is unavailable.");
  }

  await withTransaction(async (queryFn) => {
    const result = await queryFn<{ addressId: string }>(
      `
        select id as "addressId"
        from app.addresses
        where id = $1
          and user_id = $2
        limit 1
      `,
      [addressId, user.userId]
    );

    if (!result.rows[0]) {
      throw new Error("Address not found.");
    }

    await queryFn(
      `
        update app.addresses
        set is_default = false
        where user_id = $1
      `,
      [user.userId]
    );

    await queryFn(
      `
        update app.addresses
        set is_default = true
        where id = $1
      `,
      [addressId]
    );
  }, {
    actor: {
      userId: user.userId,
      email: normalizedEmail,
      role: "customer",
    },
  });
}

export async function deletePortalAddress(email: string, addressId: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !addressId || !isDatabaseConfigured()) {
    throw new Error("Address book is unavailable.");
  }

  const user = await ensureUserByEmail(normalizedEmail);

  if (!user) {
    throw new Error("Address book is unavailable.");
  }

  await withTransaction(async (queryFn) => {
    const current = await queryFn<{ isDefault: boolean }>(
      `
        select is_default as "isDefault"
        from app.addresses
        where id = $1
          and user_id = $2
        limit 1
      `,
      [addressId, user.userId]
    );
    const isDefault = current.rows[0]?.isDefault ?? false;

    await queryFn(
      `
        delete from app.addresses
        where id = $1
          and user_id = $2
      `,
      [addressId, user.userId]
    );

    if (isDefault) {
      await queryFn(
        `
          with candidate as (
            select id
            from app.addresses
            where user_id = $1
            order by updated_at desc, created_at desc
            limit 1
          )
          update app.addresses
          set is_default = true
          where id in (select id from candidate)
        `,
        [user.userId]
      );
    }
  }, {
    actor: {
      userId: user.userId,
      email: normalizedEmail,
      role: "customer",
    },
  });
}
