"use client";

import { useEffect, useRef } from "react";

const RUNTIME_VERSION_STORAGE_KEY = "hop-runtime-version";
const RUNTIME_REFRESH_FLAG_KEY = "hop-runtime-refreshing";
const SERVICE_WORKER_CLEANUP_KEY = "hop-runtime-sw-cleanup";
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

async function unregisterLegacyServiceWorkers() {
  if (!("serviceWorker" in navigator)) {
    return false;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();

  if (registrations.length === 0) {
    return false;
  }

  await Promise.all(registrations.map((registration) => registration.unregister()));
  return true;
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
}: {
  currentVersion: string;
}) {
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    let disposed = false;

    async function refreshForVersion(nextVersion: string) {
      if (disposed || isRefreshingRef.current) {
        return;
      }

      isRefreshingRef.current = true;
      window.sessionStorage.setItem(RUNTIME_REFRESH_FLAG_KEY, nextVersion);

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
      await unregisterLegacyServiceWorkers();

      window.location.reload();
    }

    async function ensureLegacyServiceWorkersAreGone() {
      if (window.sessionStorage.getItem(SERVICE_WORKER_CLEANUP_KEY) === currentVersion) {
        return;
      }

      const unregistered = await unregisterLegacyServiceWorkers();

      if (unregistered) {
        await clearCacheStorage();
      }

      window.sessionStorage.setItem(SERVICE_WORKER_CLEANUP_KEY, currentVersion);
    }

    async function checkForRuntimeMismatch() {
      if (disposed || isRefreshingRef.current) {
        return;
      }

      const remoteVersion = await readRuntimeVersion();

      if (!remoteVersion || remoteVersion === currentVersion) {
        return;
      }

      await refreshForVersion(remoteVersion);
    }

    async function boot() {
      const storedVersion = window.localStorage.getItem(RUNTIME_VERSION_STORAGE_KEY);
      const activeRefreshVersion = window.sessionStorage.getItem(
        RUNTIME_REFRESH_FLAG_KEY
      );

      if (
        storedVersion &&
        storedVersion !== currentVersion &&
        activeRefreshVersion !== currentVersion
      ) {
        await refreshForVersion(currentVersion);
        return;
      }

      window.localStorage.setItem(RUNTIME_VERSION_STORAGE_KEY, currentVersion);
      window.sessionStorage.removeItem(RUNTIME_REFRESH_FLAG_KEY);
      await ensureLegacyServiceWorkersAreGone();
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
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentVersion]);

  return null;
}
