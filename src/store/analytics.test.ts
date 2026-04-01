/**
 * Tests for analytics store — Phase 4.5.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useAnalytics } from "./analytics";

describe("analytics store", () => {
  beforeEach(() => {
    useAnalytics.setState({ metrics: [], refinementCount: 0 });
  });

  it("tracks a generation metric", () => {
    useAnalytics.getState().trackGeneration({
      menuItemName: "CustTable",
      entitySet: "Customers",
      generatedAt: new Date().toISOString(),
      durationMs: 2500,
      fromCache: false,
      version: 1,
    });

    const metrics = useAnalytics.getState().getMetrics();
    expect(metrics.totalFormsGenerated).toBe(1);
    expect(metrics.totalFormsFromCache).toBe(0);
    expect(metrics.averageGenerationMs).toBe(2500);
  });

  it("tracks cache hits separately", () => {
    useAnalytics.getState().trackGeneration({
      menuItemName: "CustTable",
      entitySet: "Customers",
      generatedAt: new Date().toISOString(),
      durationMs: 10,
      fromCache: true,
      version: 1,
    });

    const metrics = useAnalytics.getState().getMetrics();
    expect(metrics.totalFormsFromCache).toBe(1);
    expect(metrics.averageGenerationMs).toBe(0); // cache hits excluded from avg
  });

  it("tracks refinements", () => {
    useAnalytics.getState().trackRefinement();
    useAnalytics.getState().trackRefinement();
    expect(useAnalytics.getState().getMetrics().totalRefinements).toBe(2);
  });

  it("computes most used forms", () => {
    const track = useAnalytics.getState().trackGeneration;
    for (let i = 0; i < 5; i++) {
      track({ menuItemName: "CustTable", entitySet: "Customers", generatedAt: "", durationMs: 100, fromCache: false, version: 1 });
    }
    for (let i = 0; i < 3; i++) {
      track({ menuItemName: "VendTable", entitySet: "Vendors", generatedAt: "", durationMs: 100, fromCache: false, version: 1 });
    }

    const metrics = useAnalytics.getState().getMetrics();
    expect(metrics.mostUsedForms[0]?.menuItemName).toBe("CustTable");
    expect(metrics.mostUsedForms[0]?.count).toBe(5);
    expect(metrics.mostUsedForms[1]?.menuItemName).toBe("VendTable");
  });

  it("clears metrics", () => {
    useAnalytics.getState().trackGeneration({
      menuItemName: "X", entitySet: "X", generatedAt: "", durationMs: 0, fromCache: false, version: 1,
    });
    useAnalytics.getState().clearMetrics();
    expect(useAnalytics.getState().getMetrics().totalFormsGenerated).toBe(0);
  });
});
