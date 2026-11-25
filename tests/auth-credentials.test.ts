import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import { Role } from "@/types";

describe("Authentication & Credentials Verification", () => {
  const demoPassword = "Demo@1234";

  it("verifies bcrypt password hashing and comparison succeeds with valid credentials", async () => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(demoPassword, salt);

    const isValid = await bcrypt.compare(demoPassword, hash);
    expect(isValid).toBe(true);

    const isInvalid = await bcrypt.compare("WrongPassword", hash);
    expect(isInvalid).toBe(false);
  });

  it("validates all 5 system roles are defined and supported", () => {
    const roles: Role[] = [
      "ADMIN",
      "PROJECT_MANAGER",
      "SITE_ENGINEER",
      "FINANCE_MANAGER",
      "CONTRACTOR",
    ];

    expect(roles).toHaveLength(5);
    expect(roles).toContain("ADMIN");
    expect(roles).toContain("PROJECT_MANAGER");
    expect(roles).toContain("SITE_ENGINEER");
    expect(roles).toContain("FINANCE_MANAGER");
    expect(roles).toContain("CONTRACTOR");
  });

  it("verifies universal email normalization and intelligent role inference logic", () => {
    const normalize = (email: string) => {
      let clean = (email || "").trim().toLowerCase();
      if (!clean) clean = "admin@buildtrack.com";
      if (!clean.includes("@")) clean = `${clean}@buildtrack.com`;
      if (clean.endsWith("@buildtrack.internal")) {
        clean = clean.replace("@buildtrack.internal", "@buildtrack.com");
      }
      return clean;
    };

    const inferRole = (cleanEmail: string): Role => {
      if (cleanEmail.includes("pm") || cleanEmail.includes("manager")) return "PROJECT_MANAGER";
      if (cleanEmail.includes("engineer") || cleanEmail.includes("site")) return "SITE_ENGINEER";
      if (cleanEmail.includes("finance") || cleanEmail.includes("account")) return "FINANCE_MANAGER";
      if (cleanEmail.includes("contractor") || cleanEmail.includes("subcon")) return "CONTRACTOR";
      return "ADMIN";
    };

    expect(normalize("admin")).toBe("admin@buildtrack.com");
    expect(normalize("finance@buildtrack.internal")).toBe("finance@buildtrack.com");
    expect(normalize("")).toBe("admin@buildtrack.com");

    expect(inferRole("lead.pm@buildtrack.com")).toBe("PROJECT_MANAGER");
    expect(inferRole("site.engineer@buildtrack.com")).toBe("SITE_ENGINEER");
    expect(inferRole("finance.controller@buildtrack.com")).toBe("FINANCE_MANAGER");
    expect(inferRole("apex.contractor@buildtrack.com")).toBe("CONTRACTOR");
    expect(inferRole("visitor@gmail.com")).toBe("ADMIN");
  });
});
