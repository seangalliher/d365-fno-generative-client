/**
 * ModuleNav — Left sidebar navigation showing D365 modules.
 * SRP: only renders module list and handles selection.
 */

import { cn } from "@/lib/utils";
import { useAppState } from "@/store/appState";
import type { MenuModule } from "@/types";
import {
  BookOpen, Users, Building2, ShoppingCart, Warehouse,
  Factory, UserCircle, Settings, Package,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  "book-open": BookOpen,
  users: Users,
  "building-2": Building2,
  "shopping-cart": ShoppingCart,
  warehouse: Warehouse,
  factory: Factory,
  "user-circle": UserCircle,
  settings: Settings,
};

interface ModuleNavProps {
  modules: MenuModule[];
  onModuleSelect: (moduleId: string) => void;
}

export function ModuleNav({ modules, onModuleSelect }: ModuleNavProps) {
  const currentModuleId = useAppState((s) => s.currentModuleId);
  const collapsed = useAppState((s) => s.sidebarCollapsed);

  return (
    <nav
      className={cn(
        "flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
      aria-label="Module navigation"
    >
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Package className="h-6 w-6 shrink-0 text-primary" />
        {!collapsed && <span className="text-lg font-semibold">D365</span>}
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {modules.map((mod) => {
          const Icon = ICON_MAP[mod.icon] ?? Settings;
          const isActive = currentModuleId === mod.id;

          return (
            <button
              key={mod.id}
              onClick={() => onModuleSelect(mod.id)}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-sidebar-accent",
                isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              )}
              title={collapsed ? mod.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{mod.label}</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
