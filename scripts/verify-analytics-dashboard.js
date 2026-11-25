const http = require('http');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: buffer.toString('utf8'),
          buffer: buffer
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function loginAs(email, password = 'password123') {
  const csrfRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/csrf',
    method: 'GET'
  });
  const csrfData = JSON.parse(csrfRes.data);
  const csrfToken = csrfData.csrfToken;
  const cookies = csrfRes.headers['set-cookie'] || [];
  const cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');

  const formBody = new URLSearchParams({
    csrfToken: csrfToken,
    email: email,
    password: password,
    redirect: 'false',
    json: 'true'
  }).toString();

  const signinRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/callback/credentials',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(formBody),
      'Cookie': cookieHeader
    }
  }, formBody);

  const sessionCookies = signinRes.headers['set-cookie'] || [];
  const authCookieHeader = [
    cookieHeader,
    ...sessionCookies.map(c => c.split(';')[0])
  ].filter(Boolean).join('; ');
  return authCookieHeader;
}

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`PASS: ${message}`);
    passCount++;
  } else {
    console.error(`FAIL: ${message}`);
    failCount++;
  }
}

async function main() {
  console.log('================================================================');
  console.log('--- START G. ANALYTICS DASHBOARD AUDIT & VERIFICATION ---');
  console.log('================================================================');

  // Step 1: Authenticate sessions
  console.log('\n--- Step 1: Role Authentication ---');
  const adminCookie = await loginAs('admin@buildtrack.com');
  const pmCookie = await loginAs('pm@buildtrack.com');
  const financeCookie = await loginAs('finance@buildtrack.com');
  const engineerCookie = await loginAs('engineer@buildtrack.com');

  assert(adminCookie.length > 0, 'Admin (admin@buildtrack.com) authenticated successfully');
  assert(pmCookie.length > 0, 'Project Manager (pm@buildtrack.com) authenticated successfully');
  assert(financeCookie.length > 0, 'Finance Manager (finance@buildtrack.com) authenticated successfully');
  assert(engineerCookie.length > 0, 'Site Engineer (engineer@buildtrack.com) authenticated successfully');

  // Step 2: Fetch Analytics Summary API
  console.log('\n--- Step 2: Query GET /api/v1/analytics/summary ---');
  const summaryRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/analytics/summary',
    method: 'GET',
    headers: { 'Cookie': adminCookie }
  });

  assert(summaryRes.statusCode === 200, `GET /api/v1/analytics/summary returned HTTP ${summaryRes.statusCode}`);
  const summaryData = JSON.parse(summaryRes.data);
  const metrics = summaryData.data || summaryData;

  // Step 3: Verify the 10 Required Items
  console.log('\n--- Step 3: Validate All 10 Required Analytics Dashboard Items ---');

  // 1. Total Projects
  assert(typeof metrics.totalProjects === 'number', `Item 1: Total Projects is a number (${metrics.totalProjects})`);
  const dbTotalProjects = await prisma.project.count();
  assert(metrics.totalProjects === dbTotalProjects, `Item 1: Total Projects accurately reflects database count (${dbTotalProjects})`);

  // 2. Active Projects
  assert(typeof metrics.activeProjects === 'number', `Item 2: Active Projects is a number (${metrics.activeProjects})`);
  const dbActiveProjects = await prisma.project.count({ where: { status: 'IN_PROGRESS' } });
  assert(metrics.activeProjects === dbActiveProjects, `Item 2: Active Projects matches database IN_PROGRESS status count (${dbActiveProjects})`);

  // 3. Completed Projects
  assert(typeof metrics.completedProjects === 'number', `Item 3: Completed Projects is a number (${metrics.completedProjects})`);
  const dbCompletedProjects = await prisma.project.count({ where: { status: 'COMPLETED' } });
  assert(metrics.completedProjects === dbCompletedProjects, `Item 3: Completed Projects matches database COMPLETED status count (${dbCompletedProjects})`);

  // 4. Delayed Projects
  assert(typeof metrics.delayedProjects === 'number', `Item 4: Delayed Projects is a number (${metrics.delayedProjects})`);
  assert(metrics.delayedProjects >= 0, `Item 4: Delayed Projects is non-negative`);

  // 5. Total Budget
  assert(typeof metrics.totalBudget === 'number', `Item 5: Total Budget is a number ($${metrics.totalBudget.toLocaleString()})`);
  const dbProjects = await prisma.project.findMany({ select: { totalBudget: true } });
  const dbTotalBudget = dbProjects.reduce((sum, p) => sum + p.totalBudget, 0);
  assert(metrics.totalBudget === dbTotalBudget, `Item 5: Total Budget matches database aggregation ($${dbTotalBudget.toLocaleString()})`);

  // 6. Total Expenses
  const totalExpenses = metrics.totalExpenses ?? metrics.totalSpent;
  assert(typeof totalExpenses === 'number', `Item 6: Total Expenses is a number ($${totalExpenses.toLocaleString()})`);
  const dbExpenses = await prisma.expense.findMany({ select: { amount: true } });
  const dbTotalExpenses = dbExpenses.reduce((sum, e) => sum + e.amount, 0);
  assert(totalExpenses === dbTotalExpenses, `Item 6: Total Expenses matches database expenditure total ($${dbTotalExpenses.toLocaleString()})`);

  // 7. Remaining Budget
  assert(typeof metrics.remainingBudget === 'number', `Item 7: Remaining Budget is a number ($${metrics.remainingBudget.toLocaleString()})`);
  const expectedRemaining = dbTotalBudget - dbTotalExpenses;
  assert(metrics.remainingBudget === expectedRemaining, `Item 7: Remaining Budget correctly calculated server-side ($${expectedRemaining.toLocaleString()})`);

  // 8. Project Completion Rate
  const completionRate = metrics.projectCompletionRate ?? metrics.avgCompletionRate;
  assert(typeof completionRate === 'number', `Item 8: Project Completion Rate is a number (${completionRate}%)`);
  assert(completionRate >= 0 && completionRate <= 100, `Item 8: Project Completion Rate is bounded between 0% and 100%`);

  // 9. Monthly Expense Trends
  assert(Array.isArray(metrics.monthlyExpenseTrend), `Item 9: Monthly Expense Trends is an array (length: ${metrics.monthlyExpenseTrend?.length})`);
  assert(metrics.monthlyExpenseTrend?.length > 0, `Item 9: Monthly Expense Trends contains trend data points`);
  const sampleMonth = metrics.monthlyExpenseTrend[0];
  assert(!!sampleMonth.month && typeof sampleMonth.amount === 'number', `Item 9: Monthly trend data points contain valid 'month' and numeric 'amount' (${sampleMonth.month}: $${sampleMonth.amount})`);

  // 10. Contractor Performance
  const contractorPerf = metrics.contractorPerformance || metrics.contractorRankings;
  assert(Array.isArray(contractorPerf), `Item 10: Contractor Performance is an array (length: ${contractorPerf?.length})`);
  assert(contractorPerf?.length > 0, `Item 10: Contractor Performance contains contractor rankings`);
  const topContractor = contractorPerf[0];
  assert(!!topContractor.company || !!topContractor.name, `Item 10: Contractor entity contains Company Name (${topContractor.company || topContractor.name})`);
  assert(typeof topContractor.rating === 'number', `Item 10: Contractor contains Quality Rating (${topContractor.rating}/5.0)`);
  assert(typeof topContractor.onTimeRate === 'number', `Item 10: Contractor contains On-Time SLA Rate (${topContractor.onTimeRate}%)`);
  assert(typeof topContractor.reliabilityScore === 'number', `Item 10: Contractor contains Reliability Composite Score (${topContractor.reliabilityScore}/100)`);
  assert(typeof topContractor.assignedProjectsCount === 'number', `Item 10: Contractor contains Assigned Projects Count (${topContractor.assignedProjectsCount})`);

  // Step 4: Verify Dashboard and Analytics Frontend Routes
  console.log('\n--- Step 4: Dashboard & Analytics Frontend Verification ---');
  const dashboardPageRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/dashboard',
    method: 'GET',
    headers: { 'Cookie': adminCookie }
  });
  assert(dashboardPageRes.statusCode === 200, `/dashboard returns HTTP ${dashboardPageRes.statusCode} OK`);
  assert(dashboardPageRes.data.includes('TOTAL PROJECTS'), `/dashboard HTML renders 'TOTAL PROJECTS' scorecard`);
  assert(dashboardPageRes.data.includes('ACTIVE PROJECTS'), `/dashboard HTML renders 'ACTIVE PROJECTS' scorecard`);
  assert(dashboardPageRes.data.includes('COMPLETED PROJECTS'), `/dashboard HTML renders 'COMPLETED PROJECTS' scorecard`);
  assert(dashboardPageRes.data.includes('DELAYED PROJECTS'), `/dashboard HTML renders 'DELAYED PROJECTS' scorecard`);
  assert(dashboardPageRes.data.includes('TOTAL BUDGET'), `/dashboard HTML renders 'TOTAL BUDGET' scorecard`);
  assert(dashboardPageRes.data.includes('TOTAL EXPENSES'), `/dashboard HTML renders 'TOTAL EXPENSES' scorecard`);
  assert(dashboardPageRes.data.includes('REMAINING BUDGET'), `/dashboard HTML renders 'REMAINING BUDGET' scorecard`);
  assert(dashboardPageRes.data.includes('PROJECT COMPLETION RATE'), `/dashboard HTML renders 'PROJECT COMPLETION RATE' scorecard`);
  assert(dashboardPageRes.data.includes('CONTRACTOR PERFORMANCE'), `/dashboard HTML renders 'CONTRACTOR PERFORMANCE' section`);

  const analyticsPageRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/analytics',
    method: 'GET',
    headers: { 'Cookie': adminCookie }
  });
  console.log('/analytics status:', analyticsPageRes.statusCode, 'headers:', analyticsPageRes.headers);
  assert(analyticsPageRes.statusCode === 200, `/analytics route returns HTTP ${analyticsPageRes.statusCode} OK`);

  // Summary
  console.log('\n================================================================');
  console.log(`G. ANALYTICS DASHBOARD TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('================================================================');

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main()
  .catch(err => {
    console.error('Fatal error during test run:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
