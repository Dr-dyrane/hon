import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { withClient } from "./connection.mjs";

const seedsDir = path.join(process.cwd(), "db", "seeds");

async function ensureSeedTable(client) {
  await client.query(`
    create table if not exists public.seed_runs (
      version text primary key,
      applied_at timestamptz not null default timezone('utc', now())
    )
  `);
}

async function getSeedFiles() {
  const entries = await readdir(seedsDir, { withFileTypes: true });

  return entries
    .filter(
      (entry) =>
        entry.isFile() &&
        (entry.name.endsWith(".sql") || entry.name.endsWith(".mjs"))
    )
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

await withClient(async (client) => {
  await ensureSeedTable(client);

  const appliedResult = await client.query("select version from public.seed_runs");
  const appliedVersions = new Set(appliedResult.rows.map((row) => row.version));
  const seedFiles = await getSeedFiles();

  for (const fileName of seedFiles) {
    if (appliedVersions.has(fileName)) {
      continue;
    }

    const filePath = path.join(seedsDir, fileName);

    console.log(`Running seed ${fileName}`);

    await client.query("BEGIN");

    try {
      if (fileName.endsWith(".sql")) {
        const sql = await readFile(filePath, "utf8");
        await client.query(sql);
      } else {
        const seedModule = await import(pathToFileURL(filePath).href);

        if (typeof seedModule.run !== "function") {
          throw new Error(`Seed module ${fileName} must export an async run(client) function.`);
        }

        await seedModule.run(client);
      }

      await client.query(
        "insert into public.seed_runs (version) values ($1)",
        [fileName]
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }

  console.log("Seeds are up to date.");
});
