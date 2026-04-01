import { describe, it, expect, vi, beforeEach } from "vitest";
import { FormGenerationService, FormGenerationError } from "./formGenerationService";
import { MemoryCacheStore } from "@/services/cache/indexedDbCache";
import { FormCache } from "@/services/cache/formCache";
import { MetadataService } from "@/services/d365/metadataService";
import { MockFormGenerationProvider } from "@/services/llm/llmClient";
import type { MenuItem, EntityMetadata, GeneratedForm } from "@/types";

function makeMetadata(): EntityMetadata {
  return {
    name: "Customer",
    entity_set_name: "CustomersV3",
    fields: {
      CustomerAccount: { name: "CustomerAccount", type: "String", nullable: false, is_key: true },
      OrganizationName: { name: "OrganizationName", type: "String", nullable: true },
    },
    keys: ["CustomerAccount"],
    enum_values: {},
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

function makeValidFormResponse(): string {
  return JSON.stringify({
    id: "form-custtablelistpage",
    entitySet: "CustomersV3",
    menuItemName: "CustTableListPage",
    menuItemType: "Display",
    title: "All Customers",
    description: "Customer form",
    version: 1,
    generatedAt: new Date().toISOString(),
    metadataHash: "abc",
    layout: { type: "single-page", tabs: [{ name: "general", label: "General", fields: ["CustomerAccount"], order: 1 }] },
    fields: [
      { name: "CustomerAccount", label: "Account", type: "text", group: "general", required: true, readOnly: false, order: 1 },
    ],
    grids: [],
    actions: [],
    lookups: [],
    navigation: [],
    dataSource: { type: "odata", entitySet: "CustomersV3" },
  });
}

describe("FormGenerationService", () => {
  let service: FormGenerationService;
  let mockLlm: MockFormGenerationProvider;
  let formCache: FormCache;
  let metadataService: MetadataService;

  beforeEach(() => {
    const cacheStore = new MemoryCacheStore();
    formCache = new FormCache(cacheStore);
    mockLlm = new MockFormGenerationProvider();
    metadataService = new MetadataService({
      cache: cacheStore,
      fetchMetadata: vi.fn().mockResolvedValue(makeMetadata()),
    });

    service = new FormGenerationService({
      llm: mockLlm,
      metadata: metadataService,
      formCache,
    });
  });

  it("throws for menu items without entitySet", async () => {
    const item = { ...makeMenuItem(), entitySet: undefined };
    await expect(service.generateForm(item, "USMF")).rejects.toThrow(FormGenerationError);
  });

  it("returns cached form without calling LLM", async () => {
    const cachedForm: GeneratedForm = {
      id: "cached",
      entitySet: "CustomersV3",
      menuItemName: "CustTableListPage",
      menuItemType: "Display",
      title: "Cached Form",
      description: "",
      version: 1,
      generatedAt: "2024-01-01T00:00:00Z",
      metadataHash: "",
      layout: { type: "single-page", tabs: [] },
      fields: [],
      grids: [],
      actions: [],
      lookups: [],
      navigation: [],
      dataSource: { type: "odata", entitySet: "CustomersV3" },
    };
    await formCache.set(cachedForm);

    const result = await service.generateForm(makeMenuItem(), "USMF");
    expect(result.title).toBe("Cached Form");
  });

  it("generates and caches a new form", async () => {
    mockLlm.setResponse("CustomersV3", makeValidFormResponse());

    const statuses: string[] = [];
    const result = await service.generateForm(makeMenuItem(), "USMF", (s) => {
      statuses.push(s.step);
    });

    expect(result.entitySet).toBe("CustomersV3");
    expect(statuses).toContain("checking-cache");
    expect(statuses).toContain("generating");
    expect(statuses).toContain("ready");

    // Verify it was cached
    const cached = await formCache.get("CustTableListPage", "Display");
    expect(cached).toBeDefined();
  });

  it("regenerate clears cache then generates", async () => {
    mockLlm.setResponse("CustomersV3", makeValidFormResponse());

    // Pre-populate cache
    await formCache.set({
      id: "old",
      entitySet: "CustomersV3",
      menuItemName: "CustTableListPage",
      menuItemType: "Display",
      title: "Old Form",
      description: "",
      version: 1,
      generatedAt: "",
      metadataHash: "",
      layout: { type: "single-page", tabs: [] },
      fields: [],
      grids: [],
      actions: [],
      lookups: [],
      navigation: [],
      dataSource: { type: "odata", entitySet: "CustomersV3" },
    });

    const result = await service.regenerate(makeMenuItem(), "USMF");
    expect(result.title).toBe("All Customers"); // New form
  });
});
