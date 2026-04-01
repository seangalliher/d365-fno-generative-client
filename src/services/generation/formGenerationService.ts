/**
 * Form generation orchestrator — coordinates metadata fetch, LLM generation,
 * validation, and caching of dynamically generated form schemas.
 */

import type { GeneratedForm, GenerationStatus, GenerationStep } from "@/types";
import type { FormGenerationProvider } from "@/services/llm/llmClient";
import type { MetadataService } from "@/services/d365/metadataService";
import type { FormCache } from "@/services/cache/formCache";
import type { MenuItem } from "@/types";
import { buildFormGenerationPrompt, buildFormRefinementPrompt } from "@/services/llm/promptTemplates";
import { parseFormResponse } from "@/services/llm/responseParser";
import { getEntityCatalogEntry } from "@/data/entityCatalog";

export interface FormGenerationServiceDeps {
  readonly llm: FormGenerationProvider;
  readonly metadata: MetadataService;
  readonly formCache: FormCache;
}

export type StatusCallback = (status: GenerationStatus) => void;

function makeStatus(step: GenerationStep, progress: number, message: string, error?: string): GenerationStatus {
  return { step, progress, message, error };
}

export class FormGenerationService {
  private readonly deps: FormGenerationServiceDeps;

  constructor(deps: FormGenerationServiceDeps) {
    this.deps = deps;
  }

  /**
   * Generate (or retrieve from cache) a form definition for a menu item.
   * Calls onStatus throughout the process for UI progress updates.
   */
  async generateForm(
    menuItem: MenuItem,
    company: string,
    onStatus?: StatusCallback
  ): Promise<GeneratedForm> {
    const report = (s: GenerationStatus) => onStatus?.(s);

    // 1. Check cache
    report(makeStatus("checking-cache", 10, "Checking for cached form..."));
    const cached = await this.deps.formCache.get(menuItem.menuItemName, menuItem.menuItemType);
    if (cached) {
      report(makeStatus("ready", 100, "Loaded from cache"));
      return cached;
    }

    // 2. Get entity metadata
    if (!menuItem.entitySet) {
      throw new FormGenerationError(
        `Menu item "${menuItem.menuItemName}" has no associated entity set`,
        "NO_ENTITY"
      );
    }

    report(makeStatus("fetching-metadata", 25, `Fetching metadata for ${menuItem.entitySet}...`));
    const metadata = await this.deps.metadata.getMetadataWithEnums(menuItem.entitySet);

    // 3. Build prompt
    report(makeStatus("generating", 40, "Generating form layout with AI..."));
    const catalogEntry = getEntityCatalogEntry(menuItem.entitySet);
    const existingForms = await this.deps.formCache.listCached();

    const prompt = buildFormGenerationPrompt({
      metadata,
      menuItem,
      catalogEntry,
      company,
      existingFormCount: existingForms.length,
    });

    // 4. Call LLM
    const rawResponse = await this.deps.llm.generateFormSchema(prompt);

    // 5. Parse and validate
    report(makeStatus("validating", 75, "Validating generated form..."));
    const parseResult = parseFormResponse(rawResponse, metadata);

    if (!parseResult.form) {
      throw new FormGenerationError(
        `Form generation failed: ${parseResult.errors.join("; ")}`,
        "PARSE_FAILED"
      );
    }

    // Even with validation warnings, use the form
    const form = parseResult.form;

    // 6. Cache
    report(makeStatus("caching", 90, "Caching form for reuse..."));
    await this.deps.formCache.set(form);

    report(makeStatus("ready", 100, "Form ready"));
    return form;
  }

  async regenerate(
    menuItem: MenuItem,
    company: string,
    onStatus?: StatusCallback
  ): Promise<GeneratedForm> {
    await this.deps.formCache.invalidate(menuItem.menuItemName, menuItem.menuItemType);
    return this.generateForm(menuItem, company, onStatus);
  }

  /**
   * Refine an existing form based on user feedback.
   * Sends the current form + feedback to the LLM for adjustment.
   */
  async refineForm(
    menuItem: MenuItem,
    company: string,
    currentForm: GeneratedForm,
    feedback: string,
    onStatus?: StatusCallback
  ): Promise<GeneratedForm> {
    const report = (s: GenerationStatus) => onStatus?.(s);

    if (!menuItem.entitySet) {
      throw new FormGenerationError(`Menu item "${menuItem.menuItemName}" has no entity set`, "NO_ENTITY");
    }

    report(makeStatus("fetching-metadata", 20, "Fetching metadata..."));
    const metadata = await this.deps.metadata.getMetadataWithEnums(menuItem.entitySet);

    report(makeStatus("generating", 40, "Applying your feedback..."));
    const catalogEntry = getEntityCatalogEntry(menuItem.entitySet);
    const existingForms = await this.deps.formCache.listCached();

    const prompt = buildFormRefinementPrompt({
      metadata,
      menuItem,
      catalogEntry,
      company,
      existingFormCount: existingForms.length,
      userFeedback: feedback,
      currentForm: JSON.stringify(currentForm),
    });

    const rawResponse = await this.deps.llm.generateFormSchema(prompt);

    report(makeStatus("validating", 75, "Validating refined form..."));
    const parseResult = parseFormResponse(rawResponse, metadata);

    if (!parseResult.form) {
      throw new FormGenerationError(
        `Form refinement failed: ${parseResult.errors.join("; ")}`,
        "PARSE_FAILED"
      );
    }

    report(makeStatus("caching", 90, "Caching refined form..."));
    await this.deps.formCache.set(parseResult.form);

    report(makeStatus("ready", 100, "Refined form ready"));
    return parseResult.form;
  }
}

export class FormGenerationError extends Error {
  constructor(
    message: string,
    readonly code: "NO_ENTITY" | "PARSE_FAILED" | "LLM_ERROR"
  ) {
    super(message);
    this.name = "FormGenerationError";
  }
}
