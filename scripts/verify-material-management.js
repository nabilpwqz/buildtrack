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
  console.log('BUILDTRACK ENTERPRISE: D. MATERIAL MANAGEMENT SYSTEM VERIFICATION SUITE');
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
  console.log('Step 1: Authenticating Enterprise Roles (Site Engineer, Project Manager, Admin, Contractor)...');
  const seCookie = await loginAs('engineer@buildtrack.com');
  const pmCookie = await loginAs('pm@buildtrack.com');
  const adminCookie = await loginAs('admin@buildtrack.com');
  const contractorCookie = await loginAs('contractor@buildtrack.com');
  console.log('  -> All 4 authentication sessions active.\n');

  // Grab a test project from DB
  const project = await prisma.project.findFirst({
    include: { tasks: true, manager: true },
  });
  if (!project) throw new Error('No project found in database.');

  const uniqueSuffix = Date.now().toString().slice(-5);

  // ---------------------------------------------------------
  // 1. Material Categories
  // ---------------------------------------------------------
  console.log('--- Sub-Module 1: Material Categories ---');

  // 1.1 List categories
  const catListRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/materials/categories',
    method: 'GET',
    headers: { 'Cookie': seCookie },
  });
  const catListData = JSON.parse(catListRes.data);
  assert(
    catListRes.statusCode === 200 && Array.isArray(catListData.categories) && catListData.categories.length > 0,
    'GET /api/v1/materials/categories returns categorized divisions with metrics',
    `Count: ${catListData.categories?.length}`
  );

  // 1.2 Create category
  const newCatName = `Advanced Geotextile Membranes ${uniqueSuffix}`;
  const createCatRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/materials/categories',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': pmCookie,
    },
  }, JSON.stringify({
    name: newCatName,
    description: 'Sub-base soil stabilization and drainage woven geotextile fabric',
  }));
  const createCatData = JSON.parse(createCatRes.data);
  assert(
    createCatRes.statusCode === 201 && createCatData.category?.name === newCatName,
    'Project Manager can create a new Material Category (HTTP 201)',
    `Status: ${createCatRes.statusCode}`
  );

  const testCategoryId = createCatData.category?.id || catListData.categories[0].id;

  // ---------------------------------------------------------
  // 2. Material Registration
  // ---------------------------------------------------------
  console.log('\n--- Sub-Module 2: Material Registration ---');

  const newSku = `GEO-TX-${uniqueSuffix}`;
  const registerPayload = {
    name: `High-Flow Non-Woven Geotextile 250 GSM (${uniqueSuffix})`,
    sku: newSku,
    unit: 'Rolls',
    categoryId: testCategoryId,
    availableQty: 100,
    reorderLevel: 25,
    unitCost: 320,
  };

  // 2.1 Register new material
  const regRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/materials',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': pmCookie,
    },
  }, JSON.stringify(registerPayload));
  const regData = JSON.parse(regRes.data);
  const createdMaterial = regData.material;

  assert(
    regRes.statusCode === 201 && createdMaterial?.sku === newSku,
    'Project Manager can register a new Material SKU (HTTP 201)',
    `Status: ${regRes.statusCode}, SKU: ${createdMaterial?.sku}`
  );

  // 2.2 Verify initial inventory transaction logged in DB
  const initialTx = await prisma.materialTransaction.findFirst({
    where: { materialId: createdMaterial.id, type: 'RECEIVE' },
  });
  assert(
    !!initialTx && initialTx.qty === 100 && initialTx.balanceAfter === 100,
    'System automatically logs initial stock intake transaction (type: RECEIVE) on SKU registration',
    `Tx ID: ${initialTx?.id}, Qty: ${initialTx?.qty}, Balance: ${initialTx?.balanceAfter}`
  );

  // 2.3 Duplicate SKU rejected
  const dupRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/materials',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': pmCookie,
    },
  }, JSON.stringify(registerPayload));
  assert(
    dupRes.statusCode === 409,
    'Registration correctly rejects duplicate SKU code with HTTP 409 Conflict',
    `Status: ${dupRes.statusCode}`
  );

  // ---------------------------------------------------------
  // 3. Available Quantity Tracking
  // ---------------------------------------------------------
  console.log('\n--- Sub-Module 3: Available Quantity Tracking ---');

  // 3.1 Retrieve material details
  const matDetailRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/materials/${createdMaterial.id}`,
    method: 'GET',
    headers: { 'Cookie': seCookie },
  });
  const matDetailData = JSON.parse(matDetailRes.data);
  assert(
    matDetailRes.statusCode === 200 && matDetailData.material?.availableQty === 100,
    'GET /api/v1/materials/[id] returns exact available stock quantity and specifications',
    `Available: ${matDetailData.material?.availableQty} ${matDetailData.material?.unit}`
  );

  // ---------------------------------------------------------
  // 4. Material Distribution & Automatic Stock Update (Rule 7)
  // ---------------------------------------------------------
  console.log('\n--- Sub-Module 4: Material Distribution & Automatic Stock Update ---');

  // 4.1 Issue material within available stock (10 rolls from 100)
  const issueRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/materials/${createdMaterial.id}/issue`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': seCookie,
    },
  }, JSON.stringify({
    qty: 10,
    projectId: project.id,
    notes: 'Dispatched to pier staging area',
    type: 'ISSUE',
  }));
  const issueData = JSON.parse(issueRes.data);

  assert(
    issueRes.statusCode === 200 && issueData.availableQty === 90,
    'Site Engineer can dispatch stock to site; system automatically decrements availableQty (100 -> 90)',
    `Status: ${issueRes.statusCode}, Remaining Available: ${issueData.availableQty}`
  );

  // 4.2 Consume material against a specific task (15 rolls from 90)
  const consumeRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/materials/${createdMaterial.id}/issue`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': seCookie,
    },
  }, JSON.stringify({
    qty: 15,
    projectId: project.id,
    taskId: project.tasks[0]?.id || null,
    notes: 'Direct installation and anchoring on embankment sub-base',
    type: 'CONSUME',
  }));
  const consumeData = JSON.parse(consumeRes.data);

  assert(
    consumeRes.statusCode === 200 && consumeData.availableQty === 75,
    'Material consumption against specific task automatically decrements available stock (90 -> 75)',
    `Status: ${consumeRes.statusCode}, Balance: ${consumeData.availableQty}`
  );

  // 4.3 Rule 7: Material usage must not exceed available stock (try 500 rolls when only 75 available)
  const excessiveRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/materials/${createdMaterial.id}/issue`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': seCookie,
    },
  }, JSON.stringify({
    qty: 500,
    projectId: project.id,
    notes: 'Unauthorized excessive usage attempt',
  }));

  assert(
    excessiveRes.statusCode === 409,
    'Rule 7: Material usage cannot exceed available stock (HTTP 409 Conflict)',
    `Status: ${excessiveRes.statusCode}`
  );

  // ---------------------------------------------------------
  // 5. Material Requests & Requisition Fulfillment
  // ---------------------------------------------------------
  console.log('\n--- Sub-Module 5: Material Indent Requests & Fulfillment ---');

  // 5.1 Contractor / Site Engineer submits request for 20 rolls
  const indentRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/material-requests',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': contractorCookie,
    },
  }, JSON.stringify({
    materialId: createdMaterial.id,
    projectId: project.id,
    qty: 20,
    reason: 'Required for scheduled retaining wall geotextile wrapping',
  }));
  const indentData = JSON.parse(indentRes.data);
  const createdIndent = indentData.request;

  assert(
    indentRes.statusCode === 201 && createdIndent?.status === 'PENDING' && createdIndent?.qty === 20,
    'Contractor can submit Material Indent Request in PENDING state (HTTP 201)',
    `Status: ${indentRes.statusCode}, Indent ID: ${createdIndent?.id}`
  );

  // 5.2 Project Manager approves request
  const approveRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/material-requests/${createdIndent.id}/approve`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': pmCookie,
    },
  }, JSON.stringify({
    status: 'APPROVED',
    reason: 'Verified against engineering structural schedule',
  }));
  const approveData = JSON.parse(approveRes.data);

  assert(
    approveRes.statusCode === 200 && approveData.request?.status === 'APPROVED',
    'Project Manager can approve material request (HTTP 200)',
    `Status: ${approveRes.statusCode}`
  );

  // 5.3 Fulfill request (dispatches 20 units and decrements stock from 75 to 55)
  const fulfillRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/material-requests/${createdIndent.id}/approve`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': pmCookie,
    },
  }, JSON.stringify({
    status: 'FULFILLED',
  }));
  const fulfillData = JSON.parse(fulfillRes.data);

  // Check new balance in DB
  const postFulfillMat = await prisma.material.findUnique({
    where: { id: createdMaterial.id },
  });

  assert(
    fulfillRes.statusCode === 200 && fulfillData.request?.status === 'FULFILLED' && postFulfillMat.availableQty === 55,
    'Fulfilling indent request automatically issues stock and updates availableQty (75 -> 55)',
    `Status: ${fulfillRes.statusCode}, New Available Qty: ${postFulfillMat.availableQty}`
  );

  // ---------------------------------------------------------
  // 6. Low Stock Alerts
  // ---------------------------------------------------------
  console.log('\n--- Sub-Module 6: Low Stock Alerts ---');

  // Issue 35 units to push stock from 55 to 20 (below reorderLevel = 25)
  const drainRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/materials/${createdMaterial.id}/issue`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': seCookie,
    },
  }, JSON.stringify({
    qty: 35,
    projectId: project.id,
    notes: 'Large trench drain installation batch',
  }));
  const drainData = JSON.parse(drainRes.data);

  assert(
    drainRes.statusCode === 200 && drainData.availableQty === 20,
    'Stock successfully issued down to 20 rolls (below reorderLevel 25)',
    `Current Qty: ${drainData.availableQty}`
  );

  // Verify low stock flag in GET /api/v1/materials?lowStock=true
  const lowStockRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/materials?lowStock=true&q=${newSku}`,
    method: 'GET',
    headers: { 'Cookie': seCookie },
  });
  const lowStockData = JSON.parse(lowStockRes.data);
  const foundDeficit = lowStockData.materials?.find(m => m.id === createdMaterial.id);

  assert(
    foundDeficit && foundDeficit.isLowStock === true && foundDeficit.availableQty <= foundDeficit.reorderLevel,
    'System identifies low stock (isLowStock: true) when availableQty <= reorderLevel',
    `Available: ${foundDeficit?.availableQty}, ReorderLevel: ${foundDeficit?.reorderLevel}`
  );

  // Verify LOW_STOCK notification was created
  const lowStockNotif = await prisma.notification.findFirst({
    where: {
      type: 'LOW_STOCK',
      title: { contains: createdMaterial.name },
    },
  });
  assert(
    !!lowStockNotif,
    'Automatic LOW_STOCK alert notification generated for storekeepers and engineers',
    `Notification: ${lowStockNotif?.title} -> ${lowStockNotif?.message}`
  );

  // ---------------------------------------------------------
  // 7. Stock History & Inbound Receipt Replenishment
  // ---------------------------------------------------------
  console.log('\n--- Sub-Module 7: Stock History & Inbound Receipt ---');

  // 7.1 Replenish stock via POST /api/v1/materials/transactions (Receive 80 rolls)
  const replenishRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/materials/transactions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': seCookie,
    },
  }, JSON.stringify({
    materialId: createdMaterial.id,
    type: 'RECEIVE',
    qty: 80,
    notes: 'Mill resupply delivery #BOL-8902 verified with physical warehouse count',
  }));
  const replenishData = JSON.parse(replenishRes.data);

  assert(
    replenishRes.statusCode === 201 && replenishData.availableQty === 100,
    'Site Engineer records incoming shipment (RECEIVE); availableQty automatically incremented (20 -> 100)',
    `Status: ${replenishRes.statusCode}, New Balance: ${replenishData.availableQty}`
  );

  // 7.2 Query full stock history ledger for the material
  const historyRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/materials/transactions?materialId=${createdMaterial.id}`,
    method: 'GET',
    headers: { 'Cookie': seCookie },
  });
  const historyData = JSON.parse(historyRes.data);

  assert(
    historyRes.statusCode === 200 && Array.isArray(historyData.transactions) && historyData.transactions.length >= 4,
    'GET /api/v1/materials/transactions returns immutable chronological stock history ledger',
    `Total Transactions Logged: ${historyData.transactions?.length}`
  );

  const hasReceive = historyData.transactions.some(t => t.type === 'RECEIVE');
  const hasIssue = historyData.transactions.some(t => t.type === 'ISSUE');
  const hasConsume = historyData.transactions.some(t => t.type === 'CONSUME');

  assert(
    hasReceive && hasIssue && hasConsume,
    'Stock History ledger contains all core transaction types (RECEIVE, ISSUE, CONSUME) with balance snapshots',
    `RECEIVE: ${hasReceive}, ISSUE: ${hasIssue}, CONSUME: ${hasConsume}`
  );

  // ---------------------------------------------------------
  // 8. Security & Role Constraints
  // ---------------------------------------------------------
  console.log('\n--- Sub-Module 8: Security & Role Separation ---');

  // Contractor cannot directly dispatch/issue materials
  const contractorIssueRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/materials/${createdMaterial.id}/issue`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': contractorCookie,
    },
  }, JSON.stringify({
    qty: 5,
    projectId: project.id,
  }));
  assert(
    contractorIssueRes.statusCode === 403,
    'Contractor is forbidden from issuing warehouse inventory directly (HTTP 403)',
    `Status: ${contractorIssueRes.statusCode}`
  );

  // Contractor cannot decommission material SKU
  const contractorDeleteRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/materials/${createdMaterial.id}`,
    method: 'DELETE',
    headers: {
      'Cookie': contractorCookie,
    },
  });
  assert(
    contractorDeleteRes.statusCode === 403,
    'Contractor is forbidden from decommissioning material SKUs (HTTP 403)',
    `Status: ${contractorDeleteRes.statusCode}`
  );

  // Clean up test material
  await prisma.materialTransaction.deleteMany({ where: { materialId: createdMaterial.id } });
  await prisma.materialRequest.deleteMany({ where: { materialId: createdMaterial.id } });
  await prisma.material.delete({ where: { id: createdMaterial.id } });
  await prisma.materialCategory.delete({ where: { id: testCategoryId } }).catch(() => {});
  console.log('\nCleaned up audit test material artifacts from database.');

  // ---------------------------------------------------------
  // FINAL REPORT
  // ---------------------------------------------------------
  console.log('\n========================================================================');
  console.log(`MATERIAL MANAGEMENT AUDIT COMPLETE: ${passed}/${total} TESTS PASSED`);
  console.log('========================================================================');

  if (passed === total) {
    console.log('STATUS: 100% PASS - D. MATERIAL MANAGEMENT SYSTEM COMPLIANT WITH ALL REQUIREMENTS');
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

