/**
 * Hook: useGeneratedForm — loads or generates a form definition for a menu item.
 */

import { useState, useEffect, useCallback } from "react";
import type { GeneratedForm, GenerationStatus, MenuItem } from "@/types";
import type { FormGenerationService } from "@/services/generation/formGenerationService";

export interface UseGeneratedFormResult {
  form: GeneratedForm | null;
  status: GenerationStatus;
  isCached: boolean;
  error: string | null;
  regenerate: () => void;
  refine: (feedback: string) => Promise<void>;
  isRefining: boolean;
}

let _formGenerationService: FormGenerationService | null = null;

/**
 * Set the singleton FormGenerationService instance for the hook to use.
 * Call once during app initialization.
 */
export function setFormGenerationService(svc: FormGenerationService): void {
  _formGenerationService = svc;
}

export function useGeneratedForm(
  menuItem: MenuItem | undefined,
  company: string
): UseGeneratedFormResult {
  const [form, setForm] = useState<GeneratedForm | null>(null);
  const [status, setStatus] = useState<GenerationStatus>({
    step: "checking-cache",
    progress: 0,
    message: "Initializing...",
  });
  const [isCached, setIsCached] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regenerateFlag, setRegenerateFlag] = useState(0);
  const [isRefining, setIsRefining] = useState(false);

  useEffect(() => {
    if (!menuItem || !_formGenerationService) return;

    let cancelled = false;

    async function generate() {
      setForm(null);
      setError(null);
      setIsCached(false);
      setStatus({ step: "checking-cache", progress: 0, message: "Starting..." });

      try {
        const isRegen = regenerateFlag > 0;
        const result = isRegen
          ? await _formGenerationService!.regenerate(menuItem!, company, (s) => {
              if (!cancelled) setStatus(s);
            })
          : await _formGenerationService!.generateForm(menuItem!, company, (s) => {
              if (!cancelled) setStatus(s);
            });

        if (!cancelled) {
          setForm(result);
          setIsCached(result.version > 0);
          setStatus({ step: "ready", progress: 100, message: "Ready" });
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          setError(msg);
          setStatus({ step: "error", progress: 0, message: msg, error: msg });
        }
      }
    }

    void generate();

    return () => {
      cancelled = true;
    };
  }, [menuItem?.menuItemName, menuItem?.menuItemType, company, regenerateFlag]);

  const regenerate = useCallback(() => {
    setRegenerateFlag((f) => f + 1);
  }, []);

  const refine = useCallback(
    async (feedback: string) => {
      if (!menuItem || !form || !_formGenerationService) return;
      setIsRefining(true);
      try {
        const result = await _formGenerationService.refineForm(
          menuItem,
          company,
          form,
          feedback,
          (s) => setStatus(s)
        );
        setForm(result);
        setStatus({ step: "ready", progress: 100, message: "Refined form ready" });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Refinement failed";
        setError(msg);
      } finally {
        setIsRefining(false);
      }
    },
    [menuItem, company, form]
  );

  return { form, status, isCached, error, regenerate, refine, isRefining };
}
