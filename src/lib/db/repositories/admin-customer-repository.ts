import "server-only";

import { isDatabaseConfigured, withTransaction } from "@/lib/db/client";
import { getPhoneValidationMessage, normalizePhoneToE164 } from "@/lib/phone";

function normalizeOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeRequiredText(value: string | null | undefined, minimumLength: number) {
  const trimmed = value?.trim() ?? "";

  if (trimmed.length < minimumLength) {
    return null;
  }

  return trimmed;
}

function buildAdminActor(input: {
  actorUserId?: string | null;
  actorEmail?: string | null;
}) {
  return {
    userId: input.actorUserId ?? null,
    email: input.actorEmail?.trim().toLowerCase() ?? null,
    role: "admin" as const,
  };
}

export async function updateAdminCustomerProfile(input: {
  userId: string;
  fullName: string;
  preferredPhone: string;
  actorUserId?: string | null;
  actorEmail?: string | null;
}) {
  if (!isDatabaseConfigured()) {
    throw new Error("Customer profile is unavailable.");
  }

  const userId = input.userId.trim();
  const fullName = normalizeRequiredText(input.fullName, 2);
  const preferredPhoneE164 = normalizePhoneToE164(input.preferredPhone);

  if (!userId) {
    throw new Error("Customer account is required.");
  }

  if (!fullName) {
    throw new Error("Enter the customer name.");
  }

  if (!preferredPhoneE164) {
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
      throw new Error("Customer account not found.");
    }

    await queryFn(
      `
        update app.users
        set
          phone_e164 = $1,
          updated_at = timezone('utc', now())
        where id = $2
      `,
      [preferredPhoneE164, userId]
    );

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
      [userId, fullName, preferredPhoneE164]
    );
  }, { actor: buildAdminActor(input) });
}

export async function saveAdminCustomerAddress(input: {
  userId: string;
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
  actorUserId?: string | null;
  actorEmail?: string | null;
}) {
  if (!isDatabaseConfigured()) {
    throw new Error("Customer addresses are unavailable.");
  }

  const userId = input.userId.trim();
  const addressId = normalizeOptionalText(input.addressId);
  const label = normalizeRequiredText(input.label, 2);
  const recipientName = normalizeRequiredText(input.recipientName, 2);
  const phoneE164 = normalizePhoneToE164(input.phone);
  const line1 = normalizeRequiredText(input.line1, 3);
  const line2 = normalizeOptionalText(input.line2);
  const landmark = normalizeOptionalText(input.landmark);
  const city = normalizeRequiredText(input.city, 2);
  const state = normalizeRequiredText(input.state, 2);
  const postalCode = normalizeOptionalText(input.postalCode);
  const deliveryNotes = normalizeOptionalText(input.deliveryNotes);
  const latitude =
    input.latitude == null || input.latitude === "" ? null : Number(input.latitude);
  const longitude =
    input.longitude == null || input.longitude === "" ? null : Number(input.longitude);
  const isDefault = Boolean(input.isDefault);

  if (!userId) {
    throw new Error("Customer account is required.");
  }

  if (!label || !recipientName || !line1 || !city || !state) {
    throw new Error("Complete the address.");
  }

  if (!phoneE164) {
    throw new Error(getPhoneValidationMessage());
  }

  if (latitude != null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) {
    throw new Error("Invalid latitude.");
  }

  if (longitude != null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) {
    throw new Error("Invalid longitude.");
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
      throw new Error("Customer account not found.");
    }

    if (isDefault) {
      await queryFn(
        `
          update app.addresses
          set is_default = false
          where user_id = $1
            and ($2::uuid is null or id <> $2::uuid)
        `,
        [userId, addressId]
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
          userId,
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
          [userId]
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
        userId,
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
  }, { actor: buildAdminActor(input) });
}

export async function deleteAdminCustomerAddress(input: {
  userId: string;
  addressId: string;
  actorUserId?: string | null;
  actorEmail?: string | null;
}) {
  if (!isDatabaseConfigured()) {
    throw new Error("Customer addresses are unavailable.");
  }

  const userId = input.userId.trim();
  const addressId = input.addressId.trim();

  if (!userId || !addressId) {
    throw new Error("Address is required.");
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
      [addressId, userId]
    );

    if (!current.rows[0]) {
      throw new Error("Address not found.");
    }

    await queryFn(
      `
        delete from app.addresses
        where id = $1
          and user_id = $2
      `,
      [addressId, userId]
    );

    if (current.rows[0].isDefault) {
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
        [userId]
      );
    }
  }, { actor: buildAdminActor(input) });
}
