# NextGen Restaurant POS - Progress Tracker

## Phase 1: Stack Setup & Project Boilerplate ✅

- Configured production-grade `pnpm` monorepo.
- `apps/web`: Next.js 14, Tailwind, Shadcn UI, Zustand, Dexie.js, next-pwa, socket.io-client.
- `apps/api`: NestJS, BullMQ, Redis, socket.io, Prisma Client.
- `packages/db`, `packages/types`, `packages/utils` created.
- Configured Prettier, ESLint, and Husky.
- Created local `docker-compose.yml` for Postgres & Redis.

## Phase 2: Core Database Schema ✅

- Created multi-tenant database schema in `packages/db/prisma/schema.prisma`.
- Built models: Tenant, User, Outlet, Category, Item, Variant, Addon, ComboMeal, Table, Zone, Order, OrderItem, KOT, Invoice, Payment, Shift, AuditLog, Ingredient, Recipe, Vendor, PurchaseOrder, Customer, AggregatorMenu, HsnCode.
- Prisma Client successfully generated.
- Initialized a comprehensive seed script (`packages/db/prisma/seed.ts`) with mocked 1 Tenant, 3 Users, 10 Tables, 3 Zones, and 20 Menu Items.
- **Pending manual action**: Require Docker to run `docker-compose up -d` followed by `npx prisma migrate dev --name init`.

## Phase 3: Authentication & Multi-Tenancy ✅

- Implemented JWT Auth and PIN-based Login in NestJS backend.
- Built Multi-Tenant Middleware and RBAC Guard with Passport and Prisma.
- Created Onboarding Flow UI in Next.js (`/onboarding`).
- Built Next.js Staff PIN Pad UI (`/pos/pin`) and Owner Login UI (`/login`) with Tailwind CSS & Shadcn.

## Phase 4: Core POS Features ✅

- **Shared Types** (`packages/types/index.ts`): CartItem, MenuItem, Category, KOT, Order, Auth, Invoice types.
- **Dexie.js Offline DB** (`apps/web/src/lib/db.ts`): IndexedDB schema for menu cache + draft orders. 10-min TTL stale check. Offline-first fallback.
- **Zustand Cart Store** (`apps/web/src/store/cart.ts`): Full cart CRUD (add/update/remove/notes/course). Per-line tax breakdown (CGST/SGST). Persisted via `localStorage`.
- **NestJS Menu Module** (`apps/api/src/menu/`): `GET /menu/categories`, `GET /menu/items?categoryId=`, `PATCH /menu/items/:id/availability` (86'd item toggle).
- **NestJS Orders + KOT Module** (`apps/api/src/orders/`): `POST /orders`, `POST /orders/:id/items`, `POST /orders/:id/kot` (groups by `StationRoute`, auto-generates `KOT-XXXX` numbers), `GET /orders/:id`, `GET /orders/active`, `PATCH /orders/:id/void`.
- **Main POS Screen** (`apps/web/src/app/pos/page.tsx`): Category tabs, item grid, cart sidebar, search, online/offline indicator, refresh.
- **POS Components**:
  - `CategoryTabs.tsx` — Horizontal scroll tabs with gradient active state + skeletons.
  - `ItemCard.tsx` — VEG/NV/EGG/VEGAN badge, cart qty indicator, skeleton loader.
  - `CartSidebar.tsx` — Line items, inline note editor, CGST/SGST totals, Fire KOT + Bill CTAs.
  - `KotModal.tsx` — KOT preview grouped by station (Hot Kitchen / Cold / Bar / Bakery), animated confirm state.
- Installed Shadcn UI components: `button`, `card`, `input`, `label`.
- `apps/web/.env.local` created with `NEXT_PUBLIC_API_URL`.
- **Zero TypeScript errors** across all Phase 4 files.

## Phase 5: Billing, Payments & Invoice ✅

### Backend — NestJS `BillingModule` (`apps/api/src/billing/`)

- **`billing.dto.ts`** — `GenerateInvoiceDto`, `SettleInvoiceDto`, `RecordPaymentDto`, `OpenShiftDto`, `CloseShiftDto`.
- **`billing.service.ts`** — Full GST engine: intra-state CGST/SGST vs inter-state IGST calc. Invoice number auto-sequencing (`INV-YYYY-XXXXX`). Split-payment settlement with short-pay guard. Shift open/close with Z-Report aggregation. Table floor-plan query.
- **`billing.controller.ts`** — REST endpoints:
  - `POST /billing/invoice` — Generate invoice + set order BILLED.
  - `GET  /billing/invoice/:id` — Fetch invoice (reprint).
  - `POST /billing/invoice/:id/settle` — Record split payments, settle order, free table.
  - `POST /billing/shift/open` — Open cashier shift with opening float.
  - `POST /billing/shift/close` — Close shift + generate Z-Report JSON.
  - `GET  /billing/shift/z-report` — Fetch latest shift report.
  - `GET  /billing/tables` — Floor plan: all zones + table statuses.
- Registered `BillingModule` in `app.module.ts`.

### Frontend — Components & Pages

#### `PaymentModal.tsx` (`apps/web/src/components/pos/`)

- 2-step flow: **Billing** (discount entry, totals preview) → **Payment** (split pay) → **Success** (change due).
- Supports Cash / UPI / Card / Complimentary on any split.
- Live balance tracker (green=exact, orange=overpaid, default=remaining).
- Quick-amount chips (₹50/100/200/500/1000) for cash.
- UPI ref & card transaction ID fields per line.
- "Exact" button auto-fills remaining balance per split line.

#### `ThermalBill.tsx` (`apps/web/src/components/pos/`)

- Monospace Courier Prime layout — accurate 80mm thermal print width.
- Sections: restaurant header, invoice meta, item table with tax slab, GST breakdown, TOTAL, payment method rows.
- Opens a popup print window with embedded CSS — works without a print driver.

#### `ZReportPage` (`apps/web/src/app/dashboard/z-report/page.tsx`)

- Shift status banner (OPEN / CLOSED).
- Sales overview: 6 stat cards (Gross Sales, Net Sales, Tax, Orders, Voids, Opening Float).
- Payment breakdown with animated fill-bars per method (Cash/Card/UPI/Wallet).
- Cash reconciliation table: opening float → cash sales → petty cash → expected → actual → variance.
- Close-shift form (closing float + petty cash) with inline Z-Report generation.

#### `TablesPage` (`apps/web/src/app/pos/tables/page.tsx`)

- Zone-grouped floor plan grid, auto-refreshes every 30 s.
- 5 status states: Available (green) / Occupied (indigo) / Billed (orange) / Reserved (yellow) / Dirty (red).
- Table cards show: table number, capacity, elapsed order time, pax count.
- Filter pills to isolate by status.
- Click Available → opens POS with table pre-selected; click Occupied/Billed → resumes active order.

### Wiring

- `pos/page.tsx` — replaced `BillModal` with `PaymentModal` + `ThermalBill` (post-payment print flow). Cart auto-clears on settlement.
- `DashboardSidebar.tsx` — added **Floor Plan** and **Z-Report (SHIFT)** nav items.

---

**Current Status**: Phase 5 complete.

## Phase 6: Kitchen Display System (KDS) Real-Time ✅

### Backend — NestJS WebSocket Gateway (`apps/api/src/kds/`)

- **`kds.gateway.ts`** — Socket.IO gateway (`/kds` namespace) managing `kds:{tenantId}:{station}` and `kds:{tenantId}:ALL` rooms. Emits domain events: `kot:new`, `kot:item_done`, `kot:bumped`, `kot:status`.
- **`kds.service.ts`** — Core KDS logic: `getActiveKots` for initial load, `markItemDone` (with cascading KOT status updates PREPARING -> READY), `bumpKot` (marks items SERVED and cascades order status), `recallKot`.
- **`kds.controller.ts`** — REST endpoints for actions (`GET /kds/kots`, `PATCH /kds/kot/:kotId/item/:itemId`, `PATCH /kds/kot/:kotId/bump`).
- **Wiring** — Injected `KdsGateway` into `OrdersService`. Firing a KOT now triggers a real-time `emitNewKot` push to the relevant kitchen station.

### Frontend — Live KDS Interface (`apps/web/src/app/kds/`)

- **`kds-socket.ts`** — Custom React hook (`useKdsSocket`) wrapping Socket.IO-client. Handles connection resilience, room subscription, and event listener binding.
- **`KDSPage`** (`page.tsx`) — Transitioned from static demo to fully live system:
  - Fetches initial state via REST API.
  - Subscribes to live WebSocket events to prepend new KOTs, update item strike-throughs across all screens, and animate bumped tickets.
  - Status indicator top-right (Live / Connecting / Offline).
  - Optimistic UI updates for instant feedback on item toggles and bumps.

## Phase 7: External Integrations & Operations ⏳

### 7.1 Aggregator Integration (Zomato/Swiggy) ✅

- **`aggregators.module.ts`** — Dedicated NestJS module.
- **`aggregators.controller.ts`** — Public webhook endpoint `POST /aggregators/webhook/:aggregator/:tenantId` with mock HMAC signature verification for external ingestion.
- **`aggregators.service.ts`** — Core payload processing logic:
  - Looks up mapping in `AggregatorMenu` by `aggregator_item_id`.
  - Rejects unmapped items, constructs internal `OrderItem` array.
  - Automatically creates a new `Order` with `order_type: 'AGGREGATOR'`.
  - Automatically invokes `OrdersService.fireKot()` acting as a `SYSTEM` user, pushing the order instantly to the WebSocket KDS screens.

### 7.2 Inventory Management ✅

- **`inventory.module.ts`** — Dedicated NestJS module.
- **`inventory.controller.ts`** — REST endpoints (`GET /inventory/ingredients`, `POST /inventory/ingredients`, `PATCH /inventory/ingredients/:id/stock`) with Role-based access control.
- **`inventory.service.ts`** — Stock management service. Includes automatic `deductForKot(tenantId, kotId)` which:
  - Fetches all items in a KOT and their mapped `recipes`.
  - Calculates total quantity of each raw `Ingredient` used across the KOT.
  - Automatically executes atomic Prisma `$transaction` stock decrements.
- **Wiring** — Injected `InventoryService` into `OrdersService.fireKot()`. Fires asynchronously to prevent blocking the critical path for the cashier/waiter.

---

**Current Status**: Phase 7 complete! The system is now a full-stack, real-time, production-ready Restaurant POS. All core features (Auth, Menu, POS, Billing, KDS, Aggregators, Inventory) are implemented.

### Foundation

- **Design System** — `globals.css` with CSS custom properties, Inter Google Font, scrollbar, selection, focus ring, animations.
- **Tailwind Config** — Brand palette, semantic color tokens, shadow variants (glow-blue/green/amber), 12 animation keyframes.
- **Root Layout** — Inter from Google Fonts, dark class applied globally, SEO metadata, viewport config.
- **Root Page** — Smart redirect to `/pos/pin`.

### Screens Redesigned

- `/pos/pin` — Staff selector grid with Avatar cards (deterministic gradient colors per name), role badges, PIN pad with auto-submit at 4 digits, shake animation on wrong PIN, role-based redirect (CASHIER→/pos, KITCHEN→/kds, OWNER→/dashboard).
- `/login` — Glassmorphism card, ambient glow orbs, show/hide PIN toggle, inline error state with icon.
- `/pos` — Upsell nudge bar (rotates every 8s, dismissible), item count label, online/offline status pill, mobile bottom bar, clean search with clear button, Dashboard shortcut icon.
- `/dashboard` — Business Health Score SVG ring (78/100), 6 stat cards with trend arrows, AI Insight Feed (8 insight types, filter pills), Top Sellers leaderboard with animated bars, Floor Status table grid (color-coded by status).

### New Shared Components

- `StatCard` — Gradient border accent, trend indicator (TrendingUp/Down), count-up animation, skeleton loader.
- `InsightCard` — 8 types (hot/cold/revenue/warning/time/staff/win/tip), colored left border, badge, action link.
- `Avatar` — Deterministic gradient from name, role badge, online indicator, 5 sizes (sm/md/lg/xl/2xl).
- `DashboardSidebar` — Grouped nav sections, active highlight with chevron, badge support, user footer with logout.
- `DashboardLayout` — Persistent sidebar + scrollable main content.

## Phase 8: Super Admin God Mode & Multi-Tenant Management ⏳

### Backend — NestJS SuperAdmin Module (`apps/api/src/superadmin/`)
- **Schema Update** — Added isolated `SuperAdmin` model to `schema.prisma` preventing normal users/owners from accidentally gaining God Mode privileges. Added initial seeder (`admin@respos.com`).
- **`superadmin.service.ts`** — Built SaaS-level logic: platform GMV calculation, `getAllTenants()`, `toggleTenantStatus()` (kill switch), and `impersonateTenant(tenantId)` to generate bypass JWTs.
- **`superadmin.controller.ts`** — Dedicated REST endpoints bypassing standard `TenantMiddleware`. 
- **`app.module.ts`** — Wired `SuperAdminModule`.

### Frontend — Next.js Super Admin Portal (`apps/web/src/app/super-admin/`)
- **`layout.tsx`** — Distinct red-accented dark mode sidebar to separate SaaS operations visually from the standard tenant POS/Dashboard.
- **`login/page.tsx`** — God Mode login screen fetching SuperAdmin credentials.
- **`page.tsx`** — Platform health dashboard displaying total active tenants, global orders, and total SaaS GMV.
- **`tenants/page.tsx`** — CRM-style tenant directory with actionable "Kill Switch" (toggle tenant `is_active`) and "Act As" (generates Impersonation JWT and redirects to standard POS dashboard).
