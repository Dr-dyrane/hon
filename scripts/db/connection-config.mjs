import { fromWebToken } from "@aws-sdk/credential-provider-web-identity";
import { Signer } from "@aws-sdk/rds-signer";
import { getRuntimeVercelOidcToken } from "./vercel-oidc.mjs";

function resolveSsl() {
  return process.env.PGSSLMODE === "disable"
    ? false
    : {
        rejectUnauthorized: false,
      };
}

function resolvePort() {
  return Number.parseInt(process.env.PGPORT || "5432", 10);
}

function resolveRuntimeConnectionString() {
  if (process.env.DATABASE_DIRECT_URL) {
    return process.env.DATABASE_DIRECT_URL;
  }

  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  return null;
}

function hasDirectCredentialConfig() {
  return Boolean(
    process.env.PGHOST &&
      process.env.PGDATABASE &&
      process.env.PGUSER &&
      process.env.PGPASSWORD
  );
}

function hasIamConfig() {
  return Boolean(
    process.env.PGHOST &&
      process.env.PGDATABASE &&
      process.env.PGUSER &&
      process.env.AWS_REGION &&
      process.env.AWS_ROLE_ARN
  );
}

function createIamCredentialsProvider() {
  if (!hasIamConfig()) {
    throw new Error("IAM database configuration is incomplete.");
  }

  return async () => {
    const webIdentityToken = await getRuntimeVercelOidcToken();

    return fromWebToken({
      roleArn: process.env.AWS_ROLE_ARN,
      clientConfig: { region: process.env.AWS_REGION },
      webIdentityToken,
    })();
  };
}

function createIamPasswordProvider() {
  if (!hasIamConfig()) {
    throw new Error("IAM database configuration is incomplete.");
  }

  const signer = new Signer({
    hostname: process.env.PGHOST,
    port: resolvePort(),
    username: process.env.PGUSER,
    region: process.env.AWS_REGION,
    credentials: createIamCredentialsProvider(),
  });

  return () => signer.getAuthToken();
}

export function getConnectionConfig() {
  const connectionString = resolveRuntimeConnectionString();

  if (connectionString) {
    return {
      connectionString,
      ssl: resolveSsl(),
    };
  }

  if (hasDirectCredentialConfig()) {
    return {
      host: process.env.PGHOST,
      port: resolvePort(),
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      ssl: resolveSsl(),
    };
  }

  if (hasIamConfig()) {
    return {
      host: process.env.PGHOST,
      port: resolvePort(),
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: createIamPasswordProvider(),
      ssl: resolveSsl(),
    };
  }

  throw new Error(
    "Database configuration is missing. Set DATABASE_URL, PGPASSWORD-backed PG* variables, or PG* plus AWS_REGION and AWS_ROLE_ARN before running database scripts."
  );
}
