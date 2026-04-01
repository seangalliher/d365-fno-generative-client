/**
 * useFormPregeneration — Background pre-generation for recently accessed forms.
 * When idle, checks if recently navigated menu items have cached forms,
 * and pre-generates any that are missing.
 */

import { useEffect, useRef } from "react";
import { useNavigationHistory } from "@/store/navigationHistory";
import { useAppState } from "@/store/appState";
import type { FormGenerationService } from "@/services/generation/formGenerationService";
import { findMenuItem } from "@/data/moduleTaxonomy";

let _pregenService: FormGenerationService | null = null;

export function setPregenService(svc: FormGenerationService): void {
  _pregenService = svc;
}

/**
 * Pre-generates forms for recent navigation entries that aren't cached yet.
 * Runs after a delay to avoid competing with the active form generation.
 */
export function useFormPregeneration(): void {
  const recentItems = useNavigationHistory((s) => s.recentItems);
  const company = useAppState((s) => s.currentCompany);
  const runningRef = useRef(false);

  useEffect(() => {
    if (!_pregenService || runningRef.current) return;

    const timer = setTimeout(async () => {
      if (runningRef.current) return;
      runningRef.current = true;

      try {
        const recent = recentItems(5);
        for (const entry of recent) {
          if (!entry.menuItemName) continue;
          const result = findMenuItem(entry.menuItemName);
          if (!result?.item.entitySet) continue;

          try {
            await _pregenService!.generateForm(result.item, company);
          } catch {
            // Silently skip failures — this is best-effort background work
          }
        }
      } finally {
        runningRef.current = false;
      }
    }, 5000); // 5s delay before starting pre-generation

    return () => clearTimeout(timer);
  }, [recentItems, company]);
}
