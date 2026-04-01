# Power Apps Code App: JIT Generative Client for Dynamics 365 Finance & Operations

## System Prompt

You are building a **Just-In-Time (JIT) Generative Client** for Dynamics 365 Finance and Operations. This is a Power Apps Code App (React SPA hosted on Power Platform) that uses an LLM to dynamically generate the user interface on demand. Instead of pre-building hundreds of static forms, the app generates each form the first time a user needs it, then caches and reuses that generated form definition for all subsequent visits. The full D365 menu structure is presented up front so users can navigate naturally — but behind each menu item, the form materializes only when selected.

---

## Architecture Overview

### Platform: Power Apps Code Apps

The app is built as a **Power Apps Code App** — a React/TypeScript SPA scaffolded with Vite, developed locally, and deployed to the Power Platform managed runtime.

**Key architecture layers:**
1. **App Code** — React SPA with TypeScript, using a dynamic form renderer
2. **Power Apps Client Library** (`@microsoft/power-apps` npm package) — Provides access to 1,500+ Power Platform connectors, Entra ID authentication, app/user/host context, and telemetry
3. **`power.config.json`** — Auto-managed metadata for Power Platform connections
4. **Power Apps Host** — Runtime host handling Microsoft Entra authentication, app loading, and governance (DLP, conditional access, tenant isolation, app quarantine)

**Development workflow:**
```
npx degit github:microsoft/PowerAppsCodeApps/templates/vite d365-gen-client
npm install
pac code init --displayname "D365 Generative Client"
pac code add-data-source -a <connectorApi> -c <connectionId>
npm run dev          # Local development with hot reload
npm run build && pac code push   # Deploy to Power Platform
```

**What Power Platform provides for free:**
- Microsoft Entra authentication and authorization (no auth code needed)
- DLP enforcement at app launch
- Conditional access per app
- Tenant isolation and Azure B2B external user support
- Sharing limits and app quarantine by admins
- Health metrics in Power Platform Admin Center

**Licensing:** End users require Power Apps Premium license. Admins must enable code apps per environment.

**Constraints:**
- Browser only (not supported in Power Apps mobile or Windows app)
- No Power BI data integration
- No SharePoint forms integration
- Connections must be pre-created in the maker portal
- Published app code is hosted on a publicly accessible endpoint — never embed secrets in code

---

## Integration Architecture

### Three Integration Channels

The app has three distinct channels for interacting with D365 Finance & Operations. Each serves a different purpose:

#### Channel 1: OData Data Entities (Stateless CRUD)

Direct HTTP calls to D365 OData endpoints for straightforward entity operations. This is the primary data plane for reading and writing business data.

**Capabilities:**
- `GET /data/{EntitySet}?$filter=...&$select=...&$expand=...` — Query entities with full OData query syntax
- `POST /data/{EntitySet}` — Create entities
- `PATCH /data/{EntitySet}({keys})` — Update entities
- `DELETE /data/{EntitySet}({keys})` — Delete entities
- `GET /data/$metadata` — Retrieve entity structure, field types, relationships, and navigation properties

**Key patterns:**
- Always use `cross-company=true` unless deliberately filtering to a single legal entity with `dataAreaId`
- Always use `$select` to limit response payload — D365 entities can have hundreds of fields
- Use `$expand` for first-level navigation properties (deep expansion not supported)
- For enum fields, use the namespace-qualified format: `$filter=Status eq Microsoft.Dynamics.DataEntities.Status'Active'`
- Wildcard string filtering: `$filter=Name eq '*retail*'` (D365 uses wildcards, not `contains()`)
- Pagination via `$top`, `$skip`, and `@odata.nextLink`

**Use for:** Entity lists, record creation/update, lookups, reference data, reporting queries.

#### Channel 2: Form Daemon / View Model API (Stateful Form Interaction)

The D365 web client uses a **stateful server-side form engine** (the View Model API). Forms must be opened, controls navigated, values set, and forms saved/closed — all within a persistent session. This is required for operations that involve business logic embedded in form events (e.g., field-level validations, auto-calculated values, number sequences, workflow triggers).

**Reference implementation:** [D365-erp-cli](https://github.com/seangalliher/D365-erp-cli) — a Go-based CLI that implements this pattern with a background daemon process.

**Form Daemon Pattern:**
- A background daemon process maintains persistent TCP connections (port `51365` on Windows, Unix socket elsewhere)
- IPC protocol: newline-delimited JSON over TCP
- Request envelope: `{ "id": "req-...", "command": "form.open", "args": {...} }`
- Response envelope: `{ "id": "req-...", "success": true, "data": {...} }`
- Auto-starts on first form command, auto-shuts down after 30 minutes of inactivity

**16 Form Commands:**

| Command | Purpose | Key Args |
|---------|---------|----------|
| `form.open` | Open a menu item as a form | `name`, `type` ("Display"/"Action"), `companyId` |
| `form.close` | Close the current form | — |
| `form.save` | Save the current form | — |
| `form.state` | Get complete form state (all controls, types, values, enabled status) | — |
| `form.click` | Click a button or control | `controlName`, `actionId` (for listbox/treenode) |
| `form.set_values` | Set one or more control values | `setControlValues: [{controlName, value}]` |
| `form.open_lookup` | Open a lookup dropdown | `lookupName` |
| `form.open_tab` | Open or close a tab | `tabName`, `tabAction` ("Open"/"Close") |
| `form.filter` | Apply a form-level filter | `controlName`, `filterValue` |
| `form.filter_grid` | Filter a grid column | `gridName`, `gridColumnName`, `gridColumnValue` |
| `form.select_row` | Select a grid row | `gridName`, `rowNumber`, `marking` |
| `form.sort_grid` | Sort a grid column | `gridName`, `gridColumnName`, `sortDirection` |
| `form.find_controls` | Search for controls on the form | `controlSearchTerm` |
| `form.find_menu` | Search for menu items | `menuItemFilter`, `responseSize` |
| `ping` | Health check | — |
| `shutdown` | Stop the daemon | — |

**Use for:** Complex form interactions where business logic fires on field change, number sequence generation, workflow submissions, multi-step processes with server-side validation, and any operation that requires the full form engine context.

#### Channel 3: ERP MCP Server (AI-Optimized Structured Operations)

The ERP MCP Server provides tool-based access to D365 operations optimized for LLM consumption. It wraps both OData and View Model API operations behind named tools with typed parameters.

**Available MCP tool categories:**
- **Data tools:** `data_find_entity_type`, `data_get_entity_metadata`, `data_find_entities`, `data_create_entities`, `data_update_entities`, `data_delete_entities`
- **Form tools:** `form_open_menu_item`, `form_find_menu_item`, `form_click_control`, `form_set_control_values`, `form_open_lookup`, `form_open_or_close_tab`, `form_filter_form`, `form_filter_grid`, `form_select_grid_row`, `form_sort_grid_column`, `form_find_controls`, `form_save_form`, `form_close_form`
- **API tools:** `api_find_actions`, `api_invoke_action`

**Use for:** LLM-driven orchestration of D365 operations, entity discovery, metadata introspection for form generation, and as the primary backend intelligence layer for the generative client.

---

## Core Design: JIT Form Generation

### Principle: Generate Once, Cache Forever, Refine on Feedback

The client does NOT attempt to generate all 500+ D365 forms at once. Instead:

1. **Menu structure loads immediately** — The full D365 module/menu hierarchy is fetched and displayed on app launch. This gives users a familiar navigation structure from day one.
2. **Forms generate on first access** — When a user clicks a menu item for the first time, the LLM generates a form definition by analyzing entity metadata, field types, relationships, and business context.
3. **Generated forms are cached** — The form definition (a JSON schema describing layout, fields, groups, validation, labels) is persisted in local storage / IndexedDB / a Power Platform data source. On subsequent visits, the cached form renders instantly with zero LLM calls.
4. **Forms can be refined** — Users can trigger regeneration or provide feedback to improve a form. The LLM refines the schema and the cache is updated.

### Form Definition Schema

The LLM generates a JSON form definition that the React form renderer interprets:

```typescript
interface GeneratedForm {
  id: string;                          // Hash of entity + context
  entitySet: string;                   // OData entity set name
  menuItemName: string;                // D365 menu item name
  menuItemType: "Display" | "Action";  // Menu item type
  title: string;                       // Human-friendly form title
  description: string;                 // Purpose description
  version: number;                     // Schema version for cache invalidation
  generatedAt: string;                 // ISO timestamp

  layout: FormLayout;                  // Groups, tabs, field ordering
  fields: FormField[];                 // Field definitions with types, validation, labels
  grids: FormGrid[];                   // Embedded grid/list definitions
  actions: FormAction[];               // Buttons, toolbar actions
  lookups: FormLookup[];               // Lookup configurations
  navigation: FormNavigation[];        // Links to related forms/entities

  dataSource: {
    type: "odata" | "form-daemon" | "mcp";  // Which integration channel to use
    entitySet?: string;                       // For OData
    menuItemName?: string;                    // For form daemon
    mcpTools?: string[];                      // For MCP server
  };
}

interface FormField {
  name: string;                        // Control name / OData field name
  label: string;                       // User-friendly label
  type: "text" | "number" | "date" | "datetime" | "boolean" | "enum" | "lookup" | "currency" | "memo";
  group: string;                       // Tab/group this field belongs to
  required: boolean;
  readOnly: boolean;
  maxLength?: number;
  enumValues?: { value: string; label: string }[];
  lookupEntity?: string;               // Entity set for lookup resolution
  lookupDisplayField?: string;         // Field to display from lookup entity
  defaultValue?: any;
  helpText?: string;
  order: number;                       // Display order within group
}

interface FormGrid {
  name: string;                        // Grid control name
  title: string;
  entitySet: string;                   // OData entity for grid data
  columns: GridColumn[];               // Column definitions
  filterableColumns: string[];
  sortableColumns: string[];
  parentFieldMapping?: Record<string, string>;  // Foreign key mapping to parent form
}

interface FormLayout {
  type: "tabbed" | "single-page" | "wizard";
  tabs: { name: string; label: string; fields: string[]; grids?: string[] }[];
}
```

### Form Generation Prompt Strategy

When a user selects a menu item, the system:

1. **Fetches entity metadata** via MCP `data_get_entity_metadata` or OData `$metadata` to get field names, types, constraints, keys, and relationships
2. **Fetches menu item context** via MCP `form_find_menu_item` to understand the form's purpose
3. **Constructs an LLM prompt** with:
   - Entity metadata (fields, types, required flags, max lengths, enum values)
   - Entity relationships and navigation properties
   - The menu item name and type (provides business context)
   - A D365 UX pattern guide (how similar forms are typically laid out in Dynamics)
   - The `GeneratedForm` TypeScript interface as the expected output schema
4. **LLM generates** the form definition JSON
5. **Validation pass** — Verify all referenced fields exist in the entity metadata, types are compatible, required fields are included
6. **Cache the result** — Store in IndexedDB keyed by `entitySet + menuItemType + version`
7. **Render** — The React form renderer interprets the schema and builds the UI

### Fallback Strategy

If the LLM fails or is unavailable:
1. **Level 1 fallback:** Use cached form definition if available (even if stale)
2. **Level 2 fallback:** Auto-generate a basic form directly from OData `$metadata` — list all fields in alphabetical order with inferred types, no grouping or UX optimization
3. **Level 3 fallback:** Show raw entity data in a table view with inline editing

---

## Menu System

### Initial Menu Load

On first launch, the app queries D365 for the full menu structure. Two approaches:

**Approach A — MCP-driven discovery:**
```
form_find_menu_item({ menuItemFilter: "*", responseSize: "500" })
```
Then categorize results by module using LLM analysis of menu item names.

**Approach B — Pre-curated module structure with dynamic enrichment:**
Ship a baseline module taxonomy (General Ledger, Accounts Payable, Accounts Receivable, Sales, Procurement, Inventory, Production, etc.) and populate each module's menu items via targeted MCP queries.

**Recommended:** Approach B — faster initial load, predictable structure, with LLM used only to categorize uncategorized items and generate user-friendly labels.

### Menu Persistence

```typescript
interface MenuCache {
  version: number;
  generatedAt: string;
  modules: MenuModule[];
}

interface MenuModule {
  id: string;
  label: string;                       // e.g., "Accounts Receivable"
  icon: string;                        // Icon identifier
  items: MenuItem[];
  subModules?: MenuModule[];
}

interface MenuItem {
  menuItemName: string;                // D365 menu item name
  menuItemType: "Display" | "Action";
  label: string;                       // User-friendly label
  description?: string;
  formCached: boolean;                 // Whether we've generated the form
  lastAccessed?: string;               // For usage-based sorting
  accessCount: number;                 // For popularity ranking
}
```

---

## React Application Structure

```
src/
├── App.tsx                            # Root component with routing
├── main.tsx                           # Entry point, Power Apps SDK init
├── generated/                         # Auto-generated by pac code add-data-source
│   ├── models/
│   └── services/
├── components/
│   ├── shell/
│   │   ├── AppShell.tsx               # Top-level layout (nav, header, content)
│   │   ├── ModuleNav.tsx              # Left-side module navigation
│   │   ├── MenuPanel.tsx              # Menu items within a module
│   │   └── Breadcrumb.tsx             # Navigation breadcrumb
│   ├── form-renderer/
│   │   ├── DynamicForm.tsx            # Main form renderer (interprets GeneratedForm)
│   │   ├── FieldRenderer.tsx          # Field-type dispatcher
│   │   ├── fields/
│   │   │   ├── TextField.tsx
│   │   │   ├── NumberField.tsx
│   │   │   ├── DateField.tsx
│   │   │   ├── EnumField.tsx
│   │   │   ├── LookupField.tsx
│   │   │   ├── BooleanField.tsx
│   │   │   └── CurrencyField.tsx
│   │   ├── GridRenderer.tsx           # Embedded grid/list component
│   │   ├── TabLayout.tsx              # Tabbed form layout
│   │   └── FormToolbar.tsx            # Save, delete, new, close actions
│   ├── generation/
│   │   ├── FormGenerator.tsx          # Loading state during LLM generation
│   │   └── GenerationProgress.tsx     # Progress indicator with status messages
│   └── common/
│       ├── SearchBar.tsx              # Global search
│       ├── ErrorBoundary.tsx          # Error handling with fallback UI
│       └── LoadingState.tsx
├── services/
│   ├── llm/
│   │   ├── formGenerationService.ts   # LLM prompt construction and response parsing
│   │   ├── menuGenerationService.ts   # Menu categorization and labeling
│   │   └── promptTemplates.ts         # Reusable prompt templates
│   ├── d365/
│   │   ├── odataService.ts            # OData CRUD operations
│   │   ├── metadataService.ts         # Entity metadata fetching and parsing
│   │   └── formDaemonService.ts       # Form daemon IPC client (TCP JSON protocol)
│   ├── cache/
│   │   ├── formCache.ts               # IndexedDB-backed form definition cache
│   │   ├── menuCache.ts               # Menu structure cache
│   │   └── dataCache.ts               # Query result caching with TTL
│   └── mcp/
│       └── erpMcpClient.ts            # ERP MCP Server integration
├── hooks/
│   ├── useGeneratedForm.ts            # Hook: load cached or generate form
│   ├── useEntityData.ts               # Hook: OData CRUD with loading/error states
│   ├── useMenuStructure.ts            # Hook: menu loading and navigation
│   └── useFormDaemon.ts               # Hook: form daemon connection management
├── store/
│   ├── appState.ts                    # Global app state (current module, form, user context)
│   └── navigationHistory.ts           # Back/forward navigation stack
└── types/
    ├── form.ts                        # GeneratedForm, FormField, FormGrid interfaces
    ├── menu.ts                        # MenuCache, MenuModule, MenuItem interfaces
    └── d365.ts                        # D365-specific types (entity metadata, OData response)
```

---

## Form Daemon Adaptation for the Code App

The D365-erp-cli daemon runs as a Go process with TCP IPC. For the Power Apps Code App, adapt this pattern:

**Option A — Direct View Model API calls from the browser:**
The React app calls the D365 View Model API directly via authenticated HTTP requests, maintaining form session state in the app's memory. This requires the D365 instance to expose the View Model API endpoints with CORS headers.

**Option B — Proxy daemon as an Azure Function:**
Deploy the form daemon logic as an Azure Function (or Azure Container App) that maintains D365 form sessions server-side. The React app communicates with the function via REST. This isolates session management and avoids CORS issues.

**Option C — Use ERP MCP Server as the daemon:**
Route all form operations through the ERP MCP Server, which already wraps the View Model API with typed tool interfaces (`form_open_menu_item`, `form_click_control`, `form_set_control_values`, etc.). The MCP server handles session state.

**Recommended:** Option C for initial implementation (lowest complexity, already built), with Option B as an optimization for high-volume scenarios.

---

## UX Design Principles

### Modern, Not Legacy
- **Do NOT replicate** the D365 F&O web client's legacy UI patterns (dense grids, tiny fonts, overwhelming toolbars)
- Use modern design language: clean typography, generous spacing, card-based layouts, contextual actions
- Fluent UI React components for consistency with the Microsoft ecosystem

### Progressive Disclosure
- Show the most important fields first; group secondary fields in collapsible sections
- Related entities appear as linked cards or expandable panels, not embedded grids by default
- Actions appear contextually (delete only when a record is selected, save only when dirty)

### Generation Transparency
- When a form is being generated for the first time, show a clear loading state: "Building your form..." with progress steps
- After generation, optionally show a brief "This form was generated. Provide feedback to improve it." banner
- Never leave the user staring at a blank screen

### Navigation
- Left rail: module navigation (collapsible)
- Top: breadcrumb trail showing Module > Menu Item > Record
- Recently accessed items pinned to dashboard
- Global search that searches across menu items AND entity records

---

## Data Flow Summary

```
User clicks menu item
        │
        ▼
  ┌─ Form cached? ─┐
  │                 │
  Yes               No
  │                 │
  │         Fetch entity metadata
  │         (MCP or OData $metadata)
  │                 │
  │         LLM generates form schema
  │                 │
  │         Validate & cache schema
  │                 │
  └────► Render form ◄─┘
              │
              ▼
   User interacts with form
   (fill fields, grid operations)
              │
              ▼
   ┌─ Data channel? ─┐
   │      │           │
  OData  Daemon      MCP
   │      │           │
   ▼      ▼           ▼
   D365 F&O Backend
```

---

## Development Phases

### Phase 1: Foundation
- Initialize Power Apps Code App project with React + Vite
- Establish D365 OData connectivity via Power Platform connectors
- Connect to ERP MCP Server
- Build the `AppShell` with module navigation
- Implement `formCache` (IndexedDB) and `menuCache`
- Create baseline menu structure with D365 module taxonomy
- Build the `DynamicForm` renderer that interprets `GeneratedForm` JSON

### Phase 2: Generative Core
- Build `formGenerationService` with LLM prompt templates
- Implement the generation flow: metadata fetch → LLM prompt → validate → cache → render
- Create field-type renderers (text, number, date, enum, lookup, boolean, currency)
- Implement OData CRUD through the form renderer (create, read, update, delete records)
- Build grid renderer with filtering, sorting, pagination
- Implement form daemon adapter (via MCP Server)

### Phase 3: UX Polish
- Form caching with instant load for revisited forms
- Navigation history (back/forward)
- Global search across menu items and records
- Recently accessed items on dashboard
- Form generation progress indicator
- Error boundaries with fallback rendering
- Responsive layout for different screen sizes

### Phase 4: Advanced Capabilities
- Multi-step wizard form layouts
- Cross-entity navigation (click customer on sales order → opens customer form)
- User feedback loop for form refinement
- Role-based menu filtering (hide items the user can't access)
- Bulk operations on grid selections
- Export to Excel / PDF

---

## Technical Guardrails

- **Never embed D365 credentials in app code** — use Power Platform connectors or server-side proxies for authentication
- **Always use `$select`** on OData queries — D365 entities can have 200+ fields
- **Always use `cross-company=true`** unless deliberately filtering by legal entity
- **Validate LLM output** before rendering — ensure all field names exist in entity metadata, types are compatible
- **Cache aggressively** — form definitions, menu structures, entity metadata, and lookup values
- **Implement retry with backoff** for D365 API calls — D365 returns 429 under load
- **Respect D365 security** — if a user can't access an entity, the form should fail gracefully, not crash

---

## References

- **Power Apps Code Apps:** https://learn.microsoft.com/en-us/power-apps/developer/code-apps/overview
- **Power Apps Code Apps Architecture:** https://learn.microsoft.com/en-us/power-apps/developer/code-apps/architecture
- **Power Apps SDK npm:** https://www.npmjs.com/package/@microsoft/power-apps
- **Code App Templates:** https://github.com/microsoft/PowerAppsCodeApps
- **Form Daemon Pattern (D365-erp-cli):** https://github.com/seangalliher/D365-erp-cli
- **D365 OData API:** https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/data-entities/odata
- **D365 View Model API:** Server-side form engine used by the D365 web client
- **ERP MCP Server:** Project-specific MCP server wrapping D365 data, form, and API tools
