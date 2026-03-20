import { NextResponse } from "next/server";
import { recordCourierTrackingPoint } from "@/lib/db/repositories/delivery-repository";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    token?: string;
    latitude?: number;
    longitude?: number;
    heading?: number | null;
    accuracyMeters?: number | null;
    recordedAt?: string | null;
  };

  if (
    !body.token ||
    typeof body.latitude !== "number" ||
    typeof body.longitude !== "number"
  ) {
    return NextResponse.json(
      {
        ok: false,
        error: "Tracking payload is incomplete.",
      },
      { status: 400 }
    );
  }

  try {
    await recordCourierTrackingPoint({
      token: body.token,
      latitude: body.latitude,
      longitude: body.longitude,
      heading: body.heading ?? null,
      accuracyMeters: body.accuracyMeters ?? null,
      recordedAt: body.recordedAt ?? null,
    });

    return NextResponse.json(
      {
        ok: true,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: (error as Error).message,
      },
      { status: 400 }
    );
  }
}
