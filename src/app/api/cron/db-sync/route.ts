import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/config/server";
import { runNeonStandbySync } from "@/lib/db/sync/neon-standby-sync";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  if (serverEnv.isDevelopment && !serverEnv.cron.secret) {
    return true;
  }

  const expected = serverEnv.cron.secret;

  if (!expected) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${expected}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Cron access denied.",
      },
      { status: 401 }
    );
  }

  const batchSizeParam = new URL(request.url).searchParams.get("batchSize");
  const parsedBatchSize = Number.parseInt(batchSizeParam ?? "", 10);
  const batchSize =
    Number.isFinite(parsedBatchSize) && parsedBatchSize > 0 && parsedBatchSize <= 5_000
      ? parsedBatchSize
      : undefined;

  try {
    const result = await runNeonStandbySync(batchSize);

    return NextResponse.json(
      {
        ok: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Standby sync failed.",
      },
      { status: 500 }
    );
  }
}
