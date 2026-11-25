import { describe, it, expect } from "vitest";
import { can, ROLE_CAPABILITIES, getRoleCapabilities } from "@/lib/rbac";
import { SessionUser } from "@/types";

describe("Central RBAC Permission Matrix & Strict Role Capabilities", () => {
  const adminUser: SessionUser = {
    id: "admin-1",
    email: "admin@buildtrack.com",
    name: "Admin User",
    role: "ADMIN",
  };

  const pmUser: SessionUser = {
    id: "pm-1",
    email: "pm@buildtrack.com",
    name: "PM User",
    role: "PROJECT_MANAGER",
  };

  const engineerUser: SessionUser = {
    id: "eng-1",
    email: "engineer@buildtrack.com",
    name: "Site Engineer",
    role: "SITE_ENGINEER",
  };

  const financeUser: SessionUser = {
    id: "fin-1",
    email: "finance@buildtrack.com",
    name: "Finance Manager",
    role: "FINANCE_MANAGER",
  };

  const contractorUser: SessionUser = {
    id: "cont-1",
    email: "contractor@buildtrack.com",
    name: "Contractor User",
    role: "CONTRACTOR",
    contractorId: "contractor-corp-1",
  };

  describe("ADMIN Capabilities", () => {
    it("Admin has unconstrained capabilities across company, users, projects, activities, system settings, and analytics", () => {
      // Manage company information
      expect(can(adminUser, "manage", "company")).toBe(true);
      // Manage users and permissions
      expect(can(adminUser, "manage", "user")).toBe(true);
      expect(can(adminUser, "create", "user")).toBe(true);
      // View all construction projects
      expect(can(adminUser, "read", "project")).toBe(true);
      // Monitor company-wide project activities
      expect(can(adminUser, "read", "activity_log")).toBe(true);
      // Configure system settings
      expect(can(adminUser, "manage", "system_settings")).toBe(true);
      // Access overall analytics
      expect(can(adminUser, "read", "analytics")).toBe(true);
    });
  });

  describe("PROJECT_MANAGER Capabilities", () => {
    it("Project Manager can create and manage projects, tasks, milestones, review reports, and monitor budgets", () => {
      // Create and manage projects
      expect(can(pmUser, "create", "project")).toBe(true);
      expect(can(pmUser, "update", "project")).toBe(true);
      // Assign project tasks, set priorities and deadlines
      expect(can(pmUser, "create", "task")).toBe(true);
      expect(can(pmUser, "update", "task")).toBe(true);
      // Monitor project progress
      expect(can(pmUser, "read", "project")).toBe(true);
      expect(can(pmUser, "read", "progress_report")).toBe(true);
      // Manage project milestones
      expect(can(pmUser, "update", "project")).toBe(true);
      // Monitor project budgets (read-only)
      expect(can(pmUser, "read", "budget")).toBe(true);
      // Identify delayed tasks
      expect(can(pmUser, "read", "delay_report")).toBe(true);
      expect(can(pmUser, "read", "task")).toBe(true);
      // Review site reports
      expect(can(pmUser, "read", "site_report")).toBe(true);
    });

    it("Project Manager is STRICTLY DENIED from modifying budgets, managing users, and configuring system settings", () => {
      expect(can(pmUser, "create", "budget")).toBe(false);
      expect(can(pmUser, "manage", "user")).toBe(false);
      expect(can(pmUser, "create", "user")).toBe(false);
      expect(can(pmUser, "manage", "system_settings")).toBe(false);
      expect(can(pmUser, "manage", "company")).toBe(false);
    });
  });

  describe("SITE_ENGINEER Capabilities", () => {
    it("Site Engineer can submit daily progress updates, update task status, record material usage, upload photographs, submit site reports, and report delays", () => {
      // Submit daily progress updates & upload photographs
      expect(can(engineerUser, "create", "progress_report")).toBe(true);
      // Update task status
      expect(can(engineerUser, "transition", "task")).toBe(true);
      expect(can(engineerUser, "update", "task")).toBe(true);
      // Record material usage
      expect(can(engineerUser, "issue", "material")).toBe(true);
      // Submit construction site reports
      expect(can(engineerUser, "create", "site_report")).toBe(true);
      // Report construction delays
      expect(can(engineerUser, "create", "delay_report")).toBe(true);
      // Monitor assigned site activities
      expect(can(engineerUser, "read", "project")).toBe(true);
      expect(can(engineerUser, "read", "task")).toBe(true);
    });

    it("Site Engineer is STRICTLY DENIED from managing budgets, recording expenses, user management, and system settings", () => {
      expect(can(engineerUser, "read", "budget")).toBe(false);
      expect(can(engineerUser, "create", "budget")).toBe(false);
      expect(can(engineerUser, "create", "expense")).toBe(false);
      expect(can(engineerUser, "manage", "user")).toBe(false);
      expect(can(engineerUser, "manage", "system_settings")).toBe(false);
      expect(can(engineerUser, "manage", "company")).toBe(false);
      expect(can(engineerUser, "create", "project")).toBe(false);
    });
  });

  describe("FINANCE_MANAGER Capabilities", () => {
    it("Finance Manager can manage budgets, record expenses, manage categories, monitor utilization, compare costs, generate reports, and identify overruns", () => {
      // Manage project budgets
      expect(can(financeUser, "create", "budget")).toBe(true);
      expect(can(financeUser, "update", "budget")).toBe(true);
      // Record project expenses
      expect(can(financeUser, "create", "expense")).toBe(true);
      expect(can(financeUser, "update", "expense")).toBe(true);
      // Manage expense categories
      expect(can(financeUser, "manage", "expense")).toBe(true);
      expect(can(financeUser, "manage", "budget")).toBe(true);
      // Monitor budget utilization & identify overruns
      expect(can(financeUser, "read", "budget")).toBe(true);
      // Compare estimated and actual costs
      expect(can(financeUser, "read", "expense")).toBe(true);
      expect(can(financeUser, "read", "analytics")).toBe(true);
      // Generate financial reports
      expect(can(financeUser, "read", "project")).toBe(true);
    });

    it("Finance Manager is STRICTLY DENIED from creating projects, creating tasks, user management, and system settings", () => {
      expect(can(financeUser, "create", "project")).toBe(false);
      expect(can(financeUser, "create", "task")).toBe(false);
      expect(can(financeUser, "transition", "task")).toBe(false);
      expect(can(financeUser, "manage", "user")).toBe(false);
      expect(can(financeUser, "manage", "system_settings")).toBe(false);
      expect(can(financeUser, "manage", "company")).toBe(false);
    });
  });

  describe("CONTRACTOR Capabilities", () => {
    it("Contractor can view assigned projects and tasks, update task progress, submit material requests, upload work progress reports, and view task deadlines", () => {
      // View assigned projects
      expect(can(contractorUser, "read", "project")).toBe(true);
      // View assigned tasks & deadlines
      expect(can(contractorUser, "read", "task")).toBe(true);
      // Update task progress
      expect(can(contractorUser, "transition", "task")).toBe(true);
      expect(can(contractorUser, "update", "task")).toBe(true);
      // Submit material requests
      expect(can(contractorUser, "create", "material_request")).toBe(true);
      // Upload work progress reports
      expect(can(contractorUser, "create", "progress_report")).toBe(true);
    });

    it("Contractor is STRICTLY DENIED from creating projects, managing budgets, recording expenses, official site logs, user admin, and system settings", () => {
      expect(can(contractorUser, "create", "project")).toBe(false);
      expect(can(contractorUser, "read", "budget")).toBe(false);
      expect(can(contractorUser, "create", "budget")).toBe(false);
      expect(can(contractorUser, "create", "expense")).toBe(false);
      expect(can(contractorUser, "create", "site_report")).toBe(false);
      expect(can(contractorUser, "manage", "contractor")).toBe(false);
      expect(can(contractorUser, "manage", "user")).toBe(false);
      expect(can(contractorUser, "manage", "system_settings")).toBe(false);
    });
  });

  describe("ROLE_CAPABILITIES Metadata Specification", () => {
    it("Exports the exact required capabilities for all 5 roles", () => {
      expect(ROLE_CAPABILITIES.ADMIN).toContain("Manage company information");
      expect(ROLE_CAPABILITIES.PROJECT_MANAGER).toContain("Assign project tasks");
      expect(ROLE_CAPABILITIES.SITE_ENGINEER).toContain("Record material usage");
      expect(ROLE_CAPABILITIES.FINANCE_MANAGER).toContain("Compare estimated and actual costs");
      expect(ROLE_CAPABILITIES.CONTRACTOR).toContain("Upload work progress reports");

      expect(getRoleCapabilities("ADMIN")).toHaveLength(6);
      expect(getRoleCapabilities("PROJECT_MANAGER")).toHaveLength(8);
      expect(getRoleCapabilities("SITE_ENGINEER")).toHaveLength(7);
      expect(getRoleCapabilities("FINANCE_MANAGER")).toHaveLength(7);
      expect(getRoleCapabilities("CONTRACTOR")).toHaveLength(6);
    });
  });

  describe("Unauthenticated Sessions", () => {
    it("Denies all actions for unauthenticated sessions", () => {
      expect(can(null, "read", "project")).toBe(false);
      expect(can(undefined, "create", "task")).toBe(false);
    });
  });
});
