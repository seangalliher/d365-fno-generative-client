/**
 * GraphLegend — floating overlay showing colour-coded entity categories.
 */

import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
} from "@/data/entityGraphData";
import type { EntityCategory } from "@/data/entityCatalog";

interface GraphLegendProps {
  compact?: boolean;
}

export function GraphLegend({ compact }: GraphLegendProps) {
  const categories = Object.entries(CATEGORY_LABELS) as [
    EntityCategory,
    string,
  ][];

  return (
    <div
      className={`absolute top-3 left-3 z-10 rounded-lg bg-black/60 backdrop-blur-sm text-white
        ${compact ? "p-2 text-[10px] space-y-1" : "p-3 text-xs space-y-1.5"}`}
    >
      <div
        className={`font-semibold ${compact ? "text-[11px] mb-1" : "text-sm mb-2"}`}
      >
        Entity Categories
      </div>
      {categories.map(([key, label]) => (
        <div key={key} className="flex items-center gap-2">
          <div
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: CATEGORY_COLORS[key] }}
          />
          <span className="opacity-90">{label}</span>
        </div>
      ))}
    </div>
  );
}
