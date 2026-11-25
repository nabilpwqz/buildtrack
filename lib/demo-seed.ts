import bcrypt from "bcryptjs";
import prisma from "@/lib/db";

const REALISTIC_PROJECTS = [
  {
    name: "Jamuna Rail-Cum-Road Cable-Stayed Approach Viaduct",
    description:
      "Dual-gauge railway and 4-lane highway cable-stayed approach viaduct with deep bored cast-in-situ piles, seismic bearings, and automated structural health monitoring.",
    location: "Sirajganj - Tangail Corridor, Bangladesh",
    totalBudget: 68500000,
    status: "IN_PROGRESS",
    progress: 42,
    milestones: [
      { title: "Geotechnical Borehole & Riverbed Piling", status: "COMPLETED" },
      { title: "Pile Cap & Pier Shaft Concrete Pour", status: "IN_PROGRESS" },
      { title: "Pre-Stressed Box Girder Launching", status: "PENDING" },
    ],
    tasks: [
      { title: "1200mm Cast-in-Situ Bored Piling (Piers P1-P12)", priority: "CRITICAL", status: "COMPLETED", progress: 100 },
      { title: "Reinforced Concrete Pile Cap & Pier Stem Formwork", priority: "HIGH", status: "IN_PROGRESS", progress: 65 },
      { title: "Post-Tensioned Box Girder Segment Casting Yard", priority: "HIGH", status: "IN_PROGRESS", progress: 40 },
      { title: "Elastomeric Seismic Bearing Installation & Alignment", priority: "MEDIUM", status: "TODO", progress: 0 },
    ],
    expenses: [
      { title: "High-Strength C60 Marine Concrete Batching (Lot 04)", amount: 1450000, notes: "Certified slump & cube strength test passed" },
      { title: "Bored Piling Rig Mobilization & Bentonite Slurry", amount: 980000, notes: "2x Rotary hydraulic rigs deployed on barge" },
    ],
  },
  {
    name: "Chattogram Bay Container Terminal Quay Wall",
    description:
      "Deep-draft container berth quay wall construction featuring heavy combi-wall sheet piling, tie-back anchorages, crane rail beams, and automated terminal yard paving.",
    location: "Patenga Coastline, Chattogram",
    totalBudget: 54000000,
    status: "IN_PROGRESS",
    progress: 35,
    milestones: [
      { title: "Capital Dredging & Seabed Reclamation", status: "COMPLETED" },
      { title: "Tubular Steel Combi-Wall Driving", status: "IN_PROGRESS" },
      { title: "STS Crane Rail Beam & Apron Slab", status: "PENDING" },
    ],
    tasks: [
      { title: "Tubular Steel King Pile Driving (-24m Elevation)", priority: "CRITICAL", status: "COMPLETED", progress: 100 },
      { title: "Tie-Back Anchor Rod Tensioning & Grouting", priority: "HIGH", status: "IN_PROGRESS", progress: 55 },
      { title: "Heavy Duty Interlocking Concrete Yard Paving", priority: "MEDIUM", status: "TODO", progress: 0 },
    ],
    expenses: [
      { title: "Marine Grade S355J2H Tubular Steel Piles (850 MT)", amount: 1820000, notes: "Mill test certificates verified at port" },
      { title: "Cathodic Protection Sacrificial Anode Array", amount: 415000, notes: "Marine corrosion protection batch 1" },
    ],
  },
  {
    name: "Sylhet-Tamabil 4-Lane Expressway & Smart Interchange",
    description:
      "Climate-resilient 4-lane divided expressway with grade-separated trumpet interchange, box culverts, LED smart lighting, and fiber-optic ITS corridor.",
    location: "Sylhet - Jaintiapur Highway, Sylhet",
    totalBudget: 41200000,
    status: "PLANNING",
    progress: 18,
    milestones: [
      { title: "ROW Clearance & Topographic LiDAR Survey", status: "COMPLETED" },
      { title: "Sub-Grade Embankment & Geotextile Stabilization", status: "IN_PROGRESS" },
      { title: "Polymer Modified Bitumen (PMB) Wearing Course", status: "PENDING" },
    ],
    tasks: [
      { title: "Corridor LiDAR & Geotechnical CBR Testing", priority: "HIGH", status: "COMPLETED", progress: 100 },
      { title: "Sub-Base Crushed Granite Compaction (Km 0-12)", priority: "HIGH", status: "IN_PROGRESS", progress: 30 },
      { title: "Precast RCC Box Culvert Installation (14 Units)", priority: "MEDIUM", status: "TODO", progress: 0 },
    ],
    expenses: [
      { title: "Crushed Granite Aggregate & Geotextile Membrane", amount: 675000, notes: "Sylhet quarry delivery batch 02" },
    ],
  },
];

/**
 * Ensures realistic civil engineering demo data exists in PostgreSQL.
 * - If database has 0 projects, populates baseline company, users, categories, contractors, and realistic megaprojects.
 * - If forceAddSampleProject is true (Admin on-demand), appends one new realistic megaproject with full relational telemetry.
 */
export async function ensureRealisticDemoData(options?: {
  forceAddSampleProject?: boolean;
  actorId?: string;
  actorName?: string;
}) {
  const existingProjects = await prisma.project.count();
  const shouldSeed = existingProjects === 0 || Boolean(options?.forceAddSampleProject);

  if (!shouldSeed) {
    return { seeded: false, reason: "Database already populated", projectCount: existingProjects };
  }

  // 1. Ensure Company
  let company = await prisma.company.findFirst();
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: "Apex Infrastructure & Civil Engineering Corp",
        address: "Tower 71, Motijheel Commercial Area, Dhaka 1000",
        email: "hq@buildtrack.com",
        phone: "+880-2-9568400",
      },
    });
  }

  // 2. Ensure core enterprise users
  const passwordHash = await bcrypt.hash("Demo@1234", 10);
  const ensureUser = async (email: string, name: string, role: string) => {
    let u = await prisma.user.findUnique({ where: { email } });
    if (!u) {
      u = await prisma.user.create({
        data: {
          email,
          name,
          role: role as any,
          passwordHash,
          companyId: company!.id,
          status: "ACTIVE",
        },
      });
    }
    return u;
  };

  const admin = await ensureUser("admin@buildtrack.com", "Engr. Kabir Hossain", "ADMIN");
  const pm = await ensureUser("pm@buildtrack.com", "Tariqul Islam, PMP", "PROJECT_MANAGER");
  const engineer = await ensureUser("engineer@buildtrack.com", "Farhana Ahmed, PE", "SITE_ENGINEER");
  const finance = await ensureUser("finance@buildtrack.com", "Nasir Uddin, FCA", "FINANCE_MANAGER");
  const contractorUser = await ensureUser("contractor@buildtrack.com", "Rafiq Chowdhury", "CONTRACTOR");

  // 3. Ensure Expense Categories
  let expCat = await prisma.expenseCategory.findFirst();
  if (!expCat) {
    expCat = await prisma.expenseCategory.create({
      data: {
        name: "Civil & Structural Works",
        code: "EXP-CIV-01",
        description: "Piling, reinforced concrete, structural steel, and bridge girders",
      },
    });
  }

  // 4. Ensure Material Categories & Materials
  let matCat = await prisma.materialCategory.findFirst();
  if (!matCat) {
    matCat = await prisma.materialCategory.create({
      data: {
        name: "Structural Steel & Cement",
        description: "OPC cement, TMT 500W rebar, and marine grade structural plates",
      },
    });
  }

  let material = await prisma.material.findFirst();
  if (!material) {
    material = await prisma.material.create({
      data: {
        name: "TMT 500W Deformed Rebar (25mm)",
        sku: "MAT-STL-500W-25",
        unit: "MT",
        availableQty: 420,
        reorderLevel: 80,
        unitCost: 940,
        categoryId: matCat.id,
      },
    });
  }

  // 5. Ensure Contractor
  let contractor = await prisma.contractor.findFirst();
  if (!contractor) {
    contractor = await prisma.contractor.create({
      data: {
        name: "Rafiq Chowdhury",
        contact: "Rafiq Chowdhury",
        company: "Apex Steel & Rebar Mills Ltd",
        email: "contractor@buildtrack.com",
        phone: "+880-1711-001001",
        specialty: "Structural Steel & Reinforcement",
        rating: 4.8,
        status: "ACTIVE",
      },
    });
  }

  // 6. Pick realistic project blueprint
  const template = REALISTIC_PROJECTS[existingProjects % REALISTIC_PROJECTS.length];
  const suffix = existingProjects > 0 ? ` (Phase ${existingProjects + 1})` : "";
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const expectedEndDate = new Date(now.getFullYear() + 1, now.getMonth() + 4, 15);

  const project = await prisma.project.create({
    data: {
      name: `${template.name}${suffix}`,
      description: template.description,
      location: template.location,
      startDate,
      expectedEndDate,
      totalBudget: template.totalBudget,
      status: template.status as any,
      progress: template.progress,
      managerId: pm.id,
      companyId: company.id,
      members: {
        create: [
          { userId: pm.id, role: "PROJECT_MANAGER" },
          { userId: engineer.id, role: "SITE_ENGINEER" },
          { userId: finance.id, role: "FINANCE_MANAGER" },
        ],
      },
      contractors: {
        create: [{ contractorId: contractor.id, role: "Prime Structural Contractor" }],
      },
    },
  });

  // 7. Create Milestones
  for (let i = 0; i < template.milestones.length; i++) {
    const m = template.milestones[i];
    await prisma.milestone.create({
      data: {
        projectId: project.id,
        title: m.title,
        status: m.status as any,
        targetDate: new Date(now.getFullYear(), now.getMonth() + i + 1, 20),
        completedDate: m.status === "COMPLETED" ? new Date(now.getFullYear(), now.getMonth() - 1, 15) : null,
      },
    });
  }

  // 8. Create Tasks + History + Comments
  let firstTaskId: string | null = null;
  for (let i = 0; i < template.tasks.length; i++) {
    const t = template.tasks[i];
    const task = await prisma.task.create({
      data: {
        projectId: project.id,
        title: t.title,
        description: `Engineering work package for ${project.name}`,
        priority: t.priority as any,
        status: t.status as any,
        progress: t.progress,
        assigneeId: i % 2 === 0 ? contractorUser.id : engineer.id,
        deadline: new Date(now.getFullYear(), now.getMonth() + i + 1, 10),
        history: {
          create: {
            userId: options?.actorId || admin.id,
            action: "TASK_CREATED",
            to: t.status,
            details: "Initialized in project master WBS schedule",
          },
        },
        comments: {
          create: {
            userId: engineer.id,
            content: "QA/QC inspection checklist verified on site.",
          },
        },
      },
    });
    if (!firstTaskId) firstTaskId = task.id;
  }

  // 9. Create Budget & Expenses
  await prisma.budget.create({
    data: {
      projectId: project.id,
      categoryId: expCat.id,
      allocated: Math.round(template.totalBudget * 0.45),
    },
  });

  for (const exp of template.expenses) {
    await prisma.expense.create({
      data: {
        projectId: project.id,
        categoryId: expCat.id,
        title: exp.title,
        amount: exp.amount,
        date: now,
        description: exp.notes,
        recordedById: finance.id,
        documentUrl: `IPC-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}.pdf`,
      },
    });
  }

  // 10. Create Progress Report, Site Report & Notification & ActivityLog
  if (firstTaskId) {
    await prisma.progressReport.create({
      data: {
        projectId: project.id,
        taskId: firstTaskId,
        reportedById: engineer.id,
        percentage: template.progress,
        description: `Field telemetry verified for ${project.name}. Concrete curing and reinforcement tolerances within ASTM limits.`,
        photos: JSON.stringify(["/uploads/site-telemetry-01.jpg"]),
        date: now,
      },
    });
  }

  await prisma.siteReport.create({
    data: {
      projectId: project.id,
      reportedById: engineer.id,
      workCompleted: `Daily HSE & Structural Inspection: ${project.name}`,
      weather: "Clear / 29C",
      workersCount: 145,
      issuesFaced: "Zero lost-time incidents recorded.",
      safetyIncidents: 0,
      date: now,
    },
  });

  await prisma.notification.create({
    data: {
      userId: admin.id,
      title: "New Infrastructure Project Live",
      message: `${project.name} (${project.location}) initialized with $${(project.totalBudget / 1_000_000).toFixed(1)}M budget.`,
      type: "SYSTEM",
      link: `/projects/${project.id}`,
    },
  });

  await prisma.activityLog.create({
    data: {
      actorId: options?.actorId || admin.id,
      actorName: options?.actorName || admin.name,
      actorRole: "ADMIN",
      action: "CREATE",
      entity: "Project",
      entityId: project.id,
      meta: JSON.stringify({
        name: project.name,
        location: project.location,
        budget: project.totalBudget,
        source: "ADMIN_DEMO_SEED",
      }),
    },
  });

  return {
    seeded: true,
    project: {
      id: project.id,
      name: project.name,
      location: project.location,
      totalBudget: project.totalBudget,
      status: project.status,
    },
  };
}

/**
 * Ensures realistic construction Materials, Categories, Site Indent Requests, and Stock Transactions exist in PostgreSQL.
 */
export async function ensureRealisticMaterialsDemoData() {
  const existingMatCount = await prisma.material.count();
  if (existingMatCount > 0) {
    return { seeded: false, count: existingMatCount };
  }

  const project = await prisma.project.findFirst();
  const requester =
    (await prisma.user.findFirst({ where: { role: "SITE_ENGINEER" } })) ||
    (await prisma.user.findFirst());

  const categoryDefs = [
    { name: "Structural Steel & Rebar", description: "TMT 500W rebar, H-beams, and post-tensioning strands" },
    { name: "Cement & Binders", description: "OPC CEM-I 52.5N, fly ash, and micro-silica admixtures" },
    { name: "Aggregates & Earthworks", description: "Crushed granite, Sylhet sand, and geotextile membranes" },
    { name: "MEP & High-Voltage", description: "33kV XLPE armored cables, HDPE conduits, and switchgear" },
  ];

  const categories: Record<string, string> = {};
  for (const c of categoryDefs) {
    let cat = await prisma.materialCategory.findFirst({ where: { name: c.name } });
    if (!cat) {
      cat = await prisma.materialCategory.create({ data: c });
    }
    categories[c.name] = cat.id;
  }

  const materialDefs = [
    { name: "TMT 500W Deformed Rebar (25mm)", sku: "MAT-STL-500W-25", unit: "MT", category: "Structural Steel & Rebar", availableQty: 185, reorderLevel: 60, unitCost: 940 },
    { name: "7-Wire Low-Relaxation PC Strand (15.2mm)", sku: "MAT-STL-PCS-152", unit: "MT", category: "Structural Steel & Rebar", availableQty: 18, reorderLevel: 35, unitCost: 1380 },
    { name: "Ordinary Portland Cement (CEM-I 52.5N)", sku: "MAT-CEM-525N", unit: "Bags", category: "Cement & Binders", availableQty: 320, reorderLevel: 500, unitCost: 9.2 },
    { name: "Silica Fume Concrete Admixture (Densified)", sku: "MAT-CEM-SF920", unit: "MT", category: "Cement & Binders", availableQty: 44, reorderLevel: 15, unitCost: 620 },
    { name: "Crushed Granite Aggregate (20mm Graded)", sku: "MAT-AGG-GR20", unit: "MT", category: "Aggregates & Earthworks", availableQty: 920, reorderLevel: 250, unitCost: 34 },
    { name: "Non-Woven Geotextile Separator (300gsm)", sku: "MAT-AGG-GEO300", unit: "Rolls", category: "Aggregates & Earthworks", availableQty: 14, reorderLevel: 30, unitCost: 185 },
    { name: "33kV 3-Core 400mm2 XLPE Armored Cable", sku: "MAT-ELC-33KV", unit: "Drum (500m)", category: "MEP & High-Voltage", availableQty: 8, reorderLevel: 3, unitCost: 14500 },
    { name: "HDPE Corrugated Duct Pipe (160mm)", sku: "MAT-ELC-HDPE160", unit: "Meters", category: "MEP & High-Voltage", availableQty: 1400, reorderLevel: 400, unitCost: 18.5 },
  ];

  const createdMaterials: any[] = [];
  for (const m of materialDefs) {
    const existing = await prisma.material.findUnique({ where: { sku: m.sku } });
    if (existing) {
      createdMaterials.push(existing);
      continue;
    }
    const mat = await prisma.material.create({
      data: {
        name: m.name,
        sku: m.sku,
        unit: m.unit,
        categoryId: categories[m.category],
        availableQty: m.availableQty,
        reorderLevel: m.reorderLevel,
        unitCost: m.unitCost,
      },
    });
    createdMaterials.push(mat);

    if (requester) {
      await prisma.materialTransaction.create({
        data: {
          materialId: mat.id,
          projectId: project?.id || null,
          userId: requester.id,
          type: "RECEIVE",
          qty: m.availableQty,
          balanceAfter: m.availableQty,
          notes: "Initial central warehouse intake batch",
        },
      });
    }
  }

  if (project && requester && createdMaterials.length >= 3) {
    const reqCount = await prisma.materialRequest.count();
    if (reqCount === 0) {
      await prisma.materialRequest.createMany({
        data: [
          {
            materialId: createdMaterials[0].id,
            projectId: project.id,
            requesterId: requester.id,
            qty: 25,
            status: "PENDING",
            reason: "Pier cap P4-P8 reinforcement cage fabrication",
          },
          {
            materialId: createdMaterials[2].id,
            projectId: project.id,
            requesterId: requester.id,
            qty: 250,
            status: "APPROVED",
            reason: "Urgent C50 concrete pour batching replenishment",
          },
        ],
      });
    }
  }

  return { seeded: true, count: createdMaterials.length };
}


