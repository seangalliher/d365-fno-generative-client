/**
 * Dashboard — Landing page with KPI tiles, charts, and module navigation.
 */

import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useNavigationHistory } from "@/store/navigationHistory";
import { useMenuStructure } from "@/hooks/useMenuStructure";
import { useAppState } from "@/store/appState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { DataSourceToggle } from "@/components/dashboard/DataSourceToggle";
import { NLDashboardSection } from "@/components/dashboard/NLDashboardSection";
import { MODULE_TAXONOMY, getAllMenuItems } from "@/data/moduleTaxonomy";
import {
  fetchKpis,
  fetchSalesOrderStatusBreakdown,
  fetchPurchaseOrderStatusBreakdown,
  fetchTopCustomersByOrders,
  fetchTopProductsByInventory,
  fetchRecentSalesOrders,
  isDashboardLive,
} from "@/services/analytics/dashboardService";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Clock,
  TrendingUp,
  Layers,
  Users,
  ShoppingCart,
  Package,
  Building2,
  BarChart3,
} from "lucide-react";

const CHART_COLORS = ["#2563eb", "#7c3aed", "#db2777", "#ea580c", "#16a34a", "#0891b2", "#4f46e5", "#c026d3"];

export function DashboardPage() {
  const navigate = useNavigate();
  const company = useAppState((s) => s.currentCompany);
  const dataSource = useAppState((s) => s.dashboardDataSource);
  const recentItemsFn = useNavigationHistory((s) => s.recentItems);
  const recentItems = recentItemsFn(8);
  const { modules } = useMenuStructure();
  const isLive = isDashboardLive();

  // --- Data queries (only run when connected to live D365) ---
  const kpiQuery = useQuery({
    queryKey: ["dashboard-kpis", company, dataSource],
    queryFn: () => fetchKpis(company),
    enabled: isLive,
  });

  const salesStatusQuery = useQuery({
    queryKey: ["dashboard-sales-status", company, dataSource],
    queryFn: () => fetchSalesOrderStatusBreakdown(company),
    enabled: isLive,
  });

  const poStatusQuery = useQuery({
    queryKey: ["dashboard-po-status", company, dataSource],
    queryFn: () => fetchPurchaseOrderStatusBreakdown(company),
    enabled: isLive,
  });

  const topCustomersQuery = useQuery({
    queryKey: ["dashboard-top-customers", company, dataSource],
    queryFn: () => fetchTopCustomersByOrders(company),
    enabled: isLive,
  });

  const topInventoryQuery = useQuery({
    queryKey: ["dashboard-top-inventory", company, dataSource],
    queryFn: () => fetchTopProductsByInventory(company),
    enabled: isLive,
  });

  const recentOrdersQuery = useQuery({
    queryKey: ["dashboard-recent-orders", company, dataSource],
    queryFn: () => fetchRecentSalesOrders(company),
    enabled: isLive,
  });

  // Top accessed items across all modules
  const popularItems = getAllMenuItems(modules)
    .filter((entry) => entry.item.accessCount > 0)
    .sort((a, b) => b.item.accessCount - a.item.accessCount)
    .slice(0, 6);

  const kpiIcons = [Users, ShoppingCart, Building2, Package];

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold">D365 Generative Client</h1>
        <p className="mt-1 text-muted-foreground">
          {isLive
            ? `Live data for company ${company}`
            : "Select a module to begin, or use the search bar to find a specific form."}
        </p>
      </div>

      {/* KPI Tiles */}
      {isLive && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Key Metrics</h2>
            <div className="ml-auto">
              <DataSourceToggle />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {kpiQuery.isLoading
              ? Array.from({ length: 4 }).map((_, i) => <KpiCard key={i} label="" value="" loading />)
              : (kpiQuery.data ?? []).map((kpi, i) => (
                  <KpiCard
                    key={kpi.entitySet}
                    label={kpi.label}
                    value={kpi.value}
                    change={kpi.change}
                    icon={kpiIcons[i]}
                  />
                ))}
          </div>
        </section>
      )}

      {/* Charts Row */}
      {isLive && (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Sales Order Status Pie */}
          <ChartCard title="Sales Orders by Status" loading={salesStatusQuery.isLoading}>
            {salesStatusQuery.data && salesStatusQuery.data.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={salesStatusQuery.data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {salesStatusQuery.data.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No data available</p>
            )}
          </ChartCard>

          {/* Top Customers Bar */}
          <ChartCard title="Top Customers (by Order Count)" loading={topCustomersQuery.isLoading}>
            {topCustomersQuery.data && topCustomersQuery.data.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topCustomersQuery.data} layout="vertical">
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No data available</p>
            )}
          </ChartCard>

          {/* Purchase Order Status Pie */}
          <ChartCard title="Purchase Orders by Status" loading={poStatusQuery.isLoading}>
            {poStatusQuery.data && poStatusQuery.data.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={poStatusQuery.data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {poStatusQuery.data.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[(i + 3) % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No data available</p>
            )}
          </ChartCard>

          {/* Top Inventory Bar */}
          <ChartCard title="Top Products (On-hand Quantity)" loading={topInventoryQuery.isLoading}>
            {topInventoryQuery.data && topInventoryQuery.data.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topInventoryQuery.data} layout="vertical">
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#16a34a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No data available</p>
            )}
          </ChartCard>
        </section>
      )}

      {/* Recent Sales Orders Table */}
      {isLive && recentOrdersQuery.data && recentOrdersQuery.data.length > 0 && (
        <section>
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium">Recent Sales Orders</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Order #</th>
                      <th className="pb-2 pr-4 font-medium">Customer</th>
                      <th className="pb-2 pr-4 font-medium">Status</th>
                      <th className="pb-2 font-medium">Ship Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrdersQuery.data.map((order, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-mono text-xs">
                          {String(order.SalesOrderNumber ?? "")}
                        </td>
                        <td className="py-2 pr-4">
                          {String(order.OrderingCustomerAccountNumber ?? "")}
                        </td>
                        <td className="py-2 pr-4">
                          <Badge variant="secondary">
                            {String(order.SalesOrderStatus ?? "")}
                          </Badge>
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {order.RequestedShippingDate
                            ? new Date(String(order.RequestedShippingDate)).toLocaleDateString()
                            : "\u2014"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Natural Language Dashboard Builder */}
      {isLive && (
        <section>
          <NLDashboardSection />
        </section>
      )}

      {/* Recent Items */}
      {recentItems.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Recently Accessed</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recentItems.map((entry, i) => (
              <Card
                key={`${entry.path}-${i}`}
                className="cursor-pointer transition-colors hover:bg-accent"
                onClick={() => navigate(entry.path)}
              >
                <CardContent className="p-4">
                  <p className="text-sm font-medium">{entry.label}</p>
                  {entry.menuItemName && (
                    <p className="mt-1 text-xs text-muted-foreground">{entry.menuItemName}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Popular Items */}
      {popularItems.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Frequently Used</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {popularItems.map(({ item }) => (
              <Card
                key={item.menuItemName}
                className="cursor-pointer transition-colors hover:bg-accent"
                onClick={() => navigate(`/form/${item.menuItemName}`)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.menuItemName}</p>
                  </div>
                  <Badge variant="secondary">{item.accessCount}x</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Module Overview */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Layers className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Modules</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MODULE_TAXONOMY.map((mod) => (
            <Card
              key={mod.id}
              className="cursor-pointer transition-colors hover:bg-accent"
              onClick={() => navigate(`/module/${mod.id}`)}
            >
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base">{mod.label}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-xs text-muted-foreground">{mod.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {mod.items.length} item{mod.items.length !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
