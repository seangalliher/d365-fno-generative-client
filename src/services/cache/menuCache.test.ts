import { describe, it, expect, beforeEach } from "vitest";
import { MenuCacheService } from "./menuCache";
import { MemoryCacheStore } from "./indexedDbCache";
import type { MenuCache } from "@/types";

describe("MenuCacheService", () => {
  let svc: MenuCacheService;

  beforeEach(() => {
    svc = new MenuCacheService(new MemoryCacheStore());
  });

  it("returns null when no menu is cached", async () => {
    expect(await svc.get()).toBeNull();
  });

  it("stores and retrieves menu cache", async () => {
    const menu: MenuCache = {
      version: 1,
      generatedAt: "2024-01-01T00:00:00Z",
      modules: [],
    };
    await svc.set(menu);
    expect(await svc.get()).toEqual(menu);
  });

  it("invalidate removes the cached menu", async () => {
    const menu: MenuCache = { version: 1, generatedAt: "2024-01-01T00:00:00Z", modules: [] };
    await svc.set(menu);
    await svc.invalidate();
    expect(await svc.get()).toBeNull();
  });

  it("overwrites previous cache on set", async () => {
    await svc.set({ version: 1, generatedAt: "2024-01-01", modules: [] });
    await svc.set({ version: 2, generatedAt: "2024-02-01", modules: [] });
    const result = await svc.get();
    expect(result?.version).toBe(2);
  });
});
