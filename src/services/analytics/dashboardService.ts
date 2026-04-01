/**
 * Dashboard analytics service — fetches KPI and chart data via OData.
 * Uses $count and $filter queries against D365 entity sets through the Vite proxy.
 */

import type { ODataService } from "@/services/d365/odataService";

// ---- Types ----

export interface KpiData {
  label: string;
  value: number | string;
  change?: number; // percentage change indicator
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

// ---- Module-level singleton ----

let _odataService: ODataService | null = null;

export function setDashboardOData(odata: ODataService | null): void {
  _odataService = odata;
}

export function isDashboardLive(): boolean {
  return _odataService !== null;
}

// ---- Query helpers ----

async function countEntity(entitySet: string, company: string): Promise<number> {
  if (!_odataService) return 0;
  try {
    const result = await _odataService.query(entitySet, {
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

async function queryTopN<T = Record<string, unknown>>(
  entitySet: string,
  company: string,
  select: string,
  orderby: string,
  top: number,
  extraFilter?: string,
): Promise<T[]> {
  if (!_odataService) return [];
  try {
    let filter = `dataAreaId eq '${company}'`;
    if (extraFilter) filter += ` and ${extraFilter}`;
    const result = await _odataService.query<T>(entitySet, {
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

// ---- Public API ----

export async function fetchKpis(company: string): Promise<KpiData[]> {
  const [customers, salesOrders, purchaseOrders, products] = await Promise.all([
    countEntity("CustomersV3", company),
    countEntity("SalesOrderHeadersV2", company),
    countEntity("PurchaseOrderHeadersV2", company),
    countEntity("ReleasedProductsV2", company),
  ]);

  return [
    { label: "Customers", value: customers, entitySet: "CustomersV3" },
    { label: "Sales Orders", value: salesOrders, entitySet: "SalesOrderHeadersV2" },
    { label: "Purchase Orders", value: purchaseOrders, entitySet: "PurchaseOrderHeadersV2" },
    { label: "Products", value: products, entitySet: "ReleasedProductsV2" },
  ];
}

export async function fetchRecentSalesOrders(
  company: string,
  top = 10,
): Promise<Record<string, unknown>[]> {
  return queryTopN(
    "SalesOrderHeadersV2",
    company,
    "SalesOrderNumber,OrderingCustomerAccountNumber,SalesOrderStatus,RequestedShippingDate",
    "SalesOrderNumber desc",
    top,
  );
}

export async function fetchTopCustomersByOrders(
  company: string,
  top = 8,
): Promise<ChartDataPoint[]> {
  // Fetch recent sales orders and aggregate by customer
  const orders = await queryTopN<{ OrderingCustomerAccountNumber: string }>(
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

export async function fetchSalesOrderStatusBreakdown(
  company: string,
): Promise<ChartDataPoint[]> {
  const orders = await queryTopN<{ SalesOrderStatus: string }>(
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

export async function fetchPurchaseOrderStatusBreakdown(
  company: string,
): Promise<ChartDataPoint[]> {
  const orders = await queryTopN<{ PurchaseOrderStatus: string }>(
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

export async function fetchTopProductsByInventory(
  company: string,
  top = 8,
): Promise<ChartDataPoint[]> {
  // InventorySitesOnHandV2 is the correct entity (not InventOnhandEntities)
  return queryTopN<{ ItemNumber: string; ProductName: string; TotalAvailableQuantity: number }>(
    "InventorySitesOnHandV2",
    company,
    "ItemNumber,ProductName,TotalAvailableQuantity",
    "TotalAvailableQuantity desc",
    top,
    "TotalAvailableQuantity gt 0 and TotalAvailableQuantity lt 1000000",
  ).then((items) =>
    items.map((i) => ({
      name: i.ProductName || i.ItemNumber || "Unknown",
      value: Number(i.TotalAvailableQuantity) || 0,
    })),
  );
}
