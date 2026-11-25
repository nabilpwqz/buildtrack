export type Role =
  | "ADMIN"
  | "PROJECT_MANAGER"
  | "SITE_ENGINEER"
  | "FINANCE_MANAGER"
  | "CONTRACTOR";

export type ProjectStatus =
  | "PLANNING"
  | "IN_PROGRESS"
  | "DELAYED"
  | "ON_HOLD"
  | "COMPLETED";

export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "REVIEW"
  | "COMPLETED";

export type TaskPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type MaterialRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "FULFILLED";

export type MaterialTransactionType =
  | "RECEIVE"
  | "ISSUE"
  | "CONSUME"
  | "ADJUST";

export type DelayReportStatus =
  | "OPEN"
  | "MITIGATED"
  | "RESOLVED";

export type NotificationType =
  | "TASK_ASSIGNED"
  | "OVERDUE"
  | "BUDGET_OVERRUN"
  | "LOW_STOCK"
  | "REQUEST_APPROVED"
  | "REPORT_SUBMITTED"
  | "SYSTEM";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  contractorId?: string | null;
  companyId?: string | null;
}

