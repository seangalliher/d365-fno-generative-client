/**
 * LLM response parser — validates and extracts GeneratedForm from LLM output.
 */

import type { GeneratedForm, FormField } from "@/types";
import type { EntityMetadata } from "@/types";

export interface ParseResult {
  readonly success: boolean;
  readonly form?: GeneratedForm;
  readonly errors: string[];
}

/**
 * Parse a raw LLM response string into a validated GeneratedForm.
 */
export function parseFormResponse(raw: string, metadata: EntityMetadata): ParseResult {
  const errors: string[] = [];

  // Step 1: Extract JSON from response (handle markdown code blocks)
  const json = extractJson(raw);
  if (!json) {
    return { success: false, errors: ["Could not extract valid JSON from LLM response"] };
  }

  // Step 2: Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { success: false, errors: ["Invalid JSON in LLM response"] };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return { success: false, errors: ["LLM response is not a JSON object"] };
  }

  const form = parsed as Record<string, unknown>;

  // Step 3: Validate required top-level properties
  const requiredProps = ["id", "entitySet", "menuItemName", "menuItemType", "title", "fields", "layout", "dataSource"];
  for (const prop of requiredProps) {
    if (!(prop in form)) {
      errors.push(`Missing required property: ${prop}`);
    }
  }
  if (errors.length > 0) {
    return { success: false, errors };
  }

  // Step 4: Validate fields reference real metadata fields
  const metadataFieldNames = new Set(Object.keys(metadata.fields));
  const fields = form.fields as FormField[];
  if (Array.isArray(fields)) {
    for (const field of fields) {
      if (!metadataFieldNames.has(field.name)) {
        errors.push(`Field "${field.name}" does not exist in entity metadata`);
      }
    }
  }

  // Step 5: Validate field types are compatible
  const validTypes = new Set(["text", "number", "date", "datetime", "boolean", "enum", "lookup", "currency", "memo"]);
  if (Array.isArray(fields)) {
    for (const field of fields) {
      if (!validTypes.has(field.type)) {
        errors.push(`Field "${field.name}" has invalid type: ${field.type}`);
      }
    }
  }

  // Step 6: Ensure defaults for optional arrays
  const sanitizedForm: GeneratedForm = {
    ...(form as unknown as GeneratedForm),
    fields: Array.isArray(form.fields) ? form.fields as FormField[] : [],
    grids: Array.isArray(form.grids) ? form.grids as GeneratedForm["grids"] : [],
    actions: Array.isArray(form.actions) ? form.actions as GeneratedForm["actions"] : [],
    lookups: Array.isArray(form.lookups) ? form.lookups as GeneratedForm["lookups"] : [],
    navigation: Array.isArray(form.navigation) ? form.navigation as GeneratedForm["navigation"] : [],
    version: typeof form.version === "number" ? form.version : 1,
    generatedAt: typeof form.generatedAt === "string" ? form.generatedAt : new Date().toISOString(),
    metadataHash: typeof form.metadataHash === "string" ? form.metadataHash : "",
    description: typeof form.description === "string" ? form.description : "",
  };

  // Non-critical field errors are warnings only — still return the form
  return {
    success: errors.length === 0,
    form: sanitizedForm,
    errors,
  };
}

/**
 * Extract JSON from a string that may include markdown code fences.
 */
function extractJson(raw: string): string | null {
  const trimmed = raw.trim();

  // Try direct parse first
  if (trimmed.startsWith("{")) {
    return trimmed;
  }

  // Try extracting from ```json ... ``` code block
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch?.[1]) {
    return codeBlockMatch[1].trim();
  }

  // Try finding first { to last }
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return null;
}
