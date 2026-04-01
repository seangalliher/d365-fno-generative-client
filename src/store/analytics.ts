/**
 * Analytics store — tracks form generation metrics and usage patterns.
 * Stores in localStorage for persistence across sessions.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface FormGenerationMetric {
  readonly menuItemName: string;
  readonly entitySet: string;
  readonly generatedAt: string;
  readonly durationMs: number;
  readonly fromCache: boolean;
  readonly version: number;
}

export interface UsageMetrics {
  totalFormsGenerated: number;
  totalFormsFromCache: number;
  totalRefinements: number;
  averageGenerationMs: number;
  formMetrics: FormGenerationMetric[];
  mostUsedForms: Array<{ menuItemName: string; count: number }>;
}

interface AnalyticsState {
  metrics: FormGenerationMetric[];
  refinementCount: number;

  trackGeneration: (metric: FormGenerationMetric) => void;
  trackRefinement: () => void;
  getMetrics: () => UsageMetrics;
  clearMetrics: () => void;
}

const MAX_METRICS = 500;

export const useAnalytics = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      metrics: [],
      refinementCount: 0,

      trackGeneration: (metric) =>
        set((state) => ({
          metrics: [...state.metrics, metric].slice(-MAX_METRICS),
        })),

      trackRefinement: () =>
        set((state) => ({ refinementCount: state.refinementCount + 1 })),

      getMetrics: () => {
        const { metrics, refinementCount } = get();
        const cacheHits = metrics.filter((m) => m.fromCache).length;
        const generated = metrics.filter((m) => !m.fromCache);
        const avgMs =
          generated.length > 0
            ? generated.reduce((sum, m) => sum + m.durationMs, 0) / generated.length
            : 0;

        // Count usage by menuItemName
        const usageCounts = new Map<string, number>();
        for (const m of metrics) {
          usageCounts.set(m.menuItemName, (usageCounts.get(m.menuItemName) ?? 0) + 1);
        }
        const mostUsed = [...usageCounts.entries()]
          .map(([menuItemName, count]) => ({ menuItemName, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        return {
          totalFormsGenerated: metrics.length,
          totalFormsFromCache: cacheHits,
          totalRefinements: refinementCount,
          averageGenerationMs: Math.round(avgMs),
          formMetrics: metrics.slice(-20),
          mostUsedForms: mostUsed,
        };
      },

      clearMetrics: () => set({ metrics: [], refinementCount: 0 }),
    }),
    {
      name: "d365-analytics",
      partialize: (state) => ({
        metrics: state.metrics,
        refinementCount: state.refinementCount,
      }),
    }
  )
);
