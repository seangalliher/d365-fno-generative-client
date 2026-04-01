/**
 * Guardrail engine — validates D365 operations before execution.
 * Ported from D365-erp-cli/internal/guardrails/guardrails.go
 */

import type { GuardrailContext, GuardrailResult } from "@/types";

type GuardrailRule = (ctx: GuardrailContext) => GuardrailResult | null;

const ENUM_SUFFIXES = ["Status", "Type", "Category", "Mode", "Direction", "State"];

function isNumeric(value: unknown): boolean {
  return typeof value === "number" || (typeof value === "string" && /^\d+$/.test(value));
}

const crossCompanyRequired: GuardrailRule = (ctx) => {
  if (!ctx.queryString.includes("dataAreaId")) return null;
  if (ctx.queryString.includes("cross-company=true")) return null;
  return {
    rule: "cross-company-required",
    severity: "error",
    message: "Query filters by dataAreaId but does not include cross-company=true.",
    suggestion: "Add cross-company=true to the query options.",
    blocked: true,
  };
};

const selectRecommended: GuardrailRule = (ctx) => {
  if (!ctx.command.startsWith("data find")) return null;
  if (ctx.queryString.includes("$select")) return null;
  return {
    rule: "select-recommended",
    severity: "warn",
    message: "Query does not use $select. D365 entities can have 200+ fields.",
    suggestion: "Add $select to limit response payload.",
    blocked: false,
  };
};

const deleteRequiresConfirm: GuardrailRule = (ctx) => {
  if (!ctx.command.includes("delete")) return null;
  if (ctx.hasConfirm) return null;
  return {
    rule: "delete-requires-confirm",
    severity: "error",
    message: "Delete operations require explicit confirmation.",
    suggestion: "Confirm the deletion with the user before proceeding.",
    blocked: true,
  };
};

const wideQueryWarning: GuardrailRule = (ctx) => {
  if (!ctx.command.startsWith("data find")) return null;
  if (ctx.queryString.includes("$top") || ctx.queryString.includes("$filter")) return null;
  return {
    rule: "wide-query-warning",
    severity: "warn",
    message: "Query has no $top or $filter. This may return excessive data.",
    suggestion: "Add $top or $filter to limit the result set.",
    blocked: false,
  };
};

const enumFormat: GuardrailRule = (ctx) => {
  if (!ctx.body) return null;
  for (const [key, value] of Object.entries(ctx.body)) {
    const matchesSuffix = ENUM_SUFFIXES.some((s) => key.endsWith(s));
    if (matchesSuffix && isNumeric(value)) {
      return {
        rule: "enum-format",
        severity: "warn",
        message: `Field "${key}" appears to be an enum but has a numeric value. Use the enum symbol name instead.`,
        suggestion: `Use the enum symbol name (e.g., "Active") instead of a numeric value (${String(value)}).`,
        blocked: false,
      };
    }
  }
  return null;
};

const DEFAULT_RULES: GuardrailRule[] = [
  crossCompanyRequired,
  selectRecommended,
  deleteRequiresConfirm,
  wideQueryWarning,
  enumFormat,
];

export function evaluateGuardrails(ctx: GuardrailContext): GuardrailResult[] {
  const results: GuardrailResult[] = [];
  for (const rule of DEFAULT_RULES) {
    const result = rule(ctx);
    if (result) results.push(result);
  }
  return results;
}

export function hasBlockers(results: GuardrailResult[]): boolean {
  return results.some((r) => r.blocked);
}
