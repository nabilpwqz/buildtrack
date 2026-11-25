/**
 * BuildTrack Task Expansion Script
 * Adds 115+ authentic, highly realistic civil engineering and infrastructure tasks
 * across all 23 active megaprojects in the Neon PostgreSQL database.
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Engineering task templates covering multiple specialized disciplines:
// Geotechnical, Structural Concrete, Structural Steel, MEP & High Voltage, SCADA & Instrumentation, Safety & Commissioning
const TASK_TEMPLATES = [
  // 1. Geotechnical & Deep Foundations
  {
    titleSuffix: "Deep Soil Dynamic Cone Penetrometer (DCP) Profiling",
    desc: "Perform in-situ dynamic cone penetrometer profiling to a depth of 18m along critical pier alignment in accordance with ASTM D6951. Log continuous penetration resistance (mm/blow) to calibrate allowable bearing pressure for heavy piling rigs.",
    discipline: "GEOTECH",
    priority: "HIGH",
    estHours: 36,
    statusWeight: "COMPLETED",
    progress: 100,
  },
  {
    titleSuffix: "High-Strain Dynamic Pile Load Test (PDA & CAPWAP Analysis)",
    desc: "Instrument 1200mm bored cast-in-place test pile with accelerometer and strain transducers. Execute high-strain dynamic drop-hammer test per ASTM D4945-17. Validate ultimate skin friction and end-bearing resistance via CAPWAP signal matching.",
    discipline: "GEOTECH",
    priority: "CRITICAL",
    estHours: 48,
    statusWeight: "COMPLETED",
    progress: 100,
    dependsOnPreviousIndex: 0,
  },
  {
    titleSuffix: "Bentonite Slurry Specific Gravity & Viscosity Sampling",
    desc: "Collect slurry samples from base of 42m deep diaphragm wall trench at 4-hour intervals. Measure Marsh funnel viscosity (32-40 sec), mud balance specific gravity (1.05-1.12 g/cm³), and sand content (<3%) to prevent trench borehole collapse.",
    discipline: "GEOTECH",
    priority: "MEDIUM",
    estHours: 24,
    statusWeight: "IN_PROGRESS",
    progress: 60,
  },
  {
    titleSuffix: "Post-Tensioned Multi-Strand Tendon Stressing & Elongation Log",
    desc: "Execute two-end hydraulic jacking of 19-strand Grade 270 low-relaxation pre-stressing tendons in superstructure girder. Record gauge pressure (bar) and verify calculated elongation within +/- 5% tolerance as mandated by BS EN 13670.",
    discipline: "STRUCTURAL",
    priority: "CRITICAL",
    estHours: 54,
    statusWeight: "IN_PROGRESS",
    progress: 45,
    dependsOnPreviousIndex: 1,
  },
  {
    titleSuffix: "Mass Concrete Hydration Thermocouple Data-Logging",
    desc: "Monitor internal core and ambient surface temperatures on 4.5m thick raft foundation pour using embedded K-type thermocouples. Ensure maximum temperature does not exceed 70°C and thermal gradient differential stays below 20°C per ACI 207.",
    discipline: "CONCRETE",
    priority: "HIGH",
    estHours: 72,
    statusWeight: "REVIEW",
    progress: 90,
  },
  {
    titleSuffix: "Ultrasonic Phased Array (PAUT) Butt Weld Examination",
    desc: "Execute 100% volumetric non-destructive ultrasonic phased array testing (PAUT) on full-penetration transverse girder flange splices in accordance with AWS D1.5 Bridge Welding Code. Map weld root lack-of-fusion and reject internal slag inclusions.",
    discipline: "STEEL",
    priority: "CRITICAL",
    estHours: 42,
    statusWeight: "COMPLETED",
    progress: 100,
  },
  {
    titleSuffix: "132kV Gas-Insulated Switchgear (GIS) SF6 Moisture & Hi-Pot Testing",
    desc: "Conduct high-voltage AC withstand testing at 230kV for 1 minute on SF6 gas-insulated substation busbars. Measure SF6 gas dew point (<-36°C) and partial discharge levels (<5 pC) to confirm insulation integrity prior to grid back-feed energization.",
    discipline: "ELECTRICAL",
    priority: "HIGH",
    estHours: 60,
    statusWeight: "IN_PROGRESS",
    progress: 50,
  },
  {
    titleSuffix: "SCADA PLC Telemetry Loop Check & Modbus Field Commissioning",
    desc: "Verify point-to-point 4-20mA analog signal continuity between field pressure/flow transmitters and central PLC rack. Perform loop calibration, alarm threshold tripping verification, and SCADA HMI graphics symbol animation testing.",
    discipline: "SCADA",
    priority: "MEDIUM",
    estHours: 40,
    statusWeight: "TODO",
    progress: 0,
    dependsOnPreviousIndex: 6,
  },
  {
    titleSuffix: "Turbidity Curtain Silt Screen Marine Siltation Audit",
    desc: "Inspect aquatic geotextile turbidity curtain anchoring along riverside dredge perimeter. Sample down-current total suspended solids (TSS < 50 mg/L) with calibrated turbidity meter to ensure strict compliance with Department of Environment clearance.",
    discipline: "ENVIRONMENTAL",
    priority: "LOW",
    estHours: 20,
    statusWeight: "IN_PROGRESS",
    progress: 75,
  },
  {
    titleSuffix: "Fire Suppression Deluge Valve Hydraulic Flow Discharge Test",
    desc: "Perform hydrostatic pump acceptance flow rate test on high-hazard diesel fuel tank foam-water deluge system. Measure residual pitot pressure at most remote branch nozzle ensuring NFPA 16 hydraulic discharge density compliance.",
    discipline: "SAFETY",
    priority: "HIGH",
    estHours: 32,
    statusWeight: "REVIEW",
    progress: 85,
  },
];

async function main() {
  console.log("=== BuildTrack 100+ Authentic Civil Engineering Tasks Expansion ===");

  // 1. Fetch all active projects
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, createdAt: true },
  });

  console.log(`Found ${projects.length} projects in database.`);

  // 2. Fetch users for realistic assignments
  const users = await prisma.user.findMany({
    where: {
      role: { in: ["SITE_ENGINEER", "PROJECT_MANAGER", "CONTRACTOR"] },
    },
    select: { id: true, name: true, role: true },
  });

  const siteEngineers = users.filter((u) => u.role === "SITE_ENGINEER");
  const pms = users.filter((u) => u.role === "PROJECT_MANAGER");
  const contractors = users.filter((u) => u.role === "CONTRACTOR");

  const engineer1 = siteEngineers[0] || users[0];
  const engineer2 = siteEngineers[1] || siteEngineers[0] || users[0];
  const pmUser = pms[0] || users[0];
  const contractorUser = contractors[0] || users[0];

  const assigneePool = [engineer1, engineer2, contractorUser, pmUser];

  let totalTasksCreated = 0;
  let totalDependenciesCreated = 0;
  let totalCommentsCreated = 0;

  // We will add 5 tailored tasks to each of the 23 projects: 23 * 5 = 115 new tasks!
  for (let pIdx = 0; pIdx < projects.length; pIdx++) {
    const project = projects[pIdx];
    const createdProjectTasks = [];

    // Select 5 varied template tasks for this project
    // Offset by project index to ensure high diversity across projects
    const chosenTemplates = [];
    for (let i = 0; i < 5; i++) {
      const templateIdx = (pIdx * 2 + i) % TASK_TEMPLATES.length;
      chosenTemplates.push(TASK_TEMPLATES[templateIdx]);
    }

    for (let tIdx = 0; tIdx < chosenTemplates.length; tIdx++) {
      const tpl = chosenTemplates[tIdx];
      const assignee = assigneePool[(pIdx + tIdx) % assigneePool.length];

      // Deadlines spread realistically:
      // COMPLETED: past 5 to 20 days
      // IN_PROGRESS: next 7 to 25 days
      // REVIEW: next 3 to 10 days
      // TODO: next 30 to 60 days
      const now = Date.now();
      let deadlineDate;
      let completedAtDate = null;
      let actualHours = 0;

      if (tpl.statusWeight === "COMPLETED") {
        deadlineDate = new Date(now - (5 + tIdx * 3) * 86400000);
        completedAtDate = new Date(now - (6 + tIdx * 3) * 86400000);
        actualHours = Math.round(tpl.estHours * 0.92);
      } else if (tpl.statusWeight === "IN_PROGRESS") {
        deadlineDate = new Date(now + (10 + tIdx * 5) * 86400000);
        actualHours = Math.round(tpl.estHours * (tpl.progress / 100));
      } else if (tpl.statusWeight === "REVIEW") {
        deadlineDate = new Date(now + (4 + tIdx * 2) * 86400000);
        actualHours = Math.round(tpl.estHours * 0.88);
      } else {
        deadlineDate = new Date(now + (35 + tIdx * 8) * 86400000);
        actualHours = 0;
      }

      const task = await prisma.task.create({
        data: {
          projectId: project.id,
          title: `${project.name.split(" - ")[0].split(" Phase")[0]} — ${tpl.titleSuffix}`,
          description: tpl.desc,
          assigneeId: assignee.id,
          priority: tpl.priority,
          deadline: deadlineDate,
          status: tpl.statusWeight,
          progress: tpl.progress,
          estimatedHours: tpl.estHours,
          actualHours: actualHours,
          completedAt: completedAtDate,
        },
      });

      createdProjectTasks.push(task);
      totalTasksCreated++;

      // Create Task History Entry
      await prisma.taskHistory.create({
        data: {
          taskId: task.id,
          userId: assignee.id,
          action: "STATUS_CHANGE",
          from: "TODO",
          to: tpl.statusWeight,
          details: `Milestone work package initialized with status ${tpl.statusWeight} at ${tpl.progress}% completion.`,
        },
      });

      // Create Realistic Site Operations Comment
      const commentText =
        tpl.statusWeight === "COMPLETED"
          ? `QA/QC Laboratory test results logged and verified. All compressive cylinder breaks and non-destructive scans meet project specification tolerances. Work package signed off by ${assignee.name}.`
          : tpl.statusWeight === "IN_PROGRESS"
          ? `Shift work ongoing. Crew of 14 tradesmen and 2 survey technicians mobilized on site. Calibration verified with digital micrometer.`
          : tpl.statusWeight === "REVIEW"
          ? `Work package submitted for resident engineer inspection. Pre-pour checklist and formwork alignment survey attached for approval.`
          : `Work package scheduled upon clearance of predecessor structural curing cycle and site access handover.`;

      await prisma.taskComment.create({
        data: {
          taskId: task.id,
          userId: assignee.id,
          content: commentText,
        },
      });
      totalCommentsCreated++;
    }

    // Now establish DAG Dependencies within this project (Acyclic)
    // Task 1 -> Task 0
    if (createdProjectTasks.length >= 2) {
      try {
        await prisma.taskDependency.create({
          data: {
            taskId: createdProjectTasks[1].id,
            dependsOnId: createdProjectTasks[0].id,
          },
        });
        totalDependenciesCreated++;
      } catch (e) {
        // Ignore duplicate
      }
    }

    // Task 3 -> Task 1 & Task 2
    if (createdProjectTasks.length >= 4) {
      try {
        await prisma.taskDependency.create({
          data: {
            taskId: createdProjectTasks[3].id,
            dependsOnId: createdProjectTasks[1].id,
          },
        });
        totalDependenciesCreated++;
      } catch (e) {
        // Ignore duplicate
      }
    }

    // Task 4 -> Task 3
    if (createdProjectTasks.length >= 5) {
      try {
        await prisma.taskDependency.create({
          data: {
            taskId: createdProjectTasks[4].id,
            dependsOnId: createdProjectTasks[3].id,
          },
        });
        totalDependenciesCreated++;
      } catch (e) {
        // Ignore duplicate
      }
    }

    console.log(`[${pIdx + 1}/${projects.length}] Added 5 tasks for: ${project.name}`);
  }

  const finalTaskCount = await prisma.task.count({ where: { isDeleted: false } });
  const finalDependenciesCount = await prisma.taskDependency.count();
  const finalCommentsCount = await prisma.taskComment.count();

  console.log("\n========================================================");
  console.log(`Successfully added ${totalTasksCreated} new authentic engineering tasks!`);
  console.log(`Total active tasks across portfolio: ${finalTaskCount}`);
  console.log(`Total CPM task dependencies: ${finalDependenciesCount}`);
  console.log(`Total task comments & telemetry notes: ${finalCommentsCount}`);
  console.log("========================================================");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Task expansion error:", err);
  prisma.$disconnect();
  process.exit(1);
});

