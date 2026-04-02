# D365 F&O Generative Client

A React-based generative UI client for Microsoft Dynamics 365 Finance & Operations. Instead of hard-coding every form, this app uses an LLM to generate form layouts on the fly from D365 OData entity metadata — producing fully functional CRUD interfaces, data grids, and an analytics dashboard connected to a live D365 environment.

> **Disclaimer:** This is a personal research project and is not affiliated with, endorsed by, or representative of my employer. All opinions, code, and design decisions are my own.

<img width="298" height="629" alt="image (9)" src="https://github.com/user-attachments/assets/61bd09a9-275d-405e-a7c7-6d44ab8831f1" /><img width="297" height="629" alt="image (11)" src="https://github.com/user-attachments/assets/c18384cb-c391-49ea-ac74-4db4f308abfc" />

<img width="298" height="632" alt="image (10)" src="https://github.com/user-attachments/assets/e7fcf8cd-97a5-4adf-983e-646b7d0452de" /><img width="1264" height="687" alt="image (16)" src="https://github.com/user-attachments/assets/87ffcf4b-9fbd-4cd6-9ba6-539b29a247bd" />

<img width="1261" height="694" alt="image (14)" src="https://github.com/user-attachments/assets/330e0331-06c4-46b2-84d1-8a1fc59415c2" />
<img width="1071" height="698" alt="morphx explorer" src="https://github.com/user-attachments/assets/33c682d6-6807-4603-8eeb-38b183d2d8f9" />


## What It Does

- **Generative Forms** — Point it at any D365 F&O menu item and an LLM generates a complete form (fields, grids, tabs, lookups, actions) from the entity metadata. No hand-coded forms.
- **Live OData Integration** — Connects to a real D365 F&O environment via MSAL authentication and OData v4 APIs. Full CRUD: create, read, update, delete records.
- **Analytics Dashboard** — KPI tiles, pie charts (order status breakdowns), bar charts (top customers, inventory levels), and a recent orders table — all powered by live OData queries with recharts.
- **Company-Scoped Data** — A company selector filters all data by `dataAreaId`. Switching companies refreshes everything automatically.
- **Module Navigation** — Pre-mapped taxonomy of 8 D365 modules (GL, AR, AP, Procurement, Inventory, Production, HR, Org Admin) with 37+ menu items, each linked to an OData entity set.
- **Form Caching** — Generated forms are cached in IndexedDB so repeated visits are instant.
- **Demo Mode** — Runs without a D365 connection using synthetic sample data.

## Architecture

```
src/
├── components/
│   ├── dashboard/          # KpiCard, ChartCard (recharts wrappers)
│   ├── form-renderer/      # DynamicForm, FieldRenderer, GridRenderer, TabLayout
│   ├── generation/         # FormGenerationProgress, FormRefinementPanel
│   ├── shell/              # AppShell, CommandPalette, CompanySelector, MenuPanel
│   └── ui/                 # shadcn/ui primitives (Card, Button, Input, etc.)
├── data/
│   ├── entityCatalog.ts    # 35+ D365 entity definitions (keys, fields, categories)
│   ├── moduleTaxonomy.ts   # 8 modules × 37 menu items → entity set mappings
│   └── sampleData.ts       # Synthetic data generator for demo mode
├── hooks/
│   ├── useEntityData.ts    # OData fetch hook with company filtering + sample fallback
│   ├── useGeneratedForm.ts # LLM form generation hook
│   └── useMenuStructure.ts # Module/menu navigation hook
├── pages/
│   ├── DashboardPage.tsx   # Analytics dashboard + module navigation
│   └── FormPage.tsx        # Generative form page (metadata → LLM → rendered form)
├── services/
│   ├── analytics/          # Dashboard data service (KPIs, charts via OData)
│   ├── auth/               # MSAL redirect-based authentication
│   ├── cache/              # IndexedDB + in-memory caching layer
│   ├── d365/               # OData service, metadata service, guardrails
│   ├── data/               # FormDataService (CRUD routing)
│   ├── generation/         # Form generation orchestrator
│   └── llm/                # LLM client, prompt templates, response parser
├── store/
│   ├── appState.ts         # Zustand store (company, module, theme)
│   └── navigationHistory.ts # Recent/frequent item tracking
└── types/                  # TypeScript type definitions
```

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19, TypeScript 5.7 |
| Routing | React Router 7 |
| State | Zustand 5 (persisted to localStorage) |
| Data Fetching | TanStack React Query 5 |
| Charts | Recharts 2 |
| UI Components | shadcn/ui + Radix UI + Tailwind CSS 4 |
| Auth | MSAL Browser (`@azure/msal-browser`) |
| Build | Vite 6 |
| Testing | Vitest + Testing Library |

## Getting Started

### Prerequisites

- Node.js 18+
- A D365 F&O environment (optional — runs in demo mode without one)
- An Azure AD app registration with D365 F&O API permissions (if connecting to live data)

### Install

```bash
npm install
```

### Configure

Create a `.env` file in the project root:

```env
# D365 F&O endpoint (omit to run in demo mode with sample data)
VITE_D365_ENDPOINT=https://your-environment.operations.dynamics.com

# Azure AD app registration (defaults provided for dev)
VITE_MSAL_CLIENT_ID=your-client-id
VITE_MSAL_AUTHORITY=https://login.microsoftonline.com/your-tenant-id

# LLM proxy endpoint for form generation
VITE_LLM_ENDPOINT=http://127.0.0.1:8080
VITE_LLM_MODEL=gpt-4o
```

### Run

```bash
npm run dev
```

The Vite dev server starts at `http://localhost:5173` with a proxy that routes `/data/*` requests to your D365 endpoint (bypassing CORS).

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

## How It Works

1. **Bootstrap** — On startup, MSAL authenticates the user via redirect flow. The OData service is initialized with the access token.

2. **Navigation** — The user picks a module (e.g., Accounts Receivable) and a menu item (e.g., "All customers"). The app looks up the entity set (`CustomersV3`) from the pre-mapped taxonomy.

3. **Form Generation** — The entity's OData metadata (fields, types, keys) is fed into an LLM prompt. The LLM returns a JSON form schema (fields, grids, tabs, actions, lookups). This schema is rendered by the form-renderer components.

4. **Data Layer** — The `ODataService` executes queries through the Vite proxy with Bearer token auth, automatic retry on transient errors, and guardrail enforcement for destructive operations.

5. **Dashboard** — `dashboardService.ts` runs parallel OData queries (`$count`, `$top`, `$filter`, `$orderby`) to compute KPIs and chart data. React Query caches results and auto-refetches on company change.

## License

[MIT](LICENSE)

---

*Built with the help of [Claude Code](https://claude.com/claude-code).*
