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
  /** If false, this entity has no dataAreaId field and should not be filtered by company. Defaults to true. */
  readonly companyFiltered?: boolean;
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
    defaultSelect: ["ItemNumber", "SearchName", "ProductType", "ItemModelGroupId", "ProductNumber"],
    searchFields: ["ItemNumber", "SearchName"],
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
  PurchaseAgreements: {
    entitySet: "PurchaseAgreements",
    label: "Purchase Agreements",
    description: "Purchase agreement headers",
    keyFields: ["dataAreaId", "PurchaseAgreementId"],
    defaultSelect: ["PurchaseAgreementId", "AgreementVendorAccountNumber", "AgreementStatus", "DocumentTitle", "CurrencyCode", "DefaultEffectiveDate", "DefaultExpirationDate"],
    searchFields: ["PurchaseAgreementId", "AgreementVendorAccountNumber", "DocumentTitle"],
    category: "purchasing",
    relatedEntities: ["PurchaseAgreementLinesV2"],
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
    companyFiltered: false,
  },
  MainAccounts: {
    entitySet: "MainAccounts",
    label: "Main Accounts",
    description: "Chart of accounts main accounts",
    keyFields: ["dataAreaId", "MainAccountId", "ChartOfAccounts"],
    defaultSelect: ["MainAccountId", "Name", "MainAccountType", "ChartOfAccounts"],
    searchFields: ["MainAccountId", "Name"],
    category: "financials",
    companyFiltered: false,
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
  InventorySitesOnHandV2: {
    entitySet: "InventorySitesOnHandV2",
    label: "On-hand Inventory",
    description: "On-hand inventory balances by site",
    keyFields: ["dataAreaId", "ItemNumber", "InventorySiteId"],
    defaultSelect: ["ItemNumber", "ProductName", "AvailableOnHandQuantity", "TotalAvailableQuantity", "OnOrderQuantity", "InventorySiteId"],
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
    defaultSelect: ["PersonnelNumber", "Name", "NameAlias", "WorkerType"],
    searchFields: ["PersonnelNumber", "Name"],
    category: "hr",
    companyFiltered: false,
  },
  Employees: {
    entitySet: "Employees",
    label: "Employees",
    description: "Employee records",
    keyFields: ["PersonnelNumber"],
    defaultSelect: ["PersonnelNumber", "Name", "EmploymentLegalEntityId", "EmploymentStartDate"],
    searchFields: ["PersonnelNumber", "Name"],
    category: "hr",
    companyFiltered: false,
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
  CompanyInfoEntities: {
    entitySet: "CompanyInfoEntities",
    label: "Company Information",
    description: "Company information and settings",
    keyFields: ["dataAreaId"],
    defaultSelect: ["dataAreaId", "Name"],
    searchFields: ["dataAreaId", "Name"],
    category: "configuration",
  },

  // --- Additional Financials ---
  FinancialDimensionValues: {
    entitySet: "FinancialDimensionValues",
    label: "Financial Dimension Values",
    description: "Custom list financial dimension values",
    keyFields: ["FinancialDimension", "DimensionValue"],
    defaultSelect: ["FinancialDimension", "DimensionValue", "Description", "IsSuspended", "ActiveFrom", "ActiveTo"],
    searchFields: ["DimensionValue", "Description"],
    category: "financials",
    companyFiltered: false,
  },
  LedgerFiscalPeriodsV2: {
    entitySet: "LedgerFiscalPeriodsV2",
    label: "Ledger Fiscal Periods",
    description: "Ledger fiscal calendar periods",
    keyFields: ["LedgerName", "Calendar", "PeriodName"],
    defaultSelect: ["LedgerName", "Calendar", "YearName", "PeriodName", "PeriodStatus"],
    searchFields: ["Calendar", "PeriodName"],
    category: "financials",
    companyFiltered: false,
  },
  LedgerChartOfAccounts: {
    entitySet: "LedgerChartOfAccounts",
    label: "Chart of Accounts",
    description: "Chart of accounts definitions",
    keyFields: ["ChartOfAccounts"],
    defaultSelect: ["ChartOfAccounts", "Description"],
    searchFields: ["ChartOfAccounts", "Description"],
    category: "financials",
    companyFiltered: false,
  },
  FreeTextInvoiceHeaders: {
    entitySet: "FreeTextInvoiceHeaders",
    label: "Free Text Invoices",
    description: "Customer free text invoice headers",
    keyFields: ["dataAreaId", "InvoiceIdentifier"],
    defaultSelect: ["FreeTextNumber", "CustomerAccount", "InvoiceDate", "DueDate", "CurrencyCode", "IsPosted"],
    searchFields: ["FreeTextNumber", "CustomerAccount"],
    category: "financials",
  },

  // --- Additional AR/AP ---
  CustomerPaymentMethods: {
    entitySet: "CustomerPaymentMethods",
    label: "Customer Payment Methods",
    description: "Customer methods of payment",
    keyFields: ["dataAreaId", "Name"],
    defaultSelect: ["Name", "Description", "AccountType", "PaymentAccountDisplayValue"],
    searchFields: ["Name", "Description"],
    category: "financials",
  },
  CustomerGroups: {
    entitySet: "CustomerGroups",
    label: "Customer Groups",
    description: "Customer group definitions",
    keyFields: ["dataAreaId", "CustomerGroupId"],
    defaultSelect: ["CustomerGroupId", "Description"],
    searchFields: ["CustomerGroupId", "Description"],
    category: "master-data",
  },
  VendorInvoiceHeaders: {
    entitySet: "VendorInvoiceHeaders",
    label: "Vendor Invoices",
    description: "Vendor invoice headers",
    keyFields: ["dataAreaId", "HeaderReference"],
    defaultSelect: ["InvoiceNumber", "VendorAccount", "VendorName", "InvoiceDate", "DueDate", "Currency", "IsApproved"],
    searchFields: ["InvoiceNumber", "VendorAccount", "VendorName"],
    category: "purchasing",
  },
  VendorPaymentMethods: {
    entitySet: "VendorPaymentMethods",
    label: "Vendor Payment Methods",
    description: "Vendor methods of payment",
    keyFields: ["dataAreaId", "Name"],
    defaultSelect: ["Name", "Description", "AccountType", "PaymentAccountDisplayValue"],
    searchFields: ["Name", "Description"],
    category: "purchasing",
  },
  VendorGroups: {
    entitySet: "VendorGroups",
    label: "Vendor Groups",
    description: "Vendor group definitions",
    keyFields: ["dataAreaId", "VendorGroupId"],
    defaultSelect: ["VendorGroupId", "Description"],
    searchFields: ["VendorGroupId", "Description"],
    category: "master-data",
  },

  // --- Additional Procurement ---
  PurchaseRequisitionHeaders: {
    entitySet: "PurchaseRequisitionHeaders",
    label: "Purchase Requisitions",
    description: "Purchase requisition headers",
    keyFields: ["RequisitionNumber"],
    defaultSelect: ["RequisitionNumber", "RequisitionName", "RequisitionStatus", "PreparerPersonnelNumber", "DefaultRequestedDate"],
    searchFields: ["RequisitionNumber", "RequisitionName"],
    category: "purchasing",
    companyFiltered: false,
  },
  RequestForQuotationReplyHeaders: {
    entitySet: "RequestForQuotationReplyHeaders",
    label: "Requests for Quotation",
    description: "Request for quotation reply headers",
    keyFields: ["dataAreaId", "RFQNumber"],
    defaultSelect: ["RFQNumber", "RFQCaseNumber", "RFQCaseTitle", "VendorAccountNumber"],
    searchFields: ["RFQNumber", "RFQCaseTitle"],
    category: "purchasing",
  },
  ProcurementProductCategories: {
    entitySet: "ProcurementProductCategories",
    label: "Procurement Categories",
    description: "Procurement product categories and hierarchy",
    keyFields: ["CategoryHierarchyName", "CategoryName"],
    defaultSelect: ["CategoryHierarchyName", "CategoryName", "ParentCategoryName"],
    searchFields: ["CategoryName", "CategoryHierarchyName"],
    category: "purchasing",
    companyFiltered: false,
  },

  // --- Additional Inventory ---
  ItemGroups: {
    entitySet: "ItemGroups",
    label: "Item Groups",
    description: "Item group definitions",
    keyFields: ["dataAreaId", "ItemGroupId"],
    defaultSelect: ["ItemGroupId", "Name"],
    searchFields: ["ItemGroupId", "Name"],
    category: "inventory",
  },
  InventoryMovementJournalHeaders: {
    entitySet: "InventoryMovementJournalHeaders",
    label: "Inventory Movement Journals",
    description: "Inventory movement journal headers",
    keyFields: ["dataAreaId", "JournalNumber"],
    defaultSelect: ["JournalNumber", "Description", "JournalNameId", "IsPosted", "PostedDateTime"],
    searchFields: ["JournalNumber", "Description"],
    category: "inventory",
  },

  // --- Production ---
  ProductionOrderHeaders: {
    entitySet: "ProductionOrderHeaders",
    label: "Production Orders",
    description: "Production order headers",
    keyFields: ["dataAreaId", "ProductionOrderNumber"],
    defaultSelect: ["ProductionOrderNumber", "ItemNumber", "ProductionOrderStatus", "ScheduledQuantity", "ProductionOrderName"],
    searchFields: ["ProductionOrderNumber", "ItemNumber", "ProductionOrderName"],
    category: "inventory",
  },
  BillOfMaterialsVersionsV4: {
    entitySet: "BillOfMaterialsVersionsV4",
    label: "BOM Versions",
    description: "Bill of materials versions",
    keyFields: ["dataAreaId", "BOMId", "ProductionSiteId"],
    defaultSelect: ["BOMId", "ManufacturedItemNumber", "ProductionSiteId", "IsActive"],
    searchFields: ["BOMId", "ManufacturedItemNumber"],
    category: "inventory",
  },
  RouteVersionsV2: {
    entitySet: "RouteVersionsV2",
    label: "Route Versions",
    description: "Production route versions",
    keyFields: ["dataAreaId", "RouteId", "ProductionSiteId"],
    defaultSelect: ["RouteId", "ItemNumber", "ProductionSiteId", "IsActive"],
    searchFields: ["RouteId", "ItemNumber"],
    category: "inventory",
  },
  DimAttributeWrkCtrResourceGroups: {
    entitySet: "DimAttributeWrkCtrResourceGroups",
    label: "Resource Groups",
    description: "Work center resource groups",
    keyFields: ["Value"],
    defaultSelect: ["Value", "Name"],
    searchFields: ["Value", "Name"],
    category: "inventory",
    companyFiltered: false,
  },

  // --- Additional HR ---
  Positions: {
    entitySet: "Positions",
    label: "Positions",
    description: "HR position definitions",
    keyFields: ["PositionId"],
    defaultSelect: ["PositionId", "Description", "JobId", "DepartmentNumber"],
    searchFields: ["PositionId", "Description"],
    category: "hr",
    companyFiltered: false,
  },
  DimAttributeOMDepartments: {
    entitySet: "DimAttributeOMDepartments",
    label: "Departments",
    description: "Organization department definitions",
    keyFields: ["Value"],
    defaultSelect: ["Value", "Name"],
    searchFields: ["Value", "Name"],
    category: "hr",
    companyFiltered: false,
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
