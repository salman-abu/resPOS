# 🗺️ Floor Plan Logic Audit — resPOS

## ✅ What's Working

| Layer                  | Status   | Notes                                                                                             |
| ---------------------- | -------- | ------------------------------------------------------------------------------------------------- |
| Schema                 | ✅ Solid | Zone→Table→Order chain clean. TableStatus enum covers all 5 states.                               |
| GET /billing/tables    | ✅ Works | Returns zones + tables + active orders in one query.                                              |
| Table status lifecycle | ✅ Works | AVAILABLE→OCCUPIED (createOrder), OCCUPIED→BILLED (generateInvoice), BILLED→DIRTY (settleInvoice) |
| Floor plan UI          | ✅ Good  | Status pills, zone grouping, color coding, elapsed time, 30s auto-refresh.                        |

---

## 🔴 Critical Missing Pieces

### 4. No RESERVED table management

`TableStatus` has `RESERVED`, filter pill exists, but ZERO way to create/manage reservations. It's dead code.

---

## ✅ Resolved in Previous Sprints

| # | Issue | Status | Notes |
|---|-------|--------|-------|
| 1 | POS page ignores table_id / table_number query params | ✅ Fixed | `pos/page.tsx` now reads query params and attaches orders to tables. |
| 2 | No "Resume Order" when clicking OCCUPIED/BILLED table | ✅ Fixed | Clicking occupied tables loads the active order into the cart. |
| 3 | No DIRTY→AVAILABLE reset (no "Mark Clean" action) | ✅ Fixed | "Mark Clean" button is available on DIRTY tables. |
| 5 | Token key mismatch between pages | ✅ Fixed | Standardized to `rpos_auth_token` via `@respos/utils/auth.ts`. |
| 6 | No real-time WebSocket for floor plan | ✅ Fixed | `useTableSocket` handles `table:status-changed` events instantly. |

---

## 🟡 Minor Issues

| Issue                                                                   | Impact                           |
| ----------------------------------------------------------------------- | -------------------------------- |
| No PAX count prompt before table navigation                             | Pax defaults to 1                |
| BILLED table clickable → may create new order instead of reopening bill | UX bug                           |
| No capacity warning                                                     | No check if pax > table capacity |
| No zone-level search/filter                                             | Hard UX with many zones          |

---

## Fix Priority

1. #1 — Query params in POS page (breaks core dine-in TODAY)
2. #2 — Resume order (causes duplicate orders)
3. #3 — Mark Clean action (tables get permanently stuck)
4. #5 — Token key standardization
5. #6 — Real-time WebSocket
6. #4 — Reservations (future feature)

---

## 🔵 Advanced Missing Features (Roadmap)

### 1. Table Transfer & Order Merge

**Impact:** High (Operational necessity)
**Status:** ✅ **IMPLEMENTED** — `PATCH /orders/:id/transfer` is live with WebSocket broadcast.

### 2. Visual Floor Plan (Spatial Layout)

**Impact:** Medium (Aesthetics/Speed)
Tables are currently a simple grid. High-end restaurants prefer a spatial layout where tables are placed according to the actual room map (drag & drop editor).

### 3. Split Billing (Per Seat / Per Item)

**Impact:** High (Customer Experience)
No ability to "Split Bill" for a table. Standard POS systems allow splitting by seat or by selecting specific items for separate invoices.
**Status:** ⏳ **Deferred to future phase** per implementation plan.

### 4. Real Analytics (Table Turn Time)

**Impact:** Medium (Management)
**Status:** ✅ **IMPLEMENTED** — `TableTurnHeatmap.tsx` now fetches live data from `GET /analytics/table-turn`.

### 5. Staff Assignment (Table Ownership)

**Impact:** Medium (Workflow)
No "My Tables" filter for waiters. In busy shifts, waiters should only see or prioritize tables they are assigned to.

### 6. Advanced Alerts

**Impact:** Low
No "Overstay" alert (e.g., table occupied for > 90 mins) or "Service Required" toggle.
