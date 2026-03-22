import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { withClient } from "./connection.mjs";
import { loadProjectEnv } from "./load-env.mjs";
import { marketingBootstrap } from "../../src/lib/marketing/bootstrap-data.mjs";

loadProjectEnv();

function readArgValue(flag) {
  const index = process.argv.findIndex((value) => value === flag);
  if (index === -1) {
    return null;
  }

  const value = process.argv[index + 1];
  return value && !value.startsWith("--") ? value : null;
}

const bucketName =
  readArgValue("--bucket")?.trim() || process.env.S3_BUCKET_NAME?.trim() || null;
const bucketRegion =
  readArgValue("--region")?.trim() || process.env.S3_BUCKET_REGION?.trim() || null;
const uploadPrefix =
  readArgValue("--prefix")?.trim() ||
  process.env.S3_UPLOAD_PREFIX?.trim() ||
  "uploads";
const dryRun = process.argv.includes("--dry-run");
const force = process.argv.includes("--force");

if (!dryRun && (!bucketName || !bucketRegion)) {
  throw new Error("Missing S3_BUCKET_NAME or S3_BUCKET_REGION.");
}

const s3 = !dryRun && bucketRegion ? new S3Client({ region: bucketRegion }) : null;

function normalizeToken(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getMimeType(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".png") {
    return "image/png";
  }

  if (extension === ".jpg" || extension === ".jpeg") {
    return "image/jpeg";
  }

  if (extension === ".webp") {
    return "image/webp";
  }

  if (extension === ".avif") {
    return "image/avif";
  }

  return "application/octet-stream";
}

function getPublicUrl(key) {
  if (!bucketName || !bucketRegion) {
    return key;
  }

  return `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${key}`;
}

function ensureAbsoluteFromPublic(relativePath) {
  const normalized = relativePath.replace(/^\/+/, "");
  return path.join(process.cwd(), "public", normalized);
}

async function createImageLookup() {
  const lookup = new Map();
  const ingredientImageDir = path.join(process.cwd(), "public", "images", "ingredients");
  const files = await readdir(ingredientImageDir, { withFileTypes: true });

  for (const entry of files) {
    if (!entry.isFile()) {
      continue;
    }

    const absolutePath = path.join(ingredientImageDir, entry.name);
    const stem = path.basename(entry.name, path.extname(entry.name));
    const key = normalizeToken(stem);

    if (key && !lookup.has(key)) {
      lookup.set(key, absolutePath);
    }
  }

  for (const ingredient of marketingBootstrap.ingredients) {
    if (!ingredient.image?.startsWith("/")) {
      continue;
    }

    const absolutePath = ensureAbsoluteFromPublic(ingredient.image);
    const imageStem = path.basename(ingredient.image, path.extname(ingredient.image));
    const candidates = [
      ingredient.id,
      ingredient.name,
      imageStem,
      ...(ingredient.aliases ?? []),
    ];

    for (const candidate of candidates) {
      const key = normalizeToken(candidate);

      if (key && !lookup.has(key)) {
        lookup.set(key, absolutePath);
      }
    }
  }

  return lookup;
}

function findImagePath(lookup, ingredient) {
  const aliases = Array.isArray(ingredient.aliases) ? ingredient.aliases : [];
  const candidates = [ingredient.ingredientSlug, ingredient.ingredientName, ...aliases];

  for (const candidate of candidates) {
    const key = normalizeToken(candidate);

    if (key && lookup.has(key)) {
      return lookup.get(key);
    }
  }

  return null;
}

function isExternalUrl(value) {
  return /^https?:\/\//i.test(value || "");
}

await withClient(async (client) => {
  const lookup = await createImageLookup();
  const result = await client.query(`
    select
      id as "ingredientId",
      slug as "ingredientSlug",
      name as "ingredientName",
      coalesce(aliases, '[]'::jsonb) as aliases,
      image_path as "imagePath"
    from app.ingredients
    order by sort_order asc, created_at asc
  `);

  const rows = result.rows;
  let updated = 0;
  let skipped = 0;
  let unmatched = 0;

  for (const row of rows) {
    const sourcePath = findImagePath(lookup, row);

    if (!sourcePath) {
      unmatched += 1;
      console.log(`No image match for: ${row.ingredientName}`);
      continue;
    }

    if (row.imagePath && isExternalUrl(row.imagePath) && !force) {
      skipped += 1;
      console.log(`Skip (already external URL): ${row.ingredientName}`);
      continue;
    }

    const fileName = path.basename(sourcePath);
    const key = `${uploadPrefix}/catalog/ingredients/${row.ingredientId}/image/${fileName}`;
    const body = await readFile(sourcePath);

    if (!dryRun) {
      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: body,
          ContentType: getMimeType(sourcePath),
          CacheControl: "public, max-age=31536000, immutable",
        })
      );

      const publicUrl = getPublicUrl(key);
      await client.query(
        `
          update app.ingredients
          set image_path = $1
          where id = $2
        `,
        [publicUrl, row.ingredientId]
      );
    }

    updated += 1;
    console.log(`${dryRun ? "[dry-run] " : ""}Synced image: ${row.ingredientName}`);
  }

  console.log("");
  console.log(
    `Ingredient image sync complete. updated=${updated} skipped=${skipped} unmatched=${unmatched} total=${rows.length}`
  );
});
