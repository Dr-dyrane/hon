import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { withClient } from "./connection.mjs";

const migrationsDir = path.join(process.cwd(), "db", "migrations");

async function ensureMigrationTable(client) {
  await client.query(`
    create table if not exists public.schema_migrations (
      version text primary key,
      applied_at timestamptz not null default timezone('utc', now())
    )
  `);
}

async function getMigrationFiles() {
  const entries = await readdir(migrationsDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

await withClient(async (client) => {
  await ensureMigrationTable(client);

  const appliedResult = await client.query(
    "select version from public.schema_migrations"
  );
  const appliedVersions = new Set(appliedResult.rows.map((row) => row.version));
  const migrationFiles = await getMigrationFiles();

  for (const fileName of migrationFiles) {
    if (appliedVersions.has(fileName)) {
      continue;
    }

    const filePath = path.join(migrationsDir, fileName);
    const sql = await readFile(filePath, "utf8");

    console.log(`Applying migration ${fileName}`);

    await client.query("BEGIN");

    try {
      await client.query(sql);
      await client.query(
        "insert into public.schema_migrations (version) values ($1)",
        [fileName]
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }

  console.log("Migrations are up to date.");
});
