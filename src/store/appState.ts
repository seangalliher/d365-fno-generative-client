/**
 * Global application state — managed with Zustand.
 * Single Responsibility: app-wide context (company, module, user).
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MenuItem } from "@/types";

interface AppState {
  // Company context
  currentCompany: string;
  availableCompanies: string[];
  setCompany: (company: string) => void;
  setAvailableCompanies: (companies: string[]) => void;

  // Navigation context
  currentModuleId: string | null;
  currentMenuItem: MenuItem | null;
  setModule: (moduleId: string | null) => void;
  setMenuItem: (item: MenuItem | null) => void;

  // Dashboard data source
  dashboardDataSource: "odata" | "mcp";
  setDashboardDataSource: (source: "odata" | "mcp") => void;

  // UI state
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
}

export const useAppState = create<AppState>()(
  persist(
    (set) => ({
      currentCompany: "USMF",
      availableCompanies: [],
      setCompany: (company) => set({ currentCompany: company }),
      setAvailableCompanies: (companies) => set({ availableCompanies: companies }),

      currentModuleId: null,
      currentMenuItem: null,
      setModule: (moduleId) => set({ currentModuleId: moduleId, currentMenuItem: null }),
      setMenuItem: (item) => set({ currentMenuItem: item }),

      dashboardDataSource: "odata",
      setDashboardDataSource: (source) => set({ dashboardDataSource: source }),

      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      theme: "light",
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "d365-app-state",
      partialize: (state) => ({
        currentCompany: state.currentCompany,
        dashboardDataSource: state.dashboardDataSource,
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
);
