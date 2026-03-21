import "server-only";

function readRuntimeValue(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function getRuntimeVersion() {
  const commitSha = readRuntimeValue(process.env.VERCEL_GIT_COMMIT_SHA);
  const deploymentId = readRuntimeValue(process.env.VERCEL_DEPLOYMENT_ID);
  const packageVersion = readRuntimeValue(process.env.npm_package_version);
  const nodeEnv = readRuntimeValue(process.env.NODE_ENV) ?? "development";

  if (commitSha) {
    return commitSha;
  }

  if (deploymentId) {
    return deploymentId;
  }

  if (packageVersion) {
    return `${packageVersion}-${nodeEnv}`;
  }

  return nodeEnv;
}
