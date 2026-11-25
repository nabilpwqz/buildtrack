const BASE_URL = "http://localhost:3000";

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`PASS: ${msg}`);
    passed++;
  } else {
    console.error(`FAIL: ${msg}`);
    failed++;
  }
}

async function login(email, role) {
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  const csrfData = await csrfRes.json();
  const csrfSetCookies = csrfRes.headers.getSetCookie ? csrfRes.headers.getSetCookie() : [];
  const csrfCookieHeader = csrfSetCookies.map((c) => c.split(";")[0]).join("; ");

  const form = new URLSearchParams({
    email,
    password: "Demo@1234",
    role,
    csrfToken: csrfData.csrfToken,
    redirect: "false",
    json: "true",
  });

  const res = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: csrfCookieHeader,
    },
    body: form.toString(),
    redirect: "manual",
  });

  const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  const allCookies = [...csrfSetCookies, ...setCookies]
    .map((c) => c.split(";")[0])
    .filter(Boolean);
  return allCookies.join("; ");
}

async function main() {
  console.log("================================================================");
  console.log("--- START ADMIN-ONLY REALTIME DATABASE TELEMETRY VERIFICATION ---");
  console.log("================================================================");

  // 1. Unauthenticated checks
  const unauthDb = await fetch(`${BASE_URL}/api/v1/admin/database`);
  assert(unauthDb.status === 401, `Unauthenticated GET /api/v1/admin/database rejected (HTTP ${unauthDb.status})`);

  const unauthSse = await fetch(`${BASE_URL}/api/v1/admin/realtime/stream`);
  assert(unauthSse.status === 401, `Unauthenticated GET /api/v1/admin/realtime/stream rejected (HTTP ${unauthSse.status})`);

  // 2. Non-admin roles must get 403 Forbidden
  const nonAdmins = [
    { email: "pm@buildtrack.com", role: "PROJECT_MANAGER" },
    { email: "engineer@buildtrack.com", role: "SITE_ENGINEER" },
    { email: "finance@buildtrack.com", role: "FINANCE_MANAGER" },
    { email: "contractor@buildtrack.com", role: "CONTRACTOR" },
  ];

  for (const r of nonAdmins) {
    const cookie = await login(r.email, r.role);
    assert(Boolean(cookie), `${r.role} authenticated`);

    const dbRes = await fetch(`${BASE_URL}/api/v1/admin/database`, {
      headers: { Cookie: cookie },
    });
    assert(dbRes.status === 403, `${r.role} blocked from /api/v1/admin/database (HTTP ${dbRes.status})`);

    const sseRes = await fetch(`${BASE_URL}/api/v1/admin/realtime/stream`, {
      headers: { Cookie: cookie },
    });
    assert(sseRes.status === 403, `${r.role} blocked from /api/v1/admin/realtime/stream (HTTP ${sseRes.status})`);
  }

  // 3. Admin access & full database visibility
  const adminCookie = await login("admin@buildtrack.com", "ADMIN");
  assert(Boolean(adminCookie), "ADMIN authenticated successfully");

  const adminDbRes = await fetch(`${BASE_URL}/api/v1/admin/database?table=project`, {
    headers: { Cookie: adminCookie },
  });
  assert(adminDbRes.status === 200, `ADMIN GET /api/v1/admin/database?table=project returned HTTP ${adminDbRes.status}`);

  const adminDb = await adminDbRes.json();
  assert(adminDb.totalTables === 25, `All 25 Prisma tables exposed (${adminDb.totalTables})`);
  assert(adminDb.totalRecords > 0, `Live database contains records (${adminDb.totalRecords})`);
  assert(typeof adminDb.latencyMs === "number", `DB latency measured (${adminDb.latencyMs} ms)`);
  assert(Array.isArray(adminDb.tables) && adminDb.tables.length === 25, "Tables metadata array has 25 entries");
  assert(adminDb.activeTable && Array.isArray(adminDb.activeTable.records) && adminDb.activeTable.records.length > 0, `Active table 'project' returned ${adminDb.activeTable?.records?.length} live records`);

  // Verify User table redacts passwordHash
  const userDbRes = await fetch(`${BASE_URL}/api/v1/admin/database?table=user`, {
    headers: { Cookie: adminCookie },
  });
  assert(userDbRes.status === 200, "ADMIN GET /api/v1/admin/database?table=user returned HTTP 200");
  const userDb = await userDbRes.json();
  const sampleUser = userDb.activeTable?.records?.[0];
  assert(Boolean(sampleUser), "User table returned live user records");
  assert(!("passwordHash" in (sampleUser || {})), "Sensitive passwordHash is redacted from User records");

  // 4. Admin SSE stream check
  const controller = new AbortController();
  const sseRes = await fetch(`${BASE_URL}/api/v1/admin/realtime/stream`, {
    headers: { Cookie: adminCookie },
    signal: controller.signal,
  });
  assert(sseRes.status === 200, `ADMIN SSE stream returned HTTP ${sseRes.status}`);
  assert(
    (sseRes.headers.get("content-type") || "").includes("text/event-stream"),
    "SSE stream Content-Type is text/event-stream"
  );

  const reader = sseRes.body.getReader();
  const { value } = await reader.read();
  const chunk = new TextDecoder().decode(value || new Uint8Array());
  assert(chunk.includes("event: snapshot"), "SSE stream emitted initial 'event: snapshot'");
  assert(chunk.includes("totalRecords"), "SSE snapshot payload contains live totalRecords");
  controller.abort();

  // 5. Admin UI route check
  const pageRes = await fetch(`${BASE_URL}/admin/database`, {
    headers: { Cookie: adminCookie },
  });
  assert(pageRes.status === 200, `ADMIN /admin/database page returned HTTP ${pageRes.status}`);
  const html = await pageRes.text();
  assert(html.includes("OPERATIONAL DATA"), "/admin/database HTML renders OPERATIONAL DATA HUB header");

  // 6. Admin-only Realistic Demo Seed check
  const pmCookie = await login("pm@buildtrack.com", "PROJECT_MANAGER");
  const pmSeedRes = await fetch(`${BASE_URL}/api/v1/admin/database/seed`, {
    method: "POST",
    headers: { Cookie: pmCookie },
  });
  assert(pmSeedRes.status === 403, `Non-admin blocked from POST /api/v1/admin/database/seed (HTTP ${pmSeedRes.status})`);

  const adminSeedRes = await fetch(`${BASE_URL}/api/v1/admin/database/seed`, {
    method: "POST",
    headers: { Cookie: adminCookie },
  });
  assert(adminSeedRes.status === 201, `ADMIN POST /api/v1/admin/database/seed returned HTTP ${adminSeedRes.status}`);
  const seedPayload = await adminSeedRes.json();
  assert(seedPayload.seeded === true && Boolean(seedPayload.project?.id), `Seeded realistic project: ${seedPayload.project?.name}`);
  assert(
    (seedPayload.overview?.totalRecords || 0) > adminDb.totalRecords,
    `Total live records increased (${adminDb.totalRecords} -> ${seedPayload.overview?.totalRecords})`
  );

  // 7. Admin-only Read-Only SQL Console check
  const pmSqlRes = await fetch(`${BASE_URL}/api/v1/admin/database/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: pmCookie },
    body: JSON.stringify({ sql: 'SELECT id, name FROM "Project" LIMIT 3' }),
  });
  assert(pmSqlRes.status === 403, `Non-admin blocked from SQL Console (HTTP ${pmSqlRes.status})`);

  const adminSqlRes = await fetch(`${BASE_URL}/api/v1/admin/database/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ sql: 'SELECT id, name, "totalBudget" FROM "Project" ORDER BY "totalBudget" DESC LIMIT 5' }),
  });
  assert(adminSqlRes.status === 200, `ADMIN read-only SQL query returned HTTP ${adminSqlRes.status}`);
  const sqlData = await adminSqlRes.json();
  assert(Array.isArray(sqlData.rows) && sqlData.rows.length > 0, `SQL query returned ${sqlData.rows?.length} rows`);

  const mutatingSqlRes = await fetch(`${BASE_URL}/api/v1/admin/database/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ sql: 'DELETE FROM "Project"' }),
  });
  assert(mutatingSqlRes.status === 400, `Mutating SQL query strictly blocked (HTTP ${mutatingSqlRes.status})`);

  console.log("================================================================");
  console.log(`ADMIN REALTIME DATABASE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================");
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

