import "server-only";

import {
  isDatabaseConfigured,
  query,
  withTransaction,
  type DatabaseActorContext,
} from "@/lib/db/client";
import type {
  AdminDeliveryDefaults,
  AdminLayoutPreviewSetting,
  AdminSettingsSnapshot,
  BankAccountRow,
  SiteSettingRow,
} from "@/lib/db/types";

const DEFAULT_DELIVERY_DEFAULTS: AdminDeliveryDefaults = {
  trackingEnabled: true,
  staleTransferWindowMinutes: 45,
};

const DEFAULT_LAYOUT_PREVIEW: AdminLayoutPreviewSetting = {
  mode: "simulated",
};

function normalizeActor(actor?: { userId?: string | null; email?: string | null }) {
  const email = actor?.email?.trim().toLowerCase() ?? null;

  if (!email && !actor?.userId) {
    return undefined;
  }

  return {
    userId: actor?.userId ?? null,
    email,
    role: "admin",
  } satisfies DatabaseActorContext;
}

function normalizeRequiredText(value: string, label: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(`${label} is required.`);
  }

  return trimmed;
}

function normalizeTrackingWindow(value: string | number) {
  const numeric =
    typeof value === "number" ? value : Number.parseInt(value.trim(), 10);

  if (!Number.isFinite(numeric) || numeric < 5 || numeric > 720) {
    throw new Error("Set a stale window between 5 and 720 minutes.");
  }

  return Math.floor(numeric);
}

function readSettingValue<T>(rows: SiteSettingRow[], key: string, fallback: T) {
  const match = rows.find((row) => row.key === key);

  if (!match || typeof match.value !== "object" || match.value === null) {
    return fallback;
  }

  return { ...fallback, ...match.value } as T;
}

export async function getAdminSettingsSnapshot() {
  if (!isDatabaseConfigured()) {
    return {
      bankAccount: null,
      deliveryDefaults: DEFAULT_DELIVERY_DEFAULTS,
      layoutPreview: DEFAULT_LAYOUT_PREVIEW,
      siteSettings: [],
    } satisfies AdminSettingsSnapshot;
  }

  const [bankAccountResult, siteSettingsResult] = await Promise.all([
    query<BankAccountRow>(
      `
        select
          id as "bankAccountId",
          bank_name as "bankName",
          account_name as "accountName",
          account_number as "accountNumber",
          instructions,
          is_default as "isDefault"
        from app.bank_accounts
        where is_active = true
        order by is_default desc, created_at desc
        limit 1
      `
    ),
    query<SiteSettingRow>(
      `
        select key, value
        from app.site_settings
        where key = any($1::text[])
        order by key asc
      `,
      [["delivery_defaults", "layout_preview"]]
    ),
  ]);

  const siteSettings = siteSettingsResult.rows;

  return {
    bankAccount: bankAccountResult.rows[0] ?? null,
    deliveryDefaults: readSettingValue(
      siteSettings,
      "delivery_defaults",
      DEFAULT_DELIVERY_DEFAULTS
    ),
    layoutPreview: readSettingValue(
      siteSettings,
      "layout_preview",
      DEFAULT_LAYOUT_PREVIEW
    ),
    siteSettings,
  } satisfies AdminSettingsSnapshot;
}

export async function getDeliveryDefaultsSetting() {
  if (!isDatabaseConfigured()) {
    return DEFAULT_DELIVERY_DEFAULTS;
  }

  const result = await query<SiteSettingRow>(
    `
      select key, value
      from app.site_settings
      where key = 'delivery_defaults'
      limit 1
    `
  );

  return readSettingValue(
    result.rows,
    "delivery_defaults",
    DEFAULT_DELIVERY_DEFAULTS
  );
}

export async function updateAdminDefaultBankAccount(
  input: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    instructions?: string | null;
  },
  actor?: {
    userId?: string | null;
    email?: string | null;
  }
) {
  if (!isDatabaseConfigured()) {
    throw new Error("Database is not configured.");
  }

  const bankName = normalizeRequiredText(input.bankName, "Bank");
  const accountName = normalizeRequiredText(input.accountName, "Account name");
  const accountNumber = normalizeRequiredText(input.accountNumber, "Account number");
  const instructions = input.instructions?.trim() || null;
  const actorContext = normalizeActor(actor);

  await withTransaction(async (queryFn) => {
    await queryFn(
      `
        update app.bank_accounts
        set
          is_default = false,
          updated_at = timezone('utc', now())
        where is_default = true
          and (bank_name <> $1 or account_number <> $2)
      `,
      [bankName, accountNumber]
    );

    await queryFn(
      `
        insert into app.bank_accounts (
          bank_name,
          account_name,
          account_number,
          instructions,
          is_active,
          is_default
        )
        values ($1, $2, $3, $4, true, true)
        on conflict (bank_name, account_number)
        do update set
          account_name = excluded.account_name,
          instructions = excluded.instructions,
          is_active = true,
          is_default = true,
          updated_at = timezone('utc', now())
      `,
      [bankName, accountName, accountNumber, instructions]
    );

    await queryFn(
      `
        insert into app.site_settings (key, value, updated_by_user_id)
        values (
          'bank_transfer_details',
          jsonb_build_object(
            'bankName', $1::text,
            'accountName', $2::text,
            'accountNumber', $3::text
          ),
          $4::uuid
        )
        on conflict (key)
        do update set
          value = excluded.value,
          updated_by_user_id = excluded.updated_by_user_id,
          updated_at = timezone('utc', now())
      `,
      [bankName, accountName, accountNumber, actorContext?.userId ?? null]
    );
  }, {
    actor: actorContext,
  });
}

export async function updateAdminDeliveryDefaults(
  input: {
    trackingEnabled: boolean;
    staleTransferWindowMinutes: string | number;
  },
  actor?: {
    userId?: string | null;
    email?: string | null;
  }
) {
  if (!isDatabaseConfigured()) {
    throw new Error("Database is not configured.");
  }

  const actorContext = normalizeActor(actor);
  const value = {
    trackingEnabled: input.trackingEnabled,
    staleTransferWindowMinutes: normalizeTrackingWindow(
      input.staleTransferWindowMinutes
    ),
  } satisfies AdminDeliveryDefaults;

  await query(
    `
      insert into app.site_settings (key, value, updated_by_user_id)
      values ('delivery_defaults', $1::jsonb, $2::uuid)
      on conflict (key)
      do update set
        value = excluded.value,
        updated_by_user_id = excluded.updated_by_user_id,
        updated_at = timezone('utc', now())
    `,
    [JSON.stringify(value), actorContext?.userId ?? null],
    { actor: actorContext }
  );
}

export async function updateAdminLayoutPreview(
  input: {
    mode: string;
  },
  actor?: {
    userId?: string | null;
    email?: string | null;
  }
) {
  if (!isDatabaseConfigured()) {
    throw new Error("Database is not configured.");
  }

  const mode = normalizeRequiredText(input.mode, "Preview mode").toLowerCase();
  const actorContext = normalizeActor(actor);
  const value = { mode } satisfies AdminLayoutPreviewSetting;

  await query(
    `
      insert into app.site_settings (key, value, updated_by_user_id)
      values ('layout_preview', $1::jsonb, $2::uuid)
      on conflict (key)
      do update set
        value = excluded.value,
        updated_by_user_id = excluded.updated_by_user_id,
        updated_at = timezone('utc', now())
    `,
    [JSON.stringify(value), actorContext?.userId ?? null],
    { actor: actorContext }
  );
}
