import { describe, it, expect } from "vitest";
import { buildFormGenerationPrompt } from "./promptTemplates";
import type { EntityMetadata, MenuItem } from "@/types";

function makeMetadata(): EntityMetadata {
  return {
    name: "Customer",
    entity_set_name: "CustomersV3",
    fields: {
      CustomerAccount: { name: "CustomerAccount", type: "String", nullable: false, is_key: true },
      OrganizationName: { name: "OrganizationName", type: "String", nullable: true, max_length: 100 },
      CustomerGroupId: { name: "CustomerGroupId", type: "String", nullable: true },
      InvoiceStatus: { name: "InvoiceStatus", type: "Enum", nullable: false, enum_type: "CustInvoiceStatus" },
      RecId: { name: "RecId", type: "Int64", nullable: false, is_read_only: true },
      CreatedDateTime: { name: "CreatedDateTime", type: "DateTimeOffset", nullable: true },
    },
    keys: ["CustomerAccount"],
    enum_values: {
      CustInvoiceStatus: [
        { name: "Open", value: 0 },
        { name: "Paid", value: 1 },
        { name: "Cancelled", value: 2 },
      ],
    },
    relationships: [
      { name: "SalesOrders", target: "SalesOrderHeadersV2", cardinality: "ZeroOrMore" },
    ],
  };
}

function makeMenuItem(): MenuItem {
  return {
    menuItemName: "CustTableListPage",
    menuItemType: "Display",
    label: "All customers",
    entitySet: "CustomersV3",
    formCached: false,
    accessCount: 0,
  };
}

describe("buildFormGenerationPrompt", () => {
  it("includes entity set name", () => {
    const prompt = buildFormGenerationPrompt({
      metadata: makeMetadata(),
      menuItem: makeMenuItem(),
      company: "USMF",
      existingFormCount: 0,
    });
    expect(prompt).toContain("CustomersV3");
  });

  it("includes menu item name and type", () => {
    const prompt = buildFormGenerationPrompt({
      metadata: makeMetadata(),
      menuItem: makeMenuItem(),
      company: "USMF",
      existingFormCount: 0,
    });
    expect(prompt).toContain("CustTableListPage");
    expect(prompt).toContain("Display");
  });

  it("excludes system fields", () => {
    const prompt = buildFormGenerationPrompt({
      metadata: makeMetadata(),
      menuItem: makeMenuItem(),
      company: "USMF",
      existingFormCount: 0,
    });
    expect(prompt).not.toContain("RecId:");
    expect(prompt).not.toContain("CreatedDateTime:");
  });

  it("includes business fields", () => {
    const prompt = buildFormGenerationPrompt({
      metadata: makeMetadata(),
      menuItem: makeMenuItem(),
      company: "USMF",
      existingFormCount: 0,
    });
    expect(prompt).toContain("CustomerAccount");
    expect(prompt).toContain("OrganizationName");
  });

  it("includes enum definitions", () => {
    const prompt = buildFormGenerationPrompt({
      metadata: makeMetadata(),
      menuItem: makeMenuItem(),
      company: "USMF",
      existingFormCount: 0,
    });
    expect(prompt).toContain("CustInvoiceStatus");
    expect(prompt).toContain("Open");
    expect(prompt).toContain("Paid");
  });

  it("includes relationship info", () => {
    const prompt = buildFormGenerationPrompt({
      metadata: makeMetadata(),
      menuItem: makeMenuItem(),
      company: "USMF",
      existingFormCount: 0,
    });
    expect(prompt).toContain("SalesOrders");
    expect(prompt).toContain("SalesOrderHeadersV2");
  });

  it("includes catalog hints when provided", () => {
    const prompt = buildFormGenerationPrompt({
      metadata: makeMetadata(),
      menuItem: makeMenuItem(),
      catalogEntry: {
        entitySet: "CustomersV3",
        label: "Customers",
        description: "Customer master records",
        keyFields: ["dataAreaId", "CustomerAccount"],
        defaultSelect: ["CustomerAccount", "OrganizationName"],
        searchFields: ["CustomerAccount", "OrganizationName"],
        category: "master-data",
        relatedEntities: ["SalesOrderHeadersV2"],
      },
      company: "USMF",
      existingFormCount: 0,
    });
    expect(prompt).toContain("master-data");
    expect(prompt).toContain("Default display fields");
  });

  it("includes the GeneratedForm schema", () => {
    const prompt = buildFormGenerationPrompt({
      metadata: makeMetadata(),
      menuItem: makeMenuItem(),
      company: "USMF",
      existingFormCount: 0,
    });
    expect(prompt).toContain("GeneratedForm");
    expect(prompt).toContain("interface");
  });
});
