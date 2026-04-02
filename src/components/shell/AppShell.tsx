/**
 * AppShell — Root layout with module nav, header, and content area.
 * On mobile (<640px): sidebar + menu panel become an off-canvas drawer.
 */

import { useCallback, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAppState } from "@/store/appState";
import { useMenuStructure } from "@/hooks/useMenuStructure";
import { useNavigationHistory } from "@/store/navigationHistory";
import { useIsMobile } from "@/hooks/useIsMobile";
import { ModuleNav } from "./ModuleNav";
import { ICON_MAP } from "./ModuleNav";
import { MenuPanel } from "./MenuPanel";
import { CompanySelector } from "./CompanySelector";
import { GlobalSearch } from "./GlobalSearch";
import { Breadcrumb, type BreadcrumbItem } from "./Breadcrumb";
import { ThemeToggle } from "./ThemeToggle";
import { NavigationButtons } from "./NavigationButtons";
import { CommandPalette } from "./CommandPalette";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { findModule } from "@/data/moduleTaxonomy";
import type { MenuItem } from "@/types";
import { PanelLeftClose, PanelLeft, Menu, X, Settings, ChevronLeft, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppShell() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { modules, search, trackAccess } = useMenuStructure();
  const {
    currentModuleId, setModule, setMenuItem,
    sidebarCollapsed, toggleSidebar,
    mobileMenuOpen, setMobileMenuOpen,
  } = useAppState();
  const pushNav = useNavigationHistory((s) => s.push);
  const navBack = useNavigationHistory((s) => s.back);
  const navForward = useNavigationHistory((s) => s.forward);
  const navHistory = useNavigationHistory((s) => s.history);
  const navIndex = useNavigationHistory((s) => s.currentIndex);

  const activeModule = currentModuleId ? findModule(currentModuleId) : null;

  // Auto-collapse sidebar on narrow viewports (desktop only)
  useEffect(() => {
    if (isMobile) return;
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches && !sidebarCollapsed) toggleSidebar();
    };
    if (mq.matches && !sidebarCollapsed) toggleSidebar();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- run once on mount

  // Close mobile drawer on route change
  useEffect(() => {
    if (isMobile) setMobileMenuOpen(false);
  }, [currentModuleId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleModuleSelect = useCallback(
    (moduleId: string) => {
      setModule(moduleId);
      navigate(`/module/${moduleId}`);
      if (isMobile) setMobileMenuOpen(false);
    },
    [setModule, navigate, isMobile, setMobileMenuOpen]
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
      if (isMobile) setMobileMenuOpen(false);
    },
    [setMenuItem, trackAccess, pushNav, navigate, isMobile, setMobileMenuOpen]
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

  // ---------- Mobile drawer ----------
  const mobileDrawerModuleId = mobileMenuOpen ? currentModuleId : null;
  const drawerModule = mobileDrawerModuleId ? findModule(mobileDrawerModuleId) : null;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Module Navigation Sidebar — hidden on mobile */}
      {!isMobile && (
        <ModuleNav modules={modules} onModuleSelect={handleModuleSelect} />
      )}

      {/* Main Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-14 items-center justify-between border-b px-2 sm:px-4">
          <div className="flex items-center gap-1.5 sm:gap-3">
            {isMobile ? (
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Toggle sidebar">
                {sidebarCollapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
              </Button>
            )}
            {!isMobile && (
              <NavigationButtons
                canGoBack={navIndex > 0}
                canGoForward={navIndex < navHistory.length - 1}
                onBack={handleBack}
                onForward={handleForward}
              />
            )}
            <Breadcrumb items={breadcrumbs} />
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <CommandPalette onSearch={search} onSelect={handleMenuItemSelect} />
            <div className="hidden md:block">
              <GlobalSearch onSearch={search} onSelect={handleMenuItemSelect} />
            </div>
            {!isMobile && <CompanySelector />}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/data-model")}
              title="Data Model Explorer"
              aria-label="Data Model Explorer"
              className="h-8 w-8"
            >
              <Network className="h-4 w-4" />
            </Button>
            <ThemeToggle />
          </div>
        </header>

        {/* Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Menu Panel (visible when module selected, hidden on mobile) */}
          {!isMobile && activeModule && (
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

      {/* ---- Mobile Drawer Overlay ---- */}
      {isMobile && mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer panel */}
          <div className="relative z-10 flex h-full w-72 max-w-[85vw] flex-col bg-background shadow-xl">
            {/* Drawer header */}
            <div className="flex h-14 items-center justify-between border-b px-4">
              {drawerModule ? (
                <button
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setModule(null)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Modules
                </button>
              ) : (
                <span className="text-sm font-semibold">Navigation</span>
              )}
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto">
              {drawerModule ? (
                /* Show menu items for selected module */
                <MenuPanel
                  moduleLabel={drawerModule.label}
                  items={drawerModule.items}
                  onItemSelect={handleMenuItemSelect}
                />
              ) : (
                /* Module list */
                <div className="py-2">
                  {modules.map((mod) => {
                    const Icon = ICON_MAP[mod.icon] ?? Settings;
                    return (
                      <button
                        key={mod.id}
                        onClick={() => handleModuleSelect(mod.id)}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-accent",
                          currentModuleId === mod.id && "bg-accent font-medium"
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className="truncate">{mod.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Company selector at bottom of drawer */}
            <div className="border-t px-4 py-3">
              <CompanySelector />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
