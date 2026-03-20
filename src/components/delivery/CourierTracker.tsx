"use client";

import { useEffect, useRef, useState } from "react";
import type { DeliveryCourierSession } from "@/lib/db/types";
import { cn } from "@/lib/utils";

function formatTimestamp(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function CourierTracker({
  token,
  session,
}: {
  token: string;
  session: DeliveryCourierSession;
}) {
  const watchIdRef = useRef<number | null>(null);
  const lastSentAtRef = useRef<number>(0);
  const [isSharing, setIsSharing] = useState(false);
  const [message, setMessage] = useState<string>("Ready.");
  const [error, setError] = useState<string | null>(null);
  const [lastSentAt, setLastSentAt] = useState<string | null>(null);

  function stopSharing() {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setIsSharing(false);
  }

  async function sendPosition(position: GeolocationPosition) {
    const now = Date.now();

    if (now - lastSentAtRef.current < 12000) {
      return;
    }

    lastSentAtRef.current = now;

    const response = await fetch("/api/courier/location", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        heading: Number.isFinite(position.coords.heading)
          ? position.coords.heading
          : null,
        accuracyMeters: Number.isFinite(position.coords.accuracy)
          ? position.coords.accuracy
          : null,
        recordedAt: new Date(position.timestamp).toISOString(),
      }),
    });

    const payload = (await response.json()) as { ok: boolean; error?: string };

    if (!response.ok || !payload.ok) {
      setError(payload.error || "Unable to send location.");
      return;
    }

    setError(null);
    setMessage("Sharing");
    setLastSentAt(new Date().toISOString());
  }

  async function startSharing() {
    if (!("geolocation" in navigator)) {
      setError("Location is not available on this device.");
      return;
    }

    setError(null);
    setMessage("Requesting");

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        void sendPosition(position);
      },
      (geoError) => {
        setError(geoError.message || "Location unavailable.");
        setMessage("Stopped");
        stopSharing();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    watchIdRef.current = watchId;
    setIsSharing(true);
    setMessage("Starting");
  }

  useEffect(() => {
    return () => {
      stopSharing();
    };
  }, []);

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-10">
      <div className="w-full space-y-6 rounded-[32px] bg-system-background/88 p-6 shadow-[0_28px_90px_rgba(15,23,42,0.08)] md:p-8">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
            Courier
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-label md:text-4xl">
            #{session.orderNumber}
          </h1>
          <p className="mt-3 text-sm text-secondary-label">
            {session.riderName ?? "Delivery"} link
          </p>
        </div>

        <section className="grid gap-3 sm:grid-cols-2">
          <SignalCard label="Status" value={session.assignmentStatus.replace(/_/g, " ")} />
          <SignalCard label="Last ping" value={formatTimestamp(lastSentAt)} />
        </section>

        <section className="rounded-[28px] bg-system-fill/42 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
            Address
          </p>
          <p className="mt-2 text-sm text-label">
            {(session.deliveryAddressSnapshot.formatted as string | undefined) ||
              (session.deliveryAddressSnapshot.line1 as string | undefined) ||
              "Delivery address"}
          </p>
        </section>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={isSharing ? stopSharing : startSharing}
            className={cn(
              "button-primary min-h-[46px] min-w-[144px] px-5 text-[11px] font-semibold uppercase tracking-[0.16em]",
              !isSharing && "button-primary"
            )}
          >
            {isSharing ? "Pause" : "Start"}
          </button>
        </div>

        <div className="rounded-[24px] bg-system-fill/42 px-4 py-3">
          <p className="text-xs font-medium text-secondary-label">{message}</p>
          {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}

function SignalCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] bg-system-fill/42 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold tracking-tight text-label">{value}</p>
    </div>
  );
}
