import "server-only";

import { Client } from "pg";
import { serverEnv } from "@/lib/config/server";
import { buildDatabaseClientConfig } from "@/lib/db/connection-config";

const SYNC_CURSOR_KEY = "primary_to_neon_audit_logs";
const SYNC_OVERLAP_SECONDS = 5;
const DEFAULT_BATCH_SIZE = 500;

type AuditLogRow = {
  id: string;
  actor_user_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  metadata: unknown;
  schema_name: string | null;
  table_name: string | null;
  record_pk: string | null;
  before_data: unknown;
  after_data: unknown;
  event_source: string;
  created_at: string;
};

export type NeonStandbySyncResult = {
  cursorFrom: string | null;
  cursorTo: string | null;
  fetched: number;
  upserted: number;
  replayed: number;
  skippedAlreadyApplied: number;
  hasMore: boolean;
};

type ConnectionIdentity = {
  host: string;
  port: number;
  database: string;
  user: string;
};

type TableMetadata = {
  columnsByName: Map<string, string>;
  primaryKeyColumns: string[];
};

function resolveTargetConnectionString() {
  return serverEnv.database.neonSyncDirectUrl ?? serverEnv.database.neonSyncUrl ?? null;
}

function normalizeHost(host: string) {
  return host.toLowerCase().replace("-pooler", "");
}

function quoteIdentifier(identifier: string) {
  return `"${identifier.replace(/"/g, "\"\"")}"`;
}

function asRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function normalizeValueForColumn(value: unknown, dataType: string) {
  if (value === undefined) {
    return null;
  }

  if ((dataType === "json" || dataType === "jsonb") && value !== null) {
    return JSON.stringify(value);
  }

  return value;
}

function parseConnectionIdentityFromConnectionString(connectionString: string): ConnectionIdentity {
  const url = new URL(connectionString);

  return {
    host: url.hostname,
    port: Number.parseInt(url.port || "5432", 10),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
    user: decodeURIComponent(url.username || ""),
  };
}

function parseSourceConnectionIdentity() {
  const sourceConfig = buildDatabaseClientConfig();

  if ("connectionString" in sourceConfig && sourceConfig.connectionString) {
    return parseConnectionIdentityFromConnectionString(sourceConfig.connectionString);
  }

  return {
    host: String(sourceConfig.host ?? ""),
    port: Number(sourceConfig.port ?? 5432),
    database: String(sourceConfig.database ?? ""),
    user: String(sourceConfig.user ?? ""),
  } satisfies ConnectionIdentity;
}

function isSameDatabase(source: ConnectionIdentity, target: ConnectionIdentity) {
  return (
    normalizeHost(source.host) === normalizeHost(target.host) &&
    source.port === target.port &&
    source.database === target.database &&
    source.user === target.user
  );
}

function asIsoString(value: string | null) {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString();
}

async function ensureTargetSyncSchema(targetClient: Client) {
  await targetClient.query(`
    create schema if not exists sync;

    create table if not exists sync.cursors (
      key text primary key,
      last_synced_at timestamptz not null default timezone('utc', now()),
      updated_at timestamptz not null default timezone('utc', now())
    );

    create table if not exists sync.audit_logs_mirror (
      id uuid primary key,
      actor_user_id uuid null,
      actor_email text null,
      actor_role text null,
      entity_type text not null,
      entity_id uuid null,
      action text not null,
      metadata jsonb not null default '{}'::jsonb,
      schema_name text null,
      table_name text null,
      record_pk text null,
      before_data jsonb null,
      after_data jsonb null,
      event_source text not null default 'trigger',
      created_at timestamptz not null
    );

    create index if not exists audit_logs_mirror_created_idx
      on sync.audit_logs_mirror (created_at desc, id);

    create table if not exists sync.applied_audit_events (
      event_id uuid primary key,
      applied_at timestamptz not null default timezone('utc', now())
    );
  `);
}

async function setTargetSyncActorContext(targetClient: Client) {
  try {
    await targetClient.query(
      `
        select app.set_actor_context($1, $2, $3, $4)
      `,
      ["sync@standby.local", "admin", null, null]
    );
  } catch {
    await targetClient.query(
      `
        select app.set_actor_context($1, $2, $3)
      `,
      ["sync@standby.local", "admin", null]
    );
  }
}

async function readCursor(targetClient: Client) {
  const result = await targetClient.query<{ last_synced_at: string }>(
    `
      select last_synced_at
      from sync.cursors
      where key = $1
    `,
    [SYNC_CURSOR_KEY]
  );

  return result.rows[0]?.last_synced_at ?? null;
}

async function writeCursor(targetClient: Client, lastSyncedAt: string) {
  await targetClient.query(
    `
      insert into sync.cursors (key, last_synced_at, updated_at)
      values ($1, $2, timezone('utc', now()))
      on conflict (key)
      do update
        set last_synced_at = excluded.last_synced_at,
            updated_at = timezone('utc', now())
    `,
    [SYNC_CURSOR_KEY, lastSyncedAt]
  );
}

async function upsertAuditLogRows(targetClient: Client, rows: AuditLogRow[]) {
  if (rows.length === 0) {
    return;
  }

  for (const row of rows) {
    await targetClient.query(
      `
        insert into sync.audit_logs_mirror (
          id,
          actor_user_id,
          actor_email,
          actor_role,
          entity_type,
          entity_id,
          action,
          metadata,
          schema_name,
          table_name,
          record_pk,
          before_data,
          after_data,
          event_source,
          created_at
        )
        values (
          $1, $2, $3, $4, $5, $6, $7,
          coalesce($8::jsonb, '{}'::jsonb),
          $9, $10, $11,
          $12::jsonb, $13::jsonb,
          $14, $15
        )
        on conflict (id)
        do update
          set actor_user_id = excluded.actor_user_id,
              actor_email = excluded.actor_email,
              actor_role = excluded.actor_role,
              entity_type = excluded.entity_type,
              entity_id = excluded.entity_id,
              action = excluded.action,
              metadata = excluded.metadata,
              schema_name = excluded.schema_name,
              table_name = excluded.table_name,
              record_pk = excluded.record_pk,
              before_data = excluded.before_data,
              after_data = excluded.after_data,
              event_source = excluded.event_source,
              created_at = excluded.created_at
      `,
      [
        row.id,
        row.actor_user_id,
        row.actor_email,
        row.actor_role,
        row.entity_type,
        row.entity_id,
        row.action,
        row.metadata ? JSON.stringify(row.metadata) : null,
        row.schema_name,
        row.table_name,
        row.record_pk,
        row.before_data ? JSON.stringify(row.before_data) : null,
        row.after_data ? JSON.stringify(row.after_data) : null,
        row.event_source,
        row.created_at,
      ]
    );
  }
}

async function readAppliedEventIds(targetClient: Client, eventIds: string[]) {
  if (eventIds.length === 0) {
    return new Set<string>();
  }

  const result = await targetClient.query<{ event_id: string }>(
    `
      select event_id::text as event_id
      from sync.applied_audit_events
      where event_id = any($1::uuid[])
    `,
    [eventIds]
  );

  return new Set(result.rows.map((row) => row.event_id));
}

async function markEventApplied(targetClient: Client, eventId: string) {
  await targetClient.query(
    `
      insert into sync.applied_audit_events (event_id)
      values ($1::uuid)
      on conflict (event_id) do nothing
    `,
    [eventId]
  );
}

async function loadTableMetadata(
  targetClient: Client,
  schemaName: string,
  tableName: string
): Promise<TableMetadata | null> {
  const columnsResult = await targetClient.query<{
    column_name: string;
    data_type: string;
  }>(
    `
      select
        column_name,
        data_type
      from information_schema.columns
      where table_schema = $1
        and table_name = $2
      order by ordinal_position asc
    `,
    [schemaName, tableName]
  );

  if (columnsResult.rows.length === 0) {
    return null;
  }

  const primaryKeyResult = await targetClient.query<{
    column_name: string;
  }>(
    `
      select
        kcu.column_name
      from information_schema.table_constraints tc
      join information_schema.key_column_usage kcu
        on tc.constraint_name = kcu.constraint_name
       and tc.table_schema = kcu.table_schema
       and tc.table_name = kcu.table_name
      where tc.constraint_type = 'PRIMARY KEY'
        and tc.table_schema = $1
        and tc.table_name = $2
      order by kcu.ordinal_position asc
    `,
    [schemaName, tableName]
  );

  return {
    columnsByName: new Map(
      columnsResult.rows.map((row) => [row.column_name, row.data_type])
    ),
    primaryKeyColumns: primaryKeyResult.rows.map((row) => row.column_name),
  } satisfies TableMetadata;
}

async function getTableMetadata(
  targetClient: Client,
  cache: Map<string, TableMetadata | null>,
  schemaName: string,
  tableName: string
) {
  const cacheKey = `${schemaName}.${tableName}`;

  if (!cache.has(cacheKey)) {
    cache.set(cacheKey, await loadTableMetadata(targetClient, schemaName, tableName));
  }

  return cache.get(cacheKey) ?? null;
}

async function replayDelete(
  targetClient: Client,
  row: AuditLogRow,
  metadata: TableMetadata
) {
  if (metadata.primaryKeyColumns.length === 0) {
    throw new Error(
      `Cannot replay delete for ${row.schema_name}.${row.table_name}: table has no primary key.`
    );
  }

  const beforeData = asRecord(row.before_data);
  const afterData = asRecord(row.after_data);
  const keyValues = metadata.primaryKeyColumns.map((columnName) => {
    const beforeValue = beforeData?.[columnName];
    const afterValue = afterData?.[columnName];
    const fallbackValue =
      metadata.primaryKeyColumns.length === 1 ? row.record_pk : undefined;
    const value =
      beforeValue !== undefined && beforeValue !== null
        ? beforeValue
        : afterValue !== undefined && afterValue !== null
          ? afterValue
          : fallbackValue;

    if (value === undefined || value === null) {
      throw new Error(
        `Cannot replay delete for ${row.schema_name}.${row.table_name}: missing primary key value for column ${columnName}.`
      );
    }

    return value;
  });

  const whereClause = metadata.primaryKeyColumns
    .map((columnName, index) => `${quoteIdentifier(columnName)} = $${index + 1}`)
    .join(" and ");
  const deleteSql = `
    delete from ${quoteIdentifier(row.schema_name!)}.${quoteIdentifier(row.table_name!)}
    where ${whereClause}
  `;

  await targetClient.query(deleteSql, keyValues);
}

async function replayUpsert(
  targetClient: Client,
  row: AuditLogRow,
  metadata: TableMetadata
) {
  if (metadata.primaryKeyColumns.length === 0) {
    throw new Error(
      `Cannot replay upsert for ${row.schema_name}.${row.table_name}: table has no primary key.`
    );
  }

  const afterData = asRecord(row.after_data);

  if (!afterData) {
    throw new Error(
      `Cannot replay ${row.action} for ${row.schema_name}.${row.table_name}: after_data is empty.`
    );
  }

  const columns = Object.keys(afterData).filter((columnName) =>
    metadata.columnsByName.has(columnName)
  );

  if (columns.length === 0) {
    return;
  }

  const values = columns.map((columnName) =>
    normalizeValueForColumn(
      afterData[columnName],
      metadata.columnsByName.get(columnName) ?? "text"
    )
  );
  const insertColumnsSql = columns.map(quoteIdentifier).join(", ");
  const placeholdersSql = columns
    .map((_, index) => `$${index + 1}`)
    .join(", ");
  const conflictColumnsSql = metadata.primaryKeyColumns.map(quoteIdentifier).join(", ");
  const mutableColumns = columns.filter(
    (columnName) => !metadata.primaryKeyColumns.includes(columnName)
  );
  const updateSql =
    mutableColumns.length > 0
      ? `do update set ${mutableColumns
          .map((columnName) => `${quoteIdentifier(columnName)} = excluded.${quoteIdentifier(columnName)}`)
          .join(", ")}`
      : "do nothing";

  const upsertSql = `
    insert into ${quoteIdentifier(row.schema_name!)}.${quoteIdentifier(row.table_name!)} (${insertColumnsSql})
    values (${placeholdersSql})
    on conflict (${conflictColumnsSql}) ${updateSql}
  `;

  await targetClient.query(upsertSql, values);
}

async function replayAuditMutationToTarget(
  targetClient: Client,
  row: AuditLogRow,
  metadataCache: Map<string, TableMetadata | null>
) {
  if (row.schema_name !== "app" || !row.table_name) {
    return false;
  }

  const action = row.action.toLowerCase();

  if (action !== "insert" && action !== "update" && action !== "delete") {
    return false;
  }

  const metadata = await getTableMetadata(
    targetClient,
    metadataCache,
    row.schema_name,
    row.table_name
  );

  if (!metadata) {
    throw new Error(`Target table ${row.schema_name}.${row.table_name} was not found.`);
  }

  if (action === "delete") {
    await replayDelete(targetClient, row, metadata);
    return true;
  }

  await replayUpsert(targetClient, row, metadata);
  return true;
}

export async function runNeonStandbySync(batchSize = DEFAULT_BATCH_SIZE): Promise<NeonStandbySyncResult> {
  const targetConnectionString = resolveTargetConnectionString();

  if (!targetConnectionString) {
    throw new Error(
      "Standby sync is not configured. Set NEON_SYNC_DATABASE_DIRECT_URL or NEON_SYNC_DATABASE_URL."
    );
  }

  const sourceIdentity = parseSourceConnectionIdentity();
  const targetIdentity = parseConnectionIdentityFromConnectionString(targetConnectionString);

  if (isSameDatabase(sourceIdentity, targetIdentity)) {
    throw new Error(
      "Standby sync source and target resolve to the same database. Refusing to run to avoid replay loops."
    );
  }

  const sourceClient = new Client(buildDatabaseClientConfig());
  const targetClient = new Client({
    connectionString: targetConnectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  await sourceClient.connect();
  await targetClient.connect();

  try {
    await targetClient.query("BEGIN");
    await ensureTargetSyncSchema(targetClient);
    await setTargetSyncActorContext(targetClient);

    const cursorFromRaw = await readCursor(targetClient);
    const cursorFrom = asIsoString(cursorFromRaw);
    const effectiveCursor = cursorFromRaw
      ? new Date(new Date(cursorFromRaw).getTime() - SYNC_OVERLAP_SECONDS * 1000).toISOString()
      : "1970-01-01T00:00:00.000Z";

    const sourceRowsResult = await sourceClient.query<AuditLogRow>(
      `
        select
          id::text as id,
          actor_user_id::text as actor_user_id,
          actor_email::text as actor_email,
          actor_role,
          entity_type,
          entity_id::text as entity_id,
          action,
          metadata,
          schema_name,
          table_name,
          record_pk,
          before_data,
          after_data,
          event_source,
          created_at::text as created_at
        from audit.audit_logs
        where created_at >= $1::timestamptz
        order by created_at asc, id asc
        limit $2
      `,
      [effectiveCursor, batchSize]
    );

    const rows = sourceRowsResult.rows;
    const eventIds = rows.map((row) => row.id);
    const appliedEventIds = await readAppliedEventIds(targetClient, eventIds);
    const metadataCache = new Map<string, TableMetadata | null>();
    let replayed = 0;
    let skippedAlreadyApplied = 0;

    await upsertAuditLogRows(targetClient, rows);

    let cursorTo = cursorFrom;

    for (const row of rows) {
      if (appliedEventIds.has(row.id)) {
        skippedAlreadyApplied += 1;
        continue;
      }

      const didReplay = await replayAuditMutationToTarget(
        targetClient,
        row,
        metadataCache
      );

      if (didReplay) {
        replayed += 1;
      }

      await markEventApplied(targetClient, row.id);
    }

    if (rows.length > 0) {
      const newestCreatedAt = rows[rows.length - 1].created_at;
      await writeCursor(targetClient, newestCreatedAt);
      cursorTo = asIsoString(newestCreatedAt);
    }

    await targetClient.query("COMMIT");

    return {
      cursorFrom,
      cursorTo,
      fetched: rows.length,
      upserted: rows.length,
      replayed,
      skippedAlreadyApplied,
      hasMore: rows.length === batchSize,
    };
  } catch (error) {
    await targetClient.query("ROLLBACK");
    throw error;
  } finally {
    await sourceClient.end();
    await targetClient.end();
  }
}
