/**
 * MCP Analytics stub provider.
 * Returns empty data until a real MCP bridge is configured.
 */

import type { DashboardDataProvider } from "./dashboardDataProvider";
import type { KpiData, ChartDataPoint } from "./dashboardService";

export class McpDashboardProvider implements DashboardDataProvider {
  readonly type = "mcp" as const;

  private _available = false;

  setAvailable(v: boolean): void {
    this._available = v;
  }

  isAvailable(): boolean {
    return this._available;
  }

  async fetchKpis(_company: string): Promise<KpiData[]> {
    return [
      { label: "Customers", value: "—", entitySet: "CustomersV3" },
      { label: "Sales Orders", value: "—", entitySet: "SalesOrderHeadersV2" },
      { label: "Purchase Orders", value: "—", entitySet: "PurchaseOrderHeadersV2" },
      { label: "Products", value: "—", entitySet: "ReleasedProductsV2" },
    ];
  }

  async fetchRecentSalesOrders(): Promise<Record<string, unknown>[]> {
    return [];
  }

  async fetchTopCustomersByOrders(): Promise<ChartDataPoint[]> {
    return [];
  }

  async fetchSalesOrderStatusBreakdown(): Promise<ChartDataPoint[]> {
    return [];
  }

  async fetchPurchaseOrderStatusBreakdown(): Promise<ChartDataPoint[]> {
    return [];
  }

  async fetchTopProductsByInventory(): Promise<ChartDataPoint[]> {
    return [];
  }
}
