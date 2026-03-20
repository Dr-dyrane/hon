export async function run(client) {
  const bankName = process.env.BANK_TRANSFER_BANK_NAME?.trim();
  const accountName = process.env.BANK_TRANSFER_ACCOUNT_NAME?.trim();
  const accountNumber = process.env.BANK_TRANSFER_ACCOUNT_NUMBER?.trim();
  const instructions =
    process.env.BANK_TRANSFER_INSTRUCTIONS?.trim() ??
    "Include your order number as the transfer reference so we can match payments quickly.";

  if (!bankName || !accountName || !accountNumber) {
    console.log(
      "Skipping bank account seed because BANK_TRANSFER_BANK_NAME, BANK_TRANSFER_ACCOUNT_NAME, or BANK_TRANSFER_ACCOUNT_NUMBER is missing."
    );
    return;
  }

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
}
