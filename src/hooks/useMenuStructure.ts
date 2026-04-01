/**
 * Hook: load and manage the menu structure.
 * Reads from cache first, falls back to curated taxonomy.
 */

import { useCallback, useEffect, useState } from "react";
import type { MenuModule, MenuItem } from "@/types";
import { MODULE_TAXONOMY } from "@/data/moduleTaxonomy";

interface UseMenuStructureReturn {
  modules: MenuModule[];
  isLoading: boolean;
  error: string | null;
  search: (query: string) => MenuItem[];
  trackAccess: (menuItemName: string) => void;
}

export function useMenuStructure(): UseMenuStructureReturn {
  const [modules, setModules] = useState<MenuModule[]>(MODULE_TAXONOMY);
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);

  // Load from persisted state on mount (merge with taxonomy)
  useEffect(() => {
    const loadCached = async () => {
      try {
        const stored = localStorage.getItem("d365-menu-access");
        if (!stored) return;
        const accessData = JSON.parse(stored) as Record<string, { count: number; lastAccessed: string }>;

        setModules((prev) =>
          prev.map((mod) => ({
            ...mod,
            items: mod.items.map((item) => {
              const access = accessData[item.menuItemName];
              return access
                ? { ...item, accessCount: access.count, lastAccessed: access.lastAccessed }
                : item;
            }),
          }))
        );
      } catch {
        // Ignore corrupt localStorage
      }
    };
    void loadCached();
  }, []);

  const search = useCallback(
    (query: string): MenuItem[] => {
      if (!query.trim()) return [];
      const lower = query.toLowerCase();
      return modules.flatMap((mod) =>
        mod.items.filter(
          (item) =>
            item.label.toLowerCase().includes(lower) ||
            item.menuItemName.toLowerCase().includes(lower) ||
            (item.description ?? "").toLowerCase().includes(lower)
        )
      );
    },
    [modules]
  );

  const trackAccess = useCallback((menuItemName: string) => {
    const stored = localStorage.getItem("d365-menu-access");
    const accessData: Record<string, { count: number; lastAccessed: string }> = stored
      ? JSON.parse(stored)
      : {};

    const existing = accessData[menuItemName];
    accessData[menuItemName] = {
      count: (existing?.count ?? 0) + 1,
      lastAccessed: new Date().toISOString(),
    };
    localStorage.setItem("d365-menu-access", JSON.stringify(accessData));

    // Update in-memory state
    setModules((prev) =>
      prev.map((mod) => ({
        ...mod,
        items: mod.items.map((item) =>
          item.menuItemName === menuItemName
            ? {
                ...item,
                accessCount: accessData[menuItemName]!.count,
                lastAccessed: accessData[menuItemName]!.lastAccessed,
              }
            : item
        ),
      }))
    );
  }, []);

  return { modules, isLoading, error, search, trackAccess };
}
