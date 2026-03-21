export function getBankAccountDefaults() {
  const bankName =
    process.env.BANK_TRANSFER_BANK_NAME?.trim() ?? "PalmPay";
  const accountName =
    process.env.BANK_TRANSFER_ACCOUNT_NAME?.trim() ??
    "Udoka Cynthia Ihezue";
  const accountNumber =
    process.env.BANK_TRANSFER_ACCOUNT_NUMBER?.trim() ?? "8060785487";
  const instructions =
    process.env.BANK_TRANSFER_INSTRUCTIONS?.trim() ??
    "Include your order number as the transfer reference so we can match payments quickly.";

  return {
    bankName,
    accountName,
    accountNumber,
    instructions,
  };
}

export async function upsertBankAccountDefaults(client) {
  const { bankName, accountName, accountNumber, instructions } =
    getBankAccountDefaults();

  await client.query(
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

  await client.query(
    `
      insert into app.site_settings (key, value)
      values (
        'bank_transfer_details',
        jsonb_build_object(
          'bankName', $1::text,
          'accountName', $2::text,
          'accountNumber', $3::text
        )
      )
      on conflict (key)
      do update set
        value = excluded.value,
        updated_at = timezone('utc', now())
    `,
    [bankName, accountName, accountNumber]
  );
}
