import { publicEnv } from "@/lib/config/public";

export function getTrackingCoords(snapshot: Record<string, unknown>) {
  const latitudeCandidates = [snapshot.latitude, snapshot.lat];
  const longitudeCandidates = [snapshot.longitude, snapshot.lng];
  const lat =
    latitudeCandidates.find((value) => typeof value === "number") ?? null;
  const lng =
    longitudeCandidates.find((value) => typeof value === "number") ?? null;

  if (typeof lat === "number" && typeof lng === "number") {
    return { lat, lng };
  }

  return null;
}

export function buildTrackingMapUrl(input: {
  latitude: number;
  longitude: number;
  width?: number;
  height?: number;
  zoom?: number;
}) {
  if (!publicEnv.mapboxAccessToken) {
    return null;
  }

  const width = input.width ?? 960;
  const height = input.height ?? 540;
  const zoom = input.zoom ?? 13;
  const style = "mapbox/light-v10";
  const pin = `pin-s+0f0(${input.longitude},${input.latitude})`;

  return `https://api.mapbox.com/styles/v1/${style}/static/${pin}/${input.longitude},${input.latitude},${zoom}/${width}x${height}@2x?access_token=${publicEnv.mapboxAccessToken}`;
}

export function getTrackingFreshness(recordedAt: string | null) {
  if (!recordedAt) {
    return {
      label: "No signal",
      tone: "muted" as const,
      ageMinutes: null,
    };
  }

  const ageMinutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(recordedAt).getTime()) / 60000)
  );

  if (ageMinutes <= 3) {
    return {
      label: "Live",
      tone: "live" as const,
      ageMinutes,
    };
  }

  if (ageMinutes <= 15) {
    return {
      label: "Recent",
      tone: "recent" as const,
      ageMinutes,
    };
  }

  return {
    label: "Stale",
    tone: "stale" as const,
    ageMinutes,
  };
}
