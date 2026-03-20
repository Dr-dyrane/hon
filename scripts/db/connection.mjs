import { Client } from "pg";
import { loadProjectEnv } from "./load-env.mjs";
import { getConnectionConfig } from "./connection-config.mjs";

loadProjectEnv();

export async function withClient(run) {
  const client = new Client(getConnectionConfig());

  await client.connect();

  try {
    return await run(client);
  } finally {
    await client.end();
  }
}
