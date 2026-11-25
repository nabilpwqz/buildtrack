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

async function runProjectManagementAudit() {
  console.log('================================================================');
  console.log('BUILDTRACK ENTERPRISE: PROJECT MANAGEMENT SYSTEM AUDIT (PART A)');
  console.log('================================================================\n');

  console.log('Authenticating Admin and Project Manager sessions...');
  const adminCookie = await loginAs('admin@buildtrack.com');
  const pmCookie = await loginAs('pm@buildtrack.com');
  const pmUser = await prisma.user.findFirst({ where: { email: 'pm@buildtrack.com' } });
  const contractors = await prisma.contractor.findMany({ take: 3 });

  let passed = 0;
  let total = 0;

  function assert(name, condition, details = '') {
    total++;
    if (condition) {
      console.log(`[PASS] ${name}`);
      if (details) console.log(`       -> ${details}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      if (details) console.error(`       -> ${details}`);
    }
  }

  // --- 1. VIEW ALL PROJECTS ---
  const allProjectsRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/projects?pageSize=5',
    method: 'GET',
    headers: { 'Cookie': adminCookie }
  });
  assert(
    '1. Operation: View All Projects (GET /api/v1/projects)',
    allProjectsRes.statusCode === 200,
    `HTTP ${allProjectsRes.statusCode} returned projects portfolio`
  );

  const allProjectsData = JSON.parse(allProjectsRes.data);
  const sampleProject = allProjectsData.projects?.[0];

  assert(
    '2. Project contains all 10 required core fields',
    sampleProject &&
    sampleProject.name !== undefined &&
    sampleProject.description !== undefined &&
    sampleProject.location !== undefined &&
    sampleProject.startDate !== undefined &&
    sampleProject.expectedEndDate !== undefined &&
    sampleProject.totalBudget !== undefined &&
    sampleProject.manager !== undefined &&
    sampleProject.status !== undefined &&
    sampleProject.progress !== undefined &&
    sampleProject.contractors !== undefined,
    `Sample: ${sampleProject?.name} | Location: ${sampleProject?.location} | Status: ${sampleProject?.status} | Budget: $${sampleProject?.totalBudget?.toLocaleString()} | Contractors: ${sampleProject?.contractors?.length}`
  );

  // --- 3. CREATE A PROJECT (PM & ADMIN) ---
  const newProjectPayloadPM = {
    name: 'Teesta River Barrage Hydro & Irrigation Span',
    description: 'Geotechnical sub-grade stabilization and 24-gate automated hydraulic sluice barrage.',
    location: 'Rangpur Division Corridor',
    status: 'PLANNING',
    startDate: new Date().toISOString(),
    expectedEndDate: new Date(Date.now() + 180 * 86400000).toISOString(),
    totalBudget: 48000000,
    managerId: pmUser.id,
    contractorIds: contractors.slice(0, 2).map(c => c.id)
  };

  const createResPM = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/projects',
    method: 'POST',
    headers: { 'Cookie': pmCookie, 'Content-Type': 'application/json' }
  }, JSON.stringify(newProjectPayloadPM));

  const createDataPM = JSON.parse(createResPM.data);
  const createdProjectPM = createDataPM.project;

  assert(
    '3. Operation: Create a Project by Project Manager',
    createResPM.statusCode === 201 && createdProjectPM && createdProjectPM.id,
    `HTTP ${createResPM.statusCode} created project ID: ${createdProjectPM?.id}`
  );

  assert(
    '4. Created Project contains assigned contractors & manager',
    createdProjectPM &&
    createdProjectPM.managerId === pmUser.id &&
    createdProjectPM.contractors?.length === 2,
    `Manager: ${createdProjectPM?.manager?.name} | Assigned Contractors: ${createdProjectPM?.contractors?.length}`
  );

  // --- 4. VIEW PROJECT DETAILS ---
  const detailRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/projects/${createdProjectPM.id}`,
    method: 'GET',
    headers: { 'Cookie': pmCookie }
  });
  const detailData = JSON.parse(detailRes.data);

  assert(
    '5. Operation: View Project Details (GET /api/v1/projects/[id])',
    detailRes.statusCode === 200 && detailData.project && detailData.budgetSummary,
    `HTTP ${detailRes.statusCode} fetched full project entity with budget telemetry`
  );

  // --- 5. MONITOR PROJECT PROGRESS ---
  assert(
    '6. Operation: Monitor Project Progress & Rollup Telemetry',
    detailData.calculatedProgress !== undefined &&
    typeof detailData.calculatedProgress === 'number' &&
    detailData.project.status !== undefined,
    `Progress: ${detailData.calculatedProgress}% | Status: ${detailData.project.status}`
  );

  // --- 6. UPDATE PROJECT ---
  const updatePayload = {
    name: 'Teesta River Barrage Hydro & Irrigation Span (Accelerated)',
    location: 'Rangpur Division East Embankment',
    status: 'IN_PROGRESS',
    progress: 15,
    contractorIds: contractors.map(c => c.id) // update to 3 contractors
  };

  const updateRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/projects/${createdProjectPM.id}`,
    method: 'PATCH',
    headers: { 'Cookie': pmCookie, 'Content-Type': 'application/json' }
  }, JSON.stringify(updatePayload));

  const updateData = JSON.parse(updateRes.data);
  const updatedProject = updateData.project;

  assert(
    '7. Operation: Update Project (PATCH /api/v1/projects/[id])',
    updateRes.statusCode === 200 &&
    updatedProject.name === updatePayload.name &&
    updatedProject.status === 'IN_PROGRESS' &&
    updatedProject.progress === 15 &&
    updatedProject.contractors?.length === 3,
    `Updated status: ${updatedProject?.status} | Progress: ${updatedProject?.progress}% | Contractors: ${updatedProject?.contractors?.length}`
  );

  // --- 7. DELETE PROJECT ---
  const deleteRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/projects/${createdProjectPM.id}`,
    method: 'DELETE',
    headers: { 'Cookie': pmCookie }
  });

  const verifyDeleteRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/projects/${createdProjectPM.id}`,
    method: 'GET',
    headers: { 'Cookie': pmCookie }
  });

  assert(
    '8. Operation: Delete Project (DELETE /api/v1/projects/[id])',
    deleteRes.statusCode === 200 && verifyDeleteRes.statusCode === 404,
    `HTTP ${deleteRes.statusCode} deleted; subsequent GET returned HTTP ${verifyDeleteRes.statusCode} Not Found`
  );

  console.log('\n================================================================');
  console.log(`PROJECT MANAGEMENT SYSTEM AUDIT: ${passed}/${total} TESTS PASSED!`);
  console.log('================================================================');
}

runProjectManagementAudit()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

