/**
 * Curated entity catalog — pre-mapped entity set names, key fields, and default queries.
 * Ported from D365-erp-cli/cmd/agent_prompt.go and extended.
 */

export interface EntityCatalogEntry {
  readonly entitySet: string;
  readonly label: string;
  readonly description: string;
  readonly keyFields: string[];
  readonly defaultSelect: string[];
  readonly searchFields: string[];
  readonly category: EntityCategory;
  readonly relatedEntities?: string[];
}

export type EntityCategory =
  | "master-data"
  | "sales"
  | "purchasing"
  | "financials"
  | "inventory"
  | "hr"
  | "configuration";

export const ENTITY_CATALOG: Record<string, EntityCatalogEntry> = {
  // --- Master Data ---
  CustomersV3: {
    entitySet: "CustomersV3",
    label: "Customers",
    description: "Customer master records",
    keyFields: ["dataAreaId", "CustomerAccount"],
    defaultSelect: ["CustomerAccount", "OrganizationName", "CustomerGroupId", "SalesCurrencyCode", "InvoiceAccount"],
    searchFields: ["CustomerAccount", "OrganizationName"],
    category: "master-data",
    relatedEntities: ["SalesOrderHeadersV2"],
  },
  VendorsV2: {
    entitySet: "VendorsV2",
    label: "Vendors",
    description: "Vendor/supplier master records",
    keyFields: ["dataAreaId", "VendorAccountNumber"],
    defaultSelect: ["VendorAccountNumber", "VendorOrganizationName", "VendorGroupId", "DefaultPaymentDayName"],
    searchFields: ["VendorAccountNumber", "VendorOrganizationName"],
    category: "master-data",
    relatedEntities: ["PurchaseOrderHeadersV2"],
  },
  ReleasedProductsV2: {
    entitySet: "ReleasedProductsV2",
    label: "Released Products",
    description: "Released products per company with variants",
    keyFields: ["dataAreaId", "ItemNumber"],
    defaultSelect: ["ItemNumber", "ProductName", "ProductType", "ItemModelGroupId", "ItemGroupId"],
    searchFields: ["ItemNumber", "ProductName"],
    category: "master-data",
  },

  // --- Sales ---
  SalesOrderHeadersV2: {
    entitySet: "SalesOrderHeadersV2",
    label: "Sales Orders",
    description: "Sales order headers",
    keyFields: ["dataAreaId", "SalesOrderNumber"],
    defaultSelect: ["SalesOrderNumber", "OrderingCustomerAccountNumber", "InvoiceCustomerAccountNumber", "SalesOrderStatus", "RequestedShippingDate"],
    searchFields: ["SalesOrderNumber", "OrderingCustomerAccountNumber"],
    category: "sales",
    relatedEntities: ["SalesOrderLinesV2"],
  },
  SalesOrderLinesV2: {
    entitySet: "SalesOrderLinesV2",
    label: "Sales Order Lines",
    description: "Sales order line items",
    keyFields: ["dataAreaId", "SalesOrderNumber", "LineNumber"],
    defaultSelect: ["SalesOrderNumber", "LineNumber", "ItemNumber", "OrderedSalesQuantity", "SalesPrice", "LineAmount"],
    searchFields: ["SalesOrderNumber", "ItemNumber"],
    category: "sales",
  },

  // --- Purchasing ---
  PurchaseOrderHeadersV2: {
    entitySet: "PurchaseOrderHeadersV2",
    label: "Purchase Orders",
    description: "Purchase order headers",
    keyFields: ["dataAreaId", "PurchaseOrderNumber"],
    defaultSelect: ["PurchaseOrderNumber", "OrderVendorAccountNumber", "PurchaseOrderStatus", "AccountingDate"],
    searchFields: ["PurchaseOrderNumber", "OrderVendorAccountNumber"],
    category: "purchasing",
    relatedEntities: ["PurchaseOrderLinesV2"],
  },
  PurchaseOrderLinesV2: {
    entitySet: "PurchaseOrderLinesV2",
    label: "Purchase Order Lines",
    description: "Purchase order line items",
    keyFields: ["dataAreaId", "PurchaseOrderNumber", "LineNumber"],
    defaultSelect: ["PurchaseOrderNumber", "LineNumber", "ItemNumber", "OrderedPurchaseQuantity", "PurchasePrice"],
    searchFields: ["PurchaseOrderNumber", "ItemNumber"],
    category: "purchasing",
  },

  // --- Financials ---
  LegalEntities: {
    entitySet: "LegalEntities",
    label: "Legal Entities",
    description: "Legal entities / companies",
    keyFields: ["LegalEntityId"],
    defaultSelect: ["LegalEntityId", "Name", "CompanyType", "AddressCountryRegionId"],
    searchFields: ["LegalEntityId", "Name"],
    category: "financials",
  },
  MainAccounts: {
    entitySet: "MainAccounts",
    label: "Main Accounts",
    description: "Chart of accounts main accounts",
    keyFields: ["dataAreaId", "MainAccountId", "ChartOfAccounts"],
    defaultSelect: ["MainAccountId", "Name", "MainAccountType", "ChartOfAccounts"],
    searchFields: ["MainAccountId", "Name"],
    category: "financials",
  },
  GeneralJournalHeaders: {
    entitySet: "GeneralJournalHeaders",
    label: "General Journals",
    description: "General journal batch headers",
    keyFields: ["dataAreaId", "JournalBatchNumber"],
    defaultSelect: ["JournalBatchNumber", "JournalName", "Description", "PostedDateTime"],
    searchFields: ["JournalBatchNumber", "Description"],
    category: "financials",
  },

  // --- Inventory ---
  InventOnhandEntities: {
    entitySet: "InventOnhandEntities",
    label: "On-hand Inventory",
    description: "On-hand inventory balances",
    keyFields: ["dataAreaId", "ItemNumber"],
    defaultSelect: ["ItemNumber", "ProductName", "AvailableOnHandQuantity", "OnOrderQuantity", "WarehouseId"],
    searchFields: ["ItemNumber", "ProductName"],
    category: "inventory",
  },
  InventWarehouses: {
    entitySet: "InventWarehouses",
    label: "Warehouses",
    description: "Warehouse definitions",
    keyFields: ["dataAreaId", "WarehouseId"],
    defaultSelect: ["WarehouseId", "WarehouseName", "InventSiteId"],
    searchFields: ["WarehouseId", "WarehouseName"],
    category: "inventory",
  },
  InventSites: {
    entitySet: "InventSites",
    label: "Sites",
    description: "Site definitions",
    keyFields: ["dataAreaId", "SiteId"],
    defaultSelect: ["SiteId", "SiteName"],
    searchFields: ["SiteId", "SiteName"],
    category: "inventory",
  },

  // --- HR ---
  Workers: {
    entitySet: "Workers",
    label: "Workers",
    description: "Worker records (all worker types)",
    keyFields: ["PersonnelNumber"],
    defaultSelect: ["PersonnelNumber", "KnownAs", "NameAlias", "WorkerType"],
    searchFields: ["PersonnelNumber", "KnownAs"],
    category: "hr",
  },
  Employees: {
    entitySet: "Employees",
    label: "Employees",
    description: "Employee records",
    keyFields: ["PersonnelNumber"],
    defaultSelect: ["PersonnelNumber", "KnownAs", "Company", "EmploymentStartDate"],
    searchFields: ["PersonnelNumber", "KnownAs"],
    category: "hr",
  },

  // --- Configuration ---
  NumberSequences: {
    entitySet: "NumberSequences",
    label: "Number Sequences",
    description: "Number sequence definitions",
    keyFields: ["dataAreaId", "NumberSequenceCode"],
    defaultSelect: ["NumberSequenceCode", "NumberSequenceName", "NumberSequenceScope"],
    searchFields: ["NumberSequenceCode", "NumberSequenceName"],
    category: "configuration",
  },
};

/** Look up a catalog entry by entity set name. */
export function getEntityCatalogEntry(entitySet: string): EntityCatalogEntry | undefined {
  return ENTITY_CATALOG[entitySet];
}

/** Find catalog entries matching a search term. */
export function searchEntityCatalog(term: string): EntityCatalogEntry[] {
  const lower = term.toLowerCase();
  return Object.values(ENTITY_CATALOG).filter(
    (e) =>
      e.label.toLowerCase().includes(lower) ||
      e.description.toLowerCase().includes(lower) ||
      e.entitySet.toLowerCase().includes(lower)
  );
}
