# NextGen Restaurant POS (resPOS) - Application Manifest

## 1. Project Overview

**Name**: NextGen Restaurant POS (resPOS)
**Description**: A production-ready, multi-tenant, real-time Restaurant Point of Sale (POS) and management system built with modern web technologies.
**Target Audience**: Restaurants, cafes, and multi-outlet food and beverage businesses needing a reliable, fast, and scalable POS solution.

## 2. Tech Stack & Architecture

The project is built as a monorepo utilizing `pnpm` workspaces, dividing concerns into full-stack frontend applications and backend APIs, sharing common packages.

### Frontend (`apps/web`)

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS, Shadcn UI
- **State Management**: Zustand (Cart & Global UI state)
- **Offline Storage**: Dexie.js (IndexedDB for menu cache and offline-first capabilities)
- **Real-Time**: Socket.io-client (for Kitchen Display System and live notifications)
- **PWA**: next-pwa (Progressive Web App support)

### Backend (`apps/api`)

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: Prisma Client
- **Background Jobs**: BullMQ & Redis (for offline tasks, points tracking, bulk marketing)
- **Real-Time**: Socket.io WebSockets Gateway
- **Auth**: JWT & Passport (Multi-tenant middleware and RBAC)

### Shared Packages (`packages/`)

- `packages/db`: Prisma schema (`schema.prisma`), migrations, and seed scripts.
- `packages/types`: Shared TypeScript interfaces (CartItem, Order, Auth, etc.).
- `packages/utils`: Reusable helper functions across the monorepo.

## 3. Core Modules & Features

### Authentication & Multi-Tenancy

- **Super Admin Mode**: Isolated SaaS management layer to oversee all tenants, toggle active statuses, and impersonate tenants.
- **Tenant Isolation**: Middleware guarantees isolated access across tenant boundaries.
- **Role-Based Access Control (RBAC)**: Supports roles such as CASHIER, KITCHEN, and OWNER with specific PIN-based logins and dynamic redirects.

### POS Core

- **Offline-First Resilience**: Uses Dexie.js for 10-minute TTL menu caching. Falls back to offline-first if network drops.
- **Order Management**: Robust cart logic (adding, updating, removing items, line-level notes), auto-generated KOT (Kitchen Order Ticket) sequencing, and real-time voiding.
- [x] **Phase 5: Customer Engagement & CRM**
  - Customer profile creation and history lookup.
  - Loyalty point accumulation and tiered rewards.
  - Integrated redemption in checkout flow.
  - Purchase pattern tracking (frequency, spend).
- **Course & Seat Management**: Support for holding/firing courses and seat-level assignment for precision service in fine dining.
- **Bar & Hospitality Flows**: Open Bar Tabs for rapid service and "Repeat Round" functionality to duplicate orders instantly.
- **Dine-In Management**: Zone-grouped floor plan with real-time table statuses (Available, Occupied, Billed, Reserved, Dirty) and auto-refresh logic.

### Kitchen Display System (KDS)

- **Live Sync**: Uses WebSocket for real-time prep tracking. Stations receive immediate updates as KOTs are fired.
- **Optimistic UI**: Cooks can mark items complete and bump tickets instantly.

### Billing & Payments

- **GST Engine**: Handles intra-state (CGST/SGST) and inter-state (IGST) tax processing dynamically.
- **Split Payments**: Complex payment settlements across Cash, UPI, Card, and Wallet.
- **Thermal Printing**: Embedded CSS layout formatted for 80mm generic receipt printers.
- **Shift Management**: Full Z-Report aggregation for opening/closing float, petty cash, and variance tracking.

### Inventory, Delivery & Splitting

- **Real-Time Deductions**: Atomically decrements raw ingredient stock (`InventoryService`) as KOTs are fired via Prisma `$transaction`.
- **Zomato/Swiggy Ingestion**: Ingests third-party webhooks, matches `aggregator_item_id`, and auto-fires tickets to the POS/KDS without manual entry.

## Phase 6 — Delivery & Cloud Kitchen Operations ✅

- [x] **6A — Delivery Dispatch Screen**: Aggregator grouping and packaging workflow.
- [x] **6B — Item-Level Bill Splitting**: Assign items to guests for partial settlement.
- [x] **Phase 6: Delivery & Splitting Complete**
- [x] **Phase 7: QSR/Kiosk Complete** (Previously Phase 5 in implementation plan)
- [x] **Phase 8: AI & Analytics Complete**: Added ML forecasting, food cost alerts, and table turn analysis.

## 4. Design System & UX

_(Detailed in `DESIGN.md`)_

- **Philosophy**: Optimized for Point of Sale (POS) environments with harsh lighting. High contrast light theme (`surface-base` #F8FAFC, `text-primary` #0F172A).
- **Semantics**: Strict use of color meanings (Green = Success/Available, Red = Void/Error, Amber = Billed, Indigo = Occupied).
- **Fat-Finger Friendly**: All interactive targets are standardized (minimum 44-48px) to accommodate rapid touch interactions.
- **Components**: Heavy usage of subtle shadows and distinct border lines to replace glassmorphism and improve focus boundaries.

## 5. Completed Fixes (Previous Sprints)

The following items from the `FLOOR_PLAN_AUDIT.md` have been resolved and are live in production:

1. **POS Navigation Integration** ✅: `pos/page.tsx` reads `table_id` and `table_number` query parameters to attach new orders to specific tables automatically.
2. **Order Resumption** ✅: Clicking an 'Occupied' table seamlessly loads the active order into the cart rather than creating duplicates.
3. **Table State Reset** ✅: "Mark Clean" action is available to manually clear `DIRTY` tables so they revert to `AVAILABLE`.
4. **Token Standardization** ✅: JWT local storage keys are standardized across the frontend via `@respos/utils/auth.ts` (`rpos_auth_token`).
5. **Real-time Floor Plan Updates** ✅: `TablesPage` uses WebSocket (`table:status-changed`) for instant updates without polling.
6. **Table Transfer** ✅: Orders can be transferred between tables via `PATCH /orders/:id/transfer` with real-time status broadcast.
7. **Real Analytics** ✅: All dashboard widgets (`ForecastWidget`, `TableTurnHeatmap`, `FoodCostAlertBanner`, `StaffHub`) now fetch live data from the backend analytics endpoints.

## 6. Business Expansion & Future Modules (Long Term Roadmap)

- [x] **AI Forecasting**: ML-based demand prediction, food cost alerts, and table-turn analysis.
- [x] **India GST Compliance**: Auto GSTR-1/3B generation and e-Invoice Sandbox readiness.
- [x] **Staff Operations**: Timeclock PIN pad, scheduling, and automated payroll export.
- [x] **Omnichannel Support**: Native online storefront synced seamlessly to internal KDS.
- [x] **P&L Dashboard**: Stacked cash-flow charts and vendor purchase order (PO) aging reports.
- [x] **Automated Marketing**: WhatsApp/SMS campaign batcher and cron-based owner alerts.
