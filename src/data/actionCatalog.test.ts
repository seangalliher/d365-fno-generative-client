/**
 * Tests for action catalog — Phase 4.3.
 */

import { describe, it, expect } from "vitest";
import { getActionsForEntity, getAction, COMMON_ACTIONS } from "./actionCatalog";

describe("actionCatalog", () => {
  it("returns all common actions", () => {
    expect(COMMON_ACTIONS.length).toBeGreaterThan(0);
    for (const action of COMMON_ACTIONS) {
      expect(action.name).toBeTruthy();
      expect(action.label).toBeTruthy();
      expect(action.variant).toBeTruthy();
    }
  });

  it("getAction returns the correct action by name", () => {
    const post = getAction("post");
    expect(post).toBeDefined();
    expect(post?.label).toBe("Post");
    expect(post?.category).toBe("lifecycle");
  });

  it("getAction returns undefined for unknown action", () => {
    expect(getAction("nonexistent")).toBeUndefined();
  });

  it("getActionsForEntity returns entity-specific actions for SalesOrders", () => {
    const actions = getActionsForEntity("SalesOrders");
    const names = actions.map((a) => a.name);
    expect(names).toContain("post");
    expect(names).toContain("submit");
    expect(names).toContain("duplicate");
  });

  it("getActionsForEntity falls back to utility/report for unknown entity", () => {
    const actions = getActionsForEntity("UnknownEntity");
    const categories = actions.map((a) => a.category);
    expect(categories.every((c) => c === "utility" || c === "report")).toBe(true);
  });

  it("all actions have valid variants", () => {
    const validVariants = ["primary", "secondary", "destructive", "ghost"];
    for (const action of COMMON_ACTIONS) {
      expect(validVariants).toContain(action.variant);
    }
  });
});
