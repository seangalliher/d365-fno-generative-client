/**
 * Data source toggle for the dashboard — switch between OData and Analytics MCP.
 */

import { Database, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/store/appState";
import {
  getAvailableSources,
  setActiveDashboardSource,
} from "@/services/analytics/dashboardService";

export function DataSourceToggle() {
  const dataSource = useAppState((s) => s.dashboardDataSource);
  const setDataSource = useAppState((s) => s.setDashboardDataSource);
  const available = getAvailableSources();

  if (available.length < 2) return null;

  const handleSwitch = (source: "odata" | "mcp") => {
    setActiveDashboardSource(source);
    setDataSource(source);
  };

  return (
    <div className="inline-flex rounded-lg border p-0.5 gap-0.5">
      <Button
        size="sm"
        variant={dataSource === "odata" ? "default" : "ghost"}
        className="h-7 gap-1.5 text-xs"
        onClick={() => handleSwitch("odata")}
      >
        <Database className="h-3.5 w-3.5" />
        OData
      </Button>
      <Button
        size="sm"
        variant={dataSource === "mcp" ? "default" : "ghost"}
        className="h-7 gap-1.5 text-xs"
        onClick={() => handleSwitch("mcp")}
      >
        <Sparkles className="h-3.5 w-3.5" />
        Analytics MCP
      </Button>
    </div>
  );
}
