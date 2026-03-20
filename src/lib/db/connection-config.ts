import "server-only";

import { fromWebToken } from "@aws-sdk/credential-provider-web-identity";
import { Signer } from "@aws-sdk/rds-signer";
import type { AwsCredentialIdentityProvider } from "@smithy/types";
import type { ClientConfig, PoolConfig } from "pg";
import { serverEnv, type PgSslMode } from "@/lib/config/server";
import { getRuntimeVercelOidcToken } from "@/lib/vercel/oidc-token";

export type DatabaseConnectionMode =
  | "connection_string"
  | "password"
  | "iam"
  | "unconfigured";

function resolveSslConfig(sslMode: PgSslMode) {
  if (sslMode === "disable") {
    return false;
  }

  return {
    rejectUnauthorized: false,
  };
}

function resolvePort() {
  return Number.parseInt(serverEnv.database.port, 10);
}

function hasDirectCredentialConfig() {
  return Boolean(
    serverEnv.database.host &&
      serverEnv.database.name &&
      serverEnv.database.user &&
      serverEnv.database.password
  );
}

function hasIamConfig() {
  return Boolean(
    serverEnv.database.host &&
      serverEnv.database.name &&
      serverEnv.database.user &&
      serverEnv.aws.region &&
      serverEnv.aws.roleArn
  );
}

function createIamCredentialsProvider(): AwsCredentialIdentityProvider {
  if (!hasIamConfig()) {
    throw new Error("IAM database configuration is incomplete.");
  }

  return async () => {
    const webIdentityToken = await getRuntimeVercelOidcToken();

    return fromWebToken({
      roleArn: serverEnv.aws.roleArn!,
      clientConfig: { region: serverEnv.aws.region! },
      webIdentityToken,
    })();
  };
}

function createIamPasswordProvider() {
  if (!hasIamConfig()) {
    throw new Error("IAM database configuration is incomplete.");
  }

  const signer = new Signer({
    hostname: serverEnv.database.host!,
    port: resolvePort(),
    username: serverEnv.database.user!,
    region: serverEnv.aws.region!,
    credentials: createIamCredentialsProvider(),
  });

  return () => signer.getAuthToken();
}

export function resolveDatabaseConnectionMode(): DatabaseConnectionMode {
  if (serverEnv.database.url) {
    return "connection_string";
  }

  if (hasDirectCredentialConfig()) {
    return "password";
  }

  if (hasIamConfig()) {
    return "iam";
  }

  return "unconfigured";
}

function getSharedClientConfig() {
  return {
    host: serverEnv.database.host!,
    port: resolvePort(),
    database: serverEnv.database.name!,
    user: serverEnv.database.user!,
    ssl: resolveSslConfig(serverEnv.database.sslMode),
  };
}

export function buildDatabasePoolConfig(): PoolConfig {
  switch (resolveDatabaseConnectionMode()) {
    case "connection_string":
      return {
        connectionString: serverEnv.database.url!,
        ssl: resolveSslConfig(serverEnv.database.sslMode),
        max: 10,
        idleTimeoutMillis: 30_000,
      };
    case "password":
      return {
        ...getSharedClientConfig(),
        password: serverEnv.database.password!,
        max: 10,
        idleTimeoutMillis: 30_000,
      };
    case "iam":
      return {
        ...getSharedClientConfig(),
        password: createIamPasswordProvider(),
        max: 10,
        idleTimeoutMillis: 30_000,
      };
    default:
      throw new Error("Database configuration is incomplete.");
  }
}

export function buildDatabaseClientConfig(): ClientConfig {
  switch (resolveDatabaseConnectionMode()) {
    case "connection_string":
      return {
        connectionString: serverEnv.database.url!,
        ssl: resolveSslConfig(serverEnv.database.sslMode),
      };
    case "password":
      return {
        ...getSharedClientConfig(),
        password: serverEnv.database.password!,
      };
    case "iam":
      return {
        ...getSharedClientConfig(),
        password: createIamPasswordProvider(),
      };
    default:
      throw new Error("Database configuration is incomplete.");
  }
}
