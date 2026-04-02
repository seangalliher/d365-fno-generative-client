/**
 * Entity graph data builder — transforms ENTITY_CATALOG into a 3D force-graph dataset.
 * Combines explicit relatedEntities with inferred field-based relationships.
 */

import { ENTITY_CATALOG, type EntityCategory } from "./entityCatalog";

// ---- Types ----

export interface GraphNode {
  id: string;
  label: string;
  description: string;
  category: EntityCategory;
  keyFields: string[];
  defaultSelect: string[];
  connectionCount: number;
}

export interface GraphLink {
  source: string;
  target: string;
  type: "explicit" | "implicit";
  field?: string;
}

export interface EntityGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// ---- Category colours (pop on dark background) ----

export const CATEGORY_COLORS: Record<EntityCategory, string> = {
  "master-data": "#3b82f6",
  sales: "#22c55e",
  purchasing: "#f97316",
  financials: "#a855f7",
  inventory: "#eab308",
  hr: "#ec4899",
  configuration: "#6b7280",
};

export const CATEGORY_LABELS: Record<EntityCategory, string> = {
  "master-data": "Master Data",
  sales: "Sales",
  purchasing: "Purchasing",
  financials: "Financials",
  inventory: "Inventory & Production",
  hr: "Human Resources",
  configuration: "Configuration",
};

// ---- Implicit relationships (inferred from shared field names) ----

const IMPLICIT_RELATIONSHIPS: Array<{
  source: string;
  target: string;
  field: string;
}> = [
  // Customer → Sales / AR
  { source: "SalesOrderHeadersV2", target: "CustomersV3", field: "CustomerAccount" },
  { source: "FreeTextInvoiceHeaders", target: "CustomersV3", field: "CustomerAccount" },
  { source: "CustomersV3", target: "CustomerGroups", field: "CustomerGroupId" },
  { source: "CustomersV3", target: "CustomerPaymentMethods", field: "PaymentMethod" },

  // Vendor → Purchasing / AP
  { source: "PurchaseOrderHeadersV2", target: "VendorsV2", field: "VendorAccountNumber" },
  { source: "VendorInvoiceHeaders", target: "VendorsV2", field: "VendorAccount" },
  { source: "PurchaseAgreements", target: "VendorsV2", field: "VendorAccountNumber" },
  { source: "RequestForQuotationReplyHeaders", target: "VendorsV2", field: "VendorAccountNumber" },
  { source: "VendorsV2", target: "VendorGroups", field: "VendorGroupId" },
  { source: "VendorsV2", target: "VendorPaymentMethods", field: "PaymentMethod" },

  // Item → Inventory / Production
  { source: "SalesOrderLinesV2", target: "ReleasedProductsV2", field: "ItemNumber" },
  { source: "PurchaseOrderLinesV2", target: "ReleasedProductsV2", field: "ItemNumber" },
  { source: "InventorySitesOnHandV2", target: "ReleasedProductsV2", field: "ItemNumber" },
  { source: "ProductionOrderHeaders", target: "ReleasedProductsV2", field: "ItemNumber" },
  { source: "BillOfMaterialsVersionsV4", target: "ReleasedProductsV2", field: "ItemNumber" },
  { source: "RouteVersionsV2", target: "ReleasedProductsV2", field: "ItemNumber" },
  { source: "ReleasedProductsV2", target: "ItemGroups", field: "ItemGroupId" },

  // Site / Warehouse
  { source: "InventorySitesOnHandV2", target: "InventSites", field: "SiteId" },
  { source: "InventWarehouses", target: "InventSites", field: "SiteId" },
  { source: "BillOfMaterialsVersionsV4", target: "InventSites", field: "SiteId" },
  { source: "RouteVersionsV2", target: "InventSites", field: "SiteId" },
  { source: "InventorySitesOnHandV2", target: "InventWarehouses", field: "WarehouseId" },

  // Financials
  { source: "MainAccounts", target: "LedgerChartOfAccounts", field: "ChartOfAccounts" },
  { source: "GeneralJournalHeaders", target: "MainAccounts", field: "MainAccountId" },
  { source: "LedgerFiscalPeriodsV2", target: "LegalEntities", field: "LedgerName" },

  // HR
  { source: "Employees", target: "Workers", field: "PersonnelNumber" },
  { source: "PurchaseRequisitionHeaders", target: "Workers", field: "PersonnelNumber" },
  { source: "Positions", target: "DimAttributeOMDepartments", field: "DepartmentNumber" },
  { source: "Employees", target: "LegalEntities", field: "LegalEntityId" },
  { source: "Employees", target: "Positions", field: "PositionId" },

  // Production
  { source: "ProductionOrderHeaders", target: "BillOfMaterialsVersionsV4", field: "BOMId" },
  { source: "ProductionOrderHeaders", target: "RouteVersionsV2", field: "RouteId" },
  { source: "RouteVersionsV2", target: "DimAttributeWrkCtrResourceGroups", field: "ResourceGroupId" },

  // Cross-cutting
  { source: "NumberSequences", target: "CompanyInfoEntities", field: "dataAreaId" },
];

// ---- Builder ----

let _cached: EntityGraphData | null = null;

export function buildEntityGraph(): EntityGraphData {
  if (_cached) return _cached;

  const entityKeys = new Set(Object.keys(ENTITY_CATALOG));

  // Build nodes
  const nodes: GraphNode[] = Object.entries(ENTITY_CATALOG).map(
    ([key, entry]) => ({
      id: key,
      label: entry.label,
      description: entry.description,
      category: entry.category,
      keyFields: entry.keyFields,
      defaultSelect: entry.defaultSelect,
      connectionCount: 0,
    })
  );

  // Collect links — deduplicate by source+target pair
  const linkSet = new Set<string>();
  const links: GraphLink[] = [];

  function addLink(
    source: string,
    target: string,
    type: "explicit" | "implicit",
    field?: string
  ) {
    // Only add if both source and target are in the catalog
    if (!entityKeys.has(source) || !entityKeys.has(target)) return;
    // Deduplicate (unordered pair)
    const key = [source, target].sort().join("→");
    if (linkSet.has(key)) return;
    linkSet.add(key);
    links.push({ source, target, type, field });
  }

  // 1. Explicit relationships from relatedEntities
  for (const [key, entry] of Object.entries(ENTITY_CATALOG)) {
    if (entry.relatedEntities) {
      for (const rel of entry.relatedEntities) {
        addLink(key, rel, "explicit");
      }
    }
  }

  // 2. Implicit relationships from shared fields
  for (const rel of IMPLICIT_RELATIONSHIPS) {
    addLink(rel.source, rel.target, "implicit", rel.field);
  }

  // 3. Compute connection counts
  const connMap = new Map<string, number>();
  for (const link of links) {
    connMap.set(
      String(link.source),
      (connMap.get(String(link.source)) ?? 0) + 1
    );
    connMap.set(
      String(link.target),
      (connMap.get(String(link.target)) ?? 0) + 1
    );
  }
  for (const node of nodes) {
    node.connectionCount = connMap.get(node.id) ?? 0;
  }

  _cached = { nodes, links };
  return _cached;
}
