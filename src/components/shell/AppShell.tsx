/**
 * AppShell — Root layout with module nav, header, and content area.
 * Law of Demeter: delegates to child components, doesn't reach into their internals.
 */

import { useCallback, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAppState } from "@/store/appState";
import { useMenuStructure } from "@/hooks/useMenuStructure";
import { useNavigationHistory } from "@/store/navigationHistory";
import { ModuleNav } from "./ModuleNav";
import { MenuPanel } from "./MenuPanel";
import { CompanySelector } from "./CompanySelector";
import { GlobalSearch } from "./GlobalSearch";
import { Breadcrumb, type BreadcrumbItem } from "./Breadcrumb";
import { NavigationButtons } from "./NavigationButtons";
import { CommandPalette } from "./CommandPalette";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { findModule } from "@/data/moduleTaxonomy";
import type { MenuItem } from "@/types";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppShell() {
  const navigate = useNavigate();
  const { modules, search, trackAccess } = useMenuStructure();
  const { currentModuleId, setModule, setMenuItem, sidebarCollapsed, toggleSidebar } = useAppState();
  const pushNav = useNavigationHistory((s) => s.push);
  const navBack = useNavigationHistory((s) => s.back);
  const navForward = useNavigationHistory((s) => s.forward);
  const navHistory = useNavigationHistory((s) => s.history);
  const navIndex = useNavigationHistory((s) => s.currentIndex);

  const activeModule = currentModuleId ? findModule(currentModuleId) : null;

  // Auto-collapse sidebar on narrow viewports
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches && !sidebarCollapsed) toggleSidebar();
    };
    if (mq.matches && !sidebarCollapsed) toggleSidebar();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- run once on mount

  const handleModuleSelect = useCallback(
    (moduleId: string) => {
      setModule(moduleId);
      navigate(`/module/${moduleId}`);
    },
    [setModule, navigate]
  );

  const handleMenuItemSelect = useCallback(
    (item: MenuItem) => {
      setMenuItem(item);
      trackAccess(item.menuItemName);
      pushNav({
        path: `/form/${item.menuItemName}`,
        label: item.label,
        menuItemName: item.menuItemName,
        timestamp: new Date().toISOString(),
      });
      navigate(`/form/${item.menuItemName}`);
    },
    [setMenuItem, trackAccess, pushNav, navigate]
  );

  const handleBack = useCallback(() => {
    const entry = navBack();
    if (entry) navigate(entry.path);
  }, [navBack, navigate]);

  const handleForward = useCallback(() => {
    const entry = navForward();
    if (entry) navigate(entry.path);
  }, [navForward, navigate]);

  const breadcrumbs: BreadcrumbItem[] = [];
  if (activeModule) {
    breadcrumbs.push({ label: activeModule.label, path: `/module/${activeModule.id}` });
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Module Navigation Sidebar */}
      <ModuleNav modules={modules} onModuleSelect={handleModuleSelect} />

      {/* Main Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-14 items-center justify-between border-b px-2 sm:px-4">
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Toggle sidebar">
              {sidebarCollapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </Button>
            <NavigationButtons
              canGoBack={navIndex > 0}
              canGoForward={navIndex < navHistory.length - 1}
              onBack={handleBack}
              onForward={handleForward}
            />
            <Breadcrumb items={breadcrumbs} />
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <CommandPalette onSearch={search} onSelect={handleMenuItemSelect} />
            <div className="hidden md:block">
              <GlobalSearch onSearch={search} onSelect={handleMenuItemSelect} />
            </div>
            <CompanySelector />
          </div>
        </header>

        {/* Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Menu Panel (visible when module selected, hidden on small screens) */}
          {activeModule && (
            <div className="hidden sm:block w-56 lg:w-72 border-r overflow-y-auto shrink-0">
              <MenuPanel
                moduleLabel={activeModule.label}
                items={activeModule.items}
                onItemSelect={handleMenuItemSelect}
              />
            </div>
          )}

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-6">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </div>
  );
}
