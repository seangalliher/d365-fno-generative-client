/**
 * Sample data generator — produces demo records from entity catalog entries.
 * Used when no live D365 OData endpoint is available.
 */

import { ENTITY_CATALOG, type EntityCatalogEntry } from "@/data/entityCatalog";

const CUSTOMER_NAMES = [
  "Contoso Ltd", "Fabrikam Inc", "Northwind Traders", "Adventure Works",
  "Litware Inc", "Tailspin Toys", "Fourth Coffee", "Wingtip Toys",
  "Proseware Inc", "Datum Corporation", "Alpine Ski House", "Coho Vineyard",
  "Humongous Insurance", "Lucerne Publishing", "Margie's Travel", "Trey Research",
];

const VENDOR_NAMES = [
  "Acme Supplies", "Global Materials Co", "Pacific Trading", "Summit Components",
  "Reliable Parts Ltd", "Prime Logistics", "Atlas Manufacturing", "Cascade Freight",
  "Apex Distribution", "Pinnacle Services", "Core Components", "Sterling Supply",
];

const PRODUCT_NAMES = [
  "Surface Pro 10", "Office Chair Standard", "Wireless Keyboard", "USB-C Hub",
  "27\" Monitor", "Laptop Stand", "Noise-Canceling Headset", "Webcam HD",
  "Desk Lamp LED", "Ergonomic Mouse", "Docking Station", "Cable Kit",
  "Battery Pack", "Smart Board 65\"", "Conference Phone", "Network Switch",
];

const WAREHOUSE_IDS = ["WH-01", "WH-02", "WH-03", "WH-MAIN", "WH-EAST", "WH-WEST"];
const SITE_IDS = ["SITE-1", "SITE-2", "SITE-HQ", "SITE-MFG"];
const CURRENCIES = ["USD", "EUR", "GBP", "CAD"];
const STATUSES = ["Open", "Confirmed", "Invoiced", "Delivered", "Cancelled"];
const PO_STATUSES = ["Open", "Received", "Confirmed", "Invoiced"];
const ACCOUNT_TYPES = ["Profit and loss", "Balance sheet", "Revenue", "Expense", "Asset"];
const WORKER_TYPES = ["Employee", "Contractor", "Independent contractor"];

function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(startYear = 2024, endYear = 2026): string {
  const y = randomInt(startYear, endYear);
  const m = String(randomInt(1, 12)).padStart(2, "0");
  const d = String(randomInt(1, 28)).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function randomAmount(): number {
  return Math.round(randomInt(100, 50000) * 100) / 100;
}

function randomQty(): number {
  return randomInt(1, 500);
}

function generateRecordForEntity(entitySet: string, index: number): Record<string, unknown> {
  const id = String(index + 1).padStart(4, "0");

  switch (entitySet) {
    case "CustomersV3":
      return {
        CustomerAccount: `US-${id}`,
        OrganizationName: CUSTOMER_NAMES[index % CUSTOMER_NAMES.length],
        CustomerGroupId: `CG-${randomInt(10, 40)}`,
        SalesCurrencyCode: randomFrom(CURRENCIES),
        InvoiceAccount: `US-${id}`,
        dataAreaId: "USMF",
      };

    case "VendorsV2":
      return {
        VendorAccountNumber: `V-${id}`,
        VendorOrganizationName: VENDOR_NAMES[index % VENDOR_NAMES.length],
        VendorGroupId: `VG-${randomInt(10, 30)}`,
        DefaultPaymentDayName: "Net30",
        dataAreaId: "USMF",
      };

    case "ReleasedProductsV2":
      return {
        ItemNumber: `D${id}`,
        ProductName: PRODUCT_NAMES[index % PRODUCT_NAMES.length],
        ProductType: randomFrom(["Item", "Service"]),
        ItemModelGroupId: `STD`,
        ItemGroupId: `IG-${randomInt(1, 10)}`,
        dataAreaId: "USMF",
      };

    case "SalesOrderHeadersV2":
      return {
        SalesOrderNumber: `SO-${id}`,
        OrderingCustomerAccountNumber: `US-${String(randomInt(1, 16)).padStart(4, "0")}`,
        InvoiceCustomerAccountNumber: `US-${String(randomInt(1, 16)).padStart(4, "0")}`,
        SalesOrderStatus: randomFrom(STATUSES),
        RequestedShippingDate: randomDate(),
        dataAreaId: "USMF",
      };

    case "SalesOrderLinesV2":
      return {
        SalesOrderNumber: `SO-${String(randomInt(1, 20)).padStart(4, "0")}`,
        LineNumber: index + 1,
        ItemNumber: `D${String(randomInt(1, 16)).padStart(4, "0")}`,
        OrderedSalesQuantity: randomQty(),
        SalesPrice: randomAmount(),
        LineAmount: randomAmount(),
        dataAreaId: "USMF",
      };

    case "PurchaseOrderHeadersV2":
      return {
        PurchaseOrderNumber: `PO-${id}`,
        OrderVendorAccountNumber: `V-${String(randomInt(1, 12)).padStart(4, "0")}`,
        PurchaseOrderStatus: randomFrom(PO_STATUSES),
        AccountingDate: randomDate(),
        dataAreaId: "USMF",
      };

    case "PurchaseOrderLinesV2":
      return {
        PurchaseOrderNumber: `PO-${String(randomInt(1, 20)).padStart(4, "0")}`,
        LineNumber: index + 1,
        ItemNumber: `D${String(randomInt(1, 16)).padStart(4, "0")}`,
        OrderedPurchaseQuantity: randomQty(),
        PurchasePrice: randomAmount(),
        dataAreaId: "USMF",
      };

    case "MainAccounts":
      return {
        MainAccountId: `${randomInt(100000, 999999)}`,
        Name: `Account ${id}`,
        MainAccountType: randomFrom(ACCOUNT_TYPES),
        ChartOfAccounts: "COA",
        dataAreaId: "USMF",
      };

    case "GeneralJournalHeaders":
      return {
        JournalBatchNumber: `GJ-${id}`,
        JournalName: `GenJrn`,
        Description: `Journal batch ${id}`,
        PostedDateTime: randomDate(),
        dataAreaId: "USMF",
      };

    case "InventorySitesOnHandV2":
      return {
        ItemNumber: `D${String(randomInt(1, 16)).padStart(4, "0")}`,
        ProductName: PRODUCT_NAMES[index % PRODUCT_NAMES.length],
        AvailableOnHandQuantity: randomQty(),
        OnOrderQuantity: randomQty(),
        WarehouseId: randomFrom(WAREHOUSE_IDS),
        dataAreaId: "USMF",
      };

    case "InventWarehouses":
      return {
        WarehouseId: WAREHOUSE_IDS[index % WAREHOUSE_IDS.length] ?? `WH-${id}`,
        WarehouseName: `Warehouse ${index + 1}`,
        InventSiteId: randomFrom(SITE_IDS),
        dataAreaId: "USMF",
      };

    case "InventSites":
      return {
        SiteId: SITE_IDS[index % SITE_IDS.length] ?? `SITE-${id}`,
        SiteName: `Site ${index + 1}`,
        dataAreaId: "USMF",
      };

    case "Workers":
      return {
        PersonnelNumber: `EMP-${id}`,
        KnownAs: `Worker ${index + 1}`,
        NameAlias: `W${id}`,
        WorkerType: randomFrom(WORKER_TYPES),
      };

    case "Employees":
      return {
        PersonnelNumber: `EMP-${id}`,
        KnownAs: `Employee ${index + 1}`,
        Company: "USMF",
        EmploymentStartDate: randomDate(2018, 2024),
      };

    case "LegalEntities":
      return {
        LegalEntityId: ["USMF", "DEMF", "DAT", "USSI"][index % 4] ?? `LE-${id}`,
        Name: [`Contoso US`, `Contoso DE`, `Default Company`, `Contoso Services`][index % 4] ?? `Entity ${id}`,
        CompanyType: "Organization",
        AddressCountryRegionId: ["US", "DE", "US", "US"][index % 4] ?? "US",
      };

    case "NumberSequences":
      return {
        NumberSequenceCode: `NS-${id}`,
        NumberSequenceName: `Sequence ${id}`,
        NumberSequenceScope: randomFrom(["Shared", "Company"]),
        dataAreaId: "USMF",
      };

    default:
      return { dataAreaId: "USMF", Id: id };
  }
}

/**
 * Generate sample records for an entity set.
 * Returns records shaped to match the entity catalog's defaultSelect fields.
 */
export function generateSampleData(
  entitySet: string,
  count = 25,
): Record<string, unknown>[] {
  const entry = ENTITY_CATALOG[entitySet];
  if (!entry) return [];

  const records: Record<string, unknown>[] = [];
  for (let i = 0; i < count; i++) {
    records.push(generateRecordForEntity(entitySet, i));
  }
  return records;
}

/**
 * Build grid column definitions from an entity catalog entry's defaultSelect.
 */
export function buildColumnsFromCatalog(entry: EntityCatalogEntry) {
  return entry.defaultSelect.map((fieldName, i) => ({
    name: fieldName,
    label: fieldName
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (s) => s.toUpperCase())
      .trim(),
    type: "text" as const,
    sortable: true,
    filterable: entry.searchFields.includes(fieldName),
    order: i,
  }));
}
