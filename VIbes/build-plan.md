# D365 JIT Generative Client — Phased Build Plan

## Pre-Plan: Gap Analysis & Prior Work Absorption

### Prior Work to Absorb (Do Not Rebuild)

The following assets exist and should be directly consumed, not recreated:

| Asset | Source | What It Gives Us |
|-------|--------|-----------------|
| **Starter template** | `microsoft/PowerAppsCodeApps/templates/starter` | React 19, Vite 7, Tailwind CSS v4, TanStack Query v5, TanStack Table v8, React Router v7, Zustand v5, Recharts, 20 shadcn/ui components, router basename normalization |
| **Dataverse sample architecture** | `microsoft/PowerAppsCodeApps/samples/Dataverse` | Three-layer pattern (Presentation → Hooks → Generated Services), lookup resolution, CRUD hooks, confirmation dialogs |
| **FluentSample multi-connector wiring** | `microsoft/PowerAppsCodeApps/samples/FluentSample` | `useConnector()` pattern, mock-data-first dev flow, lazy loading with `React.lazy()`, pagination hook |
| **D365 type definitions** | `seangalliher/D365-erp-cli/pkg/types/response.go` | TypeScript interfaces for Response, FormState, FormControl, EntityMetadata, EntityField, ErrorCodes, GuardrailResult, ConnectionStatus, BatchCommand/Result |
| **Common entity catalog** | `seangalliher/D365-erp-cli/cmd/agent_prompt.go` | 24 pre-curated D365 entities (Customers, Vendors, SalesOrderHeaders, PurchaseOrderHeaders, MainAccounts, Workers, etc.) with entity set names, descriptions, key fields |
| **Guardrail rules** | `seangalliher/D365-erp-cli/internal/guardrails/` | 5 validation rules: cross-company-required, select-recommended, delete-requires-confirm, wide-query-warning, enum-format |
| **Daemon protocol spec** | `seangalliher/D365-erp-cli/internal/daemon/protocol.go` | 16 typed command definitions that map 1:1 to ERP MCP Server form tools |
| **ERP MCP Server** | Already deployed | Full form automation (14 form tools), OData CRUD (5 data tools), API actions (2 tools) — no backend to build |
| **Fluent UI v9 → D365 mapping** | Research output | Complete mapping of 30+ D365 form control types to specific Fluent UI v9 components and hooks |

### Gaps Identified (Must Address in the Plan)

| # | Gap | Impact | Resolution |
|---|-----|--------|------------|
| 1 | **No schema-driven form renderer exists** in Fluent UI v9 or shadcn/ui | Must build the core form renderer from scratch | Phase 2 — build `DynamicForm` component with field-type dispatcher |
| 2 | **UI framework decision: shadcn/ui vs Fluent UI v9** | Starter template ships shadcn/ui + Tailwind; D365 ecosystem uses Fluent UI | **Decision: Use shadcn/ui** (starter template, lighter weight, Tailwind composability). Add Fluent UI only for DataGrid and Nav if shadcn equivalents are insufficient |
| 3 | **Entity discovery is fuzzy** — MCP `data_find_entity_type` returns imprecise results ("sales" → FiscalYears) | Menu-to-entity mapping will be unreliable if purely search-driven | Ship a curated entity catalog (from D365-erp-cli's 24 entities + extensions) as the primary mapping; use MCP discovery as fallback |
| 4 | **Custom API catalog is sparse** — `api_find_actions` only surfaces registered custom APIs, not core operations like posting journals or confirming orders | Users will expect to run core business processes | Phase 4 — Build a curated action catalog for common operations (post journal, confirm SO, confirm PO, run MRP, etc.) with known API paths |
| 5 | **Lookup fields require different MCP tools** than regular fields (`form_open_lookup` vs `form_set_control_values`) | LLM-generated forms must distinguish lookup fields from regular fields | Entity metadata provides `is_lookup` flag; form schema must capture this and the renderer must route accordingly |
| 6 | **No deep insert/update in OData** — Creating a sales order with lines requires separate calls | Multi-entity forms need orchestrated multi-step transactions | Form submission service must sequence parent-then-child creates with error rollback |
| 7 | **Company context management** — MCP tools default to different companies; `cross-company=true` must be explicit | Data queries could silently return wrong-company data | Global company context in Zustand store, injected into every MCP/OData call |
| 8 | **D365 grid filtering uses proprietary syntax** — Range (`12..14`), comparison (`<12`), `SysQueryRangeUtil` functions | Users expect natural-language filtering; LLM must translate | Include D365 filter syntax reference in LLM prompt context |
| 9 | **Enum fields require namespace-qualified values** in OData queries (`Microsoft.Dynamics.DataEntities.Status'Active'`) | Queries will fail silently if namespace is missing | Metadata service must fetch and cache enum namespaces; guardrail warns on numeric enum values |
| 10 | **Form sessions are stateful and non-parallelizable** — MCP form tools are session-bound | Cannot open multiple forms simultaneously via form daemon | Queue form operations; use OData for read-only scenarios where possible |
| 11 | **LLM provider not specified** | Need to choose and integrate an LLM for form generation | **Decision: Azure OpenAI** (stays in Azure ecosystem, Entra auth, enterprise compliance). Abstract behind a provider interface for future flexibility |
| 12 | **Cache invalidation strategy undefined** | Entity schemas change with D365 updates; cached forms could become stale | Version form definitions; allow manual regeneration; compare metadata hash on load |
| 13 | **No testing strategy** | Code Apps support Playwright E2E tests | Include E2E test scaffolding from Phase 1; mock MCP responses for unit tests |
| 14 | **Browser-only constraint** | Power Apps Code Apps don't run in the mobile app | Ensure responsive design for tablet use; document the limitation |

---

## Phase 1: Project Foundation & Shell

**Goal:** Scaffolded Code App with navigation shell, D365 connectivity, and caching infrastructure. User can see the module menu and navigate — but no forms yet.

**Duration estimate: Sprint 1–2**

### 1.1 Project Scaffolding

- [ ] Scaffold from starter template: `npx degit microsoft/PowerAppsCodeApps/templates/starter d365-gen-client`
- [ ] Initialize Code App: `pac code init --displayname "D365 Generative Client"`
- [ ] Verify local dev server: `npm run dev`
- [ ] Confirm router basename normalization works (from starter's `router.tsx`)
- [ ] Add path aliases (`@/components`, `@/services`, `@/hooks`, `@/types`, `@/store`)

**Inherited from starter:** React 19, TypeScript 5.9, Vite 7, Tailwind CSS v4, TanStack Query v5, React Router v7, Zustand v5, shadcn/ui (20 components), sonner toasts.

### 1.2 Type System Foundation

- [ ] Create `src/types/d365.ts` — Port the D365-erp-cli types to TypeScript:
  - `Response`, `ErrorInfo`, `Metadata` (response envelope)
  - `FormState`, `FormControl` (form daemon types)
  - `EntityType`, `EntityField`, `EntityMetadata`, `EnumValue`, `Relationship` (OData metadata)
  - `ActionInfo`, `ActionParameter` (API action types)
  - `MenuItem` (menu discovery)
  - `ErrorCodes` constant map
- [ ] Create `src/types/form.ts` — Form generation schema:
  - `GeneratedForm`, `FormField`, `FormGrid`, `FormLayout`, `FormAction`, `FormLookup`, `FormNavigation`
  - `GridColumn`, `FormTab`
- [ ] Create `src/types/menu.ts` — Menu structure types:
  - `MenuCache`, `MenuModule`, `MenuItem`, `ModuleTaxonomy`

### 1.3 D365 Connectivity Layer

- [ ] Create `src/services/mcp/erpMcpClient.ts` — Typed wrapper around ERP MCP Server tools:
  - `findEntityTypes(search: string): Promise<EntityMatch[]>`
  - `getEntityMetadata(entitySet: string, options?: MetadataOptions): Promise<EntityMetadata>`
  - `findEntities(entitySet: string, queryOptions: string): Promise<ODataResult>`
  - `createEntities(entitySet: string, data: Record<string, any>[]): Promise<any>`
  - `updateEntities(updates: ODataUpdate[]): Promise<any>`
  - `deleteEntities(paths: string[]): Promise<void>`
  - `findMenuItems(filter: string, options?: { company?: string; maxResults?: number }): Promise<MenuItem[]>`
  - `openForm(name: string, type: 'Display' | 'Action', company?: string): Promise<FormState>`
  - `closeForm(): Promise<void>`
  - `saveForm(): Promise<void>`
  - `getFormState(): Promise<FormState>`
  - `clickControl(controlName: string, actionId?: string): Promise<FormState>`
  - `setControlValues(values: { controlName: string; value: string }[]): Promise<FormState>`
  - `openLookup(lookupName: string): Promise<any>`
  - `openOrCloseTab(tabName: string, action: 'Open' | 'Close'): Promise<FormState>`
  - `filterGrid(gridName: string, column: string, value?: string): Promise<FormState>`
  - `selectGridRow(gridName: string, row: number, marking?: 'Marked' | 'Unmarked'): Promise<FormState>`
  - `sortGrid(gridName: string, column: string, direction: 'Ascending' | 'Descending'): Promise<FormState>`
  - `findControls(search: string): Promise<FormControl[]>`
  - `findActions(search: string): Promise<ActionInfo[]>`
  - `invokeAction(name: string, params: Record<string, any>, company?: string): Promise<any>`
- [ ] Create `src/services/d365/odataService.ts` — Direct OData client (for scenarios bypassing MCP):
  - Query builder with guardrails (auto-inject `cross-company=true`, warn on missing `$select`)
  - Retry with exponential backoff on 429/5xx
  - OData error response parsing
- [ ] Create `src/services/d365/metadataService.ts` — Entity metadata caching layer:
  - Fetch metadata via MCP `data_get_entity_metadata`
  - Cache in IndexedDB with TTL (24 hours default)
  - Parse field types, constraints, enum values, relationships

### 1.4 Caching Infrastructure

- [ ] Create `src/services/cache/indexedDbCache.ts` — Generic IndexedDB wrapper:
  - `get<T>(store: string, key: string): Promise<T | null>`
  - `set<T>(store: string, key: string, value: T, ttl?: number): Promise<void>`
  - `delete(store: string, key: string): Promise<void>`
  - `clear(store: string): Promise<void>`
  - `getAll<T>(store: string): Promise<T[]>`
- [ ] Create `src/services/cache/formCache.ts` — Form definition storage:
  - Store: `generatedForms` keyed by `entitySet:menuItemType`
  - Methods: `getCachedForm()`, `cacheForm()`, `invalidateForm()`, `listCachedForms()`
- [ ] Create `src/services/cache/menuCache.ts` — Menu structure storage:
  - Store: `menuStructure` (single keyed entry)
  - Methods: `getCachedMenu()`, `cacheMenu()`, `invalidateMenu()`
- [ ] Create `src/services/cache/metadataCache.ts` — Entity metadata storage:
  - Store: `entityMetadata` keyed by entity set name
  - Methods: `getCachedMetadata()`, `cacheMetadata()`, with TTL check

### 1.5 Global State Management

- [ ] Create `src/store/appState.ts` (Zustand):
  - `currentCompany: string` (default from user profile or 'USMF')
  - `currentModule: string | null`
  - `currentMenuItem: MenuItem | null`
  - `setCompany()`, `setModule()`, `setMenuItem()`
- [ ] Create `src/store/navigationHistory.ts` (Zustand):
  - `history: NavigationEntry[]`
  - `push()`, `back()`, `forward()`, `current()`

### 1.6 Application Shell

- [ ] Create `src/components/shell/AppShell.tsx` — Root layout:
  - Left rail: module navigation (collapsible)
  - Top bar: company selector, global search, breadcrumb
  - Content area: routed outlet
- [ ] Create `src/components/shell/ModuleNav.tsx` — Module navigation sidebar:
  - Render module list from curated taxonomy
  - Highlight active module
  - Collapse/expand toggle
  - Show form-cached indicators per menu item
- [ ] Create `src/components/shell/MenuPanel.tsx` — Menu items within selected module:
  - List menu items for the selected module
  - Show "cached" badge for items with generated forms
  - Click handler routes to form view
- [ ] Create `src/components/shell/CompanySelector.tsx` — Company/legal entity picker:
  - Fetch legal entities via OData `LegalEntities`
  - Store selection in Zustand + localStorage
- [ ] Create `src/components/shell/GlobalSearch.tsx` — Search across menu items:
  - Client-side fuzzy search over cached menu structure
  - MCP `form_find_menu_item` for server-side search
- [ ] Create `src/components/shell/Breadcrumb.tsx` — Navigation breadcrumb

### 1.7 Menu System

- [ ] Create `src/data/moduleTaxonomy.ts` — Curated D365 module structure:
  ```typescript
  const MODULE_TAXONOMY: MenuModule[] = [
    {
      id: 'general-ledger', label: 'General Ledger', icon: 'book',
      items: [
        { menuItemName: 'LedgerJournalTable', menuItemType: 'Display', label: 'General journals' },
        { menuItemName: 'MainAccountListPage', menuItemType: 'Display', label: 'Main accounts' },
        // ...
      ]
    },
    {
      id: 'accounts-receivable', label: 'Accounts Receivable', icon: 'users',
      items: [
        { menuItemName: 'CustTableListPage', menuItemType: 'Display', label: 'All customers' },
        { menuItemName: 'SalesTableListPage', menuItemType: 'Display', label: 'All sales orders' },
        // ...
      ]
    },
    // Accounts Payable, Procurement, Inventory, Production, HR, etc.
  ];
  ```
- [ ] Create `src/data/entityCatalog.ts` — Port of D365-erp-cli's 24 common entities + extensions:
  - Entity set name, description, key fields, related entities, default `$select` fields
  - Menu item → entity set mapping
- [ ] Create `src/hooks/useMenuStructure.ts` — Hook to load menu:
  - Try cache first
  - If empty, load from curated taxonomy + enrich with MCP `form_find_menu_item`
  - Cache the merged result
  - Track access counts and last-accessed timestamps per item

### 1.8 Routing

- [ ] Define routes in `src/router.tsx`:
  - `/` → Dashboard (recently accessed, popular items)
  - `/module/:moduleId` → Module menu panel
  - `/form/:menuItemName` → Dynamic form view (Phase 2)
  - `/list/:entitySet` → Entity list view (Phase 2)
  - `/settings` → App settings (company, theme, cache management)

### Phase 1 Exit Criteria
- [ ] App loads in browser with module navigation sidebar
- [ ] User can browse all modules and see menu items
- [ ] Company selector works and persists choice
- [ ] Global search finds menu items
- [ ] IndexedDB caching layer stores and retrieves data
- [ ] MCP client successfully calls `form_find_menu_item` and `data_find_entity_type`
- [ ] `pac code push` deploys to Power Platform successfully

---

## Phase 2: Dynamic Form Generation Engine

**Goal:** Users click a menu item and a form is generated by the LLM, rendered dynamically, and cached for reuse. CRUD operations work against D365.

**Duration estimate: Sprint 3–5**

### 2.1 LLM Integration

- [ ] Create `src/services/llm/llmClient.ts` — Azure OpenAI client:
  - Abstracted behind a `FormGenerationProvider` interface for future flexibility
  - `generateFormSchema(prompt: string): Promise<GeneratedForm>`
  - `categorizeMenuItems(items: MenuItem[]): Promise<CategorizedItems>`
  - Token usage tracking
  - Error handling with retry (429 rate limits)
  - Configurable model (GPT-4o default, GPT-4o-mini for simpler tasks)
- [ ] Create `src/services/llm/promptTemplates.ts` — Prompt templates:
  - `buildFormGenerationPrompt(metadata: EntityMetadata, menuItem: MenuItem, context: AppContext): string`
  - Include: entity fields with types/constraints, relationships, menu item name (for business context), the `GeneratedForm` TypeScript interface as expected output schema, D365 UX conventions reference
  - Token budget management: only send relevant metadata fields (skip system fields, audit fields)
- [ ] Create `src/services/llm/responseParser.ts` — LLM response validation:
  - Parse JSON from LLM response (handle markdown code blocks, partial responses)
  - Validate all field names exist in entity metadata
  - Validate field types are compatible
  - Validate required fields are present
  - Validate lookup configurations reference valid entities
  - Return validation errors for fallback handling

### 2.2 Form Generation Service

- [ ] Create `src/services/generation/formGenerationService.ts` — Orchestrator:
  1. Check form cache → return immediately if cached
  2. Fetch entity metadata via MCP (with metadata cache)
  3. Resolve menu item context via curated catalog or MCP
  4. Build LLM prompt from template
  5. Call LLM for form schema generation
  6. Validate the generated schema against metadata
  7. Cache the validated form definition
  8. Return the form definition for rendering
- [ ] Create `src/hooks/useGeneratedForm.ts` — React hook:
  - `const { form, isGenerating, isCached, error, regenerate } = useGeneratedForm(menuItemName, menuItemType)`
  - States: `loading-cache` → `generating` → `validating` → `ready` | `error`
  - Expose `regenerate()` to force re-generation

### 2.3 Dynamic Form Renderer

- [ ] Create `src/components/form-renderer/DynamicForm.tsx` — Main renderer:
  - Accepts `GeneratedForm` schema as prop
  - Manages form data state (field values, dirty tracking)
  - Renders layout (tabbed, single-page, or wizard based on `layout.type`)
  - Renders toolbar (save, delete, new, close)
  - Coordinates data loading (for edit mode) and submission
- [ ] Create `src/components/form-renderer/FieldRenderer.tsx` — Field type dispatcher:
  - Maps `FormField.type` to the corresponding field component
  - Wraps each field in a label/validation container
  - Handles `readOnly`, `required`, `disabled` states
- [ ] Create individual field components in `src/components/form-renderer/fields/`:
  - [ ] `TextField.tsx` — shadcn Input for `text` type
  - [ ] `NumberField.tsx` — shadcn Input with `type="number"` for `number` type
  - [ ] `DateField.tsx` — Date picker (shadcn Calendar + Popover) for `date` / `datetime` types
  - [ ] `EnumField.tsx` — shadcn Select for `enum` type (populated from `enumValues`)
  - [ ] `LookupField.tsx` — Combobox with async search for `lookup` type:
    - Debounced search via OData `$filter` on the lookup entity
    - Display `lookupDisplayField` in dropdown
    - Store the key value on selection
  - [ ] `BooleanField.tsx` — shadcn Checkbox or Switch for `boolean` type
  - [ ] `CurrencyField.tsx` — Formatted number input with currency symbol for `currency` type
  - [ ] `MemoField.tsx` — shadcn Textarea for `memo` type
- [ ] Create `src/components/form-renderer/TabLayout.tsx` — Tabbed form layout:
  - Render tabs from `GeneratedForm.layout.tabs`
  - Show fields belonging to each tab
  - Support collapsible sections within tabs (FastTab style)
- [ ] Create `src/components/form-renderer/FormToolbar.tsx` — Action bar:
  - Save, Delete, New, Close buttons
  - Contextual actions from `GeneratedForm.actions`
  - Dirty state indicator
  - Confirmation dialog for destructive actions

### 2.4 Grid/List Renderer

- [ ] Create `src/components/form-renderer/GridRenderer.tsx` — Embedded data grid:
  - Uses TanStack Table v8 (already in starter template)
  - Column definitions from `FormGrid.columns`
  - Data fetching via OData with `$filter`, `$select`, `$orderby`, `$top`, `$skip`
  - Pagination controls
  - Column sorting (client → OData `$orderby`)
  - Column filtering (filter input → OData `$filter` or MCP `form_filter_grid`)
  - Row selection with checkbox column
  - Click row to open detail form (navigate to `/form/:entitySet/:key`)

### 2.5 Data Operations (CRUD)

- [ ] Create `src/services/data/formDataService.ts` — CRUD routing:
  - Determine data channel based on `GeneratedForm.dataSource.type`:
    - `odata` → Direct OData calls via `odataService`
    - `form-daemon` → Stateful operations via MCP form tools
    - `mcp` → MCP data tools
  - `loadRecord(entitySet, keys): Promise<Record<string, any>>`
  - `saveRecord(entitySet, keys?, data): Promise<Record<string, any>>` (create if no keys, update if keys)
  - `deleteRecord(entitySet, keys): Promise<void>` (with confirmation guardrail)
  - `queryRecords(entitySet, queryOptions): Promise<{ records: any[]; nextLink?: string; count?: number }>`
- [ ] Create `src/hooks/useEntityData.ts` — TanStack Query-backed data hook:
  - `const { data, isLoading, error, save, remove, refetch } = useEntityData(entitySet, keys?)`
  - Integrates with TanStack Query for caching, background refresh, optimistic updates
- [ ] Implement guardrail checks in the data service:
  - Port D365-erp-cli's 5 guardrail rules to TypeScript
  - Run before every OData operation
  - Show warnings via toast notifications (sonner)
  - Block dangerous operations (delete without confirm, cross-company violation)

### 2.6 Form Generation UX

- [ ] Create `src/components/generation/FormGenerationProgress.tsx`:
  - Step indicator: "Fetching metadata..." → "Generating form layout..." → "Validating..." → "Ready"
  - Skeleton loader showing approximate form shape during generation
  - Estimated time (track and display average generation time)
- [ ] Create `src/components/generation/FormFallback.tsx`:
  - Level 1: Render basic auto-form from OData metadata (all fields, alphabetical, no grouping)
  - Level 2: Raw data table with inline editing
  - Shown when LLM generation fails
  - "Try regenerating" button

### 2.7 Entity List View

- [ ] Create `src/pages/EntityListPage.tsx`:
  - Route: `/list/:entitySet`
  - Full-page data grid for browsing entity records
  - Column definitions generated from entity metadata (or cached form's grid definition)
  - Click row → navigate to form view for that record
  - New button → navigate to form view in create mode
  - Export selection (Phase 4)

### Phase 2 Exit Criteria
- [ ] User clicks a menu item → LLM generates a form → form renders with correct fields and layout
- [ ] Generated form is cached in IndexedDB → second visit loads instantly without LLM call
- [ ] All 8 field types render correctly (text, number, date, enum, lookup, boolean, currency, memo)
- [ ] User can create a new record via the generated form (OData POST)
- [ ] User can edit an existing record (OData PATCH)
- [ ] User can delete a record with confirmation dialog (OData DELETE)
- [ ] Grid/list views display paginated data with sorting and filtering
- [ ] Fallback form renders when LLM is unavailable
- [ ] Guardrail rules fire appropriately (toast warnings, blocked operations)

---

## Phase 3: UX Polish & Navigation

**Goal:** The app feels like a real ERP client — fast navigation, contextual workflows, and a polished experience.

**Duration estimate: Sprint 6–7**

### 3.1 Navigation & History

- [ ] Implement back/forward navigation using `navigationHistory` store
- [ ] Breadcrumb shows full trail: Module → Menu Item → Record ID
- [ ] "Recently accessed" section on dashboard (sorted by last access time)
- [ ] "Frequently used" section on dashboard (sorted by access count)
- [ ] Deep linking: URL includes all state needed to restore a form view
  - `/form/SalesTableListPage?company=USMF&record=SO-001234`

### 3.2 Performance Optimization

- [ ] Implement form pre-generation:
  - When user enters a module, pre-generate forms for the top 3 most popular menu items in background
  - Use `requestIdleCallback` or Web Workers for non-blocking generation
- [ ] Implement metadata pre-fetching:
  - When module is selected, fetch metadata for all entities in that module
  - Cache warms progressively as user navigates
- [ ] TanStack Query tuning:
  - `staleTime: 5 * 60 * 1000` (5 minutes) for entity data
  - `gcTime: 10 * 60 * 1000` (10 minutes) garbage collection
  - Prefetch related entity data when a record loads (e.g., customer details when viewing a sales order)
- [ ] Bundle optimization:
  - `React.lazy()` for each page route
  - Code-split the LLM client (only load when generating)
  - Measure and optimize initial load time

### 3.3 Form Refinement & Feedback

- [ ] "Regenerate form" button on every generated form
- [ ] "This form was auto-generated" banner with dismiss
- [ ] Form version tracking — show "v2 (regenerated)" indicators
- [ ] Allow user to provide text feedback: "Move customer name to the top" → append to regeneration prompt
- [ ] Side-by-side diff when regenerating (show what changed)

### 3.4 Error Handling & Resilience

- [ ] `ErrorBoundary` around every route with contextual recovery options
- [ ] Toast notifications (sonner) for:
  - Successful save/delete
  - OData errors with D365 error messages
  - Guardrail warnings
  - Network connectivity issues
- [ ] Retry logic with user-visible status for failed API calls
- [ ] Session expiry detection → prompt re-authentication
- [ ] Graceful handling of D365 downtime (cached forms still render, show "offline" banner)

### 3.5 Search Enhancement

- [ ] Global search modes:
  - Menu items (client-side fuzzy + MCP `form_find_menu_item`)
  - Entity records (OData `$filter` with wildcard search)
  - Entities/tables (MCP `data_find_entity_type`)
- [ ] Search results grouped by type with keyboard navigation
- [ ] Command palette (Ctrl+K) — leveraging `cmdk` from starter template

### 3.6 Responsive Design

- [ ] Collapsible left nav for smaller screens
- [ ] Form layout adapts: side-by-side fields on wide screens, stacked on narrow
- [ ] Grid columns auto-hide on narrow screens (keep key columns, hide detail)
- [ ] Touch-friendly tap targets for tablet use

### Phase 3 Exit Criteria
- [ ] Navigation feels fluid — back/forward, breadcrumbs, deep links all work
- [ ] Dashboard shows recently accessed and frequently used items
- [ ] Cached forms load in under 500ms
- [ ] Form pre-generation runs in background without blocking UI
- [ ] Users can regenerate forms with feedback
- [ ] Error handling covers all failure modes with recovery options
- [ ] Command palette (Ctrl+K) searches across menu items and records
- [ ] App is usable on tablets (responsive layout)

---

## Phase 4: Advanced Capabilities

**Goal:** Enterprise-grade features that extend the client beyond basic CRUD.

**Duration estimate: Sprint 8–10+**

### 4.1 Cross-Entity Navigation

- [ ] Click a lookup value to navigate to the related entity's form
  - e.g., Click customer account on a sales order → opens Customer form
- [ ] "Related records" panel on forms — shows linked entities:
  - Sales order → Sales order lines, Delivery schedule, Charges
  - Customer → Sales orders, Invoices, Payments
- [ ] Navigation between parent and child forms preserves filter context

### 4.2 Multi-Step Wizard Forms

- [ ] `FormLayout.type = 'wizard'` support:
  - Step indicator at the top
  - Next/Back navigation between steps
  - Step validation before proceeding
  - Summary/confirmation step before submission
- [ ] Use for complex creation flows (e.g., "Create Sales Order" → Header → Lines → Review → Submit)

### 4.3 Stateful Form Operations (Form Daemon Channel)

- [ ] Implement form daemon adapter for operations requiring server-side business logic:
  - Number sequence generation (order numbers, journal batch numbers)
  - Field-level defaulting (default warehouse based on site selection)
  - Cross-field validation (delivery date must be after order date)
  - Workflow submission
- [ ] Session management:
  - One active form daemon session at a time
  - Session timeout handling (re-open form if session expires)
  - Queue operations when a session is busy

### 4.4 Bulk Operations

- [ ] Multi-select rows in grid → Apply action to all selected:
  - Bulk update (change status, assign to, etc.)
  - Bulk delete with confirmation
  - Bulk export
- [ ] Batch command support:
  - Port D365-erp-cli's JSONL batch executor pattern
  - Execute a sequence of operations as a batch with progress tracking
  - Stop-on-error vs continue-on-error modes

### 4.5 Curated Action Catalog

- [ ] Build `src/data/actionCatalog.ts` — Common D365 business operations:
  - Post general journal
  - Confirm sales order / purchase order
  - Generate picking list / packing slip
  - Post invoice
  - Run MRP / master planning
  - Each entry: action name, required parameters, description, which MCP tool to use
- [ ] Surface actions as contextual buttons on relevant forms
- [ ] Action execution with parameter collection dialog

### 4.6 Role-Based Customization

- [ ] Detect user's D365 security roles via OData or MCP
- [ ] Filter menu items based on role access
- [ ] Filter form fields based on field-level security
- [ ] Remember role-specific form layouts (different users may want different field ordering)

### 4.7 Analytics & Usage Tracking

- [ ] Track per form: generation time, access count, cache hit rate, field usage
- [ ] Dashboard showing:
  - Most used forms
  - Average form generation time
  - LLM token usage per form
  - Cache efficiency metrics
- [ ] Use Power Apps telemetry API for operational metrics

### 4.8 Export & Reporting

- [ ] Export grid data to CSV/Excel
- [ ] Print-friendly form view
- [ ] Simple list reports using Recharts (from starter template):
  - Bar/line charts from OData aggregate queries
  - Embed in dashboard or as standalone report pages

### Phase 4 Exit Criteria
- [ ] Cross-entity navigation works (click lookup → opens related form)
- [ ] At least one wizard form demonstrates multi-step creation
- [ ] Form daemon channel works for operations requiring server-side logic
- [ ] Bulk operations work on grid selections
- [ ] Common business actions are surfaced contextually on forms
- [ ] Export to CSV/Excel works for grid data

---

## Technical Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **UI Framework** | shadcn/ui + Tailwind CSS | Ships with starter template; lighter than Fluent UI; highly composable; modern aesthetic |
| **State Management** | Zustand | Ships with starter template; minimal boilerplate; works well with React 19 |
| **Data Fetching** | TanStack Query v5 | Ships with starter template; caching, background refresh, optimistic updates |
| **Data Grid** | TanStack Table v8 | Ships with starter template; headless, fully customizable |
| **LLM Provider** | Azure OpenAI (GPT-4o) | Azure ecosystem, Entra auth, enterprise compliance, high-quality structured output |
| **Form Caching** | IndexedDB | Client-side, persists across sessions, handles large JSON schemas |
| **D365 Primary Integration** | ERP MCP Server | Already deployed, typed tools, handles auth and session management |
| **D365 Secondary Integration** | Direct OData | For simple CRUD where MCP overhead is unnecessary |
| **Routing** | React Router v7 | Ships with starter template; file-based routing option |
| **Testing** | Vitest + Playwright | Vitest for unit/integration; Playwright for E2E (supported by Code Apps) |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| LLM generates incorrect/invalid form schemas | High (initially) | Medium | Validation pass against entity metadata; fallback renderer; iterative prompt tuning |
| LLM latency makes first-access slow (3–8 seconds) | High | Medium | Skeleton loader UX; background pre-generation; cache eliminates repeat latency |
| D365 API rate limiting (429s) under normal use | Medium | Medium | Retry with exponential backoff; TanStack Query deduplication; aggressive caching |
| Entity metadata changes after D365 update invalidate cached forms | Medium | Low | Metadata hash comparison on load; manual "regenerate" option; versioned schemas |
| Form daemon session conflicts (only one session at a time) | Medium | Medium | Queue form operations; prefer OData for read-only; clear session status to user |
| Power Apps Code Apps platform limitations (browser only, no mobile) | Low | Medium | Responsive design for tablets; document limitation; monitor platform roadmap |
| Azure OpenAI token costs at scale | Medium | Low | GPT-4o-mini for simple forms; cache aggressively; track and alert on cost |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Form generation success rate | > 95% | Valid schema produced / total generation attempts |
| Form cache hit rate | > 80% after 2 weeks of use | Cached loads / total form loads |
| Cached form load time | < 500ms | Time from click to rendered form (cached path) |
| Generated form load time | < 8s | Time from click to rendered form (generation path) |
| LLM tokens per form generation | < 4,000 tokens | Average across all generated forms |
| Entity coverage | 50+ entities in 90 days | Number of entities with successfully generated forms |
| User-triggered regenerations | < 10% of initial generations | Regenerate clicks / total first-generation events |
