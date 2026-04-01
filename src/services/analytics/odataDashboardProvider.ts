/**
 * OData implementation of the DashboardDataProvider.
 * Wraps the low-level OData query helpers for use through the provider abstraction.
 */

import type { ODataService } from "@/services/d365/odataService";
import type { DashboardDataProvider } from "./dashboardDataProvider";
import type { KpiData, ChartDataPoint } from "./dashboardService";

export class ODataDashboardProvider implements DashboardDataProvider {
  readonly type = "odata" as const;

  constructor(private readonly odata: ODataService) {}

  isAvailable(): boolean {
    return true;
  }

  // ---- Private helpers ----

  private async countEntity(entitySet: string, company: string): Promise<number> {
    try {
      const result = await this.odata.query(entitySet, {
        filter: `dataAreaId eq '${company}'`,
        top: 0,
        count: true,
        crossCompany: true,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (result as any)["@odata.count"] ?? result.value.length;
    } catch {
      return 0;
    }
  }

  private async queryTopN<T = Record<string, unknown>>(
    entitySet: string,
    company: string,
    select: string,
    orderby: string,
    top: number,
    extraFilter?: string,
  ): Promise<T[]> {
    try {
      let filter = `dataAreaId eq '${company}'`;
      if (extraFilter) filter += ` and ${extraFilter}`;
      const result = await this.odata.query<T>(entitySet, {
        filter,
        select,
        orderby,
        top,
        crossCompany: true,
      });
      return result.value;
    } catch {
      return [];
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
    return this.queryTopN(
      "SalesOrderHeadersV2",
      company,
      "SalesOrderNumber,OrderingCustomerAccountNumber,SalesOrderStatus,RequestedShippingDate",
      "SalesOrderNumber desc",
      top,
    );
  }

  async fetchTopCustomersByOrders(company: string, top = 8): Promise<ChartDataPoint[]> {
    const orders = await this.queryTopN<{ OrderingCustomerAccountNumber: string }>(
      "SalesOrderHeadersV2",
      company,
      "OrderingCustomerAccountNumber",
      "SalesOrderNumber desc",
      200,
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
    const orders = await this.queryTopN<{ SalesOrderStatus: string }>(
      "SalesOrderHeadersV2",
      company,
      "SalesOrderStatus",
      "SalesOrderNumber desc",
      500,
    );

    const counts = new Map<string, number>();
    for (const o of orders) {
      const status = o.SalesOrderStatus ?? "Unknown";
      counts.set(status, (counts.get(status) ?? 0) + 1);
    }

    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  }

  async fetchPurchaseOrderStatusBreakdown(company: string): Promise<ChartDataPoint[]> {
    const orders = await this.queryTopN<{ PurchaseOrderStatus: string }>(
      "PurchaseOrderHeadersV2",
      company,
      "PurchaseOrderStatus",
      "PurchaseOrderNumber desc",
      500,
    );

    const counts = new Map<string, number>();
    for (const o of orders) {
      const status = o.PurchaseOrderStatus ?? "Unknown";
      counts.set(status, (counts.get(status) ?? 0) + 1);
    }

    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  }

  async fetchTopProductsByInventory(company: string, top = 8): Promise<ChartDataPoint[]> {
    const items = await this.queryTopN<{
      ItemNumber: string;
      ProductName: string;
      TotalAvailableQuantity: number;
    }>(
      "InventorySitesOnHandV2",
      company,
      "ItemNumber,ProductName,TotalAvailableQuantity",
      "TotalAvailableQuantity desc",
      top,
      "TotalAvailableQuantity gt 0 and TotalAvailableQuantity lt 1000000",
    );

    return items.map((i) => ({
      name: i.ProductName || i.ItemNumber || "Unknown",
      value: Number(i.TotalAvailableQuantity) || 0,
    }));
  }
}
