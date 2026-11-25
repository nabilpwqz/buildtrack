const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("=== BuildTrack Megaprojects Expansion ===");

  // 1. Fetch reference records
  const company = await prisma.company.findFirst();
  if (!company) {
    throw new Error("No company found in database.");
  }

  const pms = await prisma.user.findMany({ where: { role: "PROJECT_MANAGER" } });
  const engineers = await prisma.user.findMany({ where: { role: "SITE_ENGINEER" } });
  const contractors = await prisma.contractor.findMany();
  const expenseCategories = await prisma.expenseCategory.findMany();

  if (pms.length === 0 || engineers.length === 0 || contractors.length === 0 || expenseCategories.length === 0) {
    throw new Error("Missing required reference users, contractors, or expense categories.");
  }

  const pm1 = pms[0];
  const pm2 = pms.length > 1 ? pms[1] : pms[0];
  const eng1 = engineers[0];
  const eng2 = engineers.length > 1 ? engineers[1] : engineers[0];

  // 2. Define 11 new authentic civil megaprojects
  const newProjects = [
    {
      name: "Hazrat Shahjalal International Airport Terminal 3 Expansion",
      description: "Ultra-modern 230,000 m² aviation terminal with 26 boarding bridges, automated baggage handling systems, and multi-level elevated access flyover.",
      location: "Kurmitola, Airport Road, Dhaka",
      startDate: new Date("2023-04-01"),
      expectedEndDate: new Date("2025-10-31"),
      totalBudget: 110000000,
      status: "IN_PROGRESS",
      progress: 72,
      managerId: pm1.id,
      companyId: company.id,
    },
    {
      name: "Bangabandhu Sheikh Mujib Railway Bridge",
      description: "4.8 km dedicated dual-gauge double-track railway bridge spanning Jamuna River with 50 steel truss spans and deep underwater open caisson piers.",
      location: "Sirajganj to Tangail (Jamuna River)",
      startDate: new Date("2022-08-15"),
      expectedEndDate: new Date("2025-06-30"),
      totalBudget: 95000000,
      status: "IN_PROGRESS",
      progress: 84,
      managerId: pm2.id,
      companyId: company.id,
    },
    {
      name: "Matarbari Ultra Super Critical Coal & Deep Sea Port",
      description: "1,200 MW ultra-supercritical energy facility integrated with an 18.5m draft deep-sea bulk cargo harbor and wave-absorbing breakwater barrier.",
      location: "Maheshkhali, Cox's Bazar",
      startDate: new Date("2023-01-10"),
      expectedEndDate: new Date("2026-12-31"),
      totalBudget: 145000000,
      status: "IN_PROGRESS",
      progress: 65,
      managerId: pm1.id,
      companyId: company.id,
    },
    {
      name: "Payra Deep Sea Container Port & Access Channel",
      description: "Strategic maritime terminal featuring 75km Rabnabad channel capital dredging, coastal container berths, and heavy shore-to-ship cranes.",
      location: "Kalapara, Patuakhali",
      startDate: new Date("2025-03-01"),
      expectedEndDate: new Date("2028-06-30"),
      totalBudget: 78000000,
      status: "PLANNING",
      progress: 18,
      managerId: pm2.id,
      companyId: company.id,
    },
    {
      name: "Dhaka-Ashulia Elevated Expressway Phase 1",
      description: "24 km four-lane grade-separated viaduct relieving northern gateway cargo transit with pre-stressed segmental spans and toll plazas.",
      location: "Airport - Ashulia - EPZ, Dhaka",
      startDate: new Date("2024-02-01"),
      expectedEndDate: new Date("2026-08-31"),
      totalBudget: 52000000,
      status: "IN_PROGRESS",
      progress: 43,
      managerId: pm1.id,
      companyId: company.id,
    },
    {
      name: "Mirsarai Industrial Mega City Central Water Treatment Plant",
      description: "150 MLD industrial effluent treatment and desalinization facility serving 30,000-acre economic zone with SCADA monitoring network.",
      location: "Bangabandhu Shilpa Nagar, Mirsarai, Chattogram",
      startDate: new Date("2023-10-01"),
      expectedEndDate: new Date("2025-11-30"),
      totalBudget: 36000000,
      status: "IN_PROGRESS",
      progress: 56,
      managerId: pm2.id,
      companyId: company.id,
    },
    {
      name: "Purbachal Smart City High-Tech Iconic Tower",
      description: "45-story commercial and technology tower with diagrid structural steel exoskeleton, BREEAM Outstanding rating, and solar photovoltaic facade.",
      location: "Sector 19, Purbachal Smart City, Dhaka",
      startDate: new Date("2025-01-15"),
      expectedEndDate: new Date("2028-04-30"),
      totalBudget: 84000000,
      status: "PLANNING",
      progress: 12,
      managerId: pm1.id,
      companyId: company.id,
    },
    {
      name: "Dohar River Training & Flood Defense Embankment",
      description: "18.5 km hydraulic revetment embankment with geotextile mattress armouring and articulated concrete block paving for monsoonal flood protection.",
      location: "Padma Riverfront, Dohar, Dhaka",
      startDate: new Date("2022-10-01"),
      expectedEndDate: new Date("2024-09-30"),
      actualEndDate: new Date("2024-09-22"),
      totalBudget: 26500000,
      status: "COMPLETED",
      progress: 100,
      managerId: pm2.id,
      companyId: company.id,
    },
    {
      name: "Saidabad Water Treatment Plant Phase 4 Intake Works",
      description: "Raw water intake pumping station with 450,000 m³/day clarification basins and twin 1,600mm welded steel transmission mains.",
      location: "Demra Riverfront, Meghna Intake, Dhaka",
      startDate: new Date("2024-03-15"),
      expectedEndDate: new Date("2026-05-30"),
      totalBudget: 43000000,
      status: "IN_PROGRESS",
      progress: 37,
      managerId: pm1.id,
      companyId: company.id,
    },
    {
      name: "Padma Bridge Rail Link Connectivity Phase 2",
      description: "86 km broad-gauge high-speed ballastless railway alignment connecting south-western commercial zones with automated signaling.",
      location: "Bhanga to Jashore Corridor",
      startDate: new Date("2023-05-01"),
      expectedEndDate: new Date("2025-12-15"),
      totalBudget: 68000000,
      status: "IN_PROGRESS",
      progress: 61,
      managerId: pm2.id,
      companyId: company.id,
    },
    {
      name: "Mongla Port Modernization & Berth Extension",
      description: "Deepening of navigation channel, installation of two rubber-tyred gantry cranes, and extension of bulk cargo jetty by 450 meters.",
      location: "Passur River Channel, Mongla, Bagerhat",
      startDate: new Date("2023-09-01"),
      expectedEndDate: new Date("2024-11-30"),
      totalBudget: 39000000,
      status: "DELAYED",
      progress: 49,
      managerId: pm1.id,
      companyId: company.id,
    },
  ];

  console.log(`Cleaning any partial records from prior interrupted runs...`);
  await prisma.project.deleteMany({
    where: {
      name: { in: newProjects.map((p) => p.name) },
    },
  });

  console.log(`Adding ${newProjects.length} new megaprojects...`);
  const now = new Date();

  for (let idx = 0; idx < newProjects.length; idx++) {
    const pDef = newProjects[idx];
    const project = await prisma.project.create({ data: pDef });
    console.log(`+ Created Project [${idx + 1}/${newProjects.length}]: [${project.name}]`);

    // 1. Assign project team members
    await prisma.projectMember.create({
      data: { projectId: project.id, userId: eng1.id, role: "LEAD_SITE_ENGINEER" },
    });
    await prisma.projectMember.create({
      data: { projectId: project.id, userId: eng2.id, role: "FIELD_ENGINEER" },
    });

    // 2. Link 2 Contractors & performance scores
    const c1 = contractors[idx % contractors.length];
    const c2 = contractors[(idx + 7) % contractors.length];
    await prisma.projectContractor.create({
      data: { projectId: project.id, contractorId: c1.id, role: "Prime Civil Subcontractor" },
    });
    await prisma.projectContractor.create({
      data: { projectId: project.id, contractorId: c2.id, role: "Specialized MEP Contractor" },
    });
    await prisma.contractorPerformance.create({
      data: {
        contractorId: c1.id,
        projectId: project.id,
        onTimeRate: 91.5 - (idx * 2 % 10),
        qualityScore: 4.8 - (idx * 0.1 % 0.5),
        delayIncidents: project.status === "DELAYED" ? 2 : 0,
        notes: "Audited contractor performance under ISO 9001 and ISO 45001 civil specs.",
      },
    });

    // 3. Milestones (5 sequential milestones per project)
    const isCompleted = project.status === "COMPLETED";
    const milestoneDefs = [
      {
        title: "Foundation & Subsurface Geotech Verification",
        description: "Bored cast-in-situ piling, sonic-logging integrity testing, and pile cap load test passing sign-offs.",
        order: 1,
        targetDate: new Date("2024-03-31"),
        status: "COMPLETED",
      },
      {
        title: "Superstructure Heavy Civil & Structural Framing",
        description: "Main load-bearing concrete piers, pre-stressed girder placement, and composite steel framing.",
        order: 2,
        targetDate: new Date("2024-11-30"),
        status: isCompleted || project.progress >= 50 ? "COMPLETED" : "IN_PROGRESS",
      },
      {
        title: "Building Envelope, Hydraulic Revetment & Roofing",
        description: "Exterior facades, weatherproofing membranes, marine revetments, and deck expansion joint installation.",
        order: 3,
        targetDate: new Date("2025-06-30"),
        status: isCompleted ? "COMPLETED" : project.progress >= 70 ? "IN_PROGRESS" : "PENDING",
      },
      {
        title: "Heavy Electromechanical, SCADA & MEP Commissioning",
        description: "Gas-insulated switchgear, automated drainage pumping station, high-voltage busways, and fire suppression.",
        order: 4,
        targetDate: new Date("2025-10-31"),
        status: isCompleted ? "COMPLETED" : "PENDING",
      },
      {
        title: "Final Non-Destructive Testing & Regulatory Handover",
        description: "Integrated acoustic resonance testing, load deflections, as-built blueprint clearance, and client sign-off.",
        order: 5,
        targetDate: new Date("2026-03-31"),
        status: isCompleted ? "COMPLETED" : "PENDING",
      },
    ];

    for (const m of milestoneDefs) {
      await prisma.milestone.create({
        data: { ...m, projectId: project.id },
      });
    }

    // 4. Tasks (8-10 CPM tasks with dependencies)
    const taskDefs = [
      { title: "Standard Penetration Test (SPT) & Subsurface Profile", hours: 45, priority: "HIGH", pct: 100, status: "COMPLETED" },
      { title: "Heavy Earthmoving, Trenching & Deep Dewatering", hours: 140, priority: "MEDIUM", pct: 100, status: "COMPLETED" },
      { title: "Bored Cast-in-situ Piles & Sonic Logging Testing", hours: 260, priority: "CRITICAL", pct: project.progress > 40 ? 100 : 80, status: project.progress > 40 ? "COMPLETED" : "IN_PROGRESS" },
      { title: "Reinforced Concrete Pile Caps & Grade Beams", hours: 180, priority: "CRITICAL", pct: project.progress > 50 ? 100 : project.progress > 20 ? 60 : 0, status: project.progress > 50 ? "COMPLETED" : project.progress > 20 ? "IN_PROGRESS" : "TODO" },
      { title: "Structural Steel Frame & Column Rigging", hours: 220, priority: "HIGH", pct: project.progress > 70 ? 90 : project.progress > 40 ? 40 : 0, status: project.progress > 70 ? "IN_PROGRESS" : project.progress > 40 ? "IN_PROGRESS" : "TODO" },
      { title: "Pre-stressed Box Girder Post-Tensioning Jacks", hours: 320, priority: "CRITICAL", pct: project.progress > 80 ? 100 : project.progress > 60 ? 50 : 0, status: project.progress > 80 ? "COMPLETED" : project.progress > 60 ? "IN_PROGRESS" : "TODO" },
      { title: "High-Voltage Substation Busbars & SCADA Switchgear", hours: 160, priority: "HIGH", pct: isCompleted ? 100 : project.progress > 75 ? 35 : 0, status: isCompleted ? "COMPLETED" : project.progress > 75 ? "IN_PROGRESS" : "TODO" },
      { title: "Fire Suppression Standpipe & Hydrostatic Testing", hours: 120, priority: "MEDIUM", pct: isCompleted ? 100 : 0, status: isCompleted ? "COMPLETED" : "TODO" },
      { title: "Curtain Glazing, Elastomeric Waterproofing & Finish", hours: 150, priority: "LOW", pct: isCompleted ? 100 : 0, status: isCompleted ? "COMPLETED" : "TODO" },
    ];

    let prevTaskId = null;
    const createdTasks = [];

    for (let tIdx = 0; tIdx < taskDefs.length; tIdx++) {
      const t = taskDefs[tIdx];
      const taskStatus = isCompleted ? "COMPLETED" : t.status;
      const taskProgress = isCompleted ? 100 : t.pct;
      const deadline = new Date(project.startDate.getTime() + (tIdx + 1) * 35 * 24 * 60 * 60 * 1000);

      const createdTask = await prisma.task.create({
        data: {
          projectId: project.id,
          title: t.title,
          description: `Contractual engineering execution for ${project.name} under AASHTO & BNBC standards.`,
          priority: t.priority,
          status: taskStatus,
          progress: taskProgress,
          estimatedHours: t.hours,
          deadline: deadline,
          assigneeId: tIdx % 2 === 0 ? eng1.id : eng2.id,
        },
      });
      createdTasks.push(createdTask);

      // Link DAG dependency to previous task
      if (prevTaskId) {
        await prisma.taskDependency.create({
          data: {
            taskId: createdTask.id,
            dependsOnId: prevTaskId,
          },
        });
      }
      prevTaskId = createdTask.id;
    }

    // 5. Budgets (allocate across all 6 categories)
    const budgetWeights = [0.38, 0.24, 0.16, 0.10, 0.07, 0.05];
    for (let cIdx = 0; cIdx < expenseCategories.length; cIdx++) {
      const cat = expenseCategories[cIdx];
      const weight = budgetWeights[cIdx] ?? (1 / expenseCategories.length);
      const sourceBudget = Number(pDef.totalBudget);
      const allocated = Number.isFinite(sourceBudget)
        ? Math.round(sourceBudget * weight)
        : 0;
      await prisma.budget.create({
        data: {
          projectId: project.id,
          categoryId: cat.id,
          allocated: allocated,
        },
      });

      // 6. Expenses (actual spend matching progress)
      const spentRatio = (project.progress / 100) * (project.status === "DELAYED" ? 1.15 : 0.95);
      const expenseAmount = Math.round(allocated * spentRatio * 0.7);

      if (expenseAmount > 0) {
        await prisma.expense.create({
          data: {
            title: `${cat.name} Interim Progress Disbursement`,
            projectId: project.id,
            categoryId: cat.id,
            recordedById: pm1.id,
            amount: expenseAmount,
            description: `Certified interim progress disbursement for ${cat.name} — Stage ${idx + 1}.`,
            date: new Date(now.getTime() - (cIdx + 1) * 12 * 24 * 60 * 60 * 1000),
            documentUrl: `/demo/invoices/inv-${project.id}-${cIdx + 1}.pdf`,
          },
        });
      }
    }

    // 7. SiteReports (3 shift logs per project)
    const siteReports = [
      {
        date: new Date(now.getTime() - 86400000 * 1),
        weather: "Clear & Sunny (32°C)",
        workersCount: 115 + (idx * 5 % 40),
        equipmentOnSite: "2x 180T Crawler Cranes, 4x Ready-Mix Trucks, 1x Concrete Boom Pump",
        workCompleted: `Erected structural girder segment #${idx + 10} and tied rebar reinforcement on Pier Section. Non-destructive ultrasonic testing confirmed zero voiding.`,
        issuesFaced: "None. Hydration breaks scheduled during peak heat index.",
        safetyIncidents: 0,
        reportedById: eng1.id,
      },
      {
        date: new Date(now.getTime() - 86400000 * 2),
        weather: "Overcast & Humid (29°C)",
        workersCount: 95 + (idx * 4 % 30),
        equipmentOnSite: "1x Rotary Drilling Rig, 2x Grout Pumps, 3x Dump Trucks",
        workCompleted: `Bored cast-in-situ pile drilling reached designed termination depth at -42.5m. Bentonite slurry desanding executed in compliance with ASTM D4380.`,
        issuesFaced: "Bentonite circulation pump filter cleaned and restored in 20 minutes.",
        safetyIncidents: 0,
        reportedById: eng2.id,
      },
      {
        date: new Date(now.getTime() - 86400000 * 3),
        weather: "Controlled Subsurface / Breezy (28°C)",
        workersCount: 130 + (idx * 6 % 35),
        equipmentOnSite: "3x Hydraulic Excavators, 2x Vibratory Rollers, 1x Water Bowsers",
        workCompleted: `Compacted sub-base gravel aggregate layer. Plate load tests demonstrated modulus of subgrade reaction exceeding 85 MN/m³.`,
        issuesFaced: "None. Sub-base density passed nuclear density gauge verification.",
        safetyIncidents: 0,
        reportedById: eng1.id,
      },
    ];

    for (const sr of siteReports) {
      await prisma.siteReport.create({
        data: {
          ...sr,
          projectId: project.id,
        },
      });
    }

    // 8. ProgressReports (2 milestone certificates per project)
    const progressReports = [
      {
        percentage: project.progress,
        description: `Stage inspection verified for ${project.name}. Non-destructive ultrasonic pulse velocity (UPV 4,250 m/s) and core compressive strength (49.2 MPa) approved.`,
        date: new Date(now.getTime() - 86400000 * 2),
        reportedById: eng1.id,
        taskId: createdTasks[2]?.id || null,
      },
      {
        percentage: Math.max(10, project.progress - 15),
        description: `Subsurface foundation structural sign-off. Cross-hole sonic logging confirmed zero pile necking or anomaly defects.`,
        date: new Date(now.getTime() - 86400000 * 7),
        reportedById: eng2.id,
        taskId: createdTasks[1]?.id || null,
      },
    ];

    for (const pr of progressReports) {
      await prisma.progressReport.create({
        data: {
          ...pr,
          projectId: project.id,
        },
      });
    }

    // 9. DelayReports (2 delay notices per project)
    const delayReports = [
      {
        reason: `Monsoonal high-tide river discharge rate exceeded safe navigation threshold for floating marine derrick barges.`,
        impactDays: project.status === "DELAYED" ? 22 : 8,
        mitigationPlan: `Shifted pier pre-assembly to land-based casting yard; chartered twin tugboats to stabilize crane spuds during slack tide windows.`,
        status: project.status === "DELAYED" ? "OPEN" : "MITIGATED",
        reportedById: eng1.id,
        taskId: createdTasks[3]?.id || null,
      },
      {
        reason: `Subsurface geotechnical pocket of organic clay encountered requiring pressure jet grouting stabilization.`,
        impactDays: 6,
        mitigationPlan: `Dual-fluid jet grouting completed 24/7 with micro-fine cement. Core sample confirmed bearing capacity restoration.`,
        status: "RESOLVED",
        reportedById: eng2.id,
        taskId: createdTasks[0]?.id || null,
      },
    ];

    for (const dr of delayReports) {
      await prisma.delayReport.create({
        data: {
          ...dr,
          projectId: project.id,
        },
      });
    }

    // 10. Documents (2 blueprints/surveys per project)
    await prisma.document.create({
      data: {
        projectId: project.id,
        uploadedById: pm1.id,
        title: `${project.name} - Geotechnical Soil & Piling Profile`,
        fileUrl: `/demo/blueprints/${project.id}-geotech.pdf`,
        fileType: "application/pdf",
        fileSize: 4850000,
      },
    });

    await prisma.document.create({
      data: {
        projectId: project.id,
        uploadedById: pm2.id,
        title: `${project.name} - Structural Engineering Blueprint Drawing Rev-C`,
        fileUrl: `/demo/blueprints/${project.id}-blueprint.pdf`,
        fileType: "application/pdf",
        fileSize: 12400000,
      },
    });
  }

  const finalProjectCount = await prisma.project.count();
  const finalSiteReports = await prisma.siteReport.count();
  const finalProgressReports = await prisma.progressReport.count();
  const finalDelayReports = await prisma.delayReport.count();
  const finalTasks = await prisma.task.count();
  const finalBudgets = await prisma.budget.count();

  console.log("\n========================================================");
  console.log(`Expansion Complete!`);
  console.log(`Total Projects in Database: ${finalProjectCount}`);
  console.log(`Total Tasks: ${finalTasks}`);
  console.log(`Total Budgets: ${finalBudgets}`);
  console.log(`Total Daily Site Logs: ${finalSiteReports}`);
  console.log(`Total Progress Certificates: ${finalProgressReports}`);
  console.log(`Total Delay Incident Reports: ${finalDelayReports}`);
  console.log("========================================================\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
