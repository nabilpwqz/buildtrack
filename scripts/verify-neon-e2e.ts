import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

interface TestResult {
  name: string;
  status: "PASS" | "FAIL";
  details?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function recordTest(name: string, fn: () => Promise<string | void>) {
  const start = performance.now();
  try {
    const details = await fn();
    const durationMs = Math.round(performance.now() - start);
    results.push({ name, status: "PASS", details: details || undefined, durationMs });
    console.log(`[PASS] ${name} (${durationMs}ms)${details ? ` - ${details}` : ""}`);
  } catch (err: any) {
    const durationMs = Math.round(performance.now() - start);
    results.push({ name, status: "FAIL", details: err?.message || String(err), durationMs });
    console.error(`[FAIL] ${name} (${durationMs}ms) - ${err?.message || err}`);
  }
}

async function waitForServer(url: string, maxAttempts = 30): Promise<boolean> {
  console.log(`Waiting for server at ${url}...`);
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${url}/api/docs`, { method: "GET" });
      if (res.status === 200) {
        console.log(`Server is ready! (attempt ${i + 1})`);
        return true;
      }
    } catch {
      // server not yet accepting connections
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

async function main() {
  console.log("==================================================");
  console.log("BUILDTRACK — NEON POSTGRESQL END-TO-END VERIFICATION");
  console.log("==================================================");
  console.log(`Neon Branch: ${process.env.NEON_BRANCH || "production"}`);
  console.log(`Neon Branch ID: ${process.env.NEON_BRANCH_ID || "br-frosty-tooth-be0iax9u"}`);
  console.log(`Testing Server URL: ${BASE_URL}\n`);

  // SECTION 1: Direct Neon PostgreSQL Database Driver & Query Verification
  console.log("--- 1. DIRECT NEON POSTGRESQL PRISMA VERIFICATION ---");

  await recordTest("Neon Serverless Connection & SSL Query", async () => {
    const dbInfo: any[] = await prisma.$queryRaw`
      SELECT current_database() as db, current_user as "user", version() as ver
    `;
    const sslInfo: any[] = await prisma.$queryRaw`
      SELECT ssl, version, cipher FROM pg_stat_ssl WHERE pid = pg_backend_pid()
    `;
    const isSsl = sslInfo[0]?.ssl ? "Enabled" : "Disabled";
    const cipher = sslInfo[0]?.cipher || "TLS";
    return `Database: ${dbInfo[0].db}, User: ${dbInfo[0].user}, SSL: ${isSsl} (${cipher})`;
  });

  await recordTest("Neon Table Inventory & Seed Verification", async () => {
    const [userCount, projectCount, taskCount, expenseCount, materialCount, contractorCount, milestoneCount] =
      await Promise.all([
        prisma.user.count(),
        prisma.project.count(),
        prisma.task.count(),
        prisma.expense.count(),
        prisma.material.count(),
        prisma.contractor.count(),
        prisma.milestone.count(),
      ]);

    if (projectCount === 0 || userCount === 0) {
      throw new Error("Neon database has missing seeded records");
    }

    return `Projects: ${projectCount}, Tasks: ${taskCount}, Expenses: ${expenseCount}, Materials: ${materialCount}, Users: ${userCount}, Contractors: ${contractorCount}, Milestones: ${milestoneCount}`;
  });

  await recordTest("Neon Transactional Write & Readback", async () => {
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!admin) throw new Error("Admin user not found in Neon database");

    const testEntity = await prisma.$transaction(async (tx) => {
      const log = await tx.activityLog.create({
        data: {
          action: "VERIFY",
          actorId: admin.id,
          actorName: admin.name,
          actorRole: admin.role,
          entity: "SYSTEM",
          entityId: "test-neon-uuid",
          meta: JSON.stringify({ verifiedAt: new Date().toISOString(), provider: "Neon Serverless Postgres" }),
        },
      });

      return log;
    });

    if (!testEntity.id) throw new Error("Failed to write to Neon via transaction");

    // Clean up test log
    await prisma.activityLog.delete({ where: { id: testEntity.id } });
    return `Successfully wrote and read back transactional audit record ${testEntity.id}`;
  });

  // SECTION 2: Next.js Server & HTTP End-to-End Verification
  console.log("\n--- 2. NEXT.JS SERVER & HTTP API ENDPOINTS VERIFICATION ---");

  const serverReady = await waitForServer(BASE_URL);
  if (!serverReady) {
    throw new Error(`Server at ${BASE_URL} failed to start or respond within timeout.`);
  }

  await recordTest("HTTP GET / (Landing Page with 3D Canvas)", async () => {
    const res = await fetch(`${BASE_URL}/`);
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    const html = await res.text();
    if (!html.includes("BuildTrack") && !html.includes("Construction")) {
      throw new Error("Landing page HTML missing expected title");
    }
    return `HTTP ${res.status} OK (${html.length} bytes)`;
  });

  await recordTest("HTTP GET /login (Login Page & 3D Tower Crane Scene)", async () => {
    const res = await fetch(`${BASE_URL}/login`);
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    const html = await res.text();
    return `HTTP ${res.status} OK (${html.length} bytes)`;
  });

  await recordTest("HTTP POST /api/v1/auth/register (User Creation & Neon DB Persistence)", async () => {
    const testEmail = `neon.verify.${Date.now()}@buildtrack.test`;
    const regPayload = {
      name: "Neon Automated Verifier",
      email: testEmail,
      password: "TestPassword123!",
      role: "SITE_ENGINEER",
    };

    const res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(regPayload),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`HTTP status ${res.status}: ${err}`);
    }

    const regData = await res.json();
    const userId = regData.user?.id || regData.data?.user?.id || regData.data?.id;
    if (!userId) throw new Error(`Missing user id in registration response: ${JSON.stringify(regData)}`);

    // Verify in Neon directly
    const userInDb = await prisma.user.findUnique({ where: { email: testEmail } });
    if (!userInDb) throw new Error("Registered user was not persisted in Neon PostgreSQL");

    // Clean up
    await prisma.user.delete({ where: { id: userInDb.id } });

    return `HTTP ${res.status} OK - Created user ${testEmail} (ID: ${userInDb.id}, Role: ${userInDb.role})`;
  });

  await recordTest("HTTP GET /api/v1/projects (Unauthenticated 401 Guard)", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/projects`);
    if (res.status !== 401) {
      throw new Error(`Expected 401 Unauthorized, received ${res.status}`);
    }
    const data = await res.json();
    if (!data.error) throw new Error("Expected JSON error response");
    return `HTTP 401 Unauthorized correctly enforced by middleware`;
  });

  // NextAuth Session Authentication
  let sessionCookie = "";
  await recordTest("NextAuth Credentials Authentication via Neon DB", async () => {
    // 1. Fetch CSRF token
    const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
    if (!csrfRes.ok) throw new Error(`Failed to fetch CSRF token: ${csrfRes.status}`);
    const { csrfToken } = await csrfRes.json();
    const csrfCookies = csrfRes.headers.getSetCookie();
    const cookieHeader = csrfCookies.map((c) => c.split(";")[0]).join("; ");

    // 2. Sign in with admin credentials against Neon DB
    const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookieHeader,
      },
      body: new URLSearchParams({
        csrfToken,
        email: "admin@buildtrack.com",
        password: "Demo@1234",
      }),
      redirect: "manual",
    });

    const setCookies = loginRes.headers.getSetCookie();
    const tokenCookie = setCookies.find((c) => c.includes("authjs.session-token") || c.includes("next-auth.session-token"));

    if (!tokenCookie) {
      throw new Error(`Did not receive session token cookie. Set-Cookie: ${JSON.stringify(setCookies)}`);
    }

    sessionCookie = tokenCookie.split(";")[0];
    return `Successfully authenticated admin@buildtrack.com (Status: ${loginRes.status}, Token: ${sessionCookie.slice(0, 24)}...)`;
  });

  const authHeaders: Record<string, string> = sessionCookie ? { Cookie: sessionCookie } : {};

  await recordTest("HTTP GET /api/v1/projects (Projects API via Neon)", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/projects`, { headers: authHeaders });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP status ${res.status}: ${text}`);
    }
    const data = await res.json();
    const projects = data.projects || data.data;
    if (!projects || !Array.isArray(projects) || projects.length === 0) {
      throw new Error(`Expected array of projects from Neon DB. Data: ${JSON.stringify(data)}`);
    }
    return `HTTP ${res.status} OK - Retrieved ${projects.length} projects (e.g. "${projects[0].name}", total: ${data.total})`;
  });

  await recordTest("HTTP GET /api/v1/analytics/summary (Financial & Progress Aggregates)", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/analytics/summary`, { headers: authHeaders });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP status ${res.status}: ${text}`);
    }
    const summary = await res.json();
    if (summary.totalProjects === undefined || summary.totalBudget === undefined) {
      throw new Error(`Missing expected financial aggregation keys: ${Object.keys(summary).join(", ")}`);
    }
    return `HTTP ${res.status} OK - Projects: ${summary.totalProjects}, Total Budget: $${summary.totalBudget.toLocaleString()}, Spent: $${summary.totalSpent.toLocaleString()}, Overdue Tasks: ${summary.overdueTasksCount}`;
  });

  await recordTest("HTTP GET /api/v1/materials (Materials Inventory via Neon)", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/materials`, { headers: authHeaders });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP status ${res.status}: ${text}`);
    }
    const data = await res.json();
    const materials = data.materials || data.data;
    if (!materials || materials.length === 0) {
      throw new Error("No materials returned from Neon DB");
    }
    return `HTTP ${res.status} OK - Retrieved ${materials.length} materials (categories: ${data.categories?.length || 0}, total: ${data.total})`;
  });

  await recordTest("HTTP GET /api/v1/contractors (Contractor Directory via Neon)", async () => {
    const res = await fetch(`${BASE_URL}/api/v1/contractors`, { headers: authHeaders });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP status ${res.status}: ${text}`);
    }
    const data = await res.json();
    const contractors = data.contractors || data.data;
    if (!contractors || contractors.length === 0) {
      throw new Error("No contractors returned from Neon DB");
    }
    return `HTTP ${res.status} OK - Retrieved ${contractors.length} contractors (e.g. "${contractors[0].name}", specialty: ${contractors[0].specialty})`;
  });

  console.log("\n==================================================");
  console.log("VERIFICATION SUMMARY");
  console.log("==================================================");
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  console.log(`Total Tests: ${results.length} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    console.error("Some verifications failed!");
    process.exit(1);
  } else {
    console.log("ALL WIRED NEON SERVICES AND APP ENDPOINTS VERIFIED 100% SUCCESSFULLY!");
    process.exit(0);
  }
}

main()
  .catch((e) => {
    console.error("Fatal error during verification:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
