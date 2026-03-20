import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const OIDC_REFRESH_BUFFER_MS = 300000;

function readJsonFile(filePath) {
  if (!existsSync(filePath)) {
    return null;
  }

  return JSON.parse(readFileSync(filePath, "utf8"));
}

function readEnvFileValue(filePath, key) {
  if (!existsSync(filePath)) {
    return null;
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

    const currentKey = line.slice(0, separatorIndex).trim();

    if (currentKey !== key) {
      continue;
    }

    return line.slice(separatorIndex + 1).trim().replace(/^"|"$/g, "");
  }

  return null;
}

function decodeJwtPayload(token) {
  const tokenParts = token.split(".");

  if (tokenParts.length !== 3) {
    return null;
  }

  try {
    const base64 = tokenParts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

function isTokenFresh(token, bufferMs = OIDC_REFRESH_BUFFER_MS) {
  if (!token) {
    return false;
  }

  const payload = decodeJwtPayload(token);

  if (!payload?.exp) {
    return true;
  }

  return payload.exp * 1000 > Date.now() + bufferMs;
}

function readPulledOidcToken(rootDir = process.cwd()) {
  const candidatePaths = [
    path.join(rootDir, ".vercel", ".env.development.local"),
    path.join(rootDir, ".vercel", ".env.preview.local"),
    path.join(rootDir, ".vercel", ".env.production.local"),
  ];

  for (const filePath of candidatePaths) {
    const token = readEnvFileValue(filePath, "VERCEL_OIDC_TOKEN");

    if (isTokenFresh(token)) {
      return token;
    }
  }

  return null;
}

function readLocalVercelAccessToken() {
  if (process.env.VERCEL_ACCESS_TOKEN?.trim()) {
    return process.env.VERCEL_ACCESS_TOKEN.trim();
  }

  const candidatePaths = [
    process.env.LOCALAPPDATA
      ? path.join(process.env.LOCALAPPDATA, "com.vercel.cli", "auth.json")
      : null,
    process.env.APPDATA
      ? path.join(process.env.APPDATA, "com.vercel.cli", "Data", "auth.json")
      : null,
  ].filter(Boolean);

  for (const filePath of candidatePaths) {
    const authConfig = readJsonFile(filePath);

    if (authConfig?.token?.trim()) {
      return authConfig.token.trim();
    }
  }

  return null;
}

function readLinkedProjectInfo(rootDir = process.cwd()) {
  const project = readJsonFile(path.join(rootDir, ".vercel", "project.json"));

  if (!project?.projectId) {
    return null;
  }

  return {
    projectId: project.projectId,
    teamId: project.orgId,
  };
}

async function requestFreshOidcToken(projectInfo, accessToken) {
  const query = projectInfo.teamId
    ? `?source=vercel-oidc-refresh&teamId=${projectInfo.teamId}`
    : "?source=vercel-oidc-refresh";
  const response = await fetch(
    `https://api.vercel.com/v1/projects/${projectInfo.projectId}/token${query}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to refresh local Vercel OIDC token: ${response.status} ${response.statusText}`
    );
  }

  const payload = await response.json();

  if (!payload?.token) {
    throw new Error("Vercel OIDC token refresh returned no token.");
  }

  return payload.token;
}

export async function getRuntimeVercelOidcToken() {
  if (isTokenFresh(process.env.VERCEL_OIDC_TOKEN)) {
    return process.env.VERCEL_OIDC_TOKEN;
  }

  const accessToken = readLocalVercelAccessToken();
  const projectInfo = readLinkedProjectInfo();

  if (accessToken && projectInfo) {
    const refreshedToken = await requestFreshOidcToken(projectInfo, accessToken);
    process.env.VERCEL_OIDC_TOKEN = refreshedToken;

    return refreshedToken;
  }

  const pulledToken = readPulledOidcToken();

  if (pulledToken) {
    process.env.VERCEL_OIDC_TOKEN = pulledToken;
    return pulledToken;
  }

  throw new Error(
    "No local Vercel OIDC token is available. Run `vercel pull` in this project, or ensure the Vercel CLI is logged in and the project is linked."
  );
}
