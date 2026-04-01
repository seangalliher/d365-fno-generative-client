import { describe, it, expect } from "vitest";
import { evaluateGuardrails, hasBlockers } from "./guardrails";
import type { GuardrailContext } from "@/types";

function makeContext(overrides: Partial<GuardrailContext> = {}): GuardrailContext {
  return {
    command: "",
    entityPath: "",
    queryString: "",
    company: "USMF",
    hasConfirm: false,
    body: null,
    ...overrides,
  };
}

describe("evaluateGuardrails", () => {
  it("returns empty array when no rules trigger", () => {
    const ctx = makeContext({ command: "data find", queryString: "$select=Name&$top=10" });
    expect(evaluateGuardrails(ctx)).toEqual([]);
  });

  describe("cross-company-required", () => {
    it("blocks when dataAreaId is filtered without cross-company=true", () => {
      const ctx = makeContext({ queryString: "$filter=dataAreaId eq 'USMF'" });
      const results = evaluateGuardrails(ctx);
      const rule = results.find((r) => r.rule === "cross-company-required");
      expect(rule).toBeDefined();
      expect(rule!.blocked).toBe(true);
      expect(rule!.severity).toBe("error");
    });

    it("passes when cross-company=true is present with dataAreaId", () => {
      const ctx = makeContext({ queryString: "cross-company=true&$filter=dataAreaId eq 'USMF'" });
      const results = evaluateGuardrails(ctx);
      expect(results.find((r) => r.rule === "cross-company-required")).toBeUndefined();
    });

    it("does not trigger when no dataAreaId in query", () => {
      const ctx = makeContext({ queryString: "$filter=Name eq 'Test'" });
      const results = evaluateGuardrails(ctx);
      expect(results.find((r) => r.rule === "cross-company-required")).toBeUndefined();
    });
  });

  describe("select-recommended", () => {
    it("warns when data find has no $select", () => {
      const ctx = makeContext({ command: "data find", queryString: "$top=10" });
      const results = evaluateGuardrails(ctx);
      const rule = results.find((r) => r.rule === "select-recommended");
      expect(rule).toBeDefined();
      expect(rule!.severity).toBe("warn");
      expect(rule!.blocked).toBe(false);
    });

    it("passes when $select is present", () => {
      const ctx = makeContext({ command: "data find", queryString: "$select=Name" });
      const results = evaluateGuardrails(ctx);
      expect(results.find((r) => r.rule === "select-recommended")).toBeUndefined();
    });

    it("does not trigger for non-find commands", () => {
      const ctx = makeContext({ command: "data create", queryString: "" });
      const results = evaluateGuardrails(ctx);
      expect(results.find((r) => r.rule === "select-recommended")).toBeUndefined();
    });
  });

  describe("delete-requires-confirm", () => {
    it("blocks delete without confirmation", () => {
      const ctx = makeContext({ command: "data delete", hasConfirm: false });
      const results = evaluateGuardrails(ctx);
      const rule = results.find((r) => r.rule === "delete-requires-confirm");
      expect(rule).toBeDefined();
      expect(rule!.blocked).toBe(true);
    });

    it("passes delete with confirmation", () => {
      const ctx = makeContext({ command: "data delete", hasConfirm: true });
      const results = evaluateGuardrails(ctx);
      expect(results.find((r) => r.rule === "delete-requires-confirm")).toBeUndefined();
    });
  });

  describe("wide-query-warning", () => {
    it("warns when data find has no $top or $filter", () => {
      const ctx = makeContext({ command: "data find", queryString: "$select=Name" });
      const results = evaluateGuardrails(ctx);
      const rule = results.find((r) => r.rule === "wide-query-warning");
      expect(rule).toBeDefined();
      expect(rule!.blocked).toBe(false);
    });

    it("passes when $top is present", () => {
      const ctx = makeContext({ command: "data find", queryString: "$top=10" });
      const results = evaluateGuardrails(ctx);
      expect(results.find((r) => r.rule === "wide-query-warning")).toBeUndefined();
    });

    it("passes when $filter is present", () => {
      const ctx = makeContext({ command: "data find", queryString: "$filter=Name eq 'Test'" });
      const results = evaluateGuardrails(ctx);
      expect(results.find((r) => r.rule === "wide-query-warning")).toBeUndefined();
    });
  });

  describe("enum-format", () => {
    it("warns when enum-like field has numeric value", () => {
      const ctx = makeContext({ body: { ItemStatus: 1 } });
      const results = evaluateGuardrails(ctx);
      const rule = results.find((r) => r.rule === "enum-format");
      expect(rule).toBeDefined();
      expect(rule!.severity).toBe("warn");
    });

    it("warns on numeric string value for enum field", () => {
      const ctx = makeContext({ body: { OrderType: "2" } });
      const results = evaluateGuardrails(ctx);
      expect(results.find((r) => r.rule === "enum-format")).toBeDefined();
    });

    it("passes when enum field has string symbol value", () => {
      const ctx = makeContext({ body: { ItemStatus: "Active" } });
      const results = evaluateGuardrails(ctx);
      expect(results.find((r) => r.rule === "enum-format")).toBeUndefined();
    });

    it("does not trigger when body is null", () => {
      const ctx = makeContext({ body: null });
      const results = evaluateGuardrails(ctx);
      expect(results.find((r) => r.rule === "enum-format")).toBeUndefined();
    });

    it("does not trigger for non-enum field names", () => {
      const ctx = makeContext({ body: { Name: 42 } });
      const results = evaluateGuardrails(ctx);
      expect(results.find((r) => r.rule === "enum-format")).toBeUndefined();
    });
  });
});

describe("hasBlockers", () => {
  it("returns true when any result is blocked", () => {
    expect(hasBlockers([{ rule: "test", severity: "error", message: "blocked", blocked: true }])).toBe(true);
  });

  it("returns false when no results are blocked", () => {
    expect(hasBlockers([{ rule: "test", severity: "warn", message: "warning", blocked: false }])).toBe(false);
  });

  it("returns false for empty array", () => {
    expect(hasBlockers([])).toBe(false);
  });
});
