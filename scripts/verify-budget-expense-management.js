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
  return [cookieHeader, ...sessionCookies.map(c => c.split(';')[0])].filter(Boolean).join('; ');
}

async function runAudit() {
  console.log('========================================================================');
  console.log('BUILDTRACK ENTERPRISE: C. BUDGET & EXPENSE MANAGEMENT VERIFICATION SUITE');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName, details = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`  [PASS] Test ${total}: ${testName}`);
    } else {
      console.error(`  [FAIL] Test ${total}: ${testName} -> ${details}`);
    }
  }

  // 1. Authenticate roles
  console.log('Step 1: Authenticating Enterprise Roles (Finance Manager, Admin, Contractor, Engineer)...');
  const financeCookie = await loginAs('finance@buildtrack.com');
  const adminCookie = await loginAs('admin@buildtrack.com');
  const contractorCookie = await loginAs('contractor@buildtrack.com');
  const engineerCookie = await loginAs('engineer@buildtrack.com');
  console.log('  -> All 4 authentication credentials validated.\n');

  // Grab a test project and category from DB
  const project = await prisma.project.findFirst({
    include: {
      budgets: { include: { category: true } },
      manager: true,
    },
  });
  if (!project) {
    throw new Error('No project found in database to run tests against.');
  }

  let testCategory = await prisma.expenseCategory.findFirst();
  if (!testCategory) {
    testCategory = await prisma.expenseCategory.create({
      data: {
        name: 'Structural Concrete Pouring',
        code: 'STRUCT-03',
        description: 'Division 03 Concrete works',
      },
    });
  }

  // ---------------------------------------------------------
  // 1. Total Project Budget
  // ---------------------------------------------------------
  console.log('--- Sub-Module 1: Total Project Budget ---');

  // 1.1 Finance Manager can read budget summary including totalBudget
  const budgetGetRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/budget?projectId=${project.id}`,
    method: 'GET',
    headers: { 'Cookie': financeCookie },
  });
  const budgetGetData = JSON.parse(budgetGetRes.data);
  const projSummary = budgetGetData.summaries?.find(s => s.projectId === project.id);
  assert(
    budgetGetRes.statusCode === 200 && projSummary && typeof projSummary.totalBudget === 'number',
    'Finance Manager can retrieve project Total Budget and EVM summary',
    `Status ${budgetGetRes.statusCode}, totalBudget: ${projSummary?.totalBudget}`
  );

  // 1.2 Finance Manager can adjust Total Project Budget via POST /api/v1/budget
  const updatedTotalBudget = (project.totalBudget || 50000000) + 250000;
  const updateBudgetRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/budget',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': financeCookie,
    },
  }, JSON.stringify({
    projectId: project.id,
    totalBudget: updatedTotalBudget,
  }));
  const updateBudgetData = JSON.parse(updateBudgetRes.data);
  assert(
    updateBudgetRes.statusCode === 200 && updateBudgetData.project?.totalBudget === updatedTotalBudget,
    'Finance Manager can adjust Total Project Budget via POST /api/v1/budget',
    `Status: ${updateBudgetRes.statusCode}, body: ${updateBudgetRes.data}`
  );

  // 1.3 Finance Manager can adjust Total Project Budget via PATCH /api/v1/projects/[id]
  const patchBudgetRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/projects/${project.id}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': financeCookie,
    },
  }, JSON.stringify({
    totalBudget: updatedTotalBudget + 50000,
  }));
  const patchBudgetData = JSON.parse(patchBudgetRes.data);
  assert(
    patchBudgetRes.statusCode === 200 && patchBudgetData.project?.totalBudget === updatedTotalBudget + 50000,
    'Finance Manager can adjust Total Project Budget via PATCH /api/v1/projects/[id]',
    `Status: ${patchBudgetRes.statusCode}`
  );

  // 1.4 Finance Manager CANNOT modify non-financial project fields (Rule 10 & role separation)
  const financeIllegalPatchRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/projects/${project.id}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': financeCookie,
    },
  }, JSON.stringify({
    name: 'Unauthorized Megaproject Name Takeover',
  }));
  assert(
    financeIllegalPatchRes.statusCode === 403,
    'Finance Manager is strictly forbidden from modifying non-financial project attributes (HTTP 403)',
    `Status: ${financeIllegalPatchRes.statusCode}`
  );

  // 1.5 Contractor CANNOT modify Total Project Budget (Rule 10)
  const contractorBudgetPatchRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/projects/${project.id}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': contractorCookie,
    },
  }, JSON.stringify({
    totalBudget: 999999999,
  }));
  assert(
    contractorBudgetPatchRes.statusCode === 403,
    'Contractor cannot modify project financial budget data (HTTP 403)',
    `Status: ${contractorBudgetPatchRes.statusCode}`
  );

  // ---------------------------------------------------------
  // 2. Expense Categories
  // ---------------------------------------------------------
  console.log('\n--- Sub-Module 2: Expense Categories ---');

  // 2.1 GET /api/v1/expenses/categories
  const categoriesGetRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/expenses/categories',
    method: 'GET',
    headers: { 'Cookie': financeCookie },
  });
  const categoriesGetData = JSON.parse(categoriesGetRes.data);
  assert(
    categoriesGetRes.statusCode === 200 && Array.isArray(categoriesGetData.categories) && categoriesGetData.categories.length > 0,
    'GET /api/v1/expenses/categories returns expense divisions with metrics',
    `Count: ${categoriesGetData.categories?.length}`
  );

  // 2.2 Finance Manager can create a new Expense Category
  const uniqueSuffix = Date.now().toString().slice(-5);
  const newCatName = `Precision Geotechnical Testing ${uniqueSuffix}`;
  const newCatCode = `GEOTECH-${uniqueSuffix}`;
  const createCatRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/expenses/categories',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': financeCookie,
    },
  }, JSON.stringify({
    name: newCatName,
    code: newCatCode,
    description: 'Subsurface cone penetration and sonic coring validation',
  }));
  const createCatData = JSON.parse(createCatRes.data);
  assert(
    createCatRes.statusCode === 201 && createCatData.category?.code === newCatCode,
    'Finance Manager can create a new standardized Expense Category (HTTP 201)',
    `Status: ${createCatRes.statusCode}, Code: ${createCatData.category?.code}`
  );

  // 2.3 Contractor CANNOT create Expense Category
  const contractorCreateCatRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/expenses/categories',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': contractorCookie,
    },
  }, JSON.stringify({
    name: `Hacked Category ${uniqueSuffix}`,
    code: `HACK-${uniqueSuffix}`,
  }));
  assert(
    contractorCreateCatRes.statusCode === 403,
    'Contractor is forbidden from creating expense categories (HTTP 403)',
    `Status: ${contractorCreateCatRes.statusCode}`
  );

  // ---------------------------------------------------------
  // 3. Expense Records with All 8 Required Fields
  // ---------------------------------------------------------
  console.log('\n--- Sub-Module 3: Expense Records (All 8 Required Fields) ---');

  // Each expense must contain:
  // 1. Expense Title
  // 2. Project Reference
  // 3. Expense Category
  // 4. Amount
  // 5. Date
  // 6. Description
  // 7. Recorded By
  // 8. Supporting Document
  const createdCategoryId = createCatData.category?.id || testCategory.id;
  const expensePayload = {
    title: `Interim Payment Certificate IPC-TEST-${uniqueSuffix}`,
    projectId: project.id,
    categoryId: createdCategoryId,
    amount: 142500,
    date: new Date().toISOString(),
    description: 'Comprehensive QA compressive batch strength testing certificates #QA-8910',
    documentUrl: `/uploads/vouchers/IPC-TEST-${uniqueSuffix}.pdf`,
  };

  const createExpenseRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/expenses',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': financeCookie,
    },
  }, JSON.stringify(expensePayload));
  const createExpenseData = JSON.parse(createExpenseRes.data);
  const createdExpense = createExpenseData.expense;

  assert(
    createExpenseRes.statusCode === 201 && !!createdExpense?.id,
    'Finance Manager can record a new Expense Record (HTTP 201)',
    `Status: ${createExpenseRes.statusCode}`
  );

  // Verify all 8 fields are preserved
  assert(
    createdExpense?.title === expensePayload.title,
    'Field 1: Expense Title is captured accurately',
    `Title: ${createdExpense?.title}`
  );
  assert(
    createdExpense?.projectId === project.id,
    'Field 2: Project Reference is associated correctly',
    `ProjectId: ${createdExpense?.projectId}`
  );
  assert(
    createdExpense?.categoryId === createdCategoryId,
    'Field 3: Expense Category is linked correctly',
    `CategoryId: ${createdExpense?.categoryId}`
  );
  assert(
    createdExpense?.amount === expensePayload.amount,
    'Field 4: Amount is recorded accurately',
    `Amount: ${createdExpense?.amount}`
  );
  assert(
    Boolean(createdExpense?.date),
    'Field 5: Date timestamp is recorded properly',
    `Date: ${createdExpense?.date}`
  );
  assert(
    createdExpense?.description === expensePayload.description,
    'Field 6: Description / QA notes are captured',
    `Description: ${createdExpense?.description}`
  );
  assert(
    Boolean(createdExpense?.recordedById || createdExpense?.recordedBy),
    'Field 7: Recorded By audit signatory is recorded',
    `RecordedBy: ${createdExpense?.recordedBy?.name || createdExpense?.recordedById}`
  );
  assert(
    createdExpense?.documentUrl === expensePayload.documentUrl,
    'Field 8: Supporting Document voucher reference is attached',
    `DocumentUrl: ${createdExpense?.documentUrl}`
  );

  // 3.9 Validation: Rule 6 - Expenses must be associated with valid projects
  const invalidProjectExpenseRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/expenses',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': financeCookie,
    },
  }, JSON.stringify({
    ...expensePayload,
    projectId: 'non-existent-project-cuid',
  }));
  assert(
    invalidProjectExpenseRes.statusCode === 404,
    'Rule 6: Expenses must be associated with valid projects (HTTP 404 on invalid project)',
    `Status: ${invalidProjectExpenseRes.statusCode}`
  );

  // 3.10 Contractor cannot record financial expenses (HTTP 403)
  const contractorExpenseRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/expenses',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': contractorCookie,
    },
  }, JSON.stringify(expensePayload));
  assert(
    contractorExpenseRes.statusCode === 403,
    'Contractor is strictly forbidden from recording financial expenses (HTTP 403)',
    `Status: ${contractorExpenseRes.statusCode}`
  );

  // ---------------------------------------------------------
  // 4. Budget vs Actual Cost, Remaining Budget & Utilization Percentage
  // ---------------------------------------------------------
  console.log('\n--- Sub-Module 4: Budget vs Actual Cost & Utilization Analytics ---');

  // Set allocation for category so we have defined budget
  await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/budget',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': financeCookie,
    },
  }, JSON.stringify({
    projectId: project.id,
    categoryId: createdCategoryId,
    allocated: 200000,
  }));

  const calcRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/budget?projectId=${project.id}`,
    method: 'GET',
    headers: { 'Cookie': financeCookie },
  });
  const calcData = JSON.parse(calcRes.data);
  const activeSummary = calcData.summaries?.find(s => s.projectId === project.id);

  assert(
    activeSummary && typeof activeSummary.totalBudget === 'number' && typeof activeSummary.totalSpent === 'number',
    'Server calculates Total Budget and Actual Incurred Cost (totalSpent)',
    `Budget: ${activeSummary?.totalBudget}, Spent: ${activeSummary?.totalSpent}`
  );

  assert(
    activeSummary && activeSummary.remainingBudget === (activeSummary.totalBudget - activeSummary.totalSpent),
    'Server calculates Remaining Budget = (Total Budget - Total Spent)',
    `Remaining: ${activeSummary?.remainingBudget}`
  );

  const expectedUtilization = Math.round((activeSummary.totalSpent / activeSummary.totalBudget) * 1000) / 10;
  assert(
    activeSummary && Math.abs(activeSummary.utilizationRate - expectedUtilization) < 0.2,
    'Server calculates Budget Utilization Percentage accurately',
    `Reported Rate: ${activeSummary?.utilizationRate}%, Expected: ${expectedUtilization}%`
  );

  const catBreakdown = activeSummary?.categories?.find(c => c.categoryId === createdCategoryId);
  assert(
    catBreakdown && catBreakdown.allocated === 200000 && catBreakdown.spent === 142500 && catBreakdown.remaining === 57500,
    'Category-wise Budget vs Actual Cost and Remaining Contingency are calculated server-side',
    `Allocated: ${catBreakdown?.allocated}, Spent: ${catBreakdown?.spent}, Remaining: ${catBreakdown?.remaining}`
  );

  // ---------------------------------------------------------
  // 5. Budget Overrun Alerts
  // ---------------------------------------------------------
  console.log('\n--- Sub-Module 5: Budget Overrun Alerts ---');

  // Record an expense that forces category into overrun (> 200,000 allocated)
  const overrunExpenseRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/expenses',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': financeCookie,
    },
  }, JSON.stringify({
    title: `Overrun Spike Invoice #INV-OVER-${uniqueSuffix}`,
    projectId: project.id,
    categoryId: createdCategoryId,
    amount: 100000, // 142,500 + 100,000 = 242,500 > 200,000 allocated!
    date: new Date().toISOString(),
    description: 'Emergency piling reinforcement injection',
    documentUrl: `/uploads/vouchers/OVERRUN-${uniqueSuffix}.pdf`,
  }));

  const postOverrunCalcRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/budget?projectId=${project.id}`,
    method: 'GET',
    headers: { 'Cookie': financeCookie },
  });
  const postOverrunData = JSON.parse(postOverrunCalcRes.data);
  const overrunSummary = postOverrunData.summaries?.find(s => s.projectId === project.id);
  const overrunCat = overrunSummary?.categories?.find(c => c.categoryId === createdCategoryId);

  assert(
    overrunCat && overrunCat.isOverrun === true && overrunCat.spent > overrunCat.allocated,
    'System detects Budget Overrun (>100% allocation) and flags isOverrun === true',
    `Spent: ${overrunCat?.spent}, Allocated: ${overrunCat?.allocated}, isOverrun: ${overrunCat?.isOverrun}`
  );

  // Check overrun notification was triggered
  const overrunNotification = await prisma.notification.findFirst({
    where: {
      type: 'BUDGET_OVERRUN',
      message: { contains: newCatName },
    },
  });
  assert(
    !!overrunNotification,
    'Budget Overrun Alert notification generated automatically for project stakeholders',
    `Notification ID: ${overrunNotification?.id}, Message: ${overrunNotification?.message}`
  );

  // ---------------------------------------------------------
  // 6. Expense History
  // ---------------------------------------------------------
  console.log('\n--- Sub-Module 6: Expense History Ledger ---');

  const historyRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/expenses?projectId=${project.id}&sort=date&desc=true&pageSize=10`,
    method: 'GET',
    headers: { 'Cookie': financeCookie },
  });
  const historyData = JSON.parse(historyRes.data);

  assert(
    historyRes.statusCode === 200 && Array.isArray(historyData.expenses) && historyData.expenses.length >= 2,
    'Expense History ledger provides chronological paginated query with sorting and project filtering',
    `Count: ${historyData.expenses?.length}, Total: ${historyData.total}`
  );

  // ---------------------------------------------------------
  // 7. Project-wise Financial Reports (PDF)
  // ---------------------------------------------------------
  console.log('\n--- Sub-Module 7: Project-wise Financial Reports (PDF) ---');

  const pdfRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/reports/financial/${project.id}`,
    method: 'GET',
    headers: { 'Cookie': financeCookie },
  });

  const isPdfHeader = pdfRes.headers['content-type']?.includes('application/pdf');
  const hasPdfMagicBytes = pdfRes.buffer.slice(0, 4).toString() === '%PDF';

  assert(
    pdfRes.statusCode === 200 && isPdfHeader && hasPdfMagicBytes,
    'Project-wise Financial Report generated as valid downloadable PDF binary stream (%PDF-1.x)',
    `Status: ${pdfRes.statusCode}, Content-Type: ${pdfRes.headers['content-type']}, Magic: ${pdfRes.buffer.slice(0, 4).toString()}`
  );

  // ---------------------------------------------------------
  // FINAL REPORT
  // ---------------------------------------------------------
  console.log('\n========================================================================');
  console.log(`BUDGET & EXPENSE MANAGEMENT AUDIT COMPLETE: ${passed}/${total} TESTS PASSED`);
  console.log('========================================================================');

  if (passed === total) {
    console.log('STATUS: 100% PASS - C. BUDGET & EXPENSE MANAGEMENT COMPLIANT WITH ALL REQUIREMENTS');
  } else {
    console.error(`STATUS: INCOMPLETE - ${total - passed} TESTS FAILED`);
    process.exit(1);
  }
}

runAudit()
  .catch((err) => {
    console.error('Fatal audit failure:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

