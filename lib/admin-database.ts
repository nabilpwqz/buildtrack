import prisma from "@/lib/db";
import { ensureRealisticDemoData } from "@/lib/demo-seed";

export function sanitizeDatabaseError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err || "");
  if (
    /prisma|DATABASE_URL|schema\.prisma|invocation|ECONNREFUSED|authentication failed|Environment variable not found/i.test(
      raw
    )
  ) {
    return "Please visit the database manually for security reasons.";
  }
  return raw || "Please visit the database manually for security reasons.";
}

export interface DatabaseTableMeta {
  key: string;
  label: string;
  category: "CORE" | "PROJECTS" | "FINANCIALS" | "SUPPLY" | "FIELD_AUDIT";
  rowCount: number;
  orderByField: string;
}

export interface TableDescriptor {
  key: string;
  label: string;
  category: "CORE" | "PROJECTS" | "FINANCIALS" | "SUPPLY" | "FIELD_AUDIT";
  delegate: keyof typeof prisma;
  orderByField: string;
  omitFields?: string[];
}

export const DATABASE_TABLES: TableDescriptor[] = [
  { key: "company", label: "Company", category: "CORE", delegate: "company", orderByField: "createdAt" },
  { key: "user", label: "Users", category: "CORE", delegate: "user", orderByField: "createdAt", omitFields: ["passwordHash"] },
  { key: "notification", label: "Notifications", category: "CORE", delegate: "notification", orderByField: "createdAt" },
  { key: "activityLog", label: "Activity Logs", category: "FIELD_AUDIT", delegate: "activityLog", orderByField: "createdAt" },

  { key: "project", label: "Projects", category: "PROJECTS", delegate: "project", orderByField: "createdAt" },
  { key: "projectMember", label: "Project Members", category: "PROJECTS", delegate: "projectMember", orderByField: "id" },
  { key: "milestone", label: "Milestones", category: "PROJECTS", delegate: "milestone", orderByField: "createdAt" },
  { key: "task", label: "Tasks", category: "PROJECTS", delegate: "task", orderByField: "createdAt" },
  { key: "taskDependency", label: "Task Dependencies", category: "PROJECTS", delegate: "taskDependency", orderByField: "createdAt" },
  { key: "taskComment", label: "Task Comments", category: "PROJECTS", delegate: "taskComment", orderByField: "createdAt" },
  { key: "taskHistory", label: "Task History", category: "PROJECTS", delegate: "taskHistory", orderByField: "createdAt" },

  { key: "contractor", label: "Contractors", category: "PROJECTS", delegate: "contractor", orderByField: "createdAt" },
  { key: "projectContractor", label: "Project Contractors", category: "PROJECTS", delegate: "projectContractor", orderByField: "id" },
  { key: "contractorPerformance", label: "Contractor Performance", category: "PROJECTS", delegate: "contractorPerformance", orderByField: "evaluatedAt" },

  { key: "expenseCategory", label: "Expense Categories", category: "FINANCIALS", delegate: "expenseCategory", orderByField: "createdAt" },
  { key: "budget", label: "Budgets", category: "FINANCIALS", delegate: "budget", orderByField: "createdAt" },
  { key: "expense", label: "Expenses", category: "FINANCIALS", delegate: "expense", orderByField: "createdAt" },

  { key: "materialCategory", label: "Material Categories", category: "SUPPLY", delegate: "materialCategory", orderByField: "createdAt" },
  { key: "material", label: "Materials", category: "SUPPLY", delegate: "material", orderByField: "createdAt" },
  { key: "materialRequest", label: "Material Requests", category: "SUPPLY", delegate: "materialRequest", orderByField: "createdAt" },
  { key: "materialTransaction", label: "Material Transactions", category: "SUPPLY", delegate: "materialTransaction", orderByField: "createdAt" },

  { key: "progressReport", label: "Progress Reports", category: "FIELD_AUDIT", delegate: "progressReport", orderByField: "createdAt" },
  { key: "siteReport", label: "Site Reports", category: "FIELD_AUDIT", delegate: "siteReport", orderByField: "createdAt" },
  { key: "delayReport", label: "Delay Reports", category: "FIELD_AUDIT", delegate: "delayReport", orderByField: "createdAt" },
  { key: "document", label: "Documents", category: "FIELD_AUDIT", delegate: "document", orderByField: "createdAt" },
];

function sanitizeRow(row: Record<string, any>, omitFields?: string[]) {
  if (!omitFields || omitFields.length === 0) return row;
  const copy = { ...row };
  for (const field of omitFields) {
    if (field in copy) {
      delete copy[field];
    }
  }
  return copy;
}

/**
 * Queries live counts across all 25 PostgreSQL tables and recent mutations.
 * Strictly for ADMIN telemetry.
 */
export async function getAdminDatabaseOverview() {
  const start = Date.now();

  // Auto-seed realistic demo data if database is currently empty
  const projectCount = await prisma.project.count();
  if (projectCount === 0) {
    await ensureRealisticDemoData();
  }

  const counts = await Promise.all(
    DATABASE_TABLES.map(async (t) => {
      const model = (prisma as any)[t.delegate];
      const rowCount: number = await model.count();
      return {
        key: t.key,
        label: t.label,
        category: t.category,
        rowCount,
        orderByField: t.orderByField,
      } satisfies DatabaseTableMeta;
    })
  );

  const [recentActivity, recentExpenses, recentTransactions, recentProgress] = await Promise.all([
    prisma.activityLog.findMany({
      take: 15,
      orderBy: { createdAt: "desc" },
    }),
    prisma.expense.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        project: { select: { name: true } },
        category: { select: { name: true } },
      },
    }),
    prisma.materialTransaction.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        material: { select: { name: true, sku: true, unit: true } },
      },
    }),
    prisma.progressReport.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        project: { select: { name: true } },
        task: { select: { title: true } },
      },
    }),
  ]);

  const latencyMs = Date.now() - start;
  const totalRecords = counts.reduce((acc, c) => acc + c.rowCount, 0);

  // Query live PostgreSQL engine telemetry
  let engineInfo = {
    engine: "PostgreSQL",
    databaseSizeBytes: 0,
    databaseSizePretty: "N/A",
    activeConnections: 1,
    postgresVersion: "PostgreSQL",
  };
  try {
    const [dbStats]: any[] = await prisma.$queryRaw`
      SELECT
        pg_database_size(current_database())::bigint AS size_bytes,
        pg_size_pretty(pg_database_size(current_database())) AS size_pretty,
        (SELECT count(*)::int FROM pg_stat_activity WHERE datname = current_database()) AS active_conns,
        split_part(version(), ' ', 2) AS pg_version
    `;
    if (dbStats) {
      engineInfo = {
        engine: "PostgreSQL (Neon)",
        databaseSizeBytes: Number(dbStats.size_bytes || 0),
        databaseSizePretty: String(dbStats.size_pretty || "N/A"),
        activeConnections: Number(dbStats.active_conns || 1),
        postgresVersion: `v${String(dbStats.pg_version || "16")}`,
      };
    }
  } catch {
    // Fallback gracefully if pg_stat_activity is restricted
  }

  return {
    serverTimestamp: new Date().toISOString(),
    latencyMs,
    totalTables: counts.length,
    totalRecords,
    engineInfo,
    tables: counts,
    liveStreams: {
      recentActivity,
      recentExpenses,
      recentTransactions,
      recentProgress,
    },
  };
}

/**
 * Fetches paginated rows from any specific Prisma table for ADMIN inspection.
 */
export async function getAdminTableRecords(
  tableKey: string,
  page = 0,
  pageSize = 25,
  searchQuery = ""
) {
  const descriptor = DATABASE_TABLES.find((t) => t.key === tableKey) || DATABASE_TABLES[0];
  const model = (prisma as any)[descriptor.delegate];

  const start = Date.now();
  const safePageSize = Math.min(100, Math.max(1, pageSize));
  const safePage = Math.max(0, page);

  const allRows: Record<string, any>[] = await model.findMany({
    orderBy: { [descriptor.orderByField]: "desc" },
    take: searchQuery.trim() ? 500 : safePageSize,
    skip: searchQuery.trim() ? 0 : safePage * safePageSize,
  });

  const totalCount: number = await model.count();
  const sanitized = allRows.map((r) => sanitizeRow(r, descriptor.omitFields));

  const q = searchQuery.trim().toLowerCase();
  const filtered = q
    ? sanitized.filter((row) => JSON.stringify(row).toLowerCase().includes(q))
    : sanitized;

  const pagedRecords = q
    ? filtered.slice(safePage * safePageSize, (safePage + 1) * safePageSize)
    : filtered;

  return {
    table: descriptor.key,
    label: descriptor.label,
    category: descriptor.category,
    totalCount: q ? filtered.length : totalCount,
    page: safePage,
    pageSize: safePageSize,
    pageCount: Math.max(1, Math.ceil((q ? filtered.length : totalCount) / safePageSize)),
    latencyMs: Date.now() - start,
    records: pagedRecords,
  };
}

const FORBIDDEN_SQL_PATTERN =
  /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|REPLACE|GRANT|REVOKE|COPY|EXECUTE|CALL|DO|VACUUM|REINDEX|CLUSTER|LOCK|SET\s+ROLE)\b/i;

/**
 * Executes a strictly read-only SELECT / WITH SQL query for ADMIN diagnostics.
 */
export async function executeAdminReadOnlyQuery(rawSql: string) {
  const cleaned = rawSql.trim().replace(/;+\s*$/, "");
  if (!cleaned) {
    throw new Error("SQL query cannot be empty.");
  }
  if (cleaned.includes(";")) {
    throw new Error("Multiple SQL statements are not permitted.");
  }
  if (!/^(SELECT|WITH)\b/i.test(cleaned)) {
    throw new Error("Only read-only SELECT or WITH queries are permitted.");
  }
  if (FORBIDDEN_SQL_PATTERN.test(cleaned)) {
    throw new Error("Mutating or administrative DDL/DML keywords are strictly blocked.");
  }

  const start = Date.now();
  const wrappedSql = /\bLIMIT\b/i.test(cleaned) ? cleaned : `${cleaned} LIMIT 100`;
  const rows: any[] = await prisma.$queryRawUnsafe(wrappedSql);
  const latencyMs = Date.now() - start;

  // Normalize BigInt/Date values for JSON serialization
  const normalized = rows.map((row) => {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(row)) {
      if (typeof v === "bigint") {
        out[k] = Number(v);
      } else if (v instanceof Date) {
        out[k] = v.toISOString();
      } else {
        out[k] = v;
      }
    }
    return out;
  });

  return {
    latencyMs,
    rowCount: normalized.length,
    rows: normalized,
  };
}

