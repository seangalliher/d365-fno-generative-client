import { describe, it, expect, vi, beforeEach } from "vitest";
import { MetadataService } from "./metadataService";
import { MemoryCacheStore } from "@/services/cache/indexedDbCache";
import type { EntityMetadata, EntityField } from "@/types";

function makeMetadata(overrides: Partial<EntityMetadata> = {}): EntityMetadata {
  return {
    name: "Customer",
    entity_set_name: "CustomersV3",
    fields: {
      CustomerAccount: { name: "CustomerAccount", type: "String", nullable: false },
      Name: { name: "Name", type: "String", nullable: true },
      RecId: { name: "RecId", type: "Int64", nullable: false, is_read_only: true },
      DataAreaId: { name: "DataAreaId", type: "String", nullable: false },
      CreatedDateTime: { name: "CreatedDateTime", type: "DateTimeOffset", nullable: true, is_read_only: true },
      ModifiedBy: { name: "ModifiedBy", type: "String", nullable: true, is_read_only: true },
    },
    keys: ["CustomerAccount"],
    ...overrides,
  };
}

describe("MetadataService", () => {
  let service: MetadataService;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(makeMetadata());
    service = new MetadataService({
      cache: new MemoryCacheStore(),
      fetchMetadata: fetchMock,
    });
  });

  it("throws on empty entity set name", async () => {
    await expect(service.getMetadata("")).rejects.toThrow("Entity set name must not be empty");
    await expect(service.getMetadata("   ")).rejects.toThrow("Entity set name must not be empty");
  });

  it("fetches and returns metadata", async () => {
    const result = await service.getMetadata("CustomersV3");
    expect(result.entity_set_name).toBe("CustomersV3");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("caches metadata on second call", async () => {
    await service.getMetadata("CustomersV3");
    await service.getMetadata("CustomersV3");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("uses different cache keys for different options", async () => {
    await service.getMetadata("CustomersV3");
    await service.getMetadata("CustomersV3", { includeEnumValues: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("getMetadataWithEnums sets includeEnumValues", async () => {
    await service.getMetadataWithEnums("CustomersV3");
    expect(fetchMock).toHaveBeenCalledWith("CustomersV3", expect.objectContaining({ includeEnumValues: true }));
  });

  describe("getFormFields", () => {
    it("excludes system fields and read-only fields", () => {
      const meta = makeMetadata();
      const fields = service.getFormFields(meta);
      const names = fields.map((f: EntityField) => f.name);
      expect(names).toContain("CustomerAccount");
      expect(names).toContain("Name");
      expect(names).not.toContain("RecId");
      expect(names).not.toContain("DataAreaId");
      expect(names).not.toContain("CreatedDateTime");
      expect(names).not.toContain("ModifiedBy");
    });
  });

  describe("getKeyFields", () => {
    it("returns only key fields", () => {
      const meta = makeMetadata();
      const keys = service.getKeyFields(meta);
      expect(keys).toHaveLength(1);
      expect(keys[0]?.name).toBe("CustomerAccount");
    });

    it("returns empty for no keys", () => {
      const meta = makeMetadata({ keys: [] });
      expect(service.getKeyFields(meta)).toHaveLength(0);
    });
  });

  describe("computeMetadataHash", () => {
    it("returns a non-empty string", () => {
      const hash = service.computeMetadataHash(makeMetadata());
      expect(hash).toBeTruthy();
      expect(typeof hash).toBe("string");
    });

    it("returns different hashes for different metadata", () => {
      const hash1 = service.computeMetadataHash(makeMetadata());
      const hash2 = service.computeMetadataHash(makeMetadata({ entity_set_name: "VendorsV2" }));
      expect(hash1).not.toBe(hash2);
    });
  });
});
