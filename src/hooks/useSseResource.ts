"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

type SseHookOptions<T> = {
  initialData: T;
  event: string;
  streamUrl: string | null;
  fallbackUrl?: string | null;
};

type SseHookResult<T> = {
  data: T;
  error: string | null;
  status: "streaming" | "polling" | "idle";
};

export function useSseResource<T>({
  initialData,
  event,
  streamUrl,
  fallbackUrl,
}: SseHookOptions<T>): SseHookResult<T> {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"streaming" | "polling" | "idle">(
    streamUrl ? "streaming" : fallbackUrl ? "polling" : "idle"
  );
  const pollingRef = useRef<number | null>(null);

  const stopPolling = useEffectEvent(() => {
    if (pollingRef.current != null) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  });

  const refreshFromFallback = useEffectEvent(async () => {
    if (!fallbackUrl) {
      return;
    }

    const response = await fetch(fallbackUrl, {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Refresh unavailable.");
    }

    const payload = (await response.json()) as {
      ok?: boolean;
      data?: T;
      error?: string;
    };

    if (payload.data === undefined) {
      throw new Error(payload.error || "Refresh unavailable.");
    }

    setData(payload.data);
    setError(null);
  });

  const startPolling = useEffectEvent(() => {
    if (!fallbackUrl || pollingRef.current != null) {
      return;
    }

    setStatus("polling");
    void refreshFromFallback().catch((refreshError) => {
      const message =
        refreshError instanceof Error ? refreshError.message : "Refresh unavailable.";
      setError(message);
    });
    pollingRef.current = window.setInterval(() => {
      void refreshFromFallback().catch((refreshError) => {
        const message =
          refreshError instanceof Error ? refreshError.message : "Refresh unavailable.";
        setError(message);
      });
    }, 15000);
  });

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    if (!streamUrl || typeof window === "undefined" || !("EventSource" in window)) {
      startPolling();
      return () => {
        stopPolling();
      };
    }

    const source = new window.EventSource(streamUrl);

    const handleSnapshot = (sourceEvent: MessageEvent<string>) => {
      const payload = JSON.parse(sourceEvent.data) as T;
      setData(payload);
      setError(null);
      setStatus("streaming");
      stopPolling();
    };

    const handleError = () => {
      setError("Reconnecting.");
      startPolling();
    };

    source.addEventListener(event, handleSnapshot as EventListener);
    source.addEventListener("error", handleError as EventListener);

    return () => {
      source.removeEventListener(event, handleSnapshot as EventListener);
      source.removeEventListener("error", handleError as EventListener);
      source.close();
      stopPolling();
    };
  }, [event, fallbackUrl, streamUrl]);

  return { data, error, status };
}
