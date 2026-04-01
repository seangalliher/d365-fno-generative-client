/**
 * useEntityData — Fetches entity records from live D365 OData or falls back to sample data.
 * Uses module-level singleton pattern consistent with other service hooks.
 */

import { useState, useEffect, useCallback } from "react";
import type { FormDataService } from "@/services/data/formDataService";
import type { ODataQueryOptions } from "@/types";
import { getEntityCatalogEntry } from "@/data/entityCatalog";
import { generateSampleData } from "@/data/sampleData";
import { useAppState } from "@/store/appState";

// --- Module-level singleton ---
let _formDataService: FormDataService | null = null;

export function setDataServices(service: FormDataService | null): void {
  _formDataService = service;
}

export function isLiveDataAvailable(): boolean {
  return _formDataService !== null;
}

// --- Hook ---

interface UseEntityDataResult {
  data: Record<string, unknown>[];
  loading: boolean;
  error: string | null;
  isLive: boolean;
  refresh: () => void;
}

export function useEntityData(
  entitySet: string | undefined,
  options?: { top?: number; select?: string; orderby?: string },
): UseEntityDataResult {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const company = useAppState((s) => s.currentCompany);
  const isLive = _formDataService !== null;

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!entitySet) {
      setData([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      // Live mode — use OData service
      if (_formDataService) {
        try {
          const catalogEntry = getEntityCatalogEntry(entitySet!);
          const queryOptions: ODataQueryOptions = {
            top: options?.top ?? 50,
            select: options?.select ?? catalogEntry?.defaultSelect.join(","),
            orderby: options?.orderby,
            crossCompany: true,
            filter: `dataAreaId eq '${company}'`,
          };

          const result = await _formDataService.queryRecords(
            { type: "odata", entitySet },
            queryOptions,
          );

          if (!cancelled) {
            setData(result.value);
          }
        } catch (err) {
          if (!cancelled) {
            const msg = err instanceof Error ? err.message : "Failed to fetch data";
            setError(msg);
            // Fall back to sample data on error
            setData(generateSampleData(entitySet!, options?.top ?? 25));
          }
        }
      } else {
        // Demo mode — sample data
        setData(generateSampleData(entitySet!, options?.top ?? 25));
      }

      if (!cancelled) {
        setLoading(false);
      }
    }

    void fetchData();

    return () => {
      cancelled = true;
    };
  }, [entitySet, company, options?.top, options?.select, options?.orderby, refreshKey]);

  return { data, loading, error, isLive, refresh };
}
