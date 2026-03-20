import { readUrlEnv } from "@/lib/config/env-core";

const appUrl = readUrlEnv(
  "NEXT_PUBLIC_APP_URL",
  process.env.NEXT_PUBLIC_APP_URL
);

export const publicEnv = {
  appUrl: appUrl ?? "http://localhost:3000",
  mapboxAccessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() || "",
} as const;
