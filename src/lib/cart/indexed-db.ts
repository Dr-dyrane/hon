"use client";

export type PersistedCartItem = {
  productId: string;
  quantity: number;
};

export type PersistedCheckoutDraft = {
  fullName: string;
  email: string;
  phoneNumber: string;
  deliveryLocation: string;
  notes: string;
  latitude: string;
  longitude: string;
};

type StoredValueRecord<T> = {
  key: string;
  value: T;
  updatedAt: string;
};

const DB_NAME = "hop-client-state";
const DB_VERSION = 1;
const STORE_NAME = "keyval";
const CART_ITEMS_KEY = "commerce:cart-items";
const GUEST_SCOPE_KEY = "guest";

let dbPromise: Promise<IDBDatabase | null> | null = null;

function supportsIndexedDb() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function normalizeDraftScope(scope?: string | null) {
  const normalized = scope?.trim().toLowerCase();
  return normalized && normalized.length > 0 ? normalized : GUEST_SCOPE_KEY;
}

function getCheckoutDraftKey(scope?: string | null) {
  return `commerce:checkout-draft:${normalizeDraftScope(scope)}`;
}

function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
  });
}

function transactionToPromise(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction failed."));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction aborted."));
  });
}

async function openDatabase() {
  if (!supportsIndexedDb()) {
    return null;
  }

  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase | null>((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;

        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: "key" });
        }
      };

      request.onsuccess = () => {
        const database = request.result;

        database.onversionchange = () => {
          database.close();
          dbPromise = null;
        };

        resolve(database);
      };

      request.onerror = () => {
        reject(request.error ?? new Error("Unable to open IndexedDB."));
      };
    }).catch(() => null);
  }

  return dbPromise;
}

async function readStoredValue<T>(key: string) {
  const database = await openDatabase();

  if (!database) {
    return null;
  }

  const transaction = database.transaction(STORE_NAME, "readonly");
  const store = transaction.objectStore(STORE_NAME);
  const record = await requestToPromise(store.get(key));

  await transactionToPromise(transaction);

  if (!record || typeof record !== "object" || !("value" in record)) {
    return null;
  }

  return (record as StoredValueRecord<T>).value ?? null;
}

async function writeStoredValue<T>(key: string, value: T) {
  const database = await openDatabase();

  if (!database) {
    return;
  }

  const transaction = database.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  store.put({
    key,
    value,
    updatedAt: new Date().toISOString(),
  } satisfies StoredValueRecord<T>);

  await transactionToPromise(transaction);
}

async function deleteStoredValue(key: string) {
  const database = await openDatabase();

  if (!database) {
    return;
  }

  const transaction = database.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  store.delete(key);

  await transactionToPromise(transaction);
}

export async function readPersistedCartItems() {
  const value = await readStoredValue<unknown>(CART_ITEMS_KEY);
  return Array.isArray(value) ? value : [];
}

export async function persistCartItems(items: PersistedCartItem[]) {
  if (items.length === 0) {
    await deleteStoredValue(CART_ITEMS_KEY);
    return;
  }

  await writeStoredValue(CART_ITEMS_KEY, items);
}

export async function readPersistedCheckoutDraft(scope?: string | null) {
  const value = await readStoredValue<unknown>(getCheckoutDraftKey(scope));

  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Partial<PersistedCheckoutDraft>;

  if (
    typeof record.fullName !== "string" ||
    typeof record.email !== "string" ||
    typeof record.phoneNumber !== "string" ||
    typeof record.deliveryLocation !== "string" ||
    typeof record.notes !== "string" ||
    typeof record.latitude !== "string" ||
    typeof record.longitude !== "string"
  ) {
    return null;
  }

  return record as PersistedCheckoutDraft;
}

export async function persistCheckoutDraft(
  scope: string | null | undefined,
  draft: PersistedCheckoutDraft
) {
  await writeStoredValue(getCheckoutDraftKey(scope), draft);
}

export async function clearPersistedCheckoutDraft(scope?: string | null) {
  await deleteStoredValue(getCheckoutDraftKey(scope));
}
