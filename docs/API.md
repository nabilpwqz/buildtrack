# BuildTrack — REST & Real-Time SSE API Documentation

Base URL: `/api/v1` (authenticated via **NextAuth.js v5** session cookies).

## Authentication & RBAC Roles

| Role | Scope Summary |
| :--- | :--- |
| `ADMIN` | Full system access, User Management, System Settings, Operational Data Hub & Read-Only SQL Console |
| `PROJECT_MANAGER` | Create/manage authorized projects, tasks, milestones, contractors, budgets (read-only), material approvals |
| `SITE_ENGINEER` | Daily progress reports, site reports, delay reports, task status/progress updates, material issue/consume |
| `FINANCE_MANAGER` | Manage project budgets, expense categories, expense records, financial PDF reports (blocked from system settings) |
| `CONTRACTOR` | View assigned projects/tasks only, update task progress, submit material requests, upload progress reports |

---

## Core Endpoints Reference

### 1. Projects (`/api/v1/projects`)
- `GET /api/v1/projects` — Paginated, searchable, sortable list of projects (`q`, `status`, `page`, `pageSize`, `sort`, `desc`). Contractors see only assigned projects.
- `POST /api/v1/projects` — Create a project (`ADMIN`, `PROJECT_MANAGER`).
- `GET /api/v1/projects/[id]` — Full project details, members, contractors, milestones, and server-computed budget summary.
- `PATCH /api/v1/projects/[id]` — Update project fields (`FINANCE_MANAGER` restricted to `totalBudget` only).
- `DELETE /api/v1/projects/[id]` — Delete project (`ADMIN`, authorized `PROJECT_MANAGER`).

### 2. Tasks & Kanban (`/api/v1/tasks`)
- `GET /api/v1/tasks` — Filterable task list (`projectId`, `status`, `priority`, `overdueOnly`, `blockedOnly`, `q`) with computed `isOverdue` and `isBlocked`.
- `POST /api/v1/tasks` — Create task with optional `status` (`TODO | IN_PROGRESS | REVIEW | COMPLETED`) and `dependsOnIds` (DFS circular dependency check).
- `GET /api/v1/tasks/[id]` / `PATCH /api/v1/tasks/[id]` / `DELETE /api/v1/tasks/[id]`
- `POST /api/v1/tasks/[id]/transition` — Transition workflow (`TODO -> IN_PROGRESS -> REVIEW -> COMPLETED`); blocks start/completion if prerequisites are incomplete (`HTTP 409`).
- `GET /api/v1/tasks/[id]/comments` / `POST /api/v1/tasks/[id]/comments` — Task comments with audit logging.

### 3. Budget, Expenses & Financial Reports
- `GET /api/v1/budget` / `POST /api/v1/budget` — Server-computed EVM telemetry (`BAC`, `ACWP`, `EAC`, `VAC`, `CPI`), category breakdown, and overrun flags.
- `GET /api/v1/expenses` / `POST /api/v1/expenses` — Expense ledger with date range, category, and project filters; validates project existence (`HTTP 404`).
- `GET /api/v1/expenses/categories` / `POST /api/v1/expenses/categories` — Expense category management.
- `GET /api/v1/reports/financial/[projectId]` — Generates downloadable binary **PDF Financial Report** (`application/pdf`).

### 4. Materials & Inventory
- `GET /api/v1/materials` / `POST /api/v1/materials` — Warehouse SKUs, low-stock metrics, and realistic auto-seeding when empty.
- `GET /api/v1/materials/[id]` / `PATCH /api/v1/materials/[id]` / `DELETE /api/v1/materials/[id]`
- `POST /api/v1/materials/[id]/issue` — Issue or consume stock atomically; rejects over-issuance (`HTTP 409`) and triggers `LOW_STOCK` notifications.
- `GET /api/v1/materials/categories` / `POST /api/v1/materials/categories`
- `GET /api/v1/materials/transactions` / `POST /api/v1/materials/transactions` — Chronological stock history ledger (`RECEIVE`, `ISSUE`, `CONSUME`, `ADJUST`).
- `GET /api/v1/material-requests` / `POST /api/v1/material-requests` & `POST /api/v1/material-requests/[id]/approve` — Site indent request & fulfillment workflow.

### 5. Contractors
- `GET /api/v1/contractors` / `POST /api/v1/contractors` — Contractor directory with reliability rankings.
- `GET /api/v1/contractors/[id]` / `PATCH /api/v1/contractors/[id]` / `DELETE /api/v1/contractors/[id]` — Enforces Contractor isolation (`HTTP 403` for other firms).
- `POST /api/v1/contractors/[id]/assign` — Assign contractor to project.
- `POST /api/v1/contractors/[id]/performance` — Record SLA & quality evaluation.

### 6. Progress Tracking, Milestones & Analytics
- `GET /api/v1/progress-reports` / `POST /api/v1/progress-reports` — Daily progress updates with photo URLs and automatic weighted project progress rollup.
- `GET /api/v1/milestones` / `POST /api/v1/milestones` & `PATCH/DELETE /api/v1/milestones/[id]`
- `GET /api/v1/reports` / `POST /api/v1/reports` — Site reports, delay reports, delayed task radar, and progress report retrieval.
- `GET /api/v1/analytics/summary` — All 10 core Analytics Dashboard KPIs, 12-month expense trends, and contractor performance rankings.

### 7. Governance, Documents & Notifications
- `GET/POST/PATCH/DELETE /api/v1/users` (`ADMIN` for mutations)
- `GET/PATCH /api/v1/settings/system` (`ADMIN` only for mutations; `FINANCE_MANAGER` blocked with `HTTP 403`)
- `GET /api/v1/activity-logs` — Searchable audit trail.
- `GET/PATCH /api/v1/notifications` — User notifications & read-state updates.
- `GET/POST /api/v1/documents` — Construction document vault metadata.

### 8. ADMIN-Only Operational Data Hub & Real-Time SSE
- `GET /api/v1/admin/database` — Live counts across all 25 tables, PostgreSQL engine stats (`pg_database_size`, `pg_stat_activity`), paginated table explorer, and `passwordHash` redaction (`ADMIN` only).
- `GET /api/v1/admin/realtime/stream` — `text/event-stream` SSE endpoint emitting `snapshot`, `update`, and `heartbeat` events (`ADMIN` only).
- `POST /api/v1/admin/database/seed` — On-demand realistic megaproject & relational telemetry seeder (`ADMIN` only).
- `POST /api/v1/admin/database/query` — Strictly read-only `SELECT` / `WITH` SQL diagnostics console (`ADMIN` only; DML/DDL/multi-statement queries blocked with `HTTP 400`).

