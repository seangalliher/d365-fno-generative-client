/**
 * Service bootstrap — assembles the dependency graph and initializes singletons.
 * Called once at app startup before React renders.
 */

import type { EntityMetadata, EntityField, EntityFieldType } from "@/types";
import { CopilotProxyClient } from "@/services/llm/llmClient";
import { MetadataService } from "@/services/d365/metadataService";
import { FormCache } from "@/services/cache/formCache";
import { IndexedDbCacheStore } from "@/services/cache/indexedDbCache";
import { FormGenerationService } from "@/services/generation/formGenerationService";
import { setFormGenerationService } from "@/hooks/useGeneratedForm";
import { setPregenService } from "@/hooks/useFormPregeneration";
import { ENTITY_CATALOG, type EntityCatalogEntry } from "@/data/entityCatalog";

/**
 * Convert an entity catalog entry into a synthetic EntityMetadata.
 * This allows the LLM prompt builder to work without a live D365 OData endpoint.
 */
function catalogToMetadata(entry: EntityCatalogEntry): EntityMetadata {
  const fields: Record<string, EntityField> = {};

  // Build fields from defaultSelect + keyFields + searchFields (deduplicated)
  const allFieldNames = new Set([
    ...entry.keyFields,
    ...entry.defaultSelect,
    ...entry.searchFields,
  ]);

  for (const name of allFieldNames) {
    const isKey = entry.keyFields.includes(name);
    const fieldType = inferFieldType(name);
    fields[name] = {
      name,
      type: fieldType,
      nullable: !isKey,
      is_key: isKey,
      is_read_only: isKey,
      is_required: isKey,
    };
  }

  return {
    name: entry.label,
    entity_set_name: entry.entitySet,
    fields,
    keys: entry.keyFields,
  };
}

/** Infer a reasonable field type from the field name. */
function inferFieldType(name: string): EntityFieldType {
  const lower = name.toLowerCase();
  if (lower.includes("date") || lower.includes("datetime")) return "DateTimeOffset";
  if (lower.includes("quantity") || lower.includes("amount") || lower.includes("price")) return "Decimal";
  if (lower.includes("number") && !lower.includes("account")) return "Int64";
  if (lower.includes("isactive") || lower.includes("is_")) return "Boolean";
  if (lower.includes("status") || lower.includes("type") || lower.includes("group")) return "Enum";
  return "String";
}

/**
 * Create a metadata fetcher backed by the entity catalog.
 * Falls back to a minimal stub for unknown entities.
 */
function createCatalogMetadataFetcher() {
  return async (entitySetName: string): Promise<EntityMetadata> => {
    const entry = ENTITY_CATALOG[entitySetName];
    if (entry) {
      return catalogToMetadata(entry);
    }

    // Minimal fallback for entities not in catalog
    return {
      name: entitySetName,
      entity_set_name: entitySetName,
      fields: {
        dataAreaId: { name: "dataAreaId", type: "String", nullable: false, is_key: true, is_read_only: true },
      },
      keys: ["dataAreaId"],
    };
  };
}

/**
 * Bootstrap all services and wire them into the React hooks.
 */
export function bootstrapServices(): void {
  const proxyEndpoint = import.meta.env.VITE_LLM_ENDPOINT || "http://127.0.0.1:8080";
  const model = import.meta.env.VITE_LLM_MODEL || "gpt-4o";

  // LLM provider
  const llm = new CopilotProxyClient({
    endpoint: proxyEndpoint,
    model,
    temperature: 0.2,
    maxTokens: 4096,
  });

  // Cache layer (IndexedDB)
  const cacheStore = new IndexedDbCacheStore();

  // Metadata service (catalog-backed)
  const metadata = new MetadataService({
    cache: cacheStore,
    fetchMetadata: createCatalogMetadataFetcher(),
  });

  // Form cache
  const formCache = new FormCache(cacheStore);

  // Generation orchestrator
  const formGenService = new FormGenerationService({ llm, metadata, formCache });

  // Wire into React hooks
  setFormGenerationService(formGenService);
  setPregenService(formGenService);

  console.info(
    `[bootstrap] Services initialized — LLM: ${proxyEndpoint} model=${model}`
  );
}
