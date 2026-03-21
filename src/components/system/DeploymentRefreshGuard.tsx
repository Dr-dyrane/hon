"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const RUNTIME_VERSION_STORAGE_KEY = "hop-runtime-version";
const RUNTIME_REFRESH_FLAG_KEY = "hop-runtime-refreshing";
const RUNTIME_PROMPT_DISMISSED_KEY = "hop-runtime-prompt-dismissed";
const SERVICE_WORKER_CLEANUP_KEY = "hop-runtime-sw-cleanup";
const RUNTIME_SERVICE_WORKER_PATH = "/hop-runtime-sw.js";
const STORAGE_PREFIXES = ["hop-", "hop_"];

function collectMatchingKeys(storage: Storage) {
  const keys: string[] = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);

    if (!key) {
      continue;
    }

    if (STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      keys.push(key);
    }
  }

  return keys;
}

function clearAppStorage() {
  for (const key of collectMatchingKeys(window.localStorage)) {
    window.localStorage.removeItem(key);
  }

  for (const key of collectMatchingKeys(window.sessionStorage)) {
    window.sessionStorage.removeItem(key);
  }
}

function isRuntimeServiceWorkerRegistration(registration: ServiceWorkerRegistration) {
  const urls = [
    registration.active?.scriptURL,
    registration.waiting?.scriptURL,
    registration.installing?.scriptURL,
  ].filter((value): value is string => Boolean(value));

  return urls.some((url) => {
    try {
      return new URL(url).pathname === RUNTIME_SERVICE_WORKER_PATH;
    } catch {
      return false;
    }
  });
}

async function cleanupLegacyServiceWorkers() {
  if (!("serviceWorker" in navigator)) {
    return false;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  const legacyRegistrations = registrations.filter(
    (registration) => !isRuntimeServiceWorkerRegistration(registration)
  );

  if (legacyRegistrations.length === 0) {
    return false;
  }

  await Promise.all(
    legacyRegistrations.map((registration) => registration.unregister())
  );
  return true;
}

async function registerRuntimeServiceWorker(version: string) {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  return navigator.serviceWorker.register(
    `${RUNTIME_SERVICE_WORKER_PATH}?v=${encodeURIComponent(version)}`,
    { scope: "/" }
  );
}

async function clearCacheStorage() {
  if (!("caches" in window)) {
    return;
  }

  const cacheKeys = await window.caches.keys();
  await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
}

async function readRuntimeVersion() {
  const response = await fetch("/api/runtime-version", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });

  const payload = (await response.json()) as {
    ok?: boolean;
    version?: string;
  };

  return payload.ok && payload.version ? payload.version : null;
}

export function DeploymentRefreshGuard({
  currentVersion,
  enableServiceWorker = false,
}: {
  currentVersion: string;
  enableServiceWorker?: boolean;
}) {
  const isRefreshingRef = useRef(false);
  const dismissedVersionRef = useRef<string | null>(null);
  const pendingWorkerVersionRef = useRef<string | null>(null);
  const activationTimeoutRef = useRef<number | null>(null);
  const [availableVersion, setAvailableVersion] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const clearActivationTimeout = useCallback(() => {
    if (activationTimeoutRef.current !== null) {
      window.clearTimeout(activationTimeoutRef.current);
      activationTimeoutRef.current = null;
    }
  }, []);

  const completeRefreshForVersion = useCallback(
    async (nextVersion: string) => {
      if (isRefreshingRef.current) {
        return;
      }

      isRefreshingRef.current = true;
      setIsUpdating(true);
      setAvailableVersion(null);
      pendingWorkerVersionRef.current = null;
      clearActivationTimeout();
      dismissedVersionRef.current = null;

      window.sessionStorage.setItem(RUNTIME_REFRESH_FLAG_KEY, nextVersion);
      window.sessionStorage.removeItem(RUNTIME_PROMPT_DISMISSED_KEY);

      try {
        await fetch("/api/runtime-reset", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
        });
      } catch {
        // Best effort only. Client-side cleanup still runs.
      }

      clearAppStorage();
      window.localStorage.setItem(RUNTIME_VERSION_STORAGE_KEY, nextVersion);
      window.sessionStorage.setItem(RUNTIME_REFRESH_FLAG_KEY, nextVersion);

      await clearCacheStorage();
      window.location.reload();
    },
    [clearActivationTimeout]
  );

  const beginRefreshForVersion = useCallback(
    async (nextVersion: string) => {
      if (isRefreshingRef.current) {
        return;
      }

      if (!enableServiceWorker || !("serviceWorker" in navigator)) {
        await completeRefreshForVersion(nextVersion);
        return;
      }

      setIsUpdating(true);
      setAvailableVersion(null);
      dismissedVersionRef.current = null;
      pendingWorkerVersionRef.current = nextVersion;
      window.sessionStorage.removeItem(RUNTIME_PROMPT_DISMISSED_KEY);

      try {
        await registerRuntimeServiceWorker(nextVersion);
        clearActivationTimeout();
        activationTimeoutRef.current = window.setTimeout(() => {
          if (pendingWorkerVersionRef.current === nextVersion) {
            void completeRefreshForVersion(nextVersion);
          }
        }, 2500);
      } catch {
        pendingWorkerVersionRef.current = null;
        clearActivationTimeout();
        await completeRefreshForVersion(nextVersion);
      }
    },
    [clearActivationTimeout, completeRefreshForVersion, enableServiceWorker]
  );

  useEffect(() => {
    if (!enableServiceWorker || !("serviceWorker" in navigator)) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      const payload = event.data as
        | { type?: string; version?: string }
        | undefined;

      if (
        payload?.type !== "HOP_RUNTIME_SW_ACTIVATED" ||
        !payload.version ||
        pendingWorkerVersionRef.current !== payload.version
      ) {
        return;
      }

      void completeRefreshForVersion(payload.version);
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, [completeRefreshForVersion, enableServiceWorker]);

  useEffect(() => {
    let disposed = false;

    async function ensureServiceWorkersAreHealthy() {
      if (!("serviceWorker" in navigator)) {
        return;
      }

      if (window.sessionStorage.getItem(SERVICE_WORKER_CLEANUP_KEY) !== currentVersion) {
        const unregistered = await cleanupLegacyServiceWorkers();

        if (unregistered) {
          await clearCacheStorage();
        }

        window.sessionStorage.setItem(SERVICE_WORKER_CLEANUP_KEY, currentVersion);
      }

      if (enableServiceWorker) {
        await registerRuntimeServiceWorker(currentVersion);
      }
    }

    async function checkForRuntimeMismatch() {
      if (disposed || isRefreshingRef.current) {
        return;
      }

      const remoteVersion = await readRuntimeVersion();

      if (!remoteVersion) {
        return;
      }

      if (remoteVersion === currentVersion) {
        setAvailableVersion(null);
        return;
      }

      if (enableServiceWorker && "serviceWorker" in navigator) {
        await beginRefreshForVersion(remoteVersion);
        return;
      }

      if (dismissedVersionRef.current === remoteVersion) {
        return;
      }

      setAvailableVersion(remoteVersion);
    }

    async function boot() {
      const storedVersion = window.localStorage.getItem(RUNTIME_VERSION_STORAGE_KEY);
      const activeRefreshVersion = window.sessionStorage.getItem(
        RUNTIME_REFRESH_FLAG_KEY
      );
      dismissedVersionRef.current = window.sessionStorage.getItem(
        RUNTIME_PROMPT_DISMISSED_KEY
      );

      if (
        storedVersion &&
        storedVersion !== currentVersion &&
        activeRefreshVersion !== currentVersion
      ) {
        await beginRefreshForVersion(currentVersion);
        return;
      }

      window.localStorage.setItem(RUNTIME_VERSION_STORAGE_KEY, currentVersion);
      window.sessionStorage.removeItem(RUNTIME_REFRESH_FLAG_KEY);

      if (dismissedVersionRef.current === currentVersion) {
        window.sessionStorage.removeItem(RUNTIME_PROMPT_DISMISSED_KEY);
        dismissedVersionRef.current = null;
      }

      await ensureServiceWorkersAreHealthy();
    }

    void boot();

    const handleFocus = () => {
      void checkForRuntimeMismatch();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void checkForRuntimeMismatch();
      }
    };

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void checkForRuntimeMismatch();
      }
    }, 60_000);

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      disposed = true;
      clearActivationTimeout();
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    beginRefreshForVersion,
    clearActivationTimeout,
    currentVersion,
    enableServiceWorker,
  ]);

  if (!availableVersion) {
    return null;
  }

  return (
    <div className="z-layer-popover fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5.75rem)] md:inset-x-auto md:right-6 md:bottom-6">
      <div className="w-full max-w-[22rem] rounded-[28px] bg-system-background/92 p-4 shadow-[0_18px_48px_rgba(15,23,42,0.16)] backdrop-blur-xl">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
          Update ready
        </div>
        <div className="mt-2 text-base font-semibold tracking-tight text-label">
          A newer version of House of Prax is available.
        </div>
        <div className="mt-1 text-sm text-secondary-label">
          Refresh to load the latest changes and clear stale app state.
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              dismissedVersionRef.current = availableVersion;
              window.sessionStorage.setItem(
                RUNTIME_PROMPT_DISMISSED_KEY,
                availableVersion
              );
              setAvailableVersion(null);
            }}
            className="rounded-full bg-system-fill/64 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label transition-colors duration-200 hover:bg-system-fill hover:text-label"
          >
            Later
          </button>
          <button
            type="button"
            onClick={() => void beginRefreshForVersion(availableVersion)}
            disabled={isUpdating}
            className="button-primary min-h-[42px] px-4 text-[10px] font-semibold uppercase tracking-[0.16em] disabled:pointer-events-none disabled:opacity-60"
          >
            {isUpdating ? "Updating" : "Update app"}
          </button>
        </div>
      </div>
    </div>
  );
}
