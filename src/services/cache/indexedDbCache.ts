/**
 * IndexedDB-backed cache store.
 * Each "store" maps to an IndexedDB object store within a single database.
 */

import type { CacheStore, CacheEntry } from "./cacheStore";

const DB_NAME = "d365-generative-client";
const DB_VERSION = 1;
const STORE_NAMES = ["generatedForms", "menuStructure", "entityMetadata", "queryCache"] as const;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      for (const storeName of STORE_NAMES) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function withTransaction<T>(
  db: IDBDatabase,
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const request = fn(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export class IndexedDbCacheStore implements CacheStore {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDb(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = openDatabase();
    }
    return this.dbPromise;
  }

  async get<T>(store: string, key: string): Promise<T | null> {
    const db = await this.getDb();
    const entry = await withTransaction<CacheEntry<T> | undefined>(
      db, store, "readonly", (s) => s.get(key)
    );

    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      await this.delete(store, key);
      return null;
    }
    return entry.value;
  }

  async set<T>(store: string, key: string, value: T, ttlMs?: number): Promise<void> {
    const db = await this.getDb();
    const entry: CacheEntry<T> = {
      value,
      expiresAt: ttlMs ? Date.now() + ttlMs : null,
      createdAt: Date.now(),
    };
    await withTransaction(db, store, "readwrite", (s) => s.put(entry, key));
  }

  async delete(store: string, key: string): Promise<void> {
    const db = await this.getDb();
    await withTransaction(db, store, "readwrite", (s) => s.delete(key));
  }

  async clear(store: string): Promise<void> {
    const db = await this.getDb();
    await withTransaction(db, store, "readwrite", (s) => s.clear());
  }

  async getAll<T>(store: string): Promise<T[]> {
    const db = await this.getDb();
    const entries = await withTransaction<CacheEntry<T>[]>(
      db, store, "readonly", (s) => s.getAll()
    );
    const now = Date.now();
    return entries
      .filter((e) => !e.expiresAt || now <= e.expiresAt)
      .map((e) => e.value);
  }

  async keys(store: string): Promise<string[]> {
    const db = await this.getDb();
    const keys = await withTransaction<IDBValidKey[]>(
      db, store, "readonly", (s) => s.getAllKeys()
    );
    return keys.map(String);
  }
}

/**
 * In-memory cache store for testing and SSR contexts.
 */
export class MemoryCacheStore implements CacheStore {
  private stores = new Map<string, Map<string, CacheEntry<unknown>>>();

  private getStore(store: string): Map<string, CacheEntry<unknown>> {
    let s = this.stores.get(store);
    if (!s) {
      s = new Map();
      this.stores.set(store, s);
    }
    return s;
  }

  async get<T>(store: string, key: string): Promise<T | null> {
    const entry = this.getStore(store).get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.getStore(store).delete(key);
      return null;
    }
    return entry.value;
  }

  async set<T>(store: string, key: string, value: T, ttlMs?: number): Promise<void> {
    this.getStore(store).set(key, {
      value,
      expiresAt: ttlMs ? Date.now() + ttlMs : null,
      createdAt: Date.now(),
    });
  }

  async delete(store: string, key: string): Promise<void> {
    this.getStore(store).delete(key);
  }

  async clear(store: string): Promise<void> {
    this.getStore(store).clear();
  }

  async getAll<T>(store: string): Promise<T[]> {
    const now = Date.now();
    const results: T[] = [];
    for (const entry of this.getStore(store).values()) {
      if (!entry.expiresAt || now <= entry.expiresAt) {
        results.push(entry.value as T);
      }
    }
    return results;
  }

  async keys(store: string): Promise<string[]> {
    return Array.from(this.getStore(store).keys());
  }
}
