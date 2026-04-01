/**
 * Generated form schema types.
 * The LLM produces a GeneratedForm JSON; the DynamicForm renderer interprets it.
 */

export type FormFieldType =
  | "text"
  | "number"
  | "date"
  | "datetime"
  | "boolean"
  | "enum"
  | "lookup"
  | "currency"
  | "memo";

export type FormLayoutType = "tabbed" | "single-page" | "wizard";
export type DataSourceType = "odata" | "form-daemon" | "mcp";

// --- Core Schema ---

export interface GeneratedForm {
  readonly id: string;
  readonly entitySet: string;
  readonly menuItemName: string;
  readonly menuItemType: "Display" | "Action";
  readonly title: string;
  readonly description: string;
  readonly version: number;
  readonly generatedAt: string;
  readonly metadataHash: string;

  readonly layout: FormLayout;
  readonly fields: FormField[];
  readonly grids: FormGrid[];
  readonly actions: FormAction[];
  readonly lookups: FormLookupConfig[];
  readonly navigation: FormNavigation[];

  readonly dataSource: FormDataSource;
}

export interface FormLayout {
  readonly type: FormLayoutType;
  readonly tabs: FormTab[];
}

export interface FormTab {
  readonly name: string;
  readonly label: string;
  readonly fields: string[];
  readonly grids?: string[];
  readonly order: number;
}

// --- Fields ---

export interface FormField {
  readonly name: string;
  readonly label: string;
  readonly type: FormFieldType;
  readonly group: string;
  readonly required: boolean;
  readonly readOnly: boolean;
  readonly maxLength?: number;
  readonly enumValues?: FormEnumOption[];
  readonly lookupEntity?: string;
  readonly lookupDisplayField?: string;
  readonly lookupValueField?: string;
  readonly defaultValue?: unknown;
  readonly helpText?: string;
  readonly order: number;
  readonly isKey?: boolean;
  readonly currencyCode?: string;
}

export interface FormEnumOption {
  readonly value: string;
  readonly label: string;
}

// --- Grids ---

export interface FormGrid {
  readonly name: string;
  readonly title: string;
  readonly entitySet: string;
  readonly columns: GridColumn[];
  readonly filterableColumns: string[];
  readonly sortableColumns: string[];
  readonly parentFieldMapping?: Record<string, string>;
  readonly defaultSort?: { column: string; direction: "asc" | "desc" };
  readonly pageSize?: number;
}

export interface GridColumn {
  readonly name: string;
  readonly label: string;
  readonly type: FormFieldType;
  readonly width?: number;
  readonly sortable?: boolean;
  readonly filterable?: boolean;
}

// --- Actions ---

export interface FormAction {
  readonly name: string;
  readonly label: string;
  readonly icon?: string;
  readonly variant: "primary" | "secondary" | "destructive" | "ghost";
  readonly requiresSelection?: boolean;
  readonly confirmMessage?: string;
  readonly apiAction?: string;
  readonly order: number;
}

// --- Lookups ---

export interface FormLookupConfig {
  readonly fieldName: string;
  readonly entitySet: string;
  readonly displayField: string;
  readonly valueField: string;
  readonly searchFields: string[];
  readonly additionalColumns?: string[];
  readonly filter?: string;
}

// --- Navigation ---

export interface FormNavigation {
  readonly label: string;
  readonly targetMenuItemName: string;
  readonly targetMenuItemType: "Display" | "Action";
  readonly foreignKeyField: string;
  readonly icon?: string;
}

// --- Data Source ---

export interface FormDataSource {
  readonly type: DataSourceType;
  readonly entitySet?: string;
  readonly menuItemName?: string;
  readonly mcpTools?: string[];
}

// --- Form State (Runtime) ---

export interface FormValues {
  [fieldName: string]: unknown;
}

export interface FormValidationError {
  readonly field: string;
  readonly message: string;
}

export interface FormDirtyState {
  readonly isDirty: boolean;
  readonly changedFields: Set<string>;
  readonly originalValues: FormValues;
}

// --- Generation Status ---

export type GenerationStep =
  | "checking-cache"
  | "fetching-metadata"
  | "generating"
  | "validating"
  | "caching"
  | "ready"
  | "error";

export interface GenerationStatus {
  readonly step: GenerationStep;
  readonly progress: number;
  readonly message: string;
  readonly error?: string;
}
