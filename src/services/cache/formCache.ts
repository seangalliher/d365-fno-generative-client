/**
 * Form definition cache — stores and retrieves LLM-generated form schemas.
 */

import type { GeneratedForm } from "@/types";
import type { CacheStore } from "./cacheStore";

const STORE_NAME = "generatedForms";

export class FormCache {
  constructor(private readonly cache: CacheStore) {}

  async get(menuItemName: string, menuItemType: string): Promise<GeneratedForm | null> {
    return this.cache.get<GeneratedForm>(STORE_NAME, this.buildKey(menuItemName, menuItemType));
  }

  async set(form: GeneratedForm): Promise<void> {
    await this.cache.set(
      STORE_NAME,
      this.buildKey(form.menuItemName, form.menuItemType),
      form
    );
  }

  async invalidate(menuItemName: string, menuItemType: string): Promise<void> {
    await this.cache.delete(STORE_NAME, this.buildKey(menuItemName, menuItemType));
  }

  async listCached(): Promise<GeneratedForm[]> {
    return this.cache.getAll<GeneratedForm>(STORE_NAME);
  }

  async isCached(menuItemName: string, menuItemType: string): Promise<boolean> {
    const result = await this.get(menuItemName, menuItemType);
    return result !== null;
  }

  async clearAll(): Promise<void> {
    await this.cache.clear(STORE_NAME);
  }

  private buildKey(menuItemName: string, menuItemType: string): string {
    return `${menuItemName}:${menuItemType}`;
  }
}
