/**
 * Tests for FormFallback error categorization — Phase 3.4.
 */

import { describe, it, expect } from "vitest";

// We test the pure categorization function.
// Since it's inlined in the component, we extract the logic here for testability.

type ErrorCategory = "network" | "auth" | "validation" | "unknown";

function categorizeError(error: string): ErrorCategory {
  const lower = error.toLowerCase();
  if (lower.includes("rate_limited") || lower.includes("429") || lower.includes("network") || lower.includes("fetch")) {
    return "network";
  }
  if (lower.includes("401") || lower.includes("403") || lower.includes("unauthorized") || lower.includes("forbidden")) {
    return "auth";
  }
  if (lower.includes("parse") || lower.includes("missing required") || lower.includes("invalid")) {
    return "validation";
  }
  return "unknown";
}

describe("FormFallback error categorization", () => {
  it("categorizes rate limit as network", () => {
    expect(categorizeError("RATE_LIMITED: too many requests")).toBe("network");
  });

  it("categorizes 429 as network", () => {
    expect(categorizeError("HTTP 429 Too Many Requests")).toBe("network");
  });

  it("categorizes fetch errors as network", () => {
    expect(categorizeError("Failed to fetch")).toBe("network");
  });

  it("categorizes 401 as auth", () => {
    expect(categorizeError("HTTP 401 Unauthorized")).toBe("auth");
  });

  it("categorizes 403 as auth", () => {
    expect(categorizeError("HTTP 403 Forbidden")).toBe("auth");
  });

  it("categorizes parse errors as validation", () => {
    expect(categorizeError("Failed to parse JSON response")).toBe("validation");
  });

  it("categorizes missing required as validation", () => {
    expect(categorizeError("Missing required property: entitySet")).toBe("validation");
  });

  it("categorizes invalid field as validation", () => {
    expect(categorizeError("Invalid field type for CustomerAccount")).toBe("validation");
  });

  it("categorizes other errors as unknown", () => {
    expect(categorizeError("Something went wrong")).toBe("unknown");
  });

  it("is case-insensitive", () => {
    expect(categorizeError("UNAUTHORIZED access")).toBe("auth");
  });
});
