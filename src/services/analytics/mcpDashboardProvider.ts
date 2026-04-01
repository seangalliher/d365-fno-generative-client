/**
 * MCP-backed implementation of the DashboardDataProvider.
 * Routes dashboard data queries through the MCP bridge to the D365 ERP MCP server.
 * Mirrors the same query patterns as ODataDashboardProvider but uses MCP data tools.
 */

import type { McpBridgeClient } from "@/services/mcp/mcpBridgeClient";
import type { DashboardDataProvider } from "./dashboardDataProvider";
import type { KpiData, ChartDataPoint } from "./dashboardService";

export class McpDashboardProvider implements DashboardDataProvider {
  readonly type = "mcp" as const;

  private _reachable = false;

  constructor(private readonly mcp: McpBridgeClient) {}

  /** Set reachability (called during bootstrap probe). */
  setReachable(v: boolean): void {
    this._reachable = v;
  }

  isAvailable(): boolean {
    return this._reachable;
  }

  // ---- Private helpers ----

  /** Query entities via the MCP data_find_entities tool. */
  private async queryEntities<T = Record<string, unknown>>(
    odataPath: string,
    odataQueryOptions: string,
  ): Promise<T[]> {
    try {
      const result = await this.mcp.callTool("data_find_entities", {
        odataPath,
        odataQueryOptions,
      });
      const parsed = this.mcp.extractJson<{ value?: T[] }>(result);
      return parsed.value ?? [];
    } catch (err) {
      console.error(`[mcp-provider] queryEntities(${odataPath}) failed:`, err);
      return [];
    }
  }

  /** Count entities using $top=0&$count=true. */
  private async countEntity(entitySet: string, company: string): Promise<number> {
    try {
      const result = await this.mcp.callTool("data_find_entities", {
        odataPath: entitySet,
        odataQueryOptions: `cross-company=true&$filter=dataAreaId eq '${company}'&$top=0&$count=true`,
      });
      const parsed = this.mcp.extractJson<Record<string, unknown>>(result);
      return (parsed["@odata.count"] as number) ?? 0;
    } catch {
      return 0;
    }
  }

  // ---- DashboardDataProvider ----

  async fetchKpis(company: string): Promise<KpiData[]> {
    const [customers, salesOrders, purchaseOrders, products] = await Promise.all([
      this.countEntity("CustomersV3", company),
      this.countEntity("SalesOrderHeadersV2", company),
      this.countEntity("PurchaseOrderHeadersV2", company),
      this.countEntity("ReleasedProductsV2", company),
    ]);

    return [
      { label: "Customers", value: customers, entitySet: "CustomersV3" },
      { label: "Sales Orders", value: salesOrders, entitySet: "SalesOrderHeadersV2" },
      { label: "Purchase Orders", value: purchaseOrders, entitySet: "PurchaseOrderHeadersV2" },
      { label: "Products", value: products, entitySet: "ReleasedProductsV2" },
    ];
  }

  async fetchRecentSalesOrders(company: string, top = 10): Promise<Record<string, unknown>[]> {
    return this.queryEntities(
      "SalesOrderHeadersV2",
      `cross-company=true&$filter=dataAreaId eq '${company}'&$select=SalesOrderNumber,OrderingCustomerAccountNumber,SalesOrderStatus,RequestedShippingDate&$orderby=SalesOrderNumber desc&$top=${top}`,
    );
  }

  async fetchTopCustomersByOrders(company: string, top = 8): Promise<ChartDataPoint[]> {
    const orders = await this.queryEntities<{ OrderingCustomerAccountNumber: string }>(
      "SalesOrderHeadersV2",
      `cross-company=true&$filter=dataAreaId eq '${company}'&$select=OrderingCustomerAccountNumber&$orderby=SalesOrderNumber desc&$top=200`,
    );

    const counts = new Map<string, number>();
    for (const o of orders) {
      const cust = o.OrderingCustomerAccountNumber ?? "Unknown";
      counts.set(cust, (counts.get(cust) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, top)
      .map(([name, value]) => ({ name, value }));
  }

  async fetchSalesOrderStatusBreakdown(company: string): Promise<ChartDataPoint[]> {
    const orders = await this.queryEntities<{ SalesOrderStatus: string }>(
      "SalesOrderHeadersV2",
      `cross-company=true&$filter=dataAreaId eq '${company}'&$select=SalesOrderStatus&$orderby=SalesOrderNumber desc&$top=500`,
    );

    const counts = new Map<string, number>();
    for (const o of orders) {
      const status = o.SalesOrderStatus ?? "Unknown";
      counts.set(status, (counts.get(status) ?? 0) + 1);
    }

    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  }

  async fetchPurchaseOrderStatusBreakdown(company: string): Promise<ChartDataPoint[]> {
    const orders = await this.queryEntities<{ PurchaseOrderStatus: string }>(
      "PurchaseOrderHeadersV2",
      `cross-company=true&$filter=dataAreaId eq '${company}'&$select=PurchaseOrderStatus&$orderby=PurchaseOrderNumber desc&$top=500`,
    );

    const counts = new Map<string, number>();
    for (const o of orders) {
      const status = o.PurchaseOrderStatus ?? "Unknown";
      counts.set(status, (counts.get(status) ?? 0) + 1);
    }

    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  }

  async fetchTopProductsByInventory(company: string, top = 8): Promise<ChartDataPoint[]> {
    const items = await this.queryEntities<{
      ItemNumber: string;
      ProductName: string;
      TotalAvailableQuantity: number;
    }>(
      "InventorySitesOnHandV2",
      `cross-company=true&$filter=dataAreaId eq '${company}' and TotalAvailableQuantity gt 0 and TotalAvailableQuantity lt 1000000&$select=ItemNumber,ProductName,TotalAvailableQuantity&$orderby=TotalAvailableQuantity desc&$top=${top}`,
    );

    return items.map((i) => ({
      name: i.ProductName || i.ItemNumber || "Unknown",
      value: Number(i.TotalAvailableQuantity) || 0,
    }));
  }
}
