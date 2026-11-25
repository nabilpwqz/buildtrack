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

async function runSecurityAudit() {
  console.log('================================================================');
  console.log('BUILDTRACK ENTERPRISE: SECURITY & BUSINESS LOGIC RULES AUDIT');
  console.log('================================================================\n');

  // Establish role sessions
  console.log('Establishing Authenticated Sessions across Enterprise Roles...');
  const adminCookie = await loginAs('admin@buildtrack.com');
  const pmCookie = await loginAs('pm@buildtrack.com');
  const seCookie = await loginAs('engineer@buildtrack.com');
  const fmCookie = await loginAs('finance@buildtrack.com');
  const contCookie = await loginAs('contractor@buildtrack.com');
  console.log('-> Sessions Active: ADMIN, PROJECT_MANAGER, SITE_ENGINEER, FINANCE_MANAGER, CONTRACTOR.\n');

  // Query database for test artifacts
  const projects = await prisma.project.findMany({
    take: 2,
    include: { contractors: true, tasks: { take: 2 } }
  });
  const projectA = projects[0];
  const projectB = projects[1];

  const contractorUser = await prisma.user.findFirst({
    where: { role: 'CONTRACTOR' }
  });

  // Ensure contractor is assigned to projectA but NOT projectB
  if (contractorUser && contractorUser.contractorId) {
    await prisma.projectContractor.upsert({
      where: {
        projectId_contractorId: {
          projectId: projectA.id,
          contractorId: contractorUser.contractorId
        }
      },
      update: {},
      create: {
        projectId: projectA.id,
        contractorId: contractorUser.contractorId,
        role: 'Subcontractor'
      }
    });

    // Remove from projectB to guarantee unassigned test
    await prisma.projectContractor.deleteMany({
      where: {
        projectId: projectB.id,
        contractorId: contractorUser.contractorId
      }
    });
  }

  const category = await prisma.expenseCategory.findFirst();
  const material = await prisma.material.findFirst();

  let passed = 0;
  let total = 0;

  function assert(name, condition, details = '') {
    total++;
    if (condition) {
      console.log(`[PASS] Rule ${total}: ${name}`);
      if (details) console.log(`       -> ${details}`);
      passed++;
    } else {
      console.error(`[FAIL] Rule ${total}: ${name}`);
      if (details) console.error(`       -> ${details}`);
    }
  }

  // --- RULE 1: Contractors can only access their assigned projects and tasks ---
  // 1a: Contractor accessing assigned projectA
  const contProjARes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/projects/${projectA.id}`,
    method: 'GET',
    headers: { 'Cookie': contCookie }
  });
  assert(
    'Contractors can access their assigned project',
    contProjARes.statusCode === 200,
    `HTTP ${contProjARes.statusCode} for assigned project ${projectA.name}`
  );

  // 1b: Contractor accessing unassigned projectB
  const contProjBRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/projects/${projectB.id}`,
    method: 'GET',
    headers: { 'Cookie': contCookie }
  });
  assert(
    'Contractors CANNOT access unassigned projects (403 Forbidden)',
    contProjBRes.statusCode === 403,
    `HTTP ${contProjBRes.statusCode} blocked access to unassigned project ${projectB.name}`
  );

  // 1c: Contractor accessing task from unassigned projectB
  const unassignedTask = projectB.tasks[0];
  if (unassignedTask) {
    const contTaskRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/v1/tasks/${unassignedTask.id}`,
      method: 'GET',
      headers: { 'Cookie': contCookie }
    });
    assert(
      'Contractors CANNOT access tasks from unassigned projects (403 Forbidden)',
      contTaskRes.statusCode === 403,
      `HTTP ${contTaskRes.statusCode} blocked task from unassigned project`
    );
  }

  // --- RULE 2: Site engineers can only update authorized site activities ---
  // 2a: Site engineer cannot create tasks (only PM / Admin)
  const seTaskCreateRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/tasks',
    method: 'POST',
    headers: { 'Cookie': seCookie, 'Content-Type': 'application/json' }
  }, JSON.stringify({
    projectId: projectA.id,
    title: 'Unauthorized SE Task Creation',
    priority: 'HIGH',
    deadline: new Date(Date.now() + 86400000).toISOString()
  }));
  assert(
    'Site engineers CANNOT create project tasks (403 Forbidden)',
    seTaskCreateRes.statusCode === 403,
    `HTTP ${seTaskCreateRes.statusCode} properly rejected task creation`
  );

  // 2b: Site engineer can update authorized site report
  const seSiteReportRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/reports',
    method: 'POST',
    headers: { 'Cookie': seCookie, 'Content-Type': 'application/json' }
  }, JSON.stringify({
    type: 'site',
    projectId: projectA.id,
    weather: 'Clear (30C)',
    workersCount: 45,
    equipmentOnSite: '1x Crane',
    workCompleted: 'Slump test passed on pier 4 concrete batch.',
    safetyIncidents: 0
  }));
  assert(
    'Site engineers CAN update authorized site activities/reports (200/201)',
    seSiteReportRes.statusCode === 200 || seSiteReportRes.statusCode === 201,
    `HTTP ${seSiteReportRes.statusCode} site report logged successfully`
  );

  // --- RULE 3: Finance managers can manage financial records but cannot modify system-level settings ---
  // 3a: Finance manager modifies system settings -> 403 Forbidden
  const fmSysRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/settings/system',
    method: 'POST',
    headers: { 'Cookie': fmCookie, 'Content-Type': 'application/json' }
  }, JSON.stringify({ overrunThreshold: 90 }));
  assert(
    'Finance managers CANNOT modify system-level settings (403 Forbidden)',
    fmSysRes.statusCode === 403,
    `HTTP ${fmSysRes.statusCode} governance restriction enforced on Finance Manager`
  );

  // 3b: Finance manager can manage budget records
  const fmBudgetRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/budget',
    method: 'POST',
    headers: { 'Cookie': fmCookie, 'Content-Type': 'application/json' }
  }, JSON.stringify({
    projectId: projectA.id,
    categoryId: category.id,
    allocated: 1500000
  }));
  assert(
    'Finance managers CAN manage budget records (200/201)',
    fmBudgetRes.statusCode === 200 || fmBudgetRes.statusCode === 201,
    `HTTP ${fmBudgetRes.statusCode} budget allocation recorded`
  );

  // --- RULE 4: Project managers can only manage authorized projects ---
  // Create dummy project managed by someone else
  const otherPM = await prisma.user.findFirst({
    where: { role: 'PROJECT_MANAGER', NOT: { email: 'pm@buildtrack.com' } }
  });
  const pmUser = await prisma.user.findFirst({ where: { email: 'pm@buildtrack.com' } });

  let unauthProject = await prisma.project.findFirst({
    where: { NOT: { managerId: pmUser.id } }
  });

  if (unauthProject) {
    const pmUnauthRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/v1/projects/${unauthProject.id}`,
      method: 'PATCH',
      headers: { 'Cookie': pmCookie, 'Content-Type': 'application/json' }
    }, JSON.stringify({ description: 'Unauthorized PM description amendment' }));
    assert(
      'Project managers CANNOT manage unauthorized projects (403 Forbidden)',
      pmUnauthRes.statusCode === 403,
      `HTTP ${pmUnauthRes.statusCode} project management restricted to authorized PM`
    );
  }

  // --- RULE 5: Admin has full system access ---
  const adminSysRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/settings/system',
    method: 'POST',
    headers: { 'Cookie': adminCookie, 'Content-Type': 'application/json' }
  }, JSON.stringify({ overrunThreshold: 85 }));
  assert(
    'Admin HAS full system access to configure system settings (200 OK)',
    adminSysRes.statusCode === 200,
    `HTTP ${adminSysRes.statusCode} Admin executed system configuration`
  );

  // --- RULE 6: Expenses must be associated with valid projects ---
  // 6a: Invalid project ID -> 404 NOT_FOUND
  const invExpRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/expenses',
    method: 'POST',
    headers: { 'Cookie': fmCookie, 'Content-Type': 'application/json' }
  }, JSON.stringify({
    title: 'Fictitious Expense',
    projectId: 'non-existent-project-cuid-999',
    categoryId: category.id,
    amount: 50000,
    date: new Date().toISOString()
  }));
  assert(
    'Expenses MUST be associated with valid projects (404 Not Found)',
    invExpRes.statusCode === 404,
    `HTTP ${invExpRes.statusCode} correctly rejected non-existent project`
  );

  // 6b: Valid project ID -> 201 Created
  const validExpRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/expenses',
    method: 'POST',
    headers: { 'Cookie': fmCookie, 'Content-Type': 'application/json' }
  }, JSON.stringify({
    title: 'Certified QA Laboratory Geotechnical Test',
    projectId: projectA.id,
    categoryId: category.id,
    amount: 45000,
    date: new Date().toISOString()
  }));
  assert(
    'Expenses associated with valid project are accepted (201 Created)',
    validExpRes.statusCode === 201 || validExpRes.statusCode === 200,
    `HTTP ${validExpRes.statusCode} successfully recorded expenditure certificate`
  );

  // --- RULE 7: Material usage must not exceed available stock ---
  // 7a: Quantity exceeding stock -> 409 Conflict
  const excessiveQty = (material.availableQty || 0) + 999999;
  const excStockRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/materials/${material.id}/issue`,
    method: 'POST',
    headers: { 'Cookie': seCookie, 'Content-Type': 'application/json' }
  }, JSON.stringify({
    qty: excessiveQty,
    projectId: projectA.id,
    notes: 'Attempting excessive dispatch'
  }));
  assert(
    'Material usage CANNOT exceed available stock (409 Conflict)',
    excStockRes.statusCode === 409,
    `HTTP ${excStockRes.statusCode} INSUFFICIENT_STOCK correctly blocked dispatch`
  );

  // 7b: Quantity within available stock -> 200 OK
  if (material.availableQty > 2) {
    const validStockRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/v1/materials/${material.id}/issue`,
      method: 'POST',
      headers: { 'Cookie': seCookie, 'Content-Type': 'application/json' }
    }, JSON.stringify({
      qty: 1,
      projectId: projectA.id,
      notes: 'Standard authorized site batch dispatch'
    }));
    assert(
      'Material usage within stock is dispatched successfully (200 OK)',
      validStockRes.statusCode === 200,
      `HTTP ${validStockRes.statusCode} stock decremented and transaction logged`
    );
  }

  // --- RULE 8: Completed tasks must retain their activity history ---
  const taskToComplete = projectA.tasks[0];
  if (taskToComplete) {
    // Transition to completed
    const completeRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/v1/tasks/${taskToComplete.id}/transition`,
      method: 'POST',
      headers: { 'Cookie': adminCookie, 'Content-Type': 'application/json' }
    }, JSON.stringify({
      status: 'COMPLETED',
      notes: 'Final engineering inspection sign-off completed'
    }));

    // Fetch task history directly from database
    const historyCount = await prisma.taskHistory.count({
      where: { taskId: taskToComplete.id }
    });
    const updatedTask = await prisma.task.findUnique({
      where: { id: taskToComplete.id },
      include: { history: true }
    });

    assert(
      'Completed tasks retain their activity history',
      updatedTask.status === 'COMPLETED' && updatedTask.completedAt !== null && historyCount > 0,
      `Task status: ${updatedTask.status}, completedAt: ${updatedTask.completedAt?.toISOString()}, History events: ${historyCount}`
    );
  }

  // --- RULE 9: Budget calculations must be handled on the server ---
  const budgetServerRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/projects/${projectA.id}`,
    method: 'GET',
    headers: { 'Cookie': adminCookie }
  });
  const budgetData = JSON.parse(budgetServerRes.data);
  const bs = budgetData.budgetSummary;
  const isServerCalculated =
    bs &&
    typeof bs.totalBudget === 'number' &&
    typeof bs.totalSpent === 'number' &&
    typeof bs.remainingBudget === 'number' &&
    typeof bs.utilizationRate === 'number' &&
    typeof bs.isWarning === 'boolean' &&
    typeof bs.isOverrun === 'boolean';
  assert(
    'Budget calculations are computed and returned by the server',
    isServerCalculated,
    `Server computed Budget: $${bs.totalBudget.toLocaleString()}, Spent: $${bs.totalSpent.toLocaleString()}, Utilization: ${bs.utilizationRate}%, Warning: ${bs.isWarning}`
  );

  // --- RULE 10: Unauthorized users must not modify project financial data ---
  // 10a: Site Engineer attempting to modify project totalBudget -> 403 Forbidden
  const seBudgetPatchRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/projects/${projectA.id}`,
    method: 'PATCH',
    headers: { 'Cookie': seCookie, 'Content-Type': 'application/json' }
  }, JSON.stringify({ totalBudget: 99999999 }));
  assert(
    'Site engineers CANNOT modify project financial data (403 Forbidden)',
    seBudgetPatchRes.statusCode === 403,
    `HTTP ${seBudgetPatchRes.statusCode} forbidden from altering totalBudget`
  );

  // 10b: Contractor attempting to record an expense -> 403 Forbidden
  const contExpRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/expenses',
    method: 'POST',
    headers: { 'Cookie': contCookie, 'Content-Type': 'application/json' }
  }, JSON.stringify({
    title: 'Unauthorized Contractor Expense',
    projectId: projectA.id,
    categoryId: category.id,
    amount: 100000,
    date: new Date().toISOString()
  }));
  assert(
    'Contractors CANNOT modify financial ledgers / record expenses (403 Forbidden)',
    contExpRes.statusCode === 403,
    `HTTP ${contExpRes.statusCode} forbidden from financial modification`
  );

  // 10c: Unauthenticated request attempting to modify budget -> 401/403
  const anonBudgetRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/budget',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({
    projectId: projectA.id,
    categoryId: category.id,
    allocated: 2000000
  }));
  assert(
    'Unauthenticated users CANNOT modify financial budget allocations (401/403)',
    anonBudgetRes.statusCode === 401 || anonBudgetRes.statusCode === 403,
    `HTTP ${anonBudgetRes.statusCode} unauthorized financial mutation blocked`
  );

  console.log('\n================================================================');
  console.log(`SECURITY AUDIT RESULT: ${passed}/${total} RULES PASSED!`);
  console.log('================================================================');
}

runSecurityAudit()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

