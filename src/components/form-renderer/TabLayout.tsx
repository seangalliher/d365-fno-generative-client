/**
 * TabLayout — Renders a tabbed form layout from GeneratedForm tabs.
 */

import { useState, type ReactNode } from "react";
import type { FormTab } from "@/types";
import { cn } from "@/lib/utils";

interface TabLayoutProps {
  tabs: FormTab[];
  renderFields: (fieldNames: string[]) => ReactNode;
  renderGrids: (gridNames?: string[]) => ReactNode;
}

export function TabLayout({ tabs, renderFields, renderGrids }: TabLayoutProps) {
  const sorted = [...tabs].sort((a, b) => a.order - b.order);
  const [activeTab, setActiveTab] = useState(sorted[0]?.name ?? "");

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-border">
        {sorted.map((tab) => (
          <button
            key={tab.name}
            onClick={() => setActiveTab(tab.name)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              "hover:text-foreground",
              activeTab === tab.name
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      {sorted.map((tab) => (
        <div
          key={tab.name}
          className={cn("py-4", activeTab !== tab.name && "hidden")}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {renderFields(tab.fields)}
          </div>
          {renderGrids(tab.grids)}
        </div>
      ))}
    </div>
  );
}
