/**
 * BuildTrack 30+ Materials Expansion Script
 * Adds 36 authentic, highly certified civil engineering materials across all 6 warehouse categories,
 * complete with initial inventory receipt audit transactions and active site indent requests.
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const NEW_MATERIALS = [
  // 1. Cement & Binders
  {
    categoryName: "Cement & Binders",
    sku: "MAT-CEM-007",
    name: "Sulfate-Resistant Portland Cement (Type V / HS)",
    unit: "Bags (50kg)",
    unitCost: 8.9,
    availableQty: 1450,
    reorderLevel: 300,
  },
  {
    categoryName: "Cement & Binders",
    sku: "MAT-CEM-008",
    name: "Silica Fume Densified Dry Powder (ASTM C1240)",
    unit: "Bags (25kg)",
    unitCost: 32.0,
    availableQty: 420,
    reorderLevel: 80,
  },
  {
    categoryName: "Cement & Binders",
    sku: "MAT-CEM-009",
    name: "High-Strength Non-Shrink Epoxy Grout (Sikadur-42)",
    unit: "Kits (30kg)",
    unitCost: 65.0,
    availableQty: 180,
    reorderLevel: 40,
  },
  {
    categoryName: "Cement & Binders",
    sku: "MAT-CEM-010",
    name: "Rapid-Setting Hydraulic Water-Plug Cement",
    unit: "Pails (15kg)",
    unitCost: 24.5,
    availableQty: 260,
    reorderLevel: 50,
  },
  {
    categoryName: "Cement & Binders",
    sku: "MAT-CEM-011",
    name: "Pulverized Fuel Ash (PFA / Fly Ash Class F)",
    unit: "Metric Tons",
    unitCost: 78.0,
    availableQty: 110,
    reorderLevel: 25,
  },
  {
    categoryName: "Cement & Binders",
    sku: "MAT-CEM-012",
    name: "Thixotropic Cable Duct Post-Tension Grout",
    unit: "Bags (25kg)",
    unitCost: 22.0,
    availableQty: 580,
    reorderLevel: 100,
  },

  // 2. Steel & Reinforcement
  {
    categoryName: "Steel & Reinforcement",
    sku: "MAT-STL-007",
    name: "Deformed Bar 32mm Grade 500W High-Yield",
    unit: "Metric Tons",
    unitCost: 1010.0,
    availableQty: 85,
    reorderLevel: 20,
  },
  {
    categoryName: "Steel & Reinforcement",
    sku: "MAT-STL-008",
    name: "Pre-Stressing Monostrand Unbonded 12.7mm",
    unit: "Coils (2T)",
    unitCost: 2850.0,
    availableQty: 22,
    reorderLevel: 5,
  },
  {
    categoryName: "Steel & Reinforcement",
    sku: "MAT-STL-009",
    name: "Heavy Universal Column UC 356x368x129 S355JR",
    unit: "Beams (12m)",
    unitCost: 1420.0,
    availableQty: 46,
    reorderLevel: 10,
  },
  {
    categoryName: "Steel & Reinforcement",
    sku: "MAT-STL-010",
    name: "Structural Welded Wire Reinforcement Mesh (A393)",
    unit: "Sheets (4.8x2.4m)",
    unitCost: 58.0,
    availableQty: 640,
    reorderLevel: 120,
  },
  {
    categoryName: "Steel & Reinforcement",
    sku: "MAT-STL-011",
    name: "Mechanical Rebar Couplers Parallel Thread M32",
    unit: "Units",
    unitCost: 8.5,
    availableQty: 3200,
    reorderLevel: 500,
  },
  {
    categoryName: "Steel & Reinforcement",
    sku: "MAT-STL-012",
    name: "High-Strength Friction Grip (HSFG) Grade 8.8 Bolts M24",
    unit: "Boxes (100 pcs)",
    unitCost: 145.0,
    availableQty: 95,
    reorderLevel: 20,
  },

  // 3. Aggregates & Sands
  {
    categoryName: "Aggregates & Sands",
    sku: "MAT-AGG-007",
    name: "Crushed Black Granite 20mm Down-Graded Aggregate",
    unit: "Metric Tons",
    unitCost: 38.0,
    availableQty: 1650,
    reorderLevel: 300,
  },
  {
    categoryName: "Aggregates & Sands",
    sku: "MAT-AGG-008",
    name: "Crushed Granite 10mm Pea Gravel Shingles",
    unit: "Metric Tons",
    unitCost: 42.0,
    availableQty: 980,
    reorderLevel: 200,
  },
  {
    categoryName: "Aggregates & Sands",
    sku: "MAT-AGG-009",
    name: "Sylhet Coarse River Sand (Fineness Modulus FM 2.5)",
    unit: "Metric Tons",
    unitCost: 26.0,
    availableQty: 2400,
    reorderLevel: 450,
  },
  {
    categoryName: "Aggregates & Sands",
    sku: "MAT-AGG-010",
    name: "Manufactured Quarry Sand (M-Sand) Zone II",
    unit: "Metric Tons",
    unitCost: 31.0,
    availableQty: 1150,
    reorderLevel: 250,
  },
  {
    categoryName: "Aggregates & Sands",
    sku: "MAT-AGG-011",
    name: "Sub-Base Crushed Stone Aggregate (CBR > 80%)",
    unit: "Metric Tons",
    unitCost: 22.5,
    availableQty: 3800,
    reorderLevel: 600,
  },
  {
    categoryName: "Aggregates & Sands",
    sku: "MAT-AGG-012",
    name: "Rip-Rap Heavy River Boulder Rock Armor (200-400mm)",
    unit: "Metric Tons",
    unitCost: 48.0,
    availableQty: 820,
    reorderLevel: 150,
  },

  // 4. Electrical & Piping
  {
    categoryName: "Electrical & Piping",
    sku: "MAT-ELC-007",
    name: "33kV 3-Core 400mm² XLPE Copper Armored Cable",
    unit: "Drum (500m)",
    unitCost: 14500.0,
    availableQty: 8,
    reorderLevel: 2,
  },
  {
    categoryName: "Electrical & Piping",
    sku: "MAT-ELC-008",
    name: "High-Density Polyethylene (HDPE) SDR 11 Pipe 250mm",
    unit: "Lengths (12m)",
    unitCost: 165.0,
    availableQty: 140,
    reorderLevel: 30,
  },
  {
    categoryName: "Electrical & Piping",
    sku: "MAT-ELC-009",
    name: "Perforated Hot-Dip Galvanized Cable Tray 600x100mm",
    unit: "Lengths (3m)",
    unitCost: 46.0,
    availableQty: 380,
    reorderLevel: 60,
  },
  {
    categoryName: "Electrical & Piping",
    sku: "MAT-ELC-010",
    name: "Ductile Iron Class K9 Pressure Pipe 400mm",
    unit: "Lengths (6m)",
    unitCost: 520.0,
    availableQty: 65,
    reorderLevel: 15,
  },
  {
    categoryName: "Electrical & Piping",
    sku: "MAT-ELC-011",
    name: "Pure Electrolytic Copper Grounding Busbar 50x6mm",
    unit: "Meters",
    unitCost: 34.0,
    availableQty: 450,
    reorderLevel: 80,
  },
  {
    categoryName: "Electrical & Piping",
    sku: "MAT-ELC-012",
    name: "Schedule 40 Seamless Carbon Steel Fire Pipe 150mm",
    unit: "Lengths (6m)",
    unitCost: 210.0,
    availableQty: 110,
    reorderLevel: 25,
  },

  // 5. Heavy Machinery Spares
  {
    categoryName: "Heavy Machinery Spares",
    sku: "MAT-MCH-007",
    name: "Heavy Piling Rig Tungsten Carbide Core Drill Teeth",
    unit: "Sets (12 pcs)",
    unitCost: 480.0,
    availableQty: 35,
    reorderLevel: 8,
  },
  {
    categoryName: "Heavy Machinery Spares",
    sku: "MAT-MCH-008",
    name: "ISO 46 Anti-Wear Hydraulic Fluid (Shell Tellus S2)",
    unit: "Drums (209L)",
    unitCost: 620.0,
    availableQty: 24,
    reorderLevel: 6,
  },
  {
    categoryName: "Heavy Machinery Spares",
    sku: "MAT-MCH-009",
    name: "Non-Rotating Galvanized Steel Crane Hoist Wire Rope 28mm",
    unit: "Reels (1000m)",
    unitCost: 4200.0,
    availableQty: 5,
    reorderLevel: 2,
  },
  {
    categoryName: "Heavy Machinery Spares",
    sku: "MAT-MCH-010",
    name: "High-Pressure Rubber Concrete Delivery Hose 125mm",
    unit: "Sections (3m)",
    unitCost: 310.0,
    availableQty: 42,
    reorderLevel: 10,
  },
  {
    categoryName: "Heavy Machinery Spares",
    sku: "MAT-MCH-011",
    name: "Excavator Heavy-Duty Rock Chisel Breaker Moil Point",
    unit: "Units",
    unitCost: 890.0,
    availableQty: 16,
    reorderLevel: 4,
  },
  {
    categoryName: "Heavy Machinery Spares",
    sku: "MAT-MCH-012",
    name: "Heavy Track Chain Assembly for 35-Ton Hauler",
    unit: "Pairs",
    unitCost: 3600.0,
    availableQty: 6,
    reorderLevel: 2,
  },

  // 6. Finishing & Chemical Additives
  {
    categoryName: "Finishing & Chemical Additives",
    sku: "MAT-CHM-007",
    name: "Polycarboxylate Ether (PCE) Superplasticizer Sika ViscoCrete",
    unit: "Drums (200L)",
    unitCost: 380.0,
    availableQty: 55,
    reorderLevel: 12,
  },
  {
    categoryName: "Finishing & Chemical Additives",
    sku: "MAT-CHM-008",
    name: "Hydrophilic Bentonite Waterstop Strip (20x10mm)",
    unit: "Rolls (10m)",
    unitCost: 42.0,
    availableQty: 320,
    reorderLevel: 50,
  },
  {
    categoryName: "Finishing & Chemical Additives",
    sku: "MAT-CHM-009",
    name: "Two-Component Solvent-Free High-Build Epoxy Primer",
    unit: "Pails (20L)",
    unitCost: 175.0,
    availableQty: 85,
    reorderLevel: 20,
  },
  {
    categoryName: "Finishing & Chemical Additives",
    sku: "MAT-CHM-010",
    name: "Structural Silicone Facade Weatherproofing Sealant",
    unit: "Sausages (600ml)",
    unitCost: 9.8,
    availableQty: 1250,
    reorderLevel: 200,
  },
  {
    categoryName: "Finishing & Chemical Additives",
    sku: "MAT-CHM-011",
    name: "Water-Repellent Silane-Siloxane Concrete Impregnator",
    unit: "Drums (200L)",
    unitCost: 440.0,
    availableQty: 28,
    reorderLevel: 6,
  },
  {
    categoryName: "Finishing & Chemical Additives",
    sku: "MAT-CHM-012",
    name: "High-Strength Carbon Fiber Reinforced Polymer (CFRP) Wrap",
    unit: "Rolls (50m²)",
    unitCost: 1850.0,
    availableQty: 12,
    reorderLevel: 3,
  },
];

async function main() {
  console.log("=== BuildTrack 30+ Materials Expansion ===");

  const initialCount = await prisma.material.count();
  console.log(`Current materials in database: ${initialCount}`);

  // Fetch categories
  const categories = await prisma.materialCategory.findMany();
  const categoryMap = new Map();
  for (const cat of categories) {
    categoryMap.set(cat.name, cat.id);
  }

  // Fetch users & projects for transactions and indents
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  const siteEng = await prisma.user.findFirst({ where: { role: "SITE_ENGINEER" } });
  const contractor = await prisma.user.findFirst({ where: { role: "CONTRACTOR" } });
  const projects = await prisma.project.findMany({ select: { id: true, name: true } });

  let createdCount = 0;
  let transactionsCount = 0;
  let requestsCount = 0;

  for (let i = 0; i < NEW_MATERIALS.length; i++) {
    const item = NEW_MATERIALS[i];
    const categoryId = categoryMap.get(item.categoryName);

    if (!categoryId) {
      console.warn(`Category "${item.categoryName}" not found. Skipping ${item.sku}`);
      continue;
    }

    const material = await prisma.material.upsert({
      where: { sku: item.sku },
      update: {
        name: item.name,
        unit: item.unit,
        categoryId: categoryId,
        availableQty: item.availableQty,
        reorderLevel: item.reorderLevel,
        unitCost: item.unitCost,
      },
      create: {
        name: item.name,
        sku: item.sku,
        unit: item.unit,
        categoryId: categoryId,
        availableQty: item.availableQty,
        reorderLevel: item.reorderLevel,
        unitCost: item.unitCost,
      },
    });

    createdCount++;

    // Initial Inventory Receipt Audit Transaction
    await prisma.materialTransaction.create({
      data: {
        type: "RECEIVE",
        qty: item.availableQty,
        balanceAfter: item.availableQty,
        materialId: material.id,
        userId: admin ? admin.id : siteEng.id,
        notes: `Central warehouse initial intake batch for SKU ${item.sku}. Batch inspection and mill test reports verified.`,
      },
    });
    transactionsCount++;

    // Create Site Indent Request for a subset of materials (every 3rd material)
    if (i % 3 === 0) {
      const proj = projects[i % projects.length];
      const requester = (i % 2 === 0 ? siteEng : contractor) || admin;
      const reqQty = Math.max(5, Math.round(item.availableQty * 0.15));

      await prisma.materialRequest.create({
        data: {
          materialId: material.id,
          projectId: proj.id,
          requesterId: requester.id,
          qty: reqQty,
          status: i % 6 === 0 ? "APPROVED" : "PENDING",
          reason: `Urgent site requisition for active shift milestone on ${proj.name}. Required for immediate scheduled installation.`,
        },
      });
      requestsCount++;
    }

    console.log(`[${i + 1}/${NEW_MATERIALS.length}] Added SKU: ${item.sku} - ${item.name} (${item.categoryName})`);
  }

  const finalMaterialCount = await prisma.material.count();
  const finalTransactionsCount = await prisma.materialTransaction.count();
  const finalRequestsCount = await prisma.materialRequest.count();

  console.log("\n========================================================");
  console.log(`Expansion Complete!`);
  console.log(`Materials added/updated: ${createdCount}`);
  console.log(`Total materials in database: ${finalMaterialCount}`);
  console.log(`Total material transactions logged: ${finalTransactionsCount}`);
  console.log(`Total active site indent requests: ${finalRequestsCount}`);
  console.log("========================================================");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Material expansion error:", err);
  prisma.$disconnect();
  process.exit(1);
});

