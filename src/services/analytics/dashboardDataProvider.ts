/**
 * Dashboard data provider abstraction.
 * Both OData and MCP analytics implement this interface.
 */

import type { KpiData, ChartDataPoint } from "./dashboardService";

// ---- NL Query result types ----

export interface NLQueryColumn {
  key: string;
  label: string;
  type: "string" | "number" | "date";
}

export interface NLQueryResult {
  title: string;
  chartType: "bar" | "pie" | "line" | "table" | "kpi";
  columns: NLQueryColumn[];
  rows: Record<string, unknown>[];
  xKey?: string;
  yKey?: string;
  error?: string;
}

// ---- Provider interface ----

export interface DashboardDataProvider {
  readonly type: "odata" | "mcp";

  isAvailable(): boolean;

  fetchKpis(company: string): Promise<KpiData[]>;
  fetchRecentSalesOrders(company: string, top?: number): Promise<Record<string, unknown>[]>;
  fetchTopCustomersByOrders(company: string, top?: number): Promise<ChartDataPoint[]>;
  fetchSalesOrderStatusBreakdown(company: string): Promise<ChartDataPoint[]>;
  fetchPurchaseOrderStatusBreakdown(company: string): Promise<ChartDataPoint[]>;
  fetchTopProductsByInventory(company: string, top?: number): Promise<ChartDataPoint[]>;
}
