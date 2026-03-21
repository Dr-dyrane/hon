alter table app.order_return_cases
  add column if not exists refund_bank_name text null,
  add column if not exists refund_account_name text null,
  add column if not exists refund_account_number text null;
