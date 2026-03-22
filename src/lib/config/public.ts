import { readUrlEnv } from "@/lib/config/env-core";

const appUrl = readUrlEnv(
  "NEXT_PUBLIC_APP_URL",
  process.env.NEXT_PUBLIC_APP_URL
);

const geocodingEnabledValue =
  process.env.NEXT_PUBLIC_MAPBOX_GEOCODING_ENABLED?.trim().toLowerCase() ?? "";
const mapboxGeocodingEnabled =
  geocodingEnabledValue === "1" ||
  geocodingEnabledValue === "true" ||
  geocodingEnabledValue === "yes" ||
  geocodingEnabledValue === "on";

export const publicEnv = {
  appUrl: appUrl ?? "http://localhost:3000",
  mapboxAccessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() || "",
  mapboxGeocodingEnabled,
  webPushPublicKey:
    process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY?.trim() || "",
} as const;
