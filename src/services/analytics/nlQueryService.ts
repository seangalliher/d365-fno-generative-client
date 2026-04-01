/**
 * Natural language → OData query → chart result orchestrator.
 * Uses the LLM to interpret a user question, then runs the OData query.
 */

import type { FormGenerationProvider } from "@/services/llm/llmClient";
import type { ODataService } from "@/services/d365/odataService";
import type { NLQueryResult, NLQueryColumn } from "./dashboardDataProvider";
import { buildNLDashboardPrompt } from "@/services/llm/promptTemplates";
import { ENTITY_CATALOG } from "@/data/entityCatalog";

// ---- Module-level singletons ----

let _llm: FormGenerationProvider | null = null;
let _odata: ODataService | null = null;

export function setNLQueryLlm(llm: FormGenerationProvider | null): void {
  _llm = llm;
}

export function setNLQueryOData(odata: ODataService | null): void {
  _odata = odata;
}

export function isNLQueryAvailable(): boolean {
  return _llm !== null && _odata !== null;
}

// ---- Entity summary for prompt context ----

function buildEntitySummary(): string {
  return Object.values(ENTITY_CATALOG)
    .map(
      (e) =>
        `- ${e.entitySet} (${e.label}): fields=[${e.defaultSelect.join(", ")}] search=[${e.searchFields.join(", ")}]`,
    )
    .join("\n");
}

// ---- LLM response parsing ----

interface LLMQuerySpec {
  title: string;
  chartType: "bar" | "pie" | "line" | "table" | "kpi";
  entitySet: string;
  select: string;
  filter: string;
  orderby?: string;
  top?: number;
  xKey?: string;
  yKey?: string;
  aggregateBy?: string;
  columns: NLQueryColumn[];
}

function parseLLMResponse(raw: string): LLMQuerySpec {
  // Strip markdown fences if the LLM wraps it
  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  const parsed = JSON.parse(cleaned);

  if (!parsed.entitySet || !parsed.select) {
    throw new Error("LLM response missing required fields (entitySet, select)");
  }

  return {
    title: parsed.title ?? "Query Result",
    chartType: parsed.chartType ?? "table",
    entitySet: parsed.entitySet,
    select: parsed.select,
    filter: parsed.filter ?? "",
    orderby: parsed.orderby,
    top: parsed.top ?? 50,
    xKey: parsed.xKey,
    yKey: parsed.yKey,
    aggregateBy: parsed.aggregateBy,
    columns: parsed.columns ?? [],
  };
}

// ---- Public API ----

export async function executeNLDashboardQuery(
  query: string,
  company: string,
): Promise<NLQueryResult> {
  if (!_llm || !_odata) {
    return {
      title: "Not Available",
      chartType: "table",
      columns: [],
      rows: [],
      error: "NL query requires both an LLM endpoint and a D365 connection. Ensure VITE_LLM_ENDPOINT is configured and the proxy is running.",
    };
  }

  // 1. Ask LLM to interpret the question
  let spec: LLMQuerySpec;
  try {
    const prompt = buildNLDashboardPrompt(query, company, buildEntitySummary());
    const raw = await _llm.generateFormSchema(prompt);
    spec = parseLLMResponse(raw);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      title: "LLM Error",
      chartType: "table",
      columns: [],
      rows: [],
      error: `Failed to generate query from your question: ${msg}`,
    };
  }

  // 2. Execute OData query
  let rows: Record<string, unknown>[];
  try {
    const result = await _odata.query(spec.entitySet, {
      select: spec.select,
      filter: spec.filter,
      orderby: spec.orderby,
      top: spec.top,
      crossCompany: true,
    });
    rows = result.value as Record<string, unknown>[];
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      title: spec.title,
      chartType: spec.chartType,
      columns: spec.columns,
      rows: [],
      error: `OData query failed for ${spec.entitySet}: ${msg}`,
    };
  }

  // 3. Client-side aggregation if needed
  if (spec.aggregateBy && rows.length > 0) {
    const counts = new Map<string, number>();
    for (const row of rows) {
      const key = String(row[spec.aggregateBy] ?? "Unknown");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    rows = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ [spec.xKey ?? "name"]: name, [spec.yKey ?? "value"]: value }));
  }

  // 4. Auto-generate columns if LLM didn't provide them
  let columns = spec.columns;
  if (columns.length === 0 && rows.length > 0) {
    const firstRow = rows[0]!;
    columns = Object.keys(firstRow as Record<string, unknown>)
      .filter((k) => k !== "@odata.etag" && !k.startsWith("@"))
      .map((k) => ({
        key: k,
        label: k.replace(/([A-Z])/g, " $1").trim(),
        type: (typeof (firstRow as Record<string, unknown>)[k] === "number" ? "number" : "string") as "string" | "number",
      }));
  }

  return {
    title: spec.title,
    chartType: spec.chartType,
    columns,
    rows,
    xKey: spec.xKey,
    yKey: spec.yKey,
  };
}
