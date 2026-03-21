const runtimeVersion =
  new URL(self.location.href).searchParams.get("v") || "unknown";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      const clients = await self.clients.matchAll({
        includeUncontrolled: true,
        type: "window",
      });

      await Promise.all(
        clients.map((client) =>
          client.postMessage({
            type: "HOP_RUNTIME_SW_ACTIVATED",
            version: runtimeVersion,
          })
        )
      );
    })()
  );
});
