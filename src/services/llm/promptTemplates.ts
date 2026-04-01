/**
 * Prompt templates for LLM-based form generation.
 * Manages token budget by filtering metadata to essential fields.
 */

import type { EntityMetadata, EntityField } from "@/types";
import type { MenuItem } from "@/types";
import type { EntityCatalogEntry } from "@/data/entityCatalog";

export interface PromptContext {
  readonly metadata: EntityMetadata;
  readonly menuItem: MenuItem;
  readonly catalogEntry?: EntityCatalogEntry;
  readonly company: string;
  readonly existingFormCount: number;
  readonly userFeedback?: string;
  readonly currentForm?: string;
}

const GENERATED_FORM_SCHEMA = `interface GeneratedForm {
  id: string;
  entitySet: string;
  menuItemName: string;
  menuItemType: "Display" | "Action";
  title: string;
  description: string;
  version: number;
  generatedAt: string;
  metadataHash: string;
  layout: { type: "tabbed" | "single-page"; tabs: Array<{ name: string; label: string; fields: string[]; grids?: string[]; order: number }> };
  fields: Array<{ name: string; label: string; type: "text" | "number" | "date" | "datetime" | "boolean" | "enum" | "lookup" | "currency" | "memo"; group: string; required: boolean; readOnly: boolean; maxLength?: number; enumValues?: Array<{ value: string; label: string }>; lookupEntity?: string; lookupDisplayField?: string; lookupValueField?: string; defaultValue?: unknown; helpText?: string; order: number; isKey?: boolean; currencyCode?: string }>;
  grids: Array<{ name: string; title: string; entitySet: string; columns: Array<{ name: string; label: string; type: string; width?: number; sortable?: boolean; filterable?: boolean }>; filterableColumns: string[]; sortableColumns: string[]; parentFieldMapping?: Record<string, string>; defaultSort?: { column: string; direction: "asc" | "desc" }; pageSize?: number }>;
  actions: Array<{ name: string; label: string; icon?: string; variant: "primary" | "secondary" | "destructive" | "ghost"; requiresSelection?: boolean; confirmMessage?: string; apiAction?: string; order: number }>;
  lookups: Array<{ fieldName: string; entitySet: string; displayField: string; valueField: string; searchFields: string[]; additionalColumns?: string[]; filter?: string }>;
  navigation: Array<{ label: string; targetMenuItemName: string; targetMenuItemType: "Display" | "Action"; foreignKeyField: string; icon?: string }>;
  dataSource: { type: "odata"; entitySet: string };
}`;

const SYSTEM_FIELDS = new Set([
  "RecId", "DataAreaId", "Partition", "RecVersion",
  "CreatedDateTime", "ModifiedDateTime", "CreatedBy", "ModifiedBy",
  "CreatedTransactionId", "ModifiedTransactionId",
]);

function formatField(field: EntityField): string {
  const parts = [`${field.name}: ${field.type}`];
  if (field.nullable === false) parts.push("required");
  if (field.is_read_only) parts.push("readOnly");
  if (field.max_length) parts.push(`maxLen=${field.max_length}`);
  if (field.enum_type) parts.push(`enum=${field.enum_type}`);
  if (field.is_key) parts.push("KEY");
  return parts.join(" | ");
}

function getRelevantFields(metadata: EntityMetadata): EntityField[] {
  return Object.values(metadata.fields).filter(
    (f) => !SYSTEM_FIELDS.has(f.name)
  );
}

export function buildFormGenerationPrompt(ctx: PromptContext): string {
  const { metadata, menuItem, catalogEntry, company } = ctx;

  const fields = getRelevantFields(metadata);
  const keys = metadata.keys ?? [];

  const fieldList = fields.map(formatField).join("\n  ");

  const catalogHints = catalogEntry
    ? `\nPre-configured hints:\n  Default display fields: ${catalogEntry.defaultSelect.join(", ")}\n  Search fields: ${catalogEntry.searchFields.join(", ")}\n  Category: ${catalogEntry.category}\n  Related entities: ${(catalogEntry.relatedEntities ?? []).join(", ") || "none"}`
    : "";

  const enumSection =
    metadata.enum_values && Object.keys(metadata.enum_values).length > 0
      ? `\nEnum definitions:\n${Object.entries(metadata.enum_values)
          .map(([name, values]) => `  ${name}: ${values.map((v) => v.name).join(", ")}`)
          .join("\n")}`
      : "";

  const relationSection =
    metadata.relationships && metadata.relationships.length > 0
      ? `\nRelationships:\n${metadata.relationships
          .map((r) => `  ${r.name} → ${r.target} (${r.cardinality})`)
          .join("\n")}`
      : "";

  return `Generate a D365 form definition for the following entity.

Entity: ${metadata.entity_set_name} (${metadata.name})
Menu item: ${menuItem.menuItemName} (${menuItem.menuItemType})
Label: ${menuItem.label}
Company: ${company}
Key fields: ${keys.join(", ")}

Available fields (${fields.length}):
  ${fieldList}
${enumSection}
${relationSection}
${catalogHints}

Instructions:
1. Create a user-friendly form following D365 UX conventions
2. Group related fields into logical tabs (e.g., "General", "Financial", "Details")
3. Place key identifier fields prominently at the top of the first tab
4. Mark truly required business fields (not just DB-nullable fields)
5. Set appropriate field types: use "lookup" for foreign key references, "enum" for enum fields, "currency" for monetary amounts, "memo" for long text
6. Include standard actions: Save, Delete, New
7. Set the dataSource to { type: "odata", entitySet: "${metadata.entity_set_name}" }
8. Use a unique id (e.g., "form-${menuItem.menuItemName.toLowerCase()}")
9. Set version to 1, generatedAt to current ISO timestamp, metadataHash to a placeholder

Output the form as a JSON object conforming to this TypeScript interface:
${GENERATED_FORM_SCHEMA}

Return ONLY the JSON object. No markdown, no explanation.`;
}

// ---- NL Dashboard prompt ----

export function buildNLDashboardPrompt(
  query: string,
  company: string,
  entitySummary: string,
): string {
  return `You are a D365 Finance & Operations data analyst. A user asked a natural language question about their ERP data.
Generate an OData query specification and chart configuration to answer the question.

User question: "${query}"
Company (dataAreaId): ${company}

Available D365 OData entity sets and their key fields:
${entitySummary}

Instructions:
1. Pick the most relevant entity set from the list above
2. Choose appropriate $select, $filter, $orderby, and $top parameters
3. Always include a dataAreaId filter for the company
4. Choose a chart type that best visualizes the answer: "bar", "pie", "line", or "table"
5. If the question involves counts or grouping, plan client-side aggregation

Return a JSON object with this exact structure:
{
  "title": "Human-readable chart title",
  "chartType": "bar" | "pie" | "line" | "table",
  "entitySet": "EntitySetName",
  "select": "Field1,Field2,Field3",
  "filter": "dataAreaId eq '${company}' and ...",
  "orderby": "Field1 desc",
  "top": 50,
  "xKey": "field name for X axis / labels",
  "yKey": "field name for Y axis / values",
  "aggregateBy": "optional: field to group and count by",
  "columns": [
    { "key": "Field1", "label": "Display Name", "type": "string" | "number" | "date" }
  ]
}

Return ONLY the JSON object. No markdown, no explanation.`;
}

export function buildFormRefinementPrompt(ctx: PromptContext): string {
  if (!ctx.userFeedback || !ctx.currentForm) {
    return buildFormGenerationPrompt(ctx);
  }

  const { metadata, menuItem } = ctx;
  const fields = getRelevantFields(metadata);
  const fieldList = fields.map(formatField).join("\n  ");

  return `You previously generated a form definition for the entity ${metadata.entity_set_name} (menu item: ${menuItem.menuItemName}).

Current form JSON:
${ctx.currentForm}

Available fields (${fields.length}):
  ${fieldList}

The user has requested the following change:
"${ctx.userFeedback}"

Instructions:
1. Apply the user's requested change to the form definition
2. Keep all other aspects of the form the same unless they conflict with the change
3. Increment the version number by 1
4. Update the generatedAt timestamp
5. Conform to the same GeneratedForm interface

Output the updated form as a JSON object conforming to this TypeScript interface:
${GENERATED_FORM_SCHEMA}

Return ONLY the JSON object. No markdown, no explanation.`;
}
