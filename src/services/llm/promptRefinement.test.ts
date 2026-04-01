/**
 * Tests for buildFormRefinementPrompt — Phase 3.3 refinement prompt.
 */

import { describe, it, expect } from "vitest";
import { buildFormRefinementPrompt } from "./promptTemplates";
import type { EntityMetadata } from "@/types";

function makeMetadata(overrides?: Partial<EntityMetadata>): EntityMetadata {
  return {
    name: "CustTable",
    entity_set_name: "Customers",
    keys: ["CustomerAccount"],
    fields: {
      CustomerAccount: {
        name: "CustomerAccount",
        type: "String",
        nullable: false,
        max_length: 20,
      },
      Name: {
        name: "Name",
        type: "String",
        nullable: true,
        max_length: 100,
      },
    },
    ...overrides,
  };
}

describe("buildFormRefinementPrompt", () => {
  it("falls back to generation prompt when no feedback provided", () => {
    const result = buildFormRefinementPrompt({
      metadata: makeMetadata(),
      menuItem: { menuItemName: "CustTable", menuItemType: "Display", label: "Customers", formCached: false, accessCount: 0 },
      company: "USMF",
      existingFormCount: 0,
    });
    expect(result).toContain("Generate a D365 form definition");
    expect(result).not.toContain("user has requested");
  });

  it("includes user feedback and current form in refinement prompt", () => {
    const result = buildFormRefinementPrompt({
      metadata: makeMetadata(),
      menuItem: { menuItemName: "CustTable", menuItemType: "Display", label: "Customers", formCached: false, accessCount: 0 },
      company: "USMF",
      existingFormCount: 1,
      userFeedback: "Add a tab for addresses",
      currentForm: '{"id":"form-custtable"}',
    });
    expect(result).toContain("user has requested the following change");
    expect(result).toContain("Add a tab for addresses");
    expect(result).toContain('"id":"form-custtable"');
    expect(result).toContain("Increment the version number");
  });

  it("includes available fields in refinement prompt", () => {
    const result = buildFormRefinementPrompt({
      metadata: makeMetadata(),
      menuItem: { menuItemName: "CustTable", menuItemType: "Display", label: "Customers", formCached: false, accessCount: 0 },
      company: "USMF",
      existingFormCount: 0,
      userFeedback: "Make Name required",
      currentForm: "{}",
    });
    expect(result).toContain("CustomerAccount");
    expect(result).toContain("Name");
  });

  it("excludes system fields from refinement prompt", () => {
    const meta = makeMetadata({
      fields: {
        CustomerAccount: { name: "CustomerAccount", type: "String", nullable: false },
        RecId: { name: "RecId", type: "Int64", nullable: false },
        DataAreaId: { name: "DataAreaId", type: "String", nullable: false },
      },
    });
    const result = buildFormRefinementPrompt({
      metadata: meta,
      menuItem: { menuItemName: "CustTable", menuItemType: "Display", label: "Customers", formCached: false, accessCount: 0 },
      company: "USMF",
      existingFormCount: 0,
      userFeedback: "Add more fields",
      currentForm: "{}",
    });
    expect(result).toContain("CustomerAccount");
    expect(result).not.toContain("RecId:");
    expect(result).not.toContain("DataAreaId:");
  });
});
