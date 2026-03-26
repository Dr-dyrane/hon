import "server-only";

import { revalidateTag } from "next/cache";

export const MARKETING_SNAPSHOT_TAG = "marketing-snapshot";

export function revalidateMarketingSnapshot() {
  revalidateTag(MARKETING_SNAPSHOT_TAG);
}
