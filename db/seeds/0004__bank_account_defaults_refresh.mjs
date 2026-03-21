import { upsertBankAccountDefaults } from "./lib/bank-account-defaults.mjs";

export async function run(client) {
  await upsertBankAccountDefaults(client);
}
