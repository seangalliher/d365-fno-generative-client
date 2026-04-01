/**
 * D365 Finance & Operations type definitions.
 * Ported from D365-erp-cli/pkg/types/response.go
 */

// --- Response Envelope ---

export interface D365Response<T = unknown> {
  readonly success: boolean;
  readonly command: string;
  readonly data?: T;
  readonly error?: ErrorInfo;
  readonly metadata?: ResponseMetadata;
}

export interface ErrorInfo {
  readonly code: ErrorCode;
  readonly message: string;
  readonly suggestion?: string;
  readonly details?: string;
}

export interface ResponseMetadata {
  readonly duration_ms: number;
  readonly company?: string;
  readonly environment?: string;
  readonly timestamp: string;
  readonly version?: string;
}

// --- Error Codes ---

export const ERROR_CODES = {
  CONNECTION_ERROR: "CONNECTION_ERROR",
  AUTH_ERROR: "AUTH_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  TIMEOUT: "TIMEOUT",
  SERVER_ERROR: "SERVER_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  SESSION_REQUIRED: "SESSION_REQUIRED",
  FORM_REQUIRED: "FORM_REQUIRED",
  DAEMON_ERROR: "DAEMON_ERROR",
  GUARDRAIL_BLOCK: "GUARDRAIL_BLOCK",
  GUARDRAIL_WARN: "GUARDRAIL_WARN",
  ODATA_ERROR: "ODATA_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// --- Form Types ---

export interface FormState {
  readonly form_name: string;
  readonly controls?: FormControl[];
  readonly is_dirty: boolean;
}

export interface FormControl {
  readonly name: string;
  readonly type: string;
  readonly label?: string;
  readonly value?: string;
  readonly is_enabled: boolean;
  readonly is_lookup?: boolean;
}

// --- Entity / OData Types ---

export interface EntityType {
  readonly name: string;
  readonly collection_name: string;
  readonly description?: string;
  readonly is_public: boolean;
  readonly is_read_only: boolean;
}

export interface EntityField {
  readonly name: string;
  readonly type: EntityFieldType;
  readonly nullable: boolean;
  readonly max_length?: number;
  readonly is_key?: boolean;
  readonly is_read_only?: boolean;
  readonly is_required?: boolean;
  readonly is_editable_on_create?: boolean;
  readonly enum_type?: string;
  readonly enum_namespace?: string;
  readonly description?: string;
}

export type EntityFieldType =
  | "String"
  | "Int32"
  | "Int64"
  | "Decimal"
  | "Double"
  | "Boolean"
  | "DateTimeOffset"
  | "Guid"
  | "Enum"
  | "Binary";

export interface EntityMetadata {
  readonly name: string;
  readonly entity_set_name: string;
  readonly fields: Record<string, EntityField>;
  readonly keys?: string[];
  readonly enum_values?: Record<string, EnumValue[]>;
  readonly relationships?: Relationship[];
}

export interface EnumValue {
  readonly name: string;
  readonly value: number;
}

export interface Relationship {
  readonly name: string;
  readonly target: string;
  readonly cardinality: "ExactlyOne" | "ZeroOrOne" | "ZeroOrMore";
  readonly join_conditions?: JoinCondition[];
}

export interface JoinCondition {
  readonly source_field: string;
  readonly target_field: string;
}

// --- OData Query ---

export interface ODataQueryOptions {
  filter?: string;
  select?: string;
  expand?: string;
  top?: number;
  skip?: number;
  orderby?: string;
  count?: boolean;
  crossCompany?: boolean;
}

export interface ODataResult<T = Record<string, unknown>> {
  readonly value: T[];
  readonly nextLink?: string;
  readonly count?: number;
}

export interface ODataUpdate {
  readonly odataPath: string;
  readonly updatedFieldValues: Record<string, unknown>;
}

// --- Action Types ---

export interface ActionInfo {
  readonly name: string;
  readonly label?: string;
  readonly description?: string;
  readonly parameters?: ActionParameter[];
}

export interface ActionParameter {
  readonly name: string;
  readonly type: string;
  readonly required: boolean;
  readonly enum_type?: string;
  readonly description?: string;
  readonly is_optional?: boolean;
}

// --- Menu Types ---

export interface D365MenuItem {
  readonly name: string;
  readonly label?: string;
  readonly type: "Display" | "Action";
}

export interface MenuSearchResult {
  readonly sessionId: string;
  readonly company: string;
  readonly displayItems: D365MenuItem[];
  readonly actionItems: D365MenuItem[];
}

// --- Connection ---

export interface ConnectionStatus {
  readonly connected: boolean;
  readonly environment?: string;
  readonly user?: string;
  readonly company?: string;
  readonly token_expiry?: string;
  readonly daemon_pid?: number;
  readonly active_form?: string;
}

// --- Guardrails ---

export interface GuardrailResult {
  readonly rule: string;
  readonly severity: "error" | "warn" | "info";
  readonly message: string;
  readonly suggestion?: string;
  readonly blocked: boolean;
}

export interface GuardrailContext {
  readonly command: string;
  readonly entityPath: string;
  readonly queryString: string;
  readonly company: string;
  readonly hasConfirm: boolean;
  readonly body: Record<string, unknown> | null;
}
