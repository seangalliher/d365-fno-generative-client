import { describe, it, expect } from "vitest";
import { ENTITY_CATALOG, getEntityCatalogEntry, searchEntityCatalog } from "./entityCatalog";

describe("ENTITY_CATALOG", () => {
  it("has at least 16 entries", () => {
    expect(Object.keys(ENTITY_CATALOG).length).toBeGreaterThanOrEqual(16);
  });

  it("each entry has required fields", () => {
    for (const [key, entry] of Object.entries(ENTITY_CATALOG)) {
      expect(entry.entitySet).toBe(key);
      expect(entry.label).toBeTruthy();
      expect(entry.keyFields.length).toBeGreaterThanOrEqual(1);
      expect(entry.defaultSelect.length).toBeGreaterThanOrEqual(1);
      expect(entry.searchFields.length).toBeGreaterThanOrEqual(1);
      expect(entry.category).toBeTruthy();
    }
  });
});

describe("getEntityCatalogEntry", () => {
  it("returns entry for known entity", () => {
    const entry = getEntityCatalogEntry("CustomersV3");
    expect(entry).toBeDefined();
    expect(entry?.label).toBe("Customers");
  });

  it("returns undefined for unknown entity", () => {
    expect(getEntityCatalogEntry("NonexistentEntity")).toBeUndefined();
  });
});

describe("searchEntityCatalog", () => {
  it("finds by label", () => {
    const results = searchEntityCatalog("Customers");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((r) => r.entitySet === "CustomersV3")).toBe(true);
  });

  it("finds by entity set name", () => {
    const results = searchEntityCatalog("VendorsV2");
    expect(results).toHaveLength(1);
    expect(results[0]?.entitySet).toBe("VendorsV2");
  });

  it("finds by description", () => {
    const results = searchEntityCatalog("supplier");
    expect(results.some((r) => r.entitySet === "VendorsV2")).toBe(true);
  });

  it("is case-insensitive", () => {
    const results = searchEntityCatalog("SALES ORDER");
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it("returns empty for no match", () => {
    expect(searchEntityCatalog("zzz_nonexistent_xyz")).toEqual([]);
  });

  it("finds multiple matches for broad term", () => {
    const results = searchEntityCatalog("order");
    expect(results.length).toBeGreaterThanOrEqual(2);
  });
});
