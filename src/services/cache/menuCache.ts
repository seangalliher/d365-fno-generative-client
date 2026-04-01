/**
 * Menu structure cache — persists the generated menu hierarchy.
 */

import type { MenuCache } from "@/types";
import type { CacheStore } from "./cacheStore";

const STORE_NAME = "menuStructure";
const CACHE_KEY = "menu-v1";

export class MenuCacheService {
  constructor(private readonly cache: CacheStore) {}

  async get(): Promise<MenuCache | null> {
    return this.cache.get<MenuCache>(STORE_NAME, CACHE_KEY);
  }

  async set(menu: MenuCache): Promise<void> {
    await this.cache.set(STORE_NAME, CACHE_KEY, menu);
  }

  async invalidate(): Promise<void> {
    await this.cache.delete(STORE_NAME, CACHE_KEY);
  }
}
