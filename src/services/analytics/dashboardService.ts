/**
 * Dashboard analytics service — routes data fetching through pluggable providers.
 * Supports switching between OData (direct) and MCP Analytics data sources.
 */

import type { ODataService } from "@/services/d365/odataService";
import type { DashboardDataProvider } from "./dashboardDataProvider";
import { ODataDashboardProvider } from "./odataDashboardProvider";
import { McpDashboardProvider } from "./mcpDashboardProvider";

// ---- Types ----

export interface KpiData {
  label: string;
  value: number | string;
  change?: number;
  entitySet: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface DashboardData {
  kpis: KpiData[];
  ordersByStatus: ChartDataPoint[];
  topCustomers: ChartDataPoint[];
  topProducts: ChartDataPoint[];
  recentOrders: Record<string, unknown>[];
  purchaseOverview: ChartDataPoint[];
}

// ---- Provider registry ----

let _odataProvider: ODataDashboardProvider | null = null;
let _mcpProvider: McpDashboardProvider | null = null;
let _activeType: "odata" | "mcp" = "odata";

function getActiveProvider(): DashboardDataProvider | null {
  if (_activeType === "mcp" && _mcpProvider?.isAvailable()) return _mcpProvider;
  return _odataProvider;
}

// ---- Public setup API ----

/** Backward-compatible: called from bootstrap.ts */
export function setDashboardOData(odata: ODataService | null): void {
  _odataProvider = odata ? new ODataDashboardProvider(odata) : null;
}

export function setDashboardMcpProvider(provider: McpDashboardProvider | null): void {
  _mcpProvider = provider;
}

export function setActiveDashboardSource(type: "odata" | "mcp"): void {
  _activeType = type;
}

export function getActiveDashboardSource(): "odata" | "mcp" {
  return _activeType;
}

export function getAvailableSources(): ("odata" | "mcp")[] {
  const sources: ("odata" | "mcp")[] = [];
  if (_odataProvider) sources.push("odata");
  if (_mcpProvider?.isAvailable()) sources.push("mcp");
  return sources;
}

export function isDashboardLive(): boolean {
  return getActiveProvider() !== null;
}

/** Expose the raw OData service for NL query execution */
export function getODataProvider(): ODataDashboardProvider | null {
  return _odataProvider;
}

// ---- Delegating public API ----

export async function fetchKpis(company: string): Promise<KpiData[]> {
  const provider = getActiveProvider();
  return provider ? provider.fetchKpis(company) : [];
}

export async function fetchRecentSalesOrders(
  company: string,
  top = 10,
): Promise<Record<string, unknown>[]> {
  const provider = getActiveProvider();
  return provider ? provider.fetchRecentSalesOrders(company, top) : [];
}

export async function fetchTopCustomersByOrders(
  company: string,
  top = 8,
): Promise<ChartDataPoint[]> {
  const provider = getActiveProvider();
  return provider ? provider.fetchTopCustomersByOrders(company, top) : [];
}

export async function fetchSalesOrderStatusBreakdown(
  company: string,
): Promise<ChartDataPoint[]> {
  const provider = getActiveProvider();
  return provider ? provider.fetchSalesOrderStatusBreakdown(company) : [];
}

export async function fetchPurchaseOrderStatusBreakdown(
  company: string,
): Promise<ChartDataPoint[]> {
  const provider = getActiveProvider();
  return provider ? provider.fetchPurchaseOrderStatusBreakdown(company) : [];
}

export async function fetchTopProductsByInventory(
  company: string,
  top = 8,
): Promise<ChartDataPoint[]> {
  const provider = getActiveProvider();
  return provider ? provider.fetchTopProductsByInventory(company, top) : [];
}
