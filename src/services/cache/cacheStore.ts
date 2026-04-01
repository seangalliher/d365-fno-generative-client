/**
 * Cache store interface — abstracts storage backend (IndexedDB, memory, etc.)
 * Follows Interface Segregation: consumers depend only on what they need.
 */

export interface CacheStore {
  get<T>(store: string, key: string): Promise<T | null>;
  set<T>(store: string, key: string, value: T, ttlMs?: number): Promise<void>;
  delete(store: string, key: string): Promise<void>;
  clear(store: string): Promise<void>;
  getAll<T>(store: string): Promise<T[]>;
  keys(store: string): Promise<string[]>;
}

export interface CacheEntry<T> {
  readonly value: T;
  readonly expiresAt: number | null;
  readonly createdAt: number;
}
