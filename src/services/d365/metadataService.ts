/**
 * Entity metadata service — fetches, parses, and caches D365 entity schemas.
 */

import type { EntityMetadata, EntityField } from "@/types";
import type { CacheStore } from "@/services/cache/cacheStore";

export interface MetadataServiceDeps {
  readonly cache: CacheStore;
  readonly fetchMetadata: (entitySetName: string, options?: MetadataFetchOptions) => Promise<EntityMetadata>;
}

export interface MetadataFetchOptions {
  includeKeys?: boolean;
  includeFieldConstraints?: boolean;
  includeRelationships?: boolean;
  includeEnumValues?: boolean;
}

const METADATA_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Caching layer over entity metadata retrieval.
 * Follows Fail-Fast: throws immediately on invalid entity set names.
 */
export class MetadataService {
  private readonly deps: MetadataServiceDeps;

  constructor(deps: MetadataServiceDeps) {
    this.deps = deps;
  }

  async getMetadata(entitySetName: string, options?: MetadataFetchOptions): Promise<EntityMetadata> {
    if (!entitySetName.trim()) {
      throw new Error("Entity set name must not be empty");
    }

    const cacheKey = this.buildCacheKey(entitySetName, options);
    const cached = await this.deps.cache.get<EntityMetadata>("entityMetadata", cacheKey);
    if (cached) return cached;

    const fullOptions: MetadataFetchOptions = {
      includeKeys: true,
      includeFieldConstraints: true,
      includeRelationships: true,
      includeEnumValues: false,
      ...options,
    };

    const metadata = await this.deps.fetchMetadata(entitySetName, fullOptions);
    await this.deps.cache.set("entityMetadata", cacheKey, metadata, METADATA_TTL_MS);
    return metadata;
  }

  async getMetadataWithEnums(entitySetName: string): Promise<EntityMetadata> {
    return this.getMetadata(entitySetName, { includeEnumValues: true });
  }

  /** Compute a hash string from metadata for cache invalidation. */
  computeMetadataHash(metadata: EntityMetadata): string {
    const fieldNames = Object.keys(metadata.fields).sort().join(",");
    const keyFields = (metadata.keys ?? []).sort().join(",");
    return simpleHash(`${metadata.entity_set_name}:${fieldNames}:${keyFields}`);
  }

  /** Extract fields suitable for form display (exclude system/audit fields). */
  getFormFields(metadata: EntityMetadata): EntityField[] {
    const SYSTEM_FIELDS = new Set([
      "RecId", "DataAreaId", "Partition", "RecVersion",
      "CreatedDateTime", "ModifiedDateTime", "CreatedBy", "ModifiedBy",
      "CreatedTransactionId", "ModifiedTransactionId",
    ]);

    return Object.values(metadata.fields).filter(
      (field) => !SYSTEM_FIELDS.has(field.name) && !field.is_read_only
    );
  }

  /** Get key fields for the entity. */
  getKeyFields(metadata: EntityMetadata): EntityField[] {
    const keys = new Set(metadata.keys ?? []);
    return Object.values(metadata.fields).filter((f) => keys.has(f.name));
  }

  async invalidate(entitySetName: string): Promise<void> {
    await this.deps.cache.delete("entityMetadata", entitySetName);
  }

  private buildCacheKey(entitySetName: string, options?: MetadataFetchOptions): string {
    const flags = [
      options?.includeKeys ? "k" : "",
      options?.includeFieldConstraints ? "c" : "",
      options?.includeRelationships ? "r" : "",
      options?.includeEnumValues ? "e" : "",
    ].filter(Boolean).join("");
    return flags ? `${entitySetName}:${flags}` : entitySetName;
  }
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(36);
}
