/**
 * MenuPanel — Shows menu items for the selected module.
 * SRP: renders menu items list with cached indicators.
 */

import { Badge } from "@/components/ui/badge";
import type { MenuItem } from "@/types";
import { FileText, Zap } from "lucide-react";

interface MenuPanelProps {
  moduleLabel: string;
  items: MenuItem[];
  onItemSelect: (item: MenuItem) => void;
}

export function MenuPanel({ moduleLabel, items, onItemSelect }: MenuPanelProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
        <FileText className="mb-2 h-8 w-8" />
        <p>No items in this module</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="border-b px-4 py-3">
        <h2 className="text-lg font-semibold">{moduleLabel}</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {items.map((item) => (
          <button
            key={item.menuItemName}
            onClick={() => onItemSelect(item)}
            className="flex w-full items-center gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors hover:bg-accent"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{item.label}</span>
                {item.formCached && (
                  <Badge variant="secondary" className="text-xs">
                    <Zap className="mr-1 h-3 w-3" />
                    Cached
                  </Badge>
                )}
              </div>
              {item.description && (
                <p className="mt-0.5 text-xs text-muted-foreground truncate">{item.description}</p>
              )}
            </div>
            {item.accessCount > 0 && (
              <span className="text-xs text-muted-foreground">{item.accessCount}x</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
