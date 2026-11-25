import { Role, SessionUser } from "@/types";

export type PermissionAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "manage"
  | "approve"
  | "issue"
  | "transition";

export type PermissionResource =
  | "project"
  | "task"
  | "budget"
  | "expense"
  | "material"
  | "material_request"
  | "contractor"
  | "site_report"
  | "progress_report"
  | "delay_report"
  | "user"
  | "company"
  | "system_settings"
  | "activity_log"
  | "analytics"
  | "database";

export interface PermissionContext {
  projectManagerId?: string | null;
  assignedUserIds?: string[];
  contractorId?: string | null;
  projectMembers?: string[];
}

/**
 * Explicit User Roles & Capabilities Specification
 * Single source of truth directly matching enterprise civil construction requirements
 */
export const ROLE_CAPABILITIES: Record<Role, string[]> = {
  ADMIN: [
    "Manage company information",
    "Manage users and permissions",
    "View all construction projects",
    "Monitor company-wide project activities",
    "Configure system settings",
    "Access overall analytics",
  ],
  PROJECT_MANAGER: [
    "Create and manage projects",
    "Assign project tasks",
    "Set task priorities and deadlines",
    "Monitor project progress",
    "Manage project milestones",
    "Monitor project budgets",
    "Identify delayed tasks",
    "Review site reports",
  ],
  SITE_ENGINEER: [
    "Submit daily progress updates",
    "Update task status",
    "Record material usage",
    "Upload site progress photographs",
    "Submit construction site reports",
    "Report construction delays",
    "Monitor assigned site activities",
  ],
  FINANCE_MANAGER: [
    "Manage project budgets",
    "Record project expenses",
    "Manage expense categories",
    "Monitor budget utilization",
    "Compare estimated and actual costs",
    "Generate financial reports",
    "Identify budget overruns",
  ],
  CONTRACTOR: [
    "View assigned projects",
    "View assigned tasks",
    "Update task progress",
    "Submit material requests",
    "Upload work progress reports",
    "View task deadlines",
  ],
};

export function getRoleCapabilities(role: Role): string[] {
  return ROLE_CAPABILITIES[role] || [];
}

/**
 * Central RBAC rule evaluator
 * Returns true if the user with given role/id is permitted to perform the action on the resource
 */
export function can(
  user: SessionUser | null | undefined,
  action: PermissionAction,
  resource: PermissionResource,
  context?: PermissionContext
): boolean {
  if (!user) return false;

  const role = user.role;

  // 1. ADMIN
  // - Manage company information.
  // - Manage users and permissions.
  // - View all construction projects.
  // - Monitor company-wide project activities.
  // - Configure system settings.
  // - Access overall analytics.
  if (role === "ADMIN") {
    return true; // Unconstrained administrative master control
  }

  // 2. PROJECT_MANAGER
  // - Create and manage projects.
  // - Assign project tasks.
  // - Set task priorities and deadlines.
  // - Monitor project progress.
  // - Manage project milestones.
  // - Monitor project budgets.
  // - Identify delayed tasks.
  // - Review site reports.
  if (role === "PROJECT_MANAGER") {
    // Strictly disallowed from system configuration, company info, and user management
    if (resource === "system_settings" || resource === "company") {
      return false;
    }
    if (resource === "user") {
      return action === "read"; // can view users to assign them to tasks
    }
    if (resource === "project") {
      // Create and manage projects & milestones
      if (action === "create" || action === "read" || action === "update") return true;
      if (context?.projectManagerId) {
        return context.projectManagerId === user.id;
      }
      return true;
    }
    if (resource === "task") {
      // Assign project tasks, set priorities, deadlines, monitor progress
      return true;
    }
    if (resource === "budget" || resource === "expense") {
      // Monitor project budgets (READ-ONLY: cannot alter allocations or create expenses)
      return action === "read";
    }
    if (resource === "delay_report" || resource === "site_report" || resource === "progress_report") {
      // Review site reports and monitor progress/delays
      return true;
    }
    if (resource === "material") {
      return action === "read" || action === "create" || action === "update" || action === "issue";
    }
    if (resource === "material_request") {
      return action === "read" || action === "approve";
    }
    if (resource === "contractor") {
      return true;
    }
    if (resource === "analytics" || resource === "activity_log") {
      return action === "read";
    }
    return false;
  }

  // 3. SITE_ENGINEER
  // - Submit daily progress updates.
  // - Update task status.
  // - Record material usage.
  // - Upload site progress photographs.
  // - Submit construction site reports.
  // - Report construction delays.
  // - Monitor assigned site activities.
  if (role === "SITE_ENGINEER") {
    // Strictly disallowed from financial ledgers, system settings, user management, company configuration
    if (
      resource === "system_settings" ||
      resource === "user" ||
      resource === "company" ||
      resource === "budget" ||
      resource === "expense"
    ) {
      return false;
    }
    if (resource === "project") {
      return action === "read"; // Monitor assigned site activities
    }
    if (resource === "task") {
      // Update task status and monitor assigned site activities
      return action === "read" || action === "update" || action === "transition";
    }
    if (resource === "progress_report") {
      // Submit daily progress updates & upload site progress photographs
      return action === "create" || action === "read" || action === "update";
    }
    if (resource === "site_report") {
      // Submit construction site reports & upload photographs
      return action === "create" || action === "read" || action === "update";
    }
    if (resource === "delay_report") {
      // Report construction delays
      return action === "create" || action === "read" || action === "update";
    }
    if (resource === "material") {
      // Record material usage (issue / dispatch) and view inventory
      return action === "read" || action === "issue";
    }
    if (resource === "material_request") {
      return action === "create" || action === "read";
    }
    if (resource === "activity_log" || resource === "analytics") {
      return action === "read";
    }
    return false;
  }

  // 4. FINANCE_MANAGER
  // - Manage project budgets.
  // - Record project expenses.
  // - Manage expense categories.
  // - Monitor budget utilization.
  // - Compare estimated and actual costs.
  // - Generate financial reports.
  // - Identify budget overruns.
  if (role === "FINANCE_MANAGER") {
    // Strictly disallowed from system configuration, user administration, company management
    if (resource === "user" || resource === "system_settings" || resource === "company") {
      return false;
    }
    if (resource === "budget") {
      // Manage project budgets, manage expense categories, monitor utilization, identify overruns
      return true;
    }
    if (resource === "expense") {
      // Record project expenses, manage expense categories, generate reports
      return true;
    }
    if (resource === "material_request") {
      // Review financial impact and approve requisition budget
      return action === "read" || action === "approve";
    }
    if (resource === "analytics" || resource === "activity_log") {
      return action === "read";
    }
    if (
      resource === "project" ||
      resource === "task" ||
      resource === "material" ||
      resource === "contractor" ||
      resource === "progress_report" ||
      resource === "site_report" ||
      resource === "delay_report"
    ) {
      return action === "read"; // Read-only for cost comparison and auditing
    }
    return false;
  }

  // 5. CONTRACTOR
  // - View assigned projects.
  // - View assigned tasks.
  // - Update task progress.
  // - Submit material requests.
  // - Upload work progress reports.
  // - View task deadlines.
  if (role === "CONTRACTOR") {
    // Strictly disallowed from financials, user admin, system settings, company info, delay reports, contractors
    if (
      resource === "budget" ||
      resource === "expense" ||
      resource === "user" ||
      resource === "system_settings" ||
      resource === "company" ||
      resource === "contractor" ||
      resource === "delay_report"
    ) {
      return false;
    }
    if (resource === "project") {
      // View assigned projects
      return action === "read";
    }
    if (resource === "task") {
      // View assigned tasks, view task deadlines, update task progress
      return action === "read" || action === "update" || action === "transition";
    }
    if (resource === "material_request") {
      // Submit material requests
      return action === "create" || action === "read";
    }
    if (resource === "progress_report") {
      // Upload work progress reports
      return action === "create" || action === "read";
    }
    if (resource === "site_report") {
      return action === "read";
    }
    if (resource === "material") {
      return action === "read";
    }
    return false;
  }

  return false;
}
