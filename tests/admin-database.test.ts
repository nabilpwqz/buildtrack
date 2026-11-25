import { describe, it, expect } from "vitest";
import { sanitizeDatabaseError } from "@/lib/admin-database";

describe("Admin Operational Data Hub Security & Sanitization", () => {
  it("redacts raw Prisma DATABASE_URL invocation errors", () => {
    const raw =
      'Invalid `prisma.project.count()` invocation: error: Environment variable not found: DATABASE_URL. --> schema.prisma:7';
    expect(sanitizeDatabaseError(new Error(raw))).toBe(
      "Please visit the database manually for security reasons."
    );
  });

  it("redacts connection refused and authentication failures", () => {
    expect(sanitizeDatabaseError(new Error("connect ECONNREFUSED 127.0.0.1:5432"))).toBe(
      "Please visit the database manually for security reasons."
    );
    expect(sanitizeDatabaseError(new Error("password authentication failed for user"))).toBe(
      "Please visit the database manually for security reasons."
    );
  });

  it("preserves safe user-facing validation errors", () => {
    expect(sanitizeDatabaseError(new Error("Only read-only SELECT or WITH queries are permitted."))).toBe(
      "Only read-only SELECT or WITH queries are permitted."
    );
  });
});

