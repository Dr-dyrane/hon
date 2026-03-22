import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function applyEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const contents = readFileSync(filePath, "utf8");

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^"|"$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

export function loadProjectEnv(rootDir = process.cwd()) {
  applyEnvFile(path.join(rootDir, ".vercel", ".env.development.local"));
  applyEnvFile(path.join(rootDir, ".env.production.local"));
  applyEnvFile(path.join(rootDir, ".env.preview.local"));
  applyEnvFile(path.join(rootDir, ".env.local"));
  applyEnvFile(path.join(rootDir, ".env"));
}
