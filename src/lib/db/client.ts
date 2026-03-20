import "server-only";

import { attachDatabasePool } from "@vercel/functions";
import { Pool, type QueryResult, type QueryResultRow } from "pg";
import { hasDatabaseConfig } from "@/lib/config/server";
import { buildDatabasePoolConfig } from "@/lib/db/connection-config";

declare global {
  var __hopPgPool: Pool | undefined;
}

export type DatabaseActorContext = {
  userId?: string | null;
  email?: string | null;
  role?: string | null;
  guestOrderId?: string | null;
};

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

async function applyActorContext(
  queryFn: <TRow extends QueryResultRow>(
    text: string,
    values?: unknown[]
  ) => Promise<QueryResult<TRow>>,
  actor?: DatabaseActorContext
) {
  if (!actor) {
    return;
  }

  await queryFn(
    `
      select app.set_actor_context($1, $2, $3, $4)
    `,
    [
      actor.email?.trim().toLowerCase() ?? null,
      actor.role?.trim().toLowerCase() ?? null,
      actor.userId ?? null,
      actor.guestOrderId ?? null,
    ]
  );
}

export async function query<T extends QueryResultRow>(
  text: string,
  values: unknown[] = [],
  options?: { actor?: DatabaseActorContext }
) {
  if (!options?.actor) {
    const pool = getDatabasePool();

    return pool.query<T>(text, values);
  }

  const client = await getDatabasePool().connect();

  try {
    await client.query("BEGIN");
    await applyActorContext((queryText, queryValues = []) =>
      client.query(queryText, queryValues), options.actor);
    const result = await client.query<T>(text, values);
    await client.query("COMMIT");

    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function withTransaction<T>(
  handler: (queryFn: <TRow extends QueryResultRow>(
    text: string,
    values?: unknown[]
  ) => Promise<QueryResult<TRow>>) => Promise<T>,
  options?: { actor?: DatabaseActorContext }
) {
  const client = await getDatabasePool().connect();

  try {
    await client.query("BEGIN");
    await applyActorContext((text, values = []) => client.query(text, values), options?.actor);
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
