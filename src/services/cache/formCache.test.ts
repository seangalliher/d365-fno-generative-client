import { describe, it, expect, beforeEach } from "vitest";
import { FormCache } from "./formCache";
import { MemoryCacheStore } from "./indexedDbCache";
import type { GeneratedForm } from "@/types";

function makeForm(overrides: Partial<GeneratedForm> = {}): GeneratedForm {
  return {
    id: "test-id",
    entitySet: "CustomersV3",
    menuItemName: "CustTableListPage",
    menuItemType: "Display",
    title: "All Customers",
    description: "Customer list",
    version: 1,
    generatedAt: "2024-01-01T00:00:00Z",
    metadataHash: "abc123",
    layout: { type: "tabbed", tabs: [] },
    fields: [],
    grids: [],
    actions: [],
    lookups: [],
    navigation: [],
    dataSource: { type: "odata", entitySet: "CustomersV3" },
    ...overrides,
  };
}

describe("FormCache", () => {
  let cache: FormCache;

  beforeEach(() => {
    cache = new FormCache(new MemoryCacheStore());
  });

  it("returns null for uncached forms", async () => {
    expect(await cache.get("Unknown", "Display")).toBeNull();
  });

  it("stores and retrieves forms", async () => {
    const form = makeForm();
    await cache.set(form);
    const result = await cache.get("CustTableListPage", "Display");
    expect(result).toEqual(form);
  });

  it("isCached returns true for cached forms", async () => {
    await cache.set(makeForm());
    expect(await cache.isCached("CustTableListPage", "Display")).toBe(true);
  });

  it("isCached returns false for uncached forms", async () => {
    expect(await cache.isCached("Unknown", "Display")).toBe(false);
  });

  it("invalidate removes a cached form", async () => {
    await cache.set(makeForm());
    await cache.invalidate("CustTableListPage", "Display");
    expect(await cache.get("CustTableListPage", "Display")).toBeNull();
  });

  it("listCached returns all cached forms", async () => {
    await cache.set(makeForm({ menuItemName: "FormA" }));
    await cache.set(makeForm({ menuItemName: "FormB" }));
    const all = await cache.listCached();
    expect(all).toHaveLength(2);
  });

  it("clearAll removes everything", async () => {
    await cache.set(makeForm({ menuItemName: "FormA" }));
    await cache.set(makeForm({ menuItemName: "FormB" }));
    await cache.clearAll();
    const all = await cache.listCached();
    expect(all).toHaveLength(0);
  });

  it("uses menuItemName:menuItemType as cache key", async () => {
    await cache.set(makeForm({ menuItemName: "Test", menuItemType: "Display" }));
    await cache.set(makeForm({ menuItemName: "Test", menuItemType: "Action" }));
    expect(await cache.isCached("Test", "Display")).toBe(true);
    expect(await cache.isCached("Test", "Action")).toBe(true);
    await cache.invalidate("Test", "Display");
    expect(await cache.isCached("Test", "Display")).toBe(false);
    expect(await cache.isCached("Test", "Action")).toBe(true);
  });
});
