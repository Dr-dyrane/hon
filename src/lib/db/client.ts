import "server-only";

import { attachDatabasePool } from "@vercel/functions";
import { Pool, type QueryResult, type QueryResultRow } from "pg";
import { hasDatabaseConfig } from "@/lib/config/server";
import { buildDatabasePoolConfig } from "@/lib/db/connection-config";

declare global {
  var __hopPgPool: Pool | undefined;
}

export function isDatabaseConfigured() {
  return hasDatabaseConfig;
}

export function getDatabasePool() {
  if (!hasDatabaseConfig) {
    throw new Error("Database configuration is missing.");
  }

  if (!global.__hopPgPool) {
    global.__hopPgPool = new Pool(buildDatabasePoolConfig());
    attachDatabasePool(global.__hopPgPool);
  }

  return global.__hopPgPool;
}

export async function query<T extends QueryResultRow>(
  text: string,
  values: unknown[] = []
) {
  const pool = getDatabasePool();

  return pool.query<T>(text, values);
}

export async function withTransaction<T>(
  handler: (queryFn: <TRow extends QueryResultRow>(
    text: string,
    values?: unknown[]
  ) => Promise<QueryResult<TRow>>) => Promise<T>
) {
  const client = await getDatabasePool().connect();

  try {
    await client.query("BEGIN");
    const result = await handler((text, values = []) => client.query(text, values));
    await client.query("COMMIT");

    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
