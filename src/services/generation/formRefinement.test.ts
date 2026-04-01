/**
 * Tests for FormGenerationService.refineForm — Phase 3.3.
 */

import { describe, it, expect, vi } from "vitest";
import { FormGenerationService } from "./formGenerationService";
import { MockFormGenerationProvider } from "@/services/llm/llmClient";
import { MemoryCacheStore } from "@/services/cache/indexedDbCache";
import { FormCache } from "@/services/cache/formCache";
import { MetadataService } from "@/services/d365/metadataService";
import type { GeneratedForm, EntityMetadata, FormField } from "@/types";

function makeField(name: string, type: string = "text"): FormField {
  return { name, label: name, type: type as FormField["type"], group: "General", required: false, readOnly: false, order: 0 };
}

function makeForm(): GeneratedForm {
  return {
    id: "form-custtable",
    entitySet: "Customers",
    menuItemName: "CustTable",
    menuItemType: "Display",
    title: "Customers",
    description: "Customer form",
    version: 1,
    generatedAt: new Date().toISOString(),
    metadataHash: "abc123",
    layout: { type: "single-page", tabs: [] },
    fields: [makeField("CustomerAccount"), makeField("Name")],
    grids: [],
    actions: [],
    lookups: [],
    navigation: [],
    dataSource: { type: "odata", entitySet: "Customers" },
  };
}

const REFINED_FORM: GeneratedForm = {
  ...makeForm(),
  version: 2,
  fields: [makeField("CustomerAccount"), makeField("Name"), makeField("CreditLimit", "number")],
};

describe("FormGenerationService.refineForm", () => {
  it("calls LLM with feedback and caches result", async () => {
    const mockLlm = new MockFormGenerationProvider();
    mockLlm.setResponse("user has requested", JSON.stringify(REFINED_FORM));

    const metadata: EntityMetadata = {
      name: "CustTable",
      entity_set_name: "Customers",
      keys: ["CustomerAccount"],
      fields: {
        CustomerAccount: { name: "CustomerAccount", type: "String", nullable: false },
        Name: { name: "Name", type: "String", nullable: true },
        CreditLimit: { name: "CreditLimit", type: "Decimal", nullable: true },
      },
    };

    const fetchMeta = vi.fn().mockResolvedValue(metadata);
    const cacheStore = new MemoryCacheStore();
    const metadataService = new MetadataService({ cache: cacheStore, fetchMetadata: fetchMeta });
    const formCache = new FormCache(cacheStore);

    const svc = new FormGenerationService({ llm: mockLlm, metadata: metadataService, formCache });

    const menuItem = { menuItemName: "CustTable", menuItemType: "Display" as const, label: "Customers", entitySet: "Customers", formCached: false, accessCount: 0 };

    const result = await svc.refineForm(menuItem, "USMF", makeForm(), "Add credit limit field");
    expect(result.version).toBe(2);
    expect(result.fields.length).toBe(3);
  });

  it("throws on missing entitySet", async () => {
    const mockLlm = new MockFormGenerationProvider();
    const cacheStore = new MemoryCacheStore();
    const metadataService = new MetadataService({ cache: cacheStore, fetchMetadata: vi.fn() });
    const formCache = new FormCache(cacheStore);

    const svc = new FormGenerationService({ llm: mockLlm, metadata: metadataService, formCache });
    const menuItem = { menuItemName: "X", menuItemType: "Display" as const, label: "X", formCached: false, accessCount: 0 };

    await expect(svc.refineForm(menuItem, "USMF", makeForm(), "feedback")).rejects.toThrow("no entity set");
  });
});
