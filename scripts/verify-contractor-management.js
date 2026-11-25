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
  const sessionCookieHeader = sessionCookies.map(c => c.split(';')[0]).join('; ');
  return sessionCookieHeader;
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
  console.log('--- START CONTRACTOR MANAGEMENT (PART E) VERIFICATION ---');

  // Authenticate roles
  console.log('Authenticating roles...');
  const pmCookie = await loginAs('pm@buildtrack.com');
  const adminCookie = await loginAs('admin@buildtrack.com');
  const contractorUserCookie = await loginAs('contractor@buildtrack.com');
  const engineerCookie = await loginAs('engineer@buildtrack.com');

  assert(pmCookie.length > 0, 'PM authenticated successfully');
  assert(adminCookie.length > 0, 'Admin authenticated successfully');
  assert(contractorUserCookie.length > 0, 'Contractor user authenticated successfully');
  assert(engineerCookie.length > 0, 'Site Engineer authenticated successfully');

  // 1. RBAC: Unauthorized roles cannot create contractors
  console.log('\n--- Test 1: RBAC Creation Restrictions ---');
  const contractorCreateData = JSON.stringify({
    name: 'Tariq Al-Sabah',
    company: 'Sabah Geotechnical Foundations Ltd',
    contact: 'Tariq Al-Sabah, Chief Eng',
    email: `sabah.geo.${Date.now()}@buildtrack.com`,
    phone: '+880-1711-998877',
    specialty: 'Geotechnical Piling & Deep Foundations',
    status: 'ACTIVE',
    rating: 5.0
  });

  const engineerCreateRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/contractors',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(contractorCreateData),
      'Cookie': engineerCookie
    }
  }, contractorCreateData);
  assert(engineerCreateRes.statusCode === 403, 'Site Engineer is forbidden from creating contractors (HTTP 403)');

  const contractorSelfCreateRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/contractors',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(contractorCreateData),
      'Cookie': contractorUserCookie
    }
  }, contractorCreateData);
  assert(contractorSelfCreateRes.statusCode === 403, 'Contractor is forbidden from creating contractors (HTTP 403)');

  // 2. Admin & PM can create contractor
  console.log('\n--- Test 2: PM & Admin Can Register Contractors ---');
  const pmCreateRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/contractors',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(contractorCreateData),
      'Cookie': pmCookie
    }
  }, contractorCreateData);
  assert(pmCreateRes.statusCode === 201, 'PM successfully created new contractor firm (HTTP 201)');
  const createdContractor = JSON.parse(pmCreateRes.data).contractor;
  assert(createdContractor && createdContractor.id, `Created contractor assigned ID: ${createdContractor?.id}`);
  assert(createdContractor?.status === 'ACTIVE', 'Initial contractor status is ACTIVE');

  const contractorId = createdContractor.id;

  // 3. Contractor Profiles (Feature 1) & Company/Contact Information (Features 2 & 3)
  console.log('\n--- Test 3: Contractor Profile, Contact & Company Information ---');
  const profileRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/contractors/${contractorId}`,
    method: 'GET',
    headers: { 'Cookie': pmCookie }
  });
  assert(profileRes.statusCode === 200, 'PM retrieved full Contractor Profile (HTTP 200)');
  const profile = JSON.parse(profileRes.data).contractor;

  assert(profile.company === 'Sabah Geotechnical Foundations Ltd', 'Company Information present: company name matches');
  assert(profile.specialty === 'Geotechnical Piling & Deep Foundations', 'Company Information present: specialty matches');
  assert(profile.name === 'Tariq Al-Sabah', 'Contact Information present: authorized signatory matches');
  assert(profile.contact === 'Tariq Al-Sabah, Chief Eng', 'Contact Information present: contact reference matches');
  assert(profile.phone === '+880-1711-998877', 'Contact Information present: phone number matches');
  assert(profile.email.includes('sabah.geo'), 'Contact Information present: email matches');
  assert(profile.status === 'ACTIVE', 'Contractor Status present: ACTIVE');
  assert(typeof profile.reliabilityScore === 'number', 'Reliability score calculated');

  // 4. Update Profile, Contact, Company and Status (Feature 8)
  console.log('\n--- Test 4: Update Profile, Company, Contact and Status (PATCH) ---');
  const updatePayload = JSON.stringify({
    company: 'Sabah Geotechnical & Heavy Marine Foundations Ltd',
    phone: '+880-1711-000111',
    status: 'SUSPENDED'
  });

  // Contractor cannot update profile
  const unauthorizedPatch = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/contractors/${contractorId}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(updatePayload),
      'Cookie': contractorUserCookie
    }
  }, updatePayload);
  assert(unauthorizedPatch.statusCode === 403, 'Contractor is forbidden from updating contractor profile/status (HTTP 403)');

  // PM updates profile & status
  const pmPatchRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/contractors/${contractorId}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(updatePayload),
      'Cookie': pmCookie
    }
  }, updatePayload);
  assert(pmPatchRes.statusCode === 200, 'PM successfully updated contractor profile and status to SUSPENDED (HTTP 200)');
  const updatedContractor = JSON.parse(pmPatchRes.data).contractor;
  assert(updatedContractor.company === 'Sabah Geotechnical & Heavy Marine Foundations Ltd', 'Company name updated');
  assert(updatedContractor.phone === '+880-1711-000111', 'Contact phone updated');
  assert(updatedContractor.status === 'SUSPENDED', 'Contractor status changed to SUSPENDED');

  // Filter contractors by status
  const filterSuspendedRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/contractors?status=SUSPENDED',
    method: 'GET',
    headers: { 'Cookie': pmCookie }
  });
  const suspendedList = JSON.parse(filterSuspendedRes.data).contractors;
  assert(suspendedList.some(c => c.id === contractorId), 'Status filtering: suspended contractor found in SUSPENDED query');

  // Reactivate contractor status
  const reactivatePayload = JSON.stringify({ status: 'ACTIVE' });
  await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/contractors/${contractorId}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(reactivatePayload),
      'Cookie': pmCookie
    }
  }, reactivatePayload);

  // 5. Assigned Projects (Feature 4)
  console.log('\n--- Test 5: Project Allocation & Assigned Projects ---');
  const project = await prisma.project.findFirst({ where: { status: 'IN_PROGRESS' } });
  assert(project !== null, `Found active project: ${project?.name} (${project?.id})`);

  const assignPayload = JSON.stringify({
    projectId: project.id,
    role: 'Primary Deep Piling Contractor',
    action: 'ASSIGN'
  });

  // Contractor cannot assign themselves
  const unauthorizedAssign = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/contractors/${contractorId}/assign`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(assignPayload),
      'Cookie': contractorUserCookie
    }
  }, assignPayload);
  assert(unauthorizedAssign.statusCode === 403, 'Contractor is forbidden from modifying project assignments (HTTP 403)');

  // PM assigns project
  const pmAssignRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/contractors/${contractorId}/assign`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(assignPayload),
      'Cookie': pmCookie
    }
  }, assignPayload);
  assert(pmAssignRes.statusCode === 200, 'PM assigned contractor to project (HTTP 200)');

  // Verify in profile
  const profileAfterAssign = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/contractors/${contractorId}`,
    method: 'GET',
    headers: { 'Cookie': pmCookie }
  });
  const profDataAfterAssign = JSON.parse(profileAfterAssign.data).contractor;
  assert(
    profDataAfterAssign.projectAssignments.some(pa => pa.project.id === project.id),
    'Assigned Projects: project found in contractor projectAssignments'
  );

  // 6. Assigned Tasks & Work History (Features 5 & 6)
  console.log('\n--- Test 6: Assigned Tasks & Work History Metrics ---');
  // Create a contractor user associated with this contractor
  const contractorUser = await prisma.user.create({
    data: {
      name: 'Site Lead Tariq',
      email: `tariq.lead.${Date.now()}@buildtrack.com`,
      passwordHash: 'dummy',
      role: 'CONTRACTOR',
      contractorId: contractorId,
    }
  });

  // Create a task assigned to this contractor user
  const task = await prisma.task.create({
    data: {
      title: 'Geotechnical Borehole Soil Core Extraction Pier 14',
      description: 'Perform standard penetration tests and extract core samples',
      projectId: project.id,
      assigneeId: contractorUser.id,
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      progress: 60,
      deadline: new Date(Date.now() + 86400000 * 7)
    }
  });

  const profileAfterTask = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/contractors/${contractorId}`,
    method: 'GET',
    headers: { 'Cookie': pmCookie }
  });
  const profDataAfterTask = JSON.parse(profileAfterTask.data).contractor;
  assert(
    profDataAfterTask.assignedTasks.some(t => t.id === task.id),
    'Assigned Tasks: newly created site task appears in contractor assignedTasks'
  );
  assert(profDataAfterTask.workHistory.totalProjectsAssigned >= 1, 'Work History: totalProjectsAssigned >= 1');
  assert(profDataAfterTask.workHistory.totalTasksAssigned >= 1, 'Work History: totalTasksAssigned >= 1');

  // 7. Performance Tracking (Feature 7)
  console.log('\n--- Test 7: Performance Tracking & SLA Evaluation Auditing ---');
  const evalPayload = JSON.stringify({
    projectId: project.id,
    onTimeRate: 98,
    qualityScore: 4.9,
    delayIncidents: 0,
    notes: 'Exemplary borehole core recovery. Zero non-conformance reports.'
  });

  // Contractor cannot log evaluations
  const unauthorizedEval = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/contractors/${contractorId}/performance`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(evalPayload),
      'Cookie': contractorUserCookie
    }
  }, evalPayload);
  assert(unauthorizedEval.statusCode === 403, 'Contractor is forbidden from logging performance evaluations (HTTP 403)');

  // PM logs evaluation
  const pmEvalRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/contractors/${contractorId}/performance`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(evalPayload),
      'Cookie': pmCookie
    }
  }, evalPayload);
  assert(pmEvalRes.statusCode === 201, 'PM successfully recorded SLA performance evaluation (HTTP 201)');
  const evalData = JSON.parse(pmEvalRes.data);
  assert(evalData.performance && evalData.performance.qualityScore === 4.9, 'Evaluation records quality score 4.9');
  assert(evalData.rating === 4.9, 'Contractor aggregate rating updated');

  // Verify performance history in profile
  const profileAfterEval = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/contractors/${contractorId}`,
    method: 'GET',
    headers: { 'Cookie': pmCookie }
  });
  const profDataAfterEval = JSON.parse(profileAfterEval.data).contractor;
  assert(profDataAfterEval.performances.length >= 1, 'Performance Tracking: SLA audit in history');
  assert(profDataAfterEval.workHistory.evaluationsCount >= 1, 'Work History: evaluationsCount reflects logged review');

  // 8. Rule 1: Contractor can only access their assigned entity
  console.log('\n--- Test 8: Security Rule 1 (Contractor Isolation) ---');
  // Attempt to view a DIFFERENT contractor firm using the contractorUser's cookie
  // First, authenticate as contractorUser
  const customContractorCookie = await loginAs(contractorUser.email, 'password123').catch(() => null);
  // Or check against existing contractor user
  const otherContractor = await prisma.contractor.findFirst({
    where: { id: { not: contractorId } }
  });

  if (otherContractor) {
    const contractorIsolationRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/v1/contractors/${otherContractor.id}`,
      method: 'GET',
      headers: { 'Cookie': contractorUserCookie }
    });
    assert(
      contractorIsolationRes.statusCode === 403,
      'Rule 1 Enforced: Contractor user cannot access another contractor firm profile (HTTP 403 Forbidden)'
    );
  }

  // 9. Decommissioning & Cleanup
  console.log('\n--- Test 9: Decommission Contractor (DELETE) ---');
  // Contractor cannot delete
  const unauthorizedDelete = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/contractors/${contractorId}`,
    method: 'DELETE',
    headers: { 'Cookie': contractorUserCookie }
  });
  assert(unauthorizedDelete.statusCode === 403, 'Contractor is forbidden from deleting contractor firms (HTTP 403)');

  // Cleanup test user and task first to allow deletion
  await prisma.task.delete({ where: { id: task.id } });
  await prisma.user.delete({ where: { id: contractorUser.id } });

  // Admin deletes contractor
  const adminDeleteRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/contractors/${contractorId}`,
    method: 'DELETE',
    headers: { 'Cookie': adminCookie }
  });
  assert(adminDeleteRes.statusCode === 200, 'Admin successfully decommissioned contractor firm (HTTP 200)');

  // Verify not found
  const verifyDeleteRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/contractors/${contractorId}`,
    method: 'GET',
    headers: { 'Cookie': pmCookie }
  });
  assert(verifyDeleteRes.statusCode === 404, 'Decommissioned contractor firm returns HTTP 404 Not Found');

  console.log('\n========================================');
  console.log(`CONTRACTOR MANAGEMENT VERIFICATION: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('========================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});

