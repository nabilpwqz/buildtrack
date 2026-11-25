# BUILDTRACK - Civil Engineering & Megaproject Digital Twin Platform

```
██████╗ ██╗   ██╗██╗██╗     ██████╗ ████████╗██████╗  █████╗  ██████╗██╗  ██╗
██╔══██╗██║   ██║██║██║     ██╔══██╗╚══██╔══╝██╔══██╗██╔══██╗██╔════╝██║ ██╔╝
██████╔╝██║   ██║██║██║     ██║  ██║   ██║   ██████╔╝███████║██║     █████╔╝ 
██╔══██╗██║   ██║██║██║     ██║  ██║   ██║   ██╔══██╗██╔══██║██║     ██╔═██╗ 
██████╔╝╚██████╔╝██║███████╗██████╔╝   ██║   ██║  ██║██║  ██║╚██████╗██║  ██╗
╚═════╝  ╚═════╝ ╚═╝╚══════╝╚═════╝    ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
```

<div align="center">

> **Next-Generation Construction Project Intelligence, Real-Time 3D Digital Twins, Critical Path Gantt Scheduling, Earned Value Financial Control, and Autonomous Drone Photogrammetry.**

[![Next.js 15](https://img.shields.io/badge/Next.js-15.5-0E0D0C?style=for-the-badge&logo=nextdotjs&logoColor=FFB000)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0-171513?style=for-the-badge&logo=react&logoColor=FFB000)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-211E1B?style=for-the-badge&logo=typescript&logoColor=F4EFE6)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-R3F%203D-FFB000?style=for-the-badge&logo=three.js&logoColor=0E0D0C)](https://threejs.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.4-B8602E?style=for-the-badge&logo=prisma&logoColor=F4EFE6)](https://www.prisma.io/)
[![Neon PostgreSQL](https://img.shields.io/badge/Neon-PostgreSQL-0E0D0C?style=for-the-badge&logo=postgresql&logoColor=E8C547)](https://neon.tech/)
[![Vitest](https://img.shields.io/badge/Vitest-41%2F41%20PASSING-E8C547?style=for-the-badge&logo=vitest&logoColor=0E0D0C)](https://vitest.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-CSS%20v4-171513?style=for-the-badge&logo=tailwindcss&logoColor=FFB000)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-8C8782?style=for-the-badge)](LICENSE)

</div>

---

## Table of Contents

- [Executive Overview](#executive-overview)
- [Design Contract: Forged Steel & Molten Amber](#design-contract-forged-steel--molten-amber)
- [System Architecture (Mermaid)](#system-architecture-mermaid)
- [Digital Twin & Photogrammetry Pipeline](#digital-twin--photogrammetry-pipeline)
- [Core Invariant Finite State Machine](#core-invariant-finite-state-machine)
- [Database Schema & ERD Architecture](#database-schema--erd-architecture)
- [Visual Telemetry & HUD Terminal Mockups](#visual-telemetry--hud-terminal-mockups)
- [3D Interactive Viewport Engines](#3d-interactive-viewport-engines)
- [Enterprise RBAC & Demo Clearances](#enterprise-rbac--demo-clearances)
- [Full Megaproject Dataset Registry](#full-megaproject-dataset-registry)
- [Local Development & Quickstart](#local-development--quickstart)
- [REST API Specification Matrix](#rest-api-specification-matrix)
- [Production Deployment (Vercel & Neon)](#production-deployment-vercel--neon)
- [Verification & Quality Assurance](#verification--quality-assurance)

---

## Executive Overview

**BuildTrack** is an enterprise-grade construction project intelligence platform engineered for civil infrastructure contractors, project directors, site supervisors, and financial controllers. It eliminates information fragmentation across capital megaprojects by synthesizing real-time 3D spatial twins, server-validated critical path scheduling, atomic material inventory controls, and earned value cost accounting into a unified, high-density telemetry command interface.

```
+---------------------------------------------------------------------------------------+
|                                BUILDTRACK COMMAND CENTER                              |
|                                                                                       |
|  [3D SKYLINE TWIN]       [SVG CRITICAL PATH GANTT]     [EARNED VALUE FINANCIALS]      |
|  * Procedural heights    * Topological DAG solver      * BAC, BCWS, BCWP, ACWP        |
|  * Real-time HUD hover   * Prerequisite lock checks    * Cost & Schedule Variances    |
|  * Waypoint telemetry    * Dynamic float calculations  * 80% / 100% Hazard Alerts     |
|                                                                                       |
|  [SUPPLY CHAIN MATRIX]   [SITE OPERATIONS LOGS]        [INCIDENT DELAY MITIGATION]    |
|  * 3D warehouse bays     * Barometric weather logs     * Root-cause forensics         |
|  * FIFO stock reserves   * Shift trade density logs    * Critical path variance days  |
|  * Atomic dispatches     * ISO 45001 safety audits     * Optimistic mitigation state  |
+---------------------------------------------------------------------------------------+
```

---

## Design Contract: "Forged Steel & Molten Amber"

BuildTrack rejects generic modern SaaS themes (blue, purple, and green) in favor of a specialized, high-contrast palette inspired by structural steel fabrication yards, arc welding, and heavy machinery:

```
+---------------------------------------------------------------------------------------+
|  PALETTE SWATCHES & DESIGN TOKENS                                                     |
|                                                                                       |
|  PANEL DEEP      BASE LAYER      ELEVATED CARD   MOLTEN AMBER    SAFETY GOLD  CRIMSON |
|  [ #0E0D0C ]     [ #171513 ]     [ #211E1B ]     [ #FFB000 ]     [ #E8C547 ]  [ #E03131 ]
|  bg-bg-0         bg-bg-1         bg-bg-2         text-amber      text-gold    text-crimson
+---------------------------------------------------------------------------------------+
```

### Design Token Reference

| Semantic Token | Hex Code | Purpose & Application |
| :--- | :--- | :--- |
| `--bg-0` | `#0E0D0C` | Deep forged graphite base floor; application frame background |
| `--bg-1` | `#171513` | Industrial equipment panels, container cards, table headers |
| `--bg-2` | `#211E1B` | Elevated inspection plates, modal interiors, dropdown menus |
| `--border` | `#2D2824` | Structural steel perimeter borders and dividing seams |
| `--steel` | `#8C8782` | Secondary technical metadata, units, and coordinate labels |
| `--concrete` | `#C9C3BB` | Primary structural text, table content, and card descriptions |
| `--ivory` | `#F4EFE6` | High-impact headings, primary KPIs, and active highlights |
| `--amber` | `#FFB000` | Primary indicator, active tab triggers, 3D wireframes, progress fills |
| `--molten` | `#FF6A13` | High-temperature action buttons, primary form submissions |
| `--copper` | `#B8602E` | Secondary warning tags, tertiary accent elements |
| `--gold` | `#E8C547` | Verified completion certificates, ISO safety conformance stamps |
| `--crimson` | `#E03131` | Schedule delay notices, budget overrun warnings, hazard striping |

> **Strict Color Enforcement Rule**: Zero blue, purple, or green tokens exist across Tailwind classes, SVG icons, Three.js shaders, or Recharts data series. Successful state is rendered in **Ivory & Molten Gold** (`#E8C547`), while delays and overruns use **High-Contrast Crimson** (`#E03131`).

---

## System Architecture (Mermaid)

```mermaid
flowchart TD
    subgraph ClientLayer["CLIENT BROWSER & 3D VIEWPORT ENGINE"]
        UI["React 19 Server & Client Components"]
        Canvas3D["Three.js / React Three Fiber Viewport"]
        HUD["Real-Time Industrial Telemetry HUD"]
        GanttSVG["Pure SVG Custom Gantt Engine"]
        Kanban3D["@dnd-kit 3D Perspective Kanban"]
    end

    subgraph GatewayLayer["EDGE ROUTING & SECURITY GATEWAY"]
        MW["Next.js Edge Middleware"]
        Auth["NextAuth.js v5 (JWT Session Engine)"]
        RBAC["Centralized RBAC Engine (can & isRole)"]
        AuditLog["Immutable Audit Trail & Activity Logger"]
    end

    subgraph AppLayer["NEXT.JS 15 APP ROUTER & API ENGINE"]
        DashboardRoute["/dashboard & 3D Skyline Route"]
        ProjectRoute["/projects & Milestone Detail"]
        TaskRoute["/tasks & DAG Dependency Solver"]
        BudgetRoute["/budget & Earned Value Engine"]
        MaterialRoute["/materials & 3D Warehouse Bay"]
        ReportsRoute["/reports & Daily Site Telemetry"]
    end

    subgraph DataLayer["PERSISTENCE & TRANSACTION ENGINE"]
        PrismaClient["Prisma ORM Client Singleton"]
        CycleDetection["DAG Cycle & Prerequisite Evaluator"]
        AtomicTx["Atomic Stock & Financial Transactions"]
        NeonDB[("Neon Cloud PostgreSQL / dev.db")]
    end

    UI --> MW
    Canvas3D --> UI
    HUD --> UI
    GanttSVG --> UI
    Kanban3D --> UI

    MW --> Auth
    Auth --> RBAC
    RBAC --> AuditLog
    RBAC --> AppLayer

    AppLayer --> PrismaClient
    PrismaClient --> CycleDetection
    PrismaClient --> AtomicTx
    AtomicTx --> NeonDB
```

---

## Digital Twin & Photogrammetry Pipeline

```mermaid
flowchart LR
    subgraph DroneTelemetry["AUTONOMOUS FIELD CAPTURE"]
        Drone["Field Inspection Drone"]
        LiDAR["LiDAR Point Cloud Scanner"]
        SiteEng["Senior Civil Site Engineer"]
    end

    subgraph ProcessingCore["DIGITAL TWIN PROCESSING ENGINE"]
        Photogrammetry["Photogrammetry Reconstruction"]
        PointMesh["3D Polygon Mesh & Waypoints"]
        UPVTesting["Ultrasonic Pulse Velocity (UPV)"]
        NDT["NDT Non-Destructive Testing Log"]
    end

    subgraph TelemetryDisplay["REAL-TIME HUD & RISK MATRIX"]
        TwinHUD["3D Twin Interactive Waypoint HUD"]
        CPM["Critical Path Method (CPM) Variance Engine"]
        DelayForensics["Delay Disclosure & Incident Forensic Dossier"]
        ExecutiveAlerts["Automated Executive Mitigation Dispatch"]
    end

    Drone --> Photogrammetry
    LiDAR --> PointMesh
    SiteEng --> UPVTesting
    SiteEng --> NDT

    Photogrammetry --> TwinHUD
    PointMesh --> TwinHUD
    UPVTesting --> CPM
    NDT --> CPM

    TwinHUD --> CPM
    CPM --> DelayForensics
    DelayForensics --> ExecutiveAlerts
```

---

## Core Invariant Finite State Machine

```mermaid
stateDiagram-v2
    [*] --> TODO: Task Initiated & Scheduled
    
    TODO --> IN_PROGRESS: Prerequisite Dependencies Verified (DAG)
    note right of IN_PROGRESS: Server validates zero blocking prerequisite tasks
    
    IN_PROGRESS --> TODO: Dependency Rollback / Hold
    
    IN_PROGRESS --> REVIEW: Structural Quality Inspection Passed
    note right of REVIEW: Materials Engineer signs off cube strength & NDT
    
    REVIEW --> IN_PROGRESS: Remediation Required
    
    REVIEW --> COMPLETED: Milestone Sign-off Approved
    note right of COMPLETED: Automatic Progress Rollup & Audit Stamped
    
    COMPLETED --> [*]: Milestone Certified in Baseline
```

### Server-Enforced Invariant Guardrails

1. **Topological Dependency Block Rule**: A task cannot transition to `IN_PROGRESS` or `COMPLETED` if any prerequisite task is incomplete. Violations trigger an immediate `409 Conflict` containing the full array of blocking tasks.
2. **Cycle Prevention in Task Graph**: Before inserting or updating task dependencies, the engine runs a Depth-First Graph Search (DFS) over the DAG to detect potential cyclic loops, preventing infinite scheduling deadlocks.
3. **Atomic Stock Decrement Guard**: Material dispatches cannot exceed `availableQty`. Issuance logic executes inside an atomic Prisma interactive transaction (`prisma.$transaction`), throwing `409 Conflict` upon overdraft attempts.
4. **Server-Side Financial Security**: Earned Value Analysis metrics (Cost Variance, Schedule Variance, CPI, SPI) are derived exclusively on the backend from certified expense ledgers and milestone sign-offs. Client-side mutations are rejected with `403 Forbidden`.
5. **Zero Historical Erasure**: Critical project artifacts utilize soft-deletion patterns (`isDeleted: true`). Immutable event records are preserved in `ActivityLog` for legal and regulatory compliance.

---

## Database Schema & ERD Architecture

```mermaid
erDiagram
    COMPANY ||--o{ USER : employs
    COMPANY ||--o{ PROJECT : owns
    
    USER ||--o{ PROJECT : manages
    USER ||--o{ PROJECT_MEMBER : belongs_to
    USER ||--o{ TASK : assigned_to
    USER ||--o{ EXPENSE : records
    USER ||--o{ MATERIAL_REQUEST : requests
    USER ||--o{ MATERIAL_TRANSACTION : executes
    USER ||--o{ SITE_REPORT : logs
    USER ||--o{ PROGRESS_REPORT : submits
    USER ||--o{ DELAY_REPORT : files
    USER ||--o{ AUDIT_LOG : triggers
    
    CONTRACTOR ||--o{ USER : accounts
    CONTRACTOR ||--o{ PROJECT_CONTRACTOR : contracted_on
    CONTRACTOR ||--o{ CONTRACTOR_PERFORMANCE : scored_in
    
    PROJECT ||--o{ PROJECT_MEMBER : team
    PROJECT ||--o{ PROJECT_CONTRACTOR : contractors
    PROJECT ||--o{ MILESTONE : milestones
    PROJECT ||--o{ TASK : tasks
    PROJECT ||--o{ BUDGET : budget_lines
    PROJECT ||--o{ EXPENSE : actual_expenses
    PROJECT ||--o{ MATERIAL_REQUEST : indents
    PROJECT ||--o{ MATERIAL_TRANSACTION : dispatches
    PROJECT ||--o{ SITE_REPORT : site_logs
    PROJECT ||--o{ PROGRESS_REPORT : stage_certs
    PROJECT ||--o{ DELAY_REPORT : schedule_delays
    
    TASK ||--o{ TASK_DEPENDENCY : prerequisites
    TASK ||--o{ TASK_COMMENT : comments
    TASK ||--o{ TASK_HISTORY : audits
    TASK ||--o{ PROGRESS_REPORT : stage_progress
    TASK ||--o{ DELAY_REPORT : task_delays
    
    EXPENSE_CATEGORY ||--o{ BUDGET : categorized_budgets
    EXPENSE_CATEGORY ||--o{ EXPENSE : actual_line_items
    
    MATERIAL_CATEGORY ||--o{ MATERIAL : classifies
    MATERIAL ||--o{ MATERIAL_REQUEST : indents
    MATERIAL ||--o{ MATERIAL_TRANSACTION : warehouse_movements
```

---

## Visual Telemetry & HUD Terminal Mockups

### 1. Interactive 3D Skyline HUD (Dashboard)

```
========================================================================================
 BUILDTRACK PORTFOLIO SKYLINE // 3D INTERACTIVE TWIN VIEWPORT
========================================================================================
                                 [CRANE-A1] 
                                    \  |  /  
                                     \ | /   
                                      \|/    
   [DHAKA METRO]      [KARNAPHULI]     |      [GULSHAN SPIRE]     [PADMA DEPOT]
   |  68%  |           |  74%  |       |       |  45%  |           |  82%  |
   |_______|           |_______|       |       |_______|           |_______|
   | [===] |           | [===] |       |       | [===] |           | [===] |
   | [===] |           | [===] |     [HUB]     | [===] |           | [===] |
   | [===] |           | [===] |    /  |  \    | [===] |           | [===] |
   | [===] |           | [===] |   /   |   \   | [===] |           | [===] |
---|-------|-----------|-------|-------|-------|-------|-----------|-------|------------
 [TELEMETRY HUD] -> HOVER TARGET: Dhaka Metro Elevated Viaduct Phase 3
 - Coordinates: 23.7808 N, 90.4227 E  |  Elevation: +18.5m AGL  |  Active Workforce: 142
 - CPM Milestone: Pier Cap Span-48    |  Status: IN_PROGRESS    |  Burn Rate: $84k/day
========================================================================================
```

### 2. Critical Path Gantt & SVG Timeline

```
========================================================================================
 CRITICAL PATH METHOD (CPM) GANTT ENGINE // TOPOLOGICAL SCHEDULE SLICES
========================================================================================
 TASK IDENTIFIER           W1   W2   W3   W4   W5   W6   W7   W8   SLACK   STATUS
----------------------------------------------------------------------------------------
 T-101 Subsurface Piling   [====] .    .    .    .    .    .    .   0d CRIT  COMPLETED
 T-102 Pier Reinforcement  .    [======]   .    .    .    .    .   0d CRIT  COMPLETED
 T-103 Pre-cast Girders    .    .    .   [========] .    .    .   0d CRIT  IN_PROGRESS
 T-104 Deck Slab Pouring   .    .    .    .    .   [=====]  .    .   2d FLOAT LOCKED
 T-105 Electrical Rigging  .    .    .    .    .    .   [=======]   5d FLOAT TODO
----------------------------------------------------------------------------------------
 CRITICAL PATH FLOAT MARGIN: ZERO DAYS [CRITICAL PATH HEALTH: INTACT]
========================================================================================
```

### 3. Delay Forensics & Schedule Mitigation Matrix

```
========================================================================================
 ACTIVE DELAY INCIDENT & MITIGATION TELEMETRY (31 RECORDS TRACKED)
========================================================================================
 INCIDENT ID  MEGAPROJECT          VARIANCE   STATUS      ROOT CAUSE FORENSIC
----------------------------------------------------------------------------------------
 DELAY-042    Dhaka Metro Viaduct   +14 Days  MITIGATED   Unmapped utility gas main Pier 114
 DELAY-089    Padma Logistic Depot  +24 Days  OPEN        Subsurface hydrostatic surge
 DELAY-112    Karnaphuli Terminal   +07 Days  RESOLVED    Deep-water tidal wave surge Berth-3
 DELAY-134    Gulshan Spire         +09 Days  RESOLVED    High-tensile rebar import clearance
----------------------------------------------------------------------------------------
 TOTAL VARIANCE AT RISK: +309 Days  |  OPEN: 7  |  MITIGATED: 10  |  RESOLVED: 14
========================================================================================
```

---

## 3D Interactive Viewport Engines

BuildTrack includes **7 procedurally generated 3D visual twin viewports** powered by Three.js and React Three Fiber:

1. **Autonomous Crane & Framing Site (Login & Register)**:
   - Slowly rotating isometric construction site featuring an articulated luffing tower crane, hoisted rebar load, steel columns, and floating amber atmospheric dust particles.
2. **Interactive Portfolio Skyline (Dashboard)**:
   - Procedural city-grid plate where every capital project is rendered as a skyscraper.
   - Tower Height scales to Project Progress (%), Tower Color reflects real-time status (Amber for active, Gold for completed, Crimson for delayed, Steel for planning).
   - Mouse hover triggers a real-time HUD telemetry card; click initiates direct project navigation.
3. **Floor-by-Floor Structural Twin (Project Detail)**:
   - Dynamic skyscraper frame segmented into individual structural floors synchronized with milestone completion records.
   - Completed floors render in solid forged amber, in-progress floors pulse with wireframe animations, and upcoming floors appear ghosted.
4. **Stacked Cylinder Budget Towers (Budget Management)**:
   - Dual-cylinder towers comparing allocated capital budgets against actual incurred expenses per division.
   - Overrun divisions turn high-contrast crimson with hazard warning indicators; includes a 2D Recharts SVG fallback toggle.
5. **3D Warehouse Bays & Storage Crates (Materials Management)**:
   - Visual warehouse storage bays with stacked modular cargo crates scaled to inventory levels. Low-stock bays emit molten orange warnings.
6. **3D Lift Kanban (Tasks Board)**:
   - Drag-and-drop task cards with 3D perspective elevation, shadow projection, and server-side dependency rollback.
7. **Aerial Drone Photogrammetry & Completion Gauge (Reports)**:
   - Simulated autonomous UAV flight path with clickable LiDAR inspection waypoints, altitude tracking, and photographic survey frames.

---

## Enterprise RBAC & Demo Clearances

BuildTrack enforces **5 distinct role personas** with granular permissions evaluated via a centralized security matrix:

```
+---------------------------------------------------------------------------------------+
|  ROLE CLEARANCE HIERARCHY                                                             |
|                                                                                       |
|  [ADMIN] ---------> Master system control, user provisioning, global audit logs       |
|    |                                                                                  |
|    +--> [PROJECT_MANAGER] -> Project CRUD, task scheduling, indent approvals          |
|           |                                                                           |
|           +--> [SITE_ENGINEER] -> Daily site logs, progress verification, photo proofs|
|           |                                                                           |
|           +--> [FINANCE_MANAGER] -> Budget allocations, certified expense ledgers     |
|           |                                                                           |
|           +--> [CONTRACTOR] -> Assigned task updates, material indents, work logs     |
+---------------------------------------------------------------------------------------+
```

### Ready-to-Use Demo Credentials

All demo operator accounts share the universal development password: **`Demo@1234`**  
*(Quick-fill operator chips are integrated directly into the login screen)*

| Authority Level | Email Address | Operator Persona | Operational Scope & Clearance |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@buildtrack.com` | Engr. Kabir Hossain (Chief Director) | Master system configuration, user provisioning, role assignments, immutable audit log surveillance. |
| **PROJECT_MANAGER** | `pm@buildtrack.com` | Tariqul Islam, PMP (Lead Project Director) | Project lifecycle management, critical path task scheduling, contractor contracting, material indent approvals. |
| **SITE_ENGINEER** | `engineer@buildtrack.com` | Farhana Ahmed, PE (Senior Site Lead) | Daily operational shift logs, non-destructive testing progress sign-offs, material consumption receipts. |
| **FINANCE_MANAGER** | `finance@buildtrack.com` | Nasir Uddin, FCA (Chief Financial Controller) | Capital budget allocation, expense ledger certification, financial audit reports, cost variance tracking. |
| **CONTRACTOR** | `contractor@buildtrack.com` | Rafiq Chowdhury (Apex Steel Partner) | Task progress updates on assigned deliverables, material indent requests, daily shift work logs. |

### Enforced Roles & Capabilities Specification

BuildTrack strictly maintains server-enforced separation of concerns for all 5 enterprise roles:

| Security Role | Enforced Capabilities & Authority Scope | Strictly Denied Actions |
| :--- | :--- | :--- |
| **Admin** | • Manage company information<br>• Manage users and permissions<br>• View all construction projects<br>• Monitor company-wide project activities<br>• Configure system settings<br>• Access overall analytics | None (Full Master Directorate Authority) |
| **Project Manager** | • Create and manage projects<br>• Assign project tasks<br>• Set task priorities and deadlines<br>• Monitor project progress<br>• Manage project milestones<br>• Monitor project budgets<br>• Identify delayed tasks<br>• Review site reports | • Modifying budget ceilings (Finance only)<br>• Managing users & permissions (Admin only)<br>• Modifying system configurations<br>• Company info administration |
| **Site Engineer** | • Submit daily progress updates<br>• Update task status<br>• Record material usage<br>• Upload site progress photographs<br>• Submit construction site reports<br>• Report construction delays<br>• Monitor assigned site activities | • Budget management<br>• Expense ledger recording<br>• User administration<br>• System configuration<br>• Creating new projects |
| **Finance Manager** | • Manage project budgets<br>• Record project expenses<br>• Manage expense categories<br>• Monitor budget utilization<br>• Compare estimated and actual costs<br>• Generate financial reports<br>• Identify budget overruns | • Creating projects<br>• Creating or assigning tasks<br>• Updating task status<br>• User administration<br>• System configuration |
| **Contractor** | • View assigned projects<br>• View assigned tasks<br>• Update task progress<br>• Submit material requests<br>• Upload work progress reports<br>• View task deadlines | • Financial budget/expense access<br>• Managing other contractors<br>• Official daily site logs<br>• User administration<br>• System configuration |

---

## Full Megaproject Dataset Registry

BuildTrack seeds **12 real-world civil engineering megaprojects** in Bangladesh, fully populated with tasks, contractors, expense ledgers, warehouse inventory, site logs, progress certificates, and delay notices:

| Megaproject Title | Sector Category | Baseline Budget | Progress | Site Logs | Progress Certs | Delay Notices |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Dhaka Metro Elevated Viaduct Phase 3** | Urban Rail Infrastructure | $42,000,000 | 68% | 4 | 3 | 3 |
| **Karnaphuli River Deep-Water Terminal** | Marine / Port Works | $88,000,000 | 74% | 4 | 3 | 3 |
| **Sylhet International Trade Center** | Commercial High-Rise | $31,500,000 | 52% | 4 | 3 | 3 |
| **Padma Logistic City & Heavy Depot** | Industrial Logistics | $64,000,000 | 82% | 4 | 3 | 4 |
| **Gulshan High-Rise Financial Spire** | Superstructure Commercial | $54,000,000 | 45% | 4 | 3 | 3 |
| **Chattogram Port Dry Dock Expansion** | Marine Heavy Fabrication | $76,000,000 | 61% | 4 | 3 | 3 |
| **Cox's Bazar Sea-View Eco Resort** | Hospitality Masterplan | $28,000,000 | 38% | 4 | 3 | 2 |
| **Rupur Industrial Township Block D** | Civic Heavy Infrastructure | $49,000,000 | 79% | 4 | 3 | 2 |
| **Tejgaon Smart Urban Flyover** | Elevated Highway Works | $22,000,000 | 58% | 3 | 2 | 2 |
| **Khulna Power Transmission Hub** | High-Voltage Energy Grid | $36,500,000 | 64% | 3 | 2 | 2 |
| **Uttara North Commercial Complex** | Mixed-Use Retail & Office | $19,800,000 | 41% | 3 | 2 | 2 |
| **Barishal Inland River Port Wharf** | River Logistics & Piling | $14,200,000 | 33% | 3 | 2 | 2 |
| **TOTALS** | **12 Megaprojects** | **$505,000,000** | **~58%** | **44 Logs** | **32 Certs** | **31 Notices** |

---

## Local Development & Quickstart

### Prerequisites
- **Node.js**: v18.17.0+ (Tested through v24 LTS)
- **Package Manager**: npm v10+ or pnpm v9+
- **Database Engine**: Embedded zero-config SQLite (`dev.db`) for local testing, or PostgreSQL (Neon) for production.

### Step 1: Clone & Install Dependencies
```bash
git clone https://github.com/your-org/buildtrack.git
cd buildtrack

# Install dependencies with legacy peer resolution
npm install --legacy-peer-deps
```

### Step 2: Configure Environment Variables
Copy `.env.example` or create a `.env` file in the project root:
```env
# Database Connection (Neon Cloud PostgreSQL or SQLite)
DATABASE_URL="postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require"

# NextAuth Authentication Secret
AUTH_SECRET="buildtrack-super-secure-production-secret-key-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Application Public Host
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Step 3: Run Database Migrations & Seed Data
```bash
# Push Prisma schema to the database
npx prisma db push

# Run full baseline seed (12 megaprojects, 180 tasks, 24 contractors, 72 expenses, 36 materials)
npm run seed

# Seed complete reports dataset (44 site logs, 32 progress certificates, 31 delay notices)
node scripts/seed-all-reports.js
```

### Step 4: Launch Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser and use the pre-configured quick-fill demo chips on the login screen.

---

## REST API Specification Matrix

All endpoints reside under the `/api/v1` namespace and implement standardized JSON envelopes:

```json
{
  "data": { ... },
  "error": null
}
```

| Route Group | HTTP Endpoint | Method | Required RBAC Permission | Operation Description |
| :--- | :--- | :---: | :--- | :--- |
| **Analytics** | `/api/v1/analytics/summary` | `GET` | Authenticated Read | Global KPI counters, progress averages, and budget variance summaries |
| **Projects** | `/api/v1/projects` | `GET` | Authenticated Read | Paginated megaproject list with search, status filters, and sorting |
| **Projects** | `/api/v1/projects` | `POST` | `create:project` | Scaffold new capital project with initial budget and location coordinates |
| **Projects** | `/api/v1/projects/:id` | `GET` | Authenticated Read | Detailed project dossier with milestones, tasks, members, and expenses |
| **Projects** | `/api/v1/projects/:id` | `PATCH` | `update:project` | Update progress, timeline dates, status flags, and budget ceiling |
| **Tasks** | `/api/v1/tasks` | `GET` | Authenticated Read | Task registry with project slicing, status filtering, and assignee query |
| **Tasks** | `/api/v1/tasks` | `POST` | `create:task` | Create deliverable task with priority, estimated hours, and dates |
| **Tasks** | `/api/v1/tasks/:id/transition` | `POST` | `update:task` | Status state transition (`TODO` -> `IN_PROGRESS` -> `REVIEW` -> `COMPLETED`) |
| **Budget** | `/api/v1/budget` | `GET` | Authenticated Read | Earned Value Analysis, division allocations, and overrun telemetry |
| **Budget** | `/api/v1/budget` | `POST` | `create:budget` | Allocate divisional capital ceiling to project expense category |
| **Expenses** | `/api/v1/expenses` | `GET` | Authenticated Read | Certified project expense records with contractor and category links |
| **Expenses** | `/api/v1/expenses` | `POST` | `create:expense` | File certified invoice/expense entry with document attachment link |
| **Materials** | `/api/v1/materials` | `GET` | Authenticated Read | 3D warehouse inventory SKUs, stock levels, and unit costs |
| **Materials** | `/api/v1/materials/:id/issue` | `POST` | `update:material` | Atomic stock issue/dispatch with transaction logging (`409` on overdraft) |
| **Indents** | `/api/v1/material-requests` | `POST` | `create:material_request` | Submit site requisition indent with urgency tier and delivery date |
| **Indents** | `/api/v1/material-requests/:id/approve` | `POST` | `approve:material_request` | Authorize or reject site indent request |
| **Contractors** | `/api/v1/contractors` | `GET` | Authenticated Read | Contractor registry with reliability scores, on-time %, and active trades |
| **Reports** | `/api/v1/reports` | `GET` | Authenticated Read | Site operations shift logs, progress verifications, and delay incidents |
| **Reports** | `/api/v1/reports` | `POST` | `create:site_report` | File official daily site shift log, progress % sign-off, or delay notice |
| **Reports** | `/api/v1/reports` | `PATCH` | `update:site_report` | Transition delay incident status (`OPEN` -> `MITIGATED` -> `RESOLVED`) |
| **Users** | `/api/v1/users` | `GET` | `read:user` (Admin/PM) | Directory of provisioned system operators, roles, and project counts |
| **Users** | `/api/v1/users` | `POST` | `create:user` (Admin) | Provision new team operator with hashed password and role assignment |
| **Audit** | `/api/v1/activity-logs` | `GET` | Authenticated Read | Immutable chronological event log of all system mutations |

---

## Production Deployment (Vercel & Neon)

BuildTrack is optimized for deployment on **Vercel** with **Neon Cloud PostgreSQL**:

```
+---------------------------------------------------------------------------------------+
|  VERCEL + NEON PRODUCTION TOPOLOGY                                                    |
|                                                                                       |
|   [DEVELOPER PUSH]                                                                    |
|          |                                                                            |
|          v                                                                            |
|   [GITHUB MAIN REPO] ------> [VERCEL CI/CD PIPELINE]                                  |
|                                      |                                                |
|                                      v                                                |
|                            [EDGE MIDDLEWARE & CDN]                                    |
|                            * NextAuth session check                                   |
|                            * Static asset caching                                     |
|                                      |                                                |
|                                      v                                                |
|                            [SERVERLESS FUNCTIONS]                                     |
|                            * 40 Optimized Routes                                      |
|                            * Connection Pooling                                       |
|                                      |                                                |
|                                      v                                                |
|                            [NEON SERVERLESS POSTGRES]                                 |
|                            * Auto-scaling compute                                     |
|                            * Point-in-time recovery                                   |
+---------------------------------------------------------------------------------------+
```

### Production Build Command
In the Vercel project configuration:
- **Build Command**: `prisma generate && next build`
- **Output Directory**: `.next`
- **Install Command**: `npm install --legacy-peer-deps`

---

## Verification & Quality Assurance

BuildTrack maintains an automated test suite executed with Vitest:

```bash
# Run unit test suite
npm test
```

### Test Suite Execution Output
```
 RUN  v3.2.7 C:/Users/Nabil/Desktop/5 Project/buildtrack

 ✓ tests/ai-intelligence.test.ts (3 tests)
 ✓ tests/auth-credentials.test.ts (3 tests)
 ✓ tests/security-audit.test.ts (8 tests)
 ✓ tests/business-rules.test.ts (9 tests)
 ✓ tests/rbac.test.ts (6 tests)
 ✓ tests/cycle-detection.test.ts (4 tests)

 Test Files  6 passed (6)
      Tests  33 passed (33)
   Duration  1.35s
```

### Tested Capabilities
- **DAG Cycle Detection**: Validates that circular task dependencies are mathematically detected and rejected.
- **Topological Sorting**: Verifies prerequisite execution order across multi-branch task graphs.
- **Atomic Stock Invariant**: Confirms material over-issuance is blocked at the database transaction layer.
- **Role-Based Access Control**: Ensures unauthorized mutations return `403 Forbidden` for all role combinations.
- **Financial Rollups**: Validates server-side calculation of Cost Variance, Schedule Variance, and EAC.
- **Security Audit Trails**: Verifies that security-sensitive actions generate immutable event logs.
- **Admin Operational Data Hub**: Strict `ADMIN`-only live 25-table PostgreSQL explorer (`/admin/database`), SSE real-time telemetry stream, sanitized DB error handling, and read-only SQL diagnostics console.

### Technical Documentation
- [Database Design & 25-Table ERD](docs/DATABASE.md)
- [REST & Real-Time SSE API Reference](docs/API.md)

---

<div align="center">

**BUILDTRACK PLATFORM** // *Engineered with precision for the builders of modern infrastructure.*

</div>
