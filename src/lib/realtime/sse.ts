import "server-only";

const encoder = new TextEncoder();

type SseOptions<T> = {
  request: Request;
  event: string;
  load: () => Promise<T>;
  intervalMs?: number;
  retryMs?: number;
};

function encodeComment(value: string) {
  return encoder.encode(`: ${value}\n\n`);
}

function encodeEvent<T>(event: string, payload: T) {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
}

function buildHeaders() {
  return {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-store, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  };
}

export function createSseResponse<T>({
  request,
  event,
  load,
  intervalMs = 10000,
  retryMs = 10000,
}: SseOptions<T>) {
  let dispose: (() => void) | null = null;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      let lastPayload = "";
      let sending = false;
      let refreshTimer: ReturnType<typeof setInterval> | null = null;
      let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

      const cleanup = () => {
        if (closed) {
          return;
        }

        closed = true;

        if (refreshTimer) {
          clearInterval(refreshTimer);
        }

        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
        }

        request.signal.removeEventListener("abort", handleAbort);

        try {
          controller.close();
        } catch {}
      };
      dispose = cleanup;

      const handleAbort = () => {
        cleanup();
      };

      const sendLatest = async () => {
        if (closed || sending) {
          return;
        }

        sending = true;

        try {
          const payload = await load();
          const serialized = JSON.stringify(payload);

          if (serialized !== lastPayload) {
            lastPayload = serialized;
            controller.enqueue(encodeEvent(event, payload));
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Stream unavailable.";

          controller.enqueue(encodeEvent("error", { message }));
        } finally {
          sending = false;
        }
      };

      request.signal.addEventListener("abort", handleAbort);

      controller.enqueue(encoder.encode(`retry: ${retryMs}\n\n`));
      controller.enqueue(encodeComment("connected"));
      await sendLatest();

      refreshTimer = setInterval(() => {
        void sendLatest();
      }, intervalMs);

      heartbeatTimer = setInterval(() => {
        if (!closed) {
          controller.enqueue(encodeComment("keepalive"));
        }
      }, 15000);
    },
    cancel() {
      dispose?.();
    },
  });

  return new Response(stream, {
    headers: buildHeaders(),
  });
}
