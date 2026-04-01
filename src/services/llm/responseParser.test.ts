import { describe, it, expect } from "vitest";
import { parseFormResponse } from "./responseParser";
import type { EntityMetadata } from "@/types";

function makeMetadata(): EntityMetadata {
  return {
    name: "Customer",
    entity_set_name: "CustomersV3",
    fields: {
      CustomerAccount: { name: "CustomerAccount", type: "String", nullable: false },
      OrganizationName: { name: "OrganizationName", type: "String", nullable: true },
      InvoiceAccount: { name: "InvoiceAccount", type: "String", nullable: true },
    },
    keys: ["CustomerAccount"],
  };
}

function makeValidFormJson(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    id: "form-custtablelistpage",
    entitySet: "CustomersV3",
    menuItemName: "CustTableListPage",
    menuItemType: "Display",
    title: "All Customers",
    description: "Customer management form",
    version: 1,
    generatedAt: "2024-01-01T00:00:00Z",
    metadataHash: "abc",
    layout: { type: "single-page", tabs: [{ name: "general", label: "General", fields: ["CustomerAccount"], order: 1 }] },
    fields: [
      { name: "CustomerAccount", label: "Account", type: "text", group: "general", required: true, readOnly: false, order: 1 },
    ],
    grids: [],
    actions: [{ name: "save", label: "Save", variant: "primary", order: 1 }],
    lookups: [],
    navigation: [],
    dataSource: { type: "odata", entitySet: "CustomersV3" },
    ...overrides,
  });
}

describe("parseFormResponse", () => {
  it("parses valid JSON successfully", () => {
    const result = parseFormResponse(makeValidFormJson(), makeMetadata());
    expect(result.success).toBe(true);
    expect(result.form).toBeDefined();
    expect(result.form!.entitySet).toBe("CustomersV3");
  });

  it("extracts JSON from markdown code block", () => {
    const wrapped = "```json\n" + makeValidFormJson() + "\n```";
    const result = parseFormResponse(wrapped, makeMetadata());
    expect(result.success).toBe(true);
    expect(result.form).toBeDefined();
  });

  it("extracts JSON from text with surrounding content", () => {
    const wrapped = "Here is the form:\n" + makeValidFormJson() + "\nDone!";
    const result = parseFormResponse(wrapped, makeMetadata());
    expect(result.success).toBe(true);
  });

  it("fails on non-JSON input", () => {
    const result = parseFormResponse("This is not JSON at all", makeMetadata());
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("fails when required properties are missing", () => {
    const result = parseFormResponse('{"someField": true}', makeMetadata());
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.includes("Missing required"))).toBe(true);
  });

  it("reports fields not in metadata", () => {
    const json = makeValidFormJson({
      fields: [
        { name: "FakeField", label: "Fake", type: "text", group: "general", required: false, readOnly: false, order: 1 },
      ],
    });
    const result = parseFormResponse(json, makeMetadata());
    expect(result.errors.some((e) => e.includes("FakeField"))).toBe(true);
  });

  it("reports invalid field types", () => {
    const json = makeValidFormJson({
      fields: [
        { name: "CustomerAccount", label: "Account", type: "invalid_type", group: "general", required: false, readOnly: false, order: 1 },
      ],
    });
    const result = parseFormResponse(json, makeMetadata());
    expect(result.errors.some((e) => e.includes("invalid type"))).toBe(true);
  });

  it("defaults optional arrays when missing", () => {
    const json = makeValidFormJson({ grids: undefined, actions: undefined, lookups: undefined, navigation: undefined });
    const result = parseFormResponse(json, makeMetadata());
    expect(result.form?.grids).toEqual([]);
    expect(result.form?.actions).toEqual([]);
  });
});
