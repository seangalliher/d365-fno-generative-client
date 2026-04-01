import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryCacheStore } from "./indexedDbCache";

describe("MemoryCacheStore", () => {
  let cache: MemoryCacheStore;

  beforeEach(() => {
    cache = new MemoryCacheStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null for missing keys", async () => {
    expect(await cache.get("store", "key")).toBeNull();
  });

  it("stores and retrieves values", async () => {
    await cache.set("store", "key", { name: "test" });
    const result = await cache.get<{ name: string }>("store", "key");
    expect(result).toEqual({ name: "test" });
  });

  it("isolates stores", async () => {
    await cache.set("storeA", "key", "A");
    await cache.set("storeB", "key", "B");
    expect(await cache.get("storeA", "key")).toBe("A");
    expect(await cache.get("storeB", "key")).toBe("B");
  });

  it("respects TTL — returns value before expiry", async () => {
    await cache.set("store", "key", "value", 5000);
    vi.advanceTimersByTime(3000);
    expect(await cache.get("store", "key")).toBe("value");
  });

  it("respects TTL — returns null after expiry", async () => {
    await cache.set("store", "key", "value", 5000);
    vi.advanceTimersByTime(6000);
    expect(await cache.get("store", "key")).toBeNull();
  });

  it("stores without TTL persist indefinitely", async () => {
    await cache.set("store", "key", "value");
    vi.advanceTimersByTime(999999999);
    expect(await cache.get("store", "key")).toBe("value");
  });

  it("deletes a key", async () => {
    await cache.set("store", "key", "value");
    await cache.delete("store", "key");
    expect(await cache.get("store", "key")).toBeNull();
  });

  it("clears all keys in a store", async () => {
    await cache.set("store", "a", 1);
    await cache.set("store", "b", 2);
    await cache.clear("store");
    expect(await cache.get("store", "a")).toBeNull();
    expect(await cache.get("store", "b")).toBeNull();
  });

  it("clear does not affect other stores", async () => {
    await cache.set("storeA", "key", "A");
    await cache.set("storeB", "key", "B");
    await cache.clear("storeA");
    expect(await cache.get("storeB", "key")).toBe("B");
  });

  it("getAll returns non-expired values", async () => {
    await cache.set("store", "a", 1);
    await cache.set("store", "b", 2, 1000);
    vi.advanceTimersByTime(2000);
    const all = await cache.getAll<number>("store");
    expect(all).toEqual([1]);
  });

  it("keys returns all key names", async () => {
    await cache.set("store", "alpha", 1);
    await cache.set("store", "beta", 2);
    const k = await cache.keys("store");
    expect(k.sort()).toEqual(["alpha", "beta"]);
  });

  it("keys returns empty for unknown store", async () => {
    expect(await cache.keys("unknown")).toEqual([]);
  });
});
