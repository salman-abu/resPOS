# resPOS (NextGen Restaurant POS) - AI Application Manifest

## 1. System Overview

**Name**: resPOS (NextGen Restaurant POS)
**Type**: Multi-tenant SaaS B2B Restaurant Point of Sale System
**Architecture**: Monorepo (pnpm workspaces)
**Primary Interface**: Web App (Next.js PWA)
**Primary Backend**: RESTful API + WebSockets (NestJS)

## 2. Technology Stack

- **Frontend (`apps/web`)**: Next.js 14, React, Tailwind CSS, Shadcn UI, Zustand (State Management), Dexie.js (IndexedDB Offline Cache), next-pwa, socket.io-client.
- **Backend (`apps/api`)**: NestJS, Prisma ORM, BullMQ, Redis, socket.io.
- **Database (`packages/db`)**: PostgreSQL.
- **Shared Packages**: `packages/types`, `packages/utils`, `packages/db`.
- **Tooling**: pnpm, Docker (Postgres & Redis), Prettier, ESLint, Husky.

## 3. Core Entities & Schema

- **Tenancy**: `Tenant`, `Outlet`
- **Users**: `User` (Roles: Owner, Cashier, Kitchen Staff), `SuperAdmin`
- **Menu Management**: `Category`, `Item`, `Variant`, `Addon`, `ComboMeal`, `Ingredient`, `Recipe`
- **Floor Plan**: `Zone`, `Table`
- **Operations**: `Order`, `OrderItem`, `KOT` (Kitchen Order Ticket), `Shift`
- **Transactions**: `Invoice`, `Payment`
- **Inventory/Vendor**: `Vendor`, `PurchaseOrder`
- **Aggregator**: `AggregatorMenu`
- **Misc**: `Customer`, `HsnCode`, `AuditLog`

## 4. Key Feature Modules

### 4.1 Authentication & Multi-Tenancy

- **Strategy**: JWT-based authentication for APIs.
- **Login Methods**: Email/Password (Owners), PIN-based login (Staff/Kitchen).
- **Isolation**: Tenant Middleware enforces data isolation using `tenantId`.
- **RBAC**: Role-Based Access Control guards on backend routes.

### 4.2 Point of Sale (POS) Interface

- **Offline-First**: Uses Dexie.js for menu caching and drafting orders locally.
- **Cart Management**: Zustand-managed cart with per-line item tax (CGST/SGST) breakdown.
- **Floor Plan**: Visual grid of tables categorized by zones, color-coded by real-time status (Available, Occupied, Billed, Reserved, Dirty).
- **Order Flow**: Table Selection -> Item Entry -> Fire KOT -> Settle Bill.

### 4.3 Kitchen Display System (KDS)

- **Real-Time Communication**: WebSocket (`socket.io`) gateway broadcasting KOTs to specific station rooms (e.g., Hot Kitchen, Bar) or ALL.
- **Optimistic UI**: Instant status updates on screens.
- **Lifecycle**: KOT Fired -> Items marked "Prepared" -> KOT "Bumped" (Served).

### 4.4 Billing & Payments

- **Taxation Engine**: Inter-state vs intra-state GST calculation.
- **Invoicing**: Auto-sequenced thermal receipt generation (`INV-YYYY-XXXXX`), printed via embedded CSS formatting (Courier Prime).
- **Payments**: Supports split payments across Cash, UPI, Card, and Complimentary. Quick-cash chips and live balance tracker.
- **Cashier Shifts**: Open/Close shift mechanism tracking opening float, expected cash, actual cash, and variances. Generates end-of-day "Z-Reports".

### 4.5 Inventory & Recipe Management

- **Automatic Deductions**: Firing a KOT triggers background deductions of raw ingredients based on item recipes using atomic Prisma transactions.

### 4.6 Third-Party Aggregator Integrations (Zomato/Swiggy)

- **Ingestion**: Public Webhook endpoints for receiving incoming external orders.
- **Processing**: Maps external items to internal `AggregatorMenu` IDs, automatically creating system orders.
- **Automation**: Injected orders are automatically fired as KOTs to the KDS via a system-level impersonation.

### 4.7 Super Admin & Platform God Mode

- **Portal**: Dedicated Next.js portal layout with red-accented theme.
- **CRM/SaaS Ops**: Overview of all tenants, platform GMV calculations.
- **Impersonation**: Generates bypass JWTs to "Act As" a specific tenant for support operations.
- **Kill Switch**: Ability to instantly toggle tenant platform access off/on.

## 5. UI/UX Paradigm

- **Aesthetics**: Glassmorphism, dynamic animations, dark mode optimized, gradient avatars.
- **Feedback**: Smooth micro-animations (e.g., shake on wrong PIN), optimistic updates, toast notifications.
- **Dashboards**: Business Health Score UI, live metrics, top sellers, AI Insights feed.
