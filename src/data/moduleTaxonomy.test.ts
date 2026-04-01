import { describe, it, expect } from "vitest";
import { MODULE_TAXONOMY, getAllMenuItems, findModule, findMenuItem } from "./moduleTaxonomy";

describe("MODULE_TAXONOMY", () => {
  it("has at least 8 modules", () => {
    expect(MODULE_TAXONOMY.length).toBeGreaterThanOrEqual(8);
  });

  it("each module has unique id", () => {
    const ids = MODULE_TAXONOMY.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("each module has at least one menu item", () => {
    for (const mod of MODULE_TAXONOMY) {
      expect(mod.items.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("getAllMenuItems", () => {
  it("returns all items across all modules", () => {
    const all = getAllMenuItems();
    const totalExpected = MODULE_TAXONOMY.reduce((sum, m) => sum + m.items.length, 0);
    expect(all).toHaveLength(totalExpected);
  });

  it("each result has moduleId", () => {
    const all = getAllMenuItems();
    for (const entry of all) {
      expect(entry.moduleId).toBeTruthy();
    }
  });

  it("accepts custom modules array", () => {
    const firstModule = MODULE_TAXONOMY[0]!;
    const items = getAllMenuItems([firstModule]);
    expect(items).toHaveLength(firstModule.items.length);
  });
});

describe("findModule", () => {
  it("finds existing module by id", () => {
    const mod = findModule("general-ledger");
    expect(mod).toBeDefined();
    expect(mod?.label).toBe("General Ledger");
  });

  it("returns undefined for unknown id", () => {
    expect(findModule("nonexistent")).toBeUndefined();
  });
});

describe("findMenuItem", () => {
  it("finds existing menu item by name", () => {
    const result = findMenuItem("CustTableListPage");
    expect(result).toBeDefined();
    expect(result!.item.label).toBe("All customers");
    expect(result!.module.id).toBe("accounts-receivable");
  });

  it("returns undefined for unknown menu item", () => {
    expect(findMenuItem("NonexistentForm")).toBeUndefined();
  });
});
