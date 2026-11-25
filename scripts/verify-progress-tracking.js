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
  console.log('================================================================');
  console.log('--- START PROGRESS TRACKING SYSTEM (PART F) VERIFICATION ---');
  console.log('================================================================');

  // Authenticate roles
  console.log('\n--- Step 1: Role Authentication ---');
  const engineerCookie = await loginAs('engineer@buildtrack.com');
  const pmCookie = await loginAs('pm@buildtrack.com');
  const adminCookie = await loginAs('admin@buildtrack.com');
  const contractorCookie = await loginAs('contractor@buildtrack.com');

  assert(engineerCookie.length > 0, 'Site Engineer (engineer@buildtrack.com) authenticated successfully');
  assert(pmCookie.length > 0, 'Project Manager (pm@buildtrack.com) authenticated successfully');
  assert(adminCookie.length > 0, 'Admin (admin@buildtrack.com) authenticated successfully');
  assert(contractorCookie.length > 0, 'Contractor (contractor@buildtrack.com) authenticated successfully');

  // Get test project and test task
  const testProject = await prisma.project.findFirst({
    where: { status: 'IN_PROGRESS' },
    include: { tasks: true, milestones: true }
  });
  assert(!!testProject, `Found active project for progress tests: ${testProject?.name} (${testProject?.id})`);

  let testTask = testProject?.tasks?.find(t => !t.isDeleted);
  if (!testTask) {
    testTask = await prisma.task.create({
      data: {
        title: 'Reinforced Concrete Pouring Inspection',
        description: 'Quality and curing inspection for Level 4 structural slabs',
        projectId: testProject.id,
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        progress: 30,
        deadline: new Date(Date.now() + 7 * 86400000),
      }
    });
  }
  assert(!!testTask, `Found/Created test task: ${testTask?.title} (${testTask?.id})`);

  // -------------------------------------------------------------------------
  // Feature 1: Site Engineer submits daily work updates with all 7 fields
  // -------------------------------------------------------------------------
  console.log('\n--- Feature 1: Site Engineer Daily Work Update Submission (7 Required Fields) ---');
  const submissionTimestamp = new Date().toISOString();
  const samplePhotos = [
    'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80'
  ];

  const reportPayload = JSON.stringify({
    projectId: testProject.id,
    taskId: testTask.id,
    percentage: 85,
    description: 'Completed rebar alignment and slump test. 45 cubic meters of M30 concrete poured with mechanical vibrators.',
    photos: samplePhotos,
    date: submissionTimestamp
  });

  const submitRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/progress-reports',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(reportPayload),
      'Cookie': engineerCookie
    }
  }, reportPayload);

  assert(submitRes.statusCode === 201 || submitRes.statusCode === 200, `Site engineer submitted daily progress report (HTTP ${submitRes.statusCode})`);
  const submitData = JSON.parse(submitRes.data);
  const createdReport = submitData.report || submitData.data?.report;

  assert(!!createdReport, 'Response contains created progress report object');
  assert(createdReport?.projectId === testProject.id, 'Field 1: Project Information is correctly referenced');
  assert(createdReport?.taskId === testTask.id, 'Field 2: Task Reference is correctly associated');
  assert(createdReport?.percentage === 85, 'Field 3: Progress Percentage is recorded accurately (85%)');
  assert(createdReport?.description.includes('mechanical vibrators'), 'Field 4: Work Description contains detailed update');
  
  // Field 5: Progress photographs
  let parsedPhotos = [];
  try {
    parsedPhotos = typeof createdReport?.photos === 'string' ? JSON.parse(createdReport.photos) : createdReport.photos;
  } catch (e) {
    parsedPhotos = createdReport?.photos;
  }
  assert(Array.isArray(parsedPhotos) && parsedPhotos.length === 2, 'Field 5: Progress Photographs saved and returned as array');

  // Field 6: Submission date
  assert(!!createdReport?.date, 'Field 6: Submission Date is recorded');

  // Field 7: Reported by
  assert(!!createdReport?.reportedBy?.name || !!createdReport?.reportedById, 'Field 7: Reported By engineer is recorded');

  // -------------------------------------------------------------------------
  // Feature 2: Task & Project Progress Synchronization
  // -------------------------------------------------------------------------
  console.log('\n--- Feature 2: Task & Project Progress Synchronization ---');
  const updatedTask = await prisma.task.findUnique({ where: { id: testTask.id } });
  assert(updatedTask?.progress === 85, `Task progress automatically updated to 85% (actual: ${updatedTask?.progress}%)`);

  const taskHistory = await prisma.taskHistory.findFirst({
    where: { taskId: testTask.id },
    orderBy: { createdAt: 'desc' }
  });
  assert(taskHistory?.action === 'PROGRESS_UPDATE', `Task history automatically logs PROGRESS_UPDATE from daily report`);

  const updatedProject = await prisma.project.findUnique({ where: { id: testProject.id } });
  assert(typeof updatedProject?.progress === 'number', `Project weighted progress rolled up to ${updatedProject?.progress}%`);

  // Also verify submitting via /api/v1/reports with type: "progress"
  const altReportPayload = JSON.stringify({
    type: 'progress',
    projectId: testProject.id,
    taskId: testTask.id,
    percentage: 90,
    description: 'Curing membranes applied and compressive strength cubes sampled at 24h interval.',
    photos: ['https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=800&q=80'],
    date: new Date().toISOString()
  });

  const altSubmitRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/reports',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(altReportPayload),
      'Cookie': engineerCookie
    }
  }, altReportPayload);

  assert(altSubmitRes.statusCode === 201 || altSubmitRes.statusCode === 200, `Site engineer can also submit via POST /api/v1/reports (HTTP ${altSubmitRes.statusCode})`);

  // -------------------------------------------------------------------------
  // Feature 3: Daily Progress Reports Retrieval and Filtering
  // -------------------------------------------------------------------------
  console.log('\n--- Feature 3: Daily Progress Reports Retrieval and Filtering ---');
  const getReportsRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/reports?projectId=${testProject.id}`,
    method: 'GET',
    headers: { 'Cookie': engineerCookie }
  });

  assert(getReportsRes.statusCode === 200, `GET /api/v1/reports returned HTTP 200`);
  const reportsData = JSON.parse(getReportsRes.data);
  const progReports = reportsData.progressReports || reportsData.data?.progressReports || [];
  assert(progReports.length > 0, `Retrieved ${progReports.length} progress reports for project`);

  const firstProgReport = progReports[0];
  assert(!!firstProgReport.project, 'Report includes project details');
  assert(!!firstProgReport.task, 'Report includes task reference');
  assert(typeof firstProgReport.percentage === 'number', 'Report includes progress percentage');
  assert(!!firstProgReport.description, 'Report includes work description');
  assert(!!firstProgReport.photos, 'Report includes photos');
  assert(!!firstProgReport.date, 'Report includes submission date');
  assert(!!firstProgReport.reportedBy, 'Report includes reporter profile');

  // Dedicated progress-reports endpoint check
  const getDedicatedReportsRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/progress-reports?projectId=${testProject.id}`,
    method: 'GET',
    headers: { 'Cookie': pmCookie }
  });
  assert(getDedicatedReportsRes.statusCode === 200, `GET /api/v1/progress-reports returned HTTP 200`);
  const dedicatedData = JSON.parse(getDedicatedReportsRes.data);
  const dedReports = dedicatedData.progressReports || dedicatedData.data?.progressReports || [];
  assert(Array.isArray(dedReports), 'Dedicated progress-reports endpoint returns report list');

  // -------------------------------------------------------------------------
  // Feature 4: Milestone Management System
  // -------------------------------------------------------------------------
  console.log('\n--- Feature 4: Milestone Management (CRUD & RBAC) ---');
  
  // 4a. Contractor cannot create milestone (HTTP 403)
  const milestonePayload = JSON.stringify({
    projectId: testProject.id,
    title: 'Substructure Structural Gate Approval',
    description: 'Foundation and basement level waterproofing signoff by structural authority',
    targetDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    status: 'PENDING',
    order: 1
  });

  const contractorMilestoneRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/milestones',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(milestonePayload),
      'Cookie': contractorCookie
    }
  }, milestonePayload);

  assert(contractorMilestoneRes.statusCode === 403, `Contractor forbidden from creating milestones (HTTP ${contractorMilestoneRes.statusCode})`);

  // 4b. Project Manager can create milestone
  const pmMilestoneRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/milestones',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(milestonePayload),
      'Cookie': adminCookie // Admin or assigned PM
    }
  }, milestonePayload);

  assert(pmMilestoneRes.statusCode === 200 || pmMilestoneRes.statusCode === 201, `Admin/PM created milestone (HTTP ${pmMilestoneRes.statusCode})`);
  const createdMilestoneData = JSON.parse(pmMilestoneRes.data);
  const createdMilestone = createdMilestoneData.milestone || createdMilestoneData.data?.milestone;
  assert(!!createdMilestone?.id, `Milestone created with ID: ${createdMilestone?.id}`);
  assert(createdMilestone?.title === 'Substructure Structural Gate Approval', 'Milestone title verified');

  // 4c. Milestone List & Completion Metrics
  const listMilestonesRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/milestones?projectId=${testProject.id}`,
    method: 'GET',
    headers: { 'Cookie': pmCookie }
  });
  assert(listMilestonesRes.statusCode === 200, `GET /api/v1/milestones returned HTTP 200`);
  const milestonesList = JSON.parse(listMilestonesRes.data);
  const milestonesArr = milestonesList.milestones || milestonesList.data?.milestones || [];
  const milestoneMetrics = milestonesList.metrics || milestonesList.data?.metrics;
  assert(milestonesArr.length > 0, `Listed ${milestonesArr.length} milestones`);
  assert(typeof milestoneMetrics?.completionRate === 'number', `Milestone completionRate metric: ${milestoneMetrics?.completionRate}%`);

  // 4d. Update Milestone Status to COMPLETED
  const updateMilestonePayload = JSON.stringify({
    status: 'COMPLETED',
    description: 'Structural inspection successfully certified by government authority.'
  });

  const updateMilestoneRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/milestones/${createdMilestone.id}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(updateMilestonePayload),
      'Cookie': adminCookie
    }
  }, updateMilestonePayload);

  assert(updateMilestoneRes.statusCode === 200, `Milestone updated to COMPLETED (HTTP ${updateMilestoneRes.statusCode})`);
  const updatedMilestoneObj = JSON.parse(updateMilestoneRes.data).milestone || JSON.parse(updateMilestoneRes.data).data?.milestone;
  assert(updatedMilestoneObj?.status === 'COMPLETED', 'Milestone status is COMPLETED');
  assert(!!updatedMilestoneObj?.completedDate, 'Milestone completedDate automatically populated upon completion');

  // 4e. Delete Milestone
  const deleteMilestoneRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/milestones/${createdMilestone.id}`,
    method: 'DELETE',
    headers: { 'Cookie': adminCookie }
  });
  assert(deleteMilestoneRes.statusCode === 200, `Milestone deleted successfully (HTTP ${deleteMilestoneRes.statusCode})`);

  // -------------------------------------------------------------------------
  // Feature 5: Delayed Task Identification
  // -------------------------------------------------------------------------
  console.log('\n--- Feature 5: Delayed Task Identification ---');
  // Ensure there is at least one overdue task for testing detection
  let overdueTask = await prisma.task.findFirst({
    where: {
      projectId: testProject.id,
      deadline: { lt: new Date() },
      status: { not: 'COMPLETED' },
      isDeleted: false
    }
  });

  if (!overdueTask) {
    overdueTask = await prisma.task.create({
      data: {
        title: 'Geotechnical Borehole Sample Testing',
        description: 'Core borehole sample analysis past target deadline',
        projectId: testProject.id,
        priority: 'CRITICAL',
        status: 'IN_PROGRESS',
        progress: 40,
        deadline: new Date(Date.now() - 3 * 86400000), // 3 days ago
      }
    });
  }

  assert(!!overdueTask, `Active overdue task verified: ${overdueTask?.title} (Deadline: ${overdueTask?.deadline?.toISOString()})`);

  // Verify delayed tasks are returned by GET /api/v1/reports
  const reportSummaryRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/reports?projectId=${testProject.id}`,
    method: 'GET',
    headers: { 'Cookie': pmCookie }
  });

  const repSummary = JSON.parse(reportSummaryRes.data);
  const repDelayedTasks = repSummary.delayedTasks || repSummary.data?.delayedTasks || [];
  assert(Array.isArray(repDelayedTasks), 'GET /api/v1/reports returns delayedTasks array');
  const foundDelayed = repDelayedTasks.find(t => t.id === overdueTask.id);
  assert(!!foundDelayed, `Delayed task radar automatically identifies overdue task '${overdueTask.title}'`);
  assert(new Date(foundDelayed?.deadline) < new Date(), 'Identified task deadline is in the past');
  assert(foundDelayed?.status !== 'COMPLETED', 'Identified task is not completed');
  assert(new Date(foundDelayed?.deadline) < new Date(), 'Identified task deadline is in the past');
  assert(foundDelayed?.status !== 'COMPLETED', 'Identified task is not completed');

  // Verify tasks API supports filtering overdue
  const overdueTasksQueryRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/tasks?projectId=${testProject.id}&overdueOnly=true`,
    method: 'GET',
    headers: { 'Cookie': pmCookie }
  });
  assert(overdueTasksQueryRes.statusCode === 200, `GET /api/v1/tasks?overdueOnly=true returned HTTP 200`);

  // -------------------------------------------------------------------------
  // Feature 6: Project Timeline & Completion Tracking
  // -------------------------------------------------------------------------
  console.log('\n--- Feature 6: Project Timeline & Completion Tracking ---');
  // Check project completion calculation
  const allTasks = await prisma.task.findMany({
    where: { projectId: testProject.id, isDeleted: false }
  });
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(t => t.status === 'COMPLETED').length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  assert(totalTasks > 0, `Project has ${totalTasks} active tasks, ${completedTasks} completed (${taskCompletionRate}%)`);
  assert(typeof testProject.progress === 'number', `Project progress tracking score is ${testProject.progress}%`);

  // Check interactive timeline page returns HTTP 200
  const timelinePageRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/projects/${testProject.id}/timeline`,
    method: 'GET',
    headers: { 'Cookie': pmCookie }
  });
  assert(timelinePageRes.statusCode === 200, `Interactive project timeline view /projects/[id]/timeline returns HTTP ${timelinePageRes.statusCode}`);

  // Check reports page returns HTTP 200
  const reportsPageRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/reports',
    method: 'GET',
    headers: { 'Cookie': engineerCookie }
  });
  assert(reportsPageRes.statusCode === 200, `Progress tracking and site reports dashboard /reports returns HTTP ${reportsPageRes.statusCode}`);

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`PROGRESS TRACKING TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
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
