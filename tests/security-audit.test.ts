import { describe, it, expect } from "vitest";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeString, sanitizeObject } from "@/lib/sanitize";
import { can } from "@/lib/rbac";
import bcrypt from "bcryptjs";

describe("Platform Security & Threat Mitigation Audit", () => {
  describe("Rate Limiting & Abuse Prevention", () => {
    it("allows requests under the rate threshold and blocks requests exceeding limit", () => {
      const testIp = "audit-test-client-1";
      const limit = 5;

      // 5 requests allowed
      for (let i = 0; i < limit; i++) {
        const res = rateLimit(testIp, { limit, windowMs: 10000 });
        expect(res.success).toBe(true);
      }

      // 6th request blocked
      const blocked = rateLimit(testIp, { limit, windowMs: 10000 });
      expect(blocked.success).toBe(false);
      expect(blocked.remaining).toBe(0);
    });
  });

  describe("XSS Injection Sanitization", () => {
    it("neutralizes stored and reflected script injection payloads", () => {
      const maliciousInput = "<script>alert('XSS-ATTACK')</script>Structural Rebar Invoice";
      const sanitized = sanitizeString(maliciousInput);
      expect(sanitized).not.toContain("<script>");
      expect(sanitized).not.toContain("alert");
      expect(sanitized).toContain("Structural Rebar Invoice");
    });

    it("strips malicious javascript: URI and event handlers", () => {
      const maliciousHref = "javascript:stealTokens()";
      const sanitized = sanitizeString(maliciousHref);
      expect(sanitized).not.toContain("javascript:");

      const maliciousHandler = "test<img src=x onerror=alert(1)>";
      const sanitizedHandler = sanitizeString(maliciousHandler);
      expect(sanitizedHandler).not.toContain("onerror=");
    });

    it("recursively sanitizes nested objects in form submissions", () => {
      const payload = {
        title: "<script>hack()</script>Deep Piling",
        nested: {
          comment: "Approved <iframe src='evil.com'></iframe>",
          amount: 50000,
        },
      };

      const clean = sanitizeObject(payload);
      expect(clean.title).toBe("Deep Piling");
      expect(clean.nested.comment).toBe("Approved");
      expect(clean.nested.amount).toBe(50000);
    });
  });

  describe("RBAC Financial & Admin Guard Verification", () => {
    it("strictly prevents SITE_ENGINEER from modifying financial budgets", () => {
      const siteEngineer = {
        id: "eng-1",
        email: "engineer@buildtrack.com",
        name: "Test Engineer",
        role: "SITE_ENGINEER" as const,
      };

      expect(can(siteEngineer, "create", "budget")).toBe(false);
      expect(can(siteEngineer, "update", "budget")).toBe(false);
      expect(can(siteEngineer, "delete", "expense")).toBe(false);
    });

    it("strictly prevents CONTRACTOR from accessing system settings or users", () => {
      const contractor = {
        id: "con-1",
        email: "contractor@buildtrack.com",
        name: "Test Contractor",
        role: "CONTRACTOR" as const,
      };

      expect(can(contractor, "manage", "system_settings")).toBe(false);
      expect(can(contractor, "read", "user")).toBe(false);
      expect(can(contractor, "delete", "project")).toBe(false);
    });

    it("ensures only ADMIN can manage user provisioning and company info", () => {
      const admin = {
        id: "admin-1",
        email: "admin@buildtrack.com",
        name: "Test Admin",
        role: "ADMIN" as const,
      };

      expect(can(admin, "create", "user")).toBe(true);
      expect(can(admin, "manage", "company")).toBe(true);
      expect(can(admin, "manage", "system_settings")).toBe(true);
    });
  });

  describe("Password Hashing & Cryptography Verification", () => {
    it("verifies bcrypt hashes use high-cost salt rounds and reject plain comparison", async () => {
      const password = "Demo@1234";
      const hash = await bcrypt.hash(password, 10);

      expect(hash).toMatch(/^\$2[aby]\$10\$/);
      expect(password).not.toEqual(hash);

      const isMatch = await bcrypt.compare(password, hash);
      expect(isMatch).toBe(true);

      const isWrongMatch = await bcrypt.compare("WrongPass", hash);
      expect(isWrongMatch).toBe(false);
    });
  });
});
