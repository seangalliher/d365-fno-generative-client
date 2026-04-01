/**
 * Curated D365 F&O module taxonomy.
 * Provides the initial menu structure without requiring any API calls.
 * Ported and extended from D365-erp-cli/cmd/agent_prompt.go entity catalog.
 */

import type { MenuModule } from "@/types";

export const MODULE_TAXONOMY: MenuModule[] = [
  {
    id: "general-ledger",
    label: "General Ledger",
    icon: "book-open",
    description: "Chart of accounts, journals, and financial reporting",
    order: 1,
    items: [
      { menuItemName: "LedgerJournalTable", menuItemType: "Display", label: "General journals", entitySet: "GeneralJournalHeaders", formCached: false, accessCount: 0 },
      { menuItemName: "MainAccountListPage", menuItemType: "Display", label: "Main accounts", entitySet: "MainAccounts", formCached: false, accessCount: 0 },
      { menuItemName: "LedgerChartOfAccountsListPage", menuItemType: "Display", label: "Chart of accounts", entitySet: "LedgerChartOfAccounts", formCached: false, accessCount: 0 },
      { menuItemName: "DimensionDetails", menuItemType: "Display", label: "Financial dimensions", formCached: false, accessCount: 0 },
      { menuItemName: "LedgerPeriodClose", menuItemType: "Display", label: "Period close", formCached: false, accessCount: 0 },
    ],
  },
  {
    id: "accounts-receivable",
    label: "Accounts Receivable",
    icon: "users",
    description: "Customers, sales orders, and invoicing",
    order: 2,
    items: [
      { menuItemName: "CustTableListPage", menuItemType: "Display", label: "All customers", entitySet: "CustomersV3", formCached: false, accessCount: 0 },
      { menuItemName: "SalesTableListPage", menuItemType: "Display", label: "All sales orders", entitySet: "SalesOrderHeadersV2", formCached: false, accessCount: 0 },
      { menuItemName: "CustFreeInvoiceListPage", menuItemType: "Display", label: "Free text invoices", formCached: false, accessCount: 0 },
      { menuItemName: "CustOpenInvoicesListPage", menuItemType: "Display", label: "Open customer invoices", formCached: false, accessCount: 0 },
      { menuItemName: "CustPaymMode", menuItemType: "Display", label: "Methods of payment", formCached: false, accessCount: 0 },
      { menuItemName: "CustomerGroupListPage", menuItemType: "Display", label: "Customer groups", entitySet: "CustomerGroups", formCached: false, accessCount: 0 },
    ],
  },
  {
    id: "accounts-payable",
    label: "Accounts Payable",
    icon: "building-2",
    description: "Vendors, purchase orders, and payments",
    order: 3,
    items: [
      { menuItemName: "VendTableListPage", menuItemType: "Display", label: "All vendors", entitySet: "VendorsV2", formCached: false, accessCount: 0 },
      { menuItemName: "PurchTableListPage", menuItemType: "Display", label: "All purchase orders", entitySet: "PurchaseOrderHeadersV2", formCached: false, accessCount: 0 },
      { menuItemName: "VendOpenInvoicesListPage", menuItemType: "Display", label: "Open vendor invoices", formCached: false, accessCount: 0 },
      { menuItemName: "VendPaymMode", menuItemType: "Display", label: "Methods of payment", formCached: false, accessCount: 0 },
      { menuItemName: "VendGroupListPage", menuItemType: "Display", label: "Vendor groups", entitySet: "VendorGroups", formCached: false, accessCount: 0 },
    ],
  },
  {
    id: "procurement",
    label: "Procurement & Sourcing",
    icon: "shopping-cart",
    description: "Procurement policies, requisitions, and sourcing",
    order: 4,
    items: [
      { menuItemName: "PurchReqListPage", menuItemType: "Display", label: "Purchase requisitions", formCached: false, accessCount: 0 },
      { menuItemName: "PurchRFQListPage", menuItemType: "Display", label: "Requests for quotation", formCached: false, accessCount: 0 },
      { menuItemName: "PurchAgreementListPage", menuItemType: "Display", label: "Purchase agreements", formCached: false, accessCount: 0 },
      { menuItemName: "CatProcurementCatalogListPage", menuItemType: "Display", label: "Procurement catalogs", formCached: false, accessCount: 0 },
    ],
  },
  {
    id: "inventory",
    label: "Inventory Management",
    icon: "warehouse",
    description: "On-hand inventory, warehouses, and item management",
    order: 5,
    items: [
      { menuItemName: "EcoResProductListPage", menuItemType: "Display", label: "Released products", entitySet: "ReleasedProductsV2", formCached: false, accessCount: 0 },
      { menuItemName: "InventOnHandItem", menuItemType: "Display", label: "On-hand inventory", entitySet: "InventOnhandEntities", formCached: false, accessCount: 0 },
      { menuItemName: "InventSiteListPage", menuItemType: "Display", label: "Sites", entitySet: "InventSites", formCached: false, accessCount: 0 },
      { menuItemName: "WMSWarehouseListPage", menuItemType: "Display", label: "Warehouses", entitySet: "InventWarehouses", formCached: false, accessCount: 0 },
      { menuItemName: "InventItemGroupList", menuItemType: "Display", label: "Item groups", entitySet: "ItemGroups", formCached: false, accessCount: 0 },
      { menuItemName: "InventJournalTable_Movement", menuItemType: "Display", label: "Inventory journals", formCached: false, accessCount: 0 },
    ],
  },
  {
    id: "production",
    label: "Production Control",
    icon: "factory",
    description: "Production orders, BOMs, and routes",
    order: 6,
    items: [
      { menuItemName: "ProdTableListPage", menuItemType: "Display", label: "All production orders", formCached: false, accessCount: 0 },
      { menuItemName: "BOMVersionListPage", menuItemType: "Display", label: "Bills of materials", formCached: false, accessCount: 0 },
      { menuItemName: "RouteVersionListPage", menuItemType: "Display", label: "Routes", formCached: false, accessCount: 0 },
      { menuItemName: "WrkCtrResourceGroupListPage", menuItemType: "Display", label: "Resource groups", formCached: false, accessCount: 0 },
    ],
  },
  {
    id: "human-resources",
    label: "Human Resources",
    icon: "user-circle",
    description: "Workers, employees, positions, and benefits",
    order: 7,
    items: [
      { menuItemName: "HcmWorkerListPage_Employees", menuItemType: "Display", label: "Employees", entitySet: "Employees", formCached: false, accessCount: 0 },
      { menuItemName: "HcmWorkerListPage_Workers", menuItemType: "Display", label: "All workers", entitySet: "Workers", formCached: false, accessCount: 0 },
      { menuItemName: "HcmPositionListPage", menuItemType: "Display", label: "Positions", entitySet: "Positions", formCached: false, accessCount: 0 },
      { menuItemName: "HcmDepartmentListPage", menuItemType: "Display", label: "Departments", formCached: false, accessCount: 0 },
    ],
  },
  {
    id: "organization",
    label: "Organization Administration",
    icon: "settings",
    description: "Legal entities, number sequences, and system configuration",
    order: 8,
    items: [
      { menuItemName: "OMLegalEntities", menuItemType: "Display", label: "Legal entities", entitySet: "LegalEntities", formCached: false, accessCount: 0 },
      { menuItemName: "NumberSequenceTableListPage", menuItemType: "Display", label: "Number sequences", entitySet: "NumberSequences", formCached: false, accessCount: 0 },
      { menuItemName: "CompanyInfoListPage", menuItemType: "Display", label: "Company information", entitySet: "CompanyInfoEntities", formCached: false, accessCount: 0 },
    ],
  },
];

/**
 * Flatten all menu items across all modules.
 */
export function getAllMenuItems(modules: MenuModule[] = MODULE_TAXONOMY): Array<{ moduleId: string; item: MenuModule["items"][number] }> {
  return modules.flatMap((mod) =>
    mod.items.map((item) => ({ moduleId: mod.id, item }))
  );
}

/**
 * Find a module by ID.
 */
export function findModule(moduleId: string): MenuModule | undefined {
  return MODULE_TAXONOMY.find((m) => m.id === moduleId);
}

/**
 * Find a menu item across all modules.
 */
export function findMenuItem(menuItemName: string): { module: MenuModule; item: MenuModule["items"][number] } | undefined {
  for (const mod of MODULE_TAXONOMY) {
    const item = mod.items.find((i) => i.menuItemName === menuItemName);
    if (item) return { module: mod, item };
  }
  return undefined;
}
