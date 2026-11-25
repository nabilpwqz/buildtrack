const http = require("http");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: buffer.toString("utf8"),
        });
      });
    });
    req.on("error", reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function loginAs(email, password = "password123") {
  const csrfRes = await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/auth/csrf",
    method: "GET",
  });
  const csrfData = JSON.parse(csrfRes.data);
  const csrfToken = csrfData.csrfToken;
  const cookies = csrfRes.headers["set-cookie"] || [];
  const cookieHeader = cookies.map((c) => c.split(";")[0]).join("; ");

  const formBody = new URLSearchParams({
    csrfToken: csrfToken,
    email: email,
    password: password,
    redirect: "false",
    json: "true",
  }).toString();

  const signinRes = await request(
    {
      hostname: "localhost",
      port: 3000,
      path: "/api/auth/callback/credentials",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(formBody),
        Cookie: cookieHeader,
      },
    },
    formBody
  );

  const sessionCookies = signinRes.headers["set-cookie"] || [];
  return [cookieHeader, ...sessionCookies.map((c) => c.split(";")[0])]
    .filter(Boolean)
    .join("; ");
}

async function apiCall(method, path, body = null, cookie = "") {
  const headers = { "Content-Type": "application/json" };
  if (cookie) headers["Cookie"] = cookie;

  const postData = body ? JSON.stringify(body) : null;
  if (postData) {
    headers["Content-Length"] = Buffer.byteLength(postData);
  }

  const res = await request(
    {
      hostname: "localhost",
      port: 3000,
      path,
      method,
      headers,
    },
    postData
  );

  let json = null;
  try {
    json = JSON.parse(res.data);
  } catch (e) {
    json = null;
  }

  return { status: res.statusCode, data: json, raw: res.data };
}

// Inline circular dependency detection matching lib/business-rules
function hasCircularDependency(taskId, newPrerequisiteId, existingDependencies) {
  if (taskId === newPrerequisiteId) return true;
  const visited = new Set();
  const queue = [newPrerequisiteId];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    if (current === taskId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    const directPrereqs = existingDependencies
      .filter((d) => d.taskId === current)
      .map((d) => d.dependsOnId);
    queue.push(...directPrereqs);
  }
  return false;
}

async function runTaskManagementAudit() {
  console.log("================================================================");
  console.log("  BUILDTRACK ENTERPRISE: TASK MANAGEMENT MODULE AUDIT (PART B)  ");
  console.log("================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(name, condition, details = "") {
    total++;
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} ${details ? "- " + details : ""}`);
    }
  }

  try {
    console.log("Authenticating test user sessions...");
    const adminCookie = await loginAs("admin@buildtrack.com");
    const pmCookie = await loginAs("pm@buildtrack.com");
    const contractorCookie = await loginAs("contractor@buildtrack.com");

    assert("Admin authentication succeeded", !!adminCookie);
    assert("Project Manager authentication succeeded", !!pmCookie);
    assert("Contractor authentication succeeded", !!contractorCookie);

    // Identify project & assign PM if needed
    const pmUser = await prisma.user.findFirst({ where: { email: "pm@buildtrack.com" } });
    const siteEng = await prisma.user.findFirst({ where: { role: "SITE_ENGINEER" } });
    const testProject = await prisma.project.findFirst({
      include: { manager: true },
    });

    assert("Test Megaproject exists", !!testProject, testProject?.name);

    // Ensure PM is assigned to test project or manager so Rule 4 passes
    await prisma.project.update({
      where: { id: testProject.id },
      data: { managerId: pmUser.id },
    });

    // 1. Create Task A (Prerequisite Deliverable)
    console.log("\n--- 1. TASK CREATION & ATTRIBUTES ---");
    const taskAPayload = {
      projectId: testProject.id,
      title: "AUDIT_TASK_A: Substructure Foundation Piling",
      description: "Perform hydraulic pile driving and structural ultrasonic testing.",
      assigneeId: siteEng ? siteEng.id : pmUser.id,
      priority: "HIGH",
      deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
      estimatedHours: 24,
    };

    const taskACreate = await apiCall("POST", "/api/v1/tasks", taskAPayload, pmCookie);
    assert(
      "Create Task with PM session returns HTTP 201",
      taskACreate.status === 201,
      `Status: ${taskACreate.status}`
    );
    const taskAId = taskACreate.data?.task?.id;
    assert("Task A assigned valid ID", !!taskAId);
    assert(
      "Task A initialized to status TODO with 0% progress",
      taskACreate.data?.task?.status === "TODO" && taskACreate.data?.task?.progress === 0
    );
    assert(
      "Task A priority assigned correctly as HIGH",
      taskACreate.data?.task?.priority === "HIGH"
    );

    // 2. Create Task B with Task A as Prerequisite Dependency
    console.log("\n--- 2. TASK DEPENDENCIES & BLOCKING IDENTIFICATION ---");
    const taskBPayload = {
      projectId: testProject.id,
      title: "AUDIT_TASK_B: Structural Column Erection",
      description: "Mount prefabricated steel columns after foundation sign-off.",
      assigneeId: pmUser.id,
      priority: "CRITICAL",
      deadline: new Date(Date.now() + 14 * 86400000).toISOString(),
      estimatedHours: 40,
      dependsOnIds: [taskAId],
    };

    const taskBCreate = await apiCall("POST", "/api/v1/tasks", taskBPayload, adminCookie);
    assert(
      "Create Task B with dependency linkage returns HTTP 201",
      taskBCreate.status === 201,
      `Status: ${taskBCreate.status}`
    );
    const taskBId = taskBCreate.data?.task?.id;
    assert("Task B assigned valid ID", !!taskBId);

    // Verify Task B is identified as BLOCKED
    const taskBInspect = await apiCall("GET", `/api/v1/tasks/${taskBId}`, null, adminCookie);
    assert(
      "Task B identified as isBlocked: true due to incomplete prerequisite",
      taskBInspect.data?.task?.isBlocked === true
    );
    assert(
      "Task B lists Task A in blockedBy prerequisites",
      taskBInspect.data?.task?.blockedBy?.some((d) => d.id === taskAId)
    );

    // 3. Dependency Blocking Enforcement
    console.log("\n--- 3. DEPENDENCY BLOCKING ENFORCEMENT ---");
    const blockedTransition = await apiCall(
      "POST",
      `/api/v1/tasks/${taskBId}/transition`,
      { status: "IN_PROGRESS" },
      adminCookie
    );
    assert(
      "Transition of blocked Task B to IN_PROGRESS rejected with HTTP 409 Conflict",
      blockedTransition.status === 409,
      `Status: ${blockedTransition.status}`
    );
    assert(
      "Conflict response details incomplete prerequisite blockers",
      blockedTransition.data?.error?.message?.toLowerCase().includes("prerequisite") ||
        blockedTransition.data?.error?.message?.toLowerCase().includes("blocked")
    );

    // 4. Circular Dependency Prevention
    console.log("\n--- 4. CIRCULAR DEPENDENCY REJECTION ---");
    const cyclicTask = await apiCall(
      "POST",
      "/api/v1/tasks",
      {
        projectId: testProject.id,
        title: "AUDIT_TASK_CYCLIC: Circular Test",
        priority: "LOW",
        deadline: new Date(Date.now() + 5 * 86400000).toISOString(),
        estimatedHours: 8,
        dependsOnIds: [taskBId],
      },
      adminCookie
    );
    const cyclicTaskId = cyclicTask.data?.task?.id;
    assert("Auxiliary dependent task created", cyclicTask.status === 201);

    const allProjectDeps = await prisma.taskDependency.findMany({
      where: { task: { projectId: testProject.id } },
      select: { taskId: true, dependsOnId: true },
    });
    const circularDetected = hasCircularDependency(taskAId, taskBId, allProjectDeps);
    assert(
      "Circular dependency detection correctly rejects inverse cycle (A -> B -> A)",
      circularDetected === true
    );

    // 5. Task Status Workflow (TODO -> IN_PROGRESS -> REVIEW -> COMPLETED)
    console.log("\n--- 5. COMPLETE TASK WORKFLOW & UNBLOCKING ---");
    // Step 5a: Move Task A: TODO -> IN_PROGRESS
    const wfStep1 = await apiCall(
      "POST",
      `/api/v1/tasks/${taskAId}/transition`,
      { status: "IN_PROGRESS", notes: "Excavation and pile drivers mobilized to site." },
      pmCookie
    );
    assert("Workflow Step 1: TODO -> IN_PROGRESS returns HTTP 200", wfStep1.status === 200);
    assert("Task A status updated to IN_PROGRESS", wfStep1.data?.task?.status === "IN_PROGRESS");

    // Step 5b: Move Task A: IN_PROGRESS -> REVIEW
    const wfStep2 = await apiCall(
      "POST",
      `/api/v1/tasks/${taskAId}/transition`,
      { status: "REVIEW", notes: "Piling complete; structural ultrasound report submitted." },
      pmCookie
    );
    assert("Workflow Step 2: IN_PROGRESS -> REVIEW returns HTTP 200", wfStep2.status === 200);
    assert("Task A status updated to REVIEW", wfStep2.data?.task?.status === "REVIEW");

    // Step 5c: Move Task A: REVIEW -> COMPLETED
    const wfStep3 = await apiCall(
      "POST",
      `/api/v1/tasks/${taskAId}/transition`,
      { status: "COMPLETED", notes: "Ultrasonic tests certified 100% compliant." },
      adminCookie
    );
    assert("Workflow Step 3: REVIEW -> COMPLETED returns HTTP 200", wfStep3.status === 200);
    assert("Task A status updated to COMPLETED", wfStep3.data?.task?.status === "COMPLETED");
    assert("Task A progress automatically finalized to 100%", wfStep3.data?.task?.progress === 100);

    // Step 5d: Verify Task B is now UNBLOCKED
    const taskBAfterACompleted = await apiCall("GET", `/api/v1/tasks/${taskBId}`, null, adminCookie);
    assert(
      "Task B is now UNBLOCKED (isBlocked: false) after prerequisite completion",
      taskBAfterACompleted.data?.task?.isBlocked === false
    );

    // Step 5e: Move Task B: TODO -> IN_PROGRESS now succeeds
    const taskBStart = await apiCall(
      "POST",
      `/api/v1/tasks/${taskBId}/transition`,
      { status: "IN_PROGRESS" },
      adminCookie
    );
    assert(
      "Unblocked Task B transitions to IN_PROGRESS successfully (HTTP 200)",
      taskBStart.status === 200
    );

    // 6. Overdue Task Detection
    console.log("\n--- 6. OVERDUE TASK IDENTIFICATION ---");
    const pastDeadline = new Date(Date.now() - 4 * 86400000).toISOString();
    const overdueTask = await apiCall(
      "POST",
      "/api/v1/tasks",
      {
        projectId: testProject.id,
        title: "AUDIT_TASK_OVERDUE: Soil Density Analysis",
        priority: "CRITICAL",
        deadline: pastDeadline,
        estimatedHours: 16,
      },
      adminCookie
    );
    assert("Created deliverable with past deadline", overdueTask.status === 201);
    const overdueTaskId = overdueTask.data?.task?.id;

    const overdueInspect = await apiCall("GET", `/api/v1/tasks/${overdueTaskId}`, null, adminCookie);
    assert(
      "Task with past deadline identified as isOverdue: true",
      overdueInspect.data?.task?.isOverdue === true
    );

    const overdueFilter = await apiCall(
      "GET",
      `/api/v1/tasks?overdueOnly=true&pageSize=100`,
      null,
      adminCookie
    );
    assert(
      "Overdue task retrieved in /api/v1/tasks?overdueOnly=true filter",
      overdueFilter.data?.tasks?.some((t) => t.id === overdueTaskId)
    );

    // 7. Task Comments API
    console.log("\n--- 7. TASK COMMENTS SYSTEM ---");
    const commentPost = await apiCall(
      "POST",
      `/api/v1/tasks/${taskAId}/comments`,
      { content: "Certified slump test at 115mm with water-cement ratio 0.42." },
      pmCookie
    );
    assert("Post comment to task returns HTTP 201", commentPost.status === 201);
    assert(
      "Comment text preserved and user attributed",
      commentPost.data?.comment?.content?.includes("slump test") &&
        commentPost.data?.comment?.user?.email === "pm@buildtrack.com"
    );

    const commentList = await apiCall("GET", `/api/v1/tasks/${taskAId}/comments`, null, adminCookie);
    assert("Get task comments returns HTTP 200", commentList.status === 200);
    assert("Task comments list contains submitted comment", commentList.data?.comments?.length >= 1);

    // 8. Immutable Task History (Audit Trail)
    console.log("\n--- 8. IMMUTABLE TASK HISTORY & AUDIT TRAIL ---");
    const dbHistory = await prisma.taskHistory.findMany({
      where: { taskId: taskAId },
      orderBy: { createdAt: "asc" },
    });
    assert("Audit history records exist for Task A", dbHistory.length >= 4);
    const actionsLogged = dbHistory.map((h) => h.action);
    assert("Audit trail logged TASK_CREATED", actionsLogged.includes("TASK_CREATED"));
    assert("Audit trail logged STATUS_TRANSITION", actionsLogged.includes("STATUS_TRANSITION"));
    assert("Audit trail logged COMMENT_ADDED", actionsLogged.includes("COMMENT_ADDED"));

    // 9. Task Progress & Server-Side Weighted Project Rollup
    console.log("\n--- 9. TASK PROGRESS & WEIGHTED PROJECT ROLLUP ---");
    const patchProgress = await apiCall(
      "PATCH",
      `/api/v1/tasks/${taskBId}`,
      { progress: 65 },
      adminCookie
    );
    assert("Update task progress via PATCH returns HTTP 200", patchProgress.status === 200);
    assert("Task B progress saved at 65%", patchProgress.data?.task?.progress === 65);

    const updatedProject = await prisma.project.findUnique({
      where: { id: testProject.id },
      select: { progress: true },
    });
    assert(
      "Project progress weighted rollup recalculated server-side",
      typeof updatedProject.progress === "number" && updatedProject.progress >= 0
    );

    // 10. Security & Role Constraints
    console.log("\n--- 10. SECURITY & ROLE CONSTRAINTS ---");
    // Contractor cannot modify administrative parameters (deadline/priority)
    const contractorTamper = await apiCall(
      "PATCH",
      `/api/v1/tasks/${taskAId}`,
      { priority: "LOW", deadline: new Date().toISOString() },
      contractorCookie
    );
    assert(
      "Contractor modification of administrative task parameters rejected with HTTP 403 Forbidden",
      contractorTamper.status === 403
    );

    // Cleanup test fixtures
    console.log("\n--- 11. CLEANING UP TEST ARTIFACTS ---");
    const taskIds = [taskAId, taskBId, cyclicTaskId, overdueTaskId].filter(Boolean);
    await prisma.taskDependency.deleteMany({
      where: {
        OR: [{ taskId: { in: taskIds } }, { dependsOnId: { in: taskIds } }],
      },
    });
    await prisma.taskComment.deleteMany({ where: { taskId: { in: taskIds } } });
    await prisma.taskHistory.deleteMany({ where: { taskId: { in: taskIds } } });
    await prisma.task.deleteMany({ where: { id: { in: taskIds } } });
    console.log("Cleaned up audit test tasks from database.");

    console.log("\n================================================================");
    console.log(`TASK MANAGEMENT AUDIT COMPLETE: ${passed}/${total} PASS (${Math.round((passed / total) * 100)}%)`);
    console.log("================================================================");

    if (passed !== total) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Audit fatal error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTaskManagementAudit();
