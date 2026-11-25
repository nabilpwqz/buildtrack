import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log(" Cleaning existing data...");
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.document.deleteMany();
  await prisma.delayReport.deleteMany();
  await prisma.siteReport.deleteMany();
  await prisma.progressReport.deleteMany();
  await prisma.materialTransaction.deleteMany();
  await prisma.materialRequest.deleteMany();
  await prisma.material.deleteMany();
  await prisma.materialCategory.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.expenseCategory.deleteMany();
  await prisma.taskHistory.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.task.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.contractorPerformance.deleteMany();
  await prisma.projectContractor.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.contractor.deleteMany();
  await prisma.company.deleteMany();

  console.log(" Seeding Company...");
  const company = await prisma.company.create({
    data: {
      name: "Apex Infrastructure & Civil Engineering Corp",
      address: "Tower 71, Motijheel Commercial Area, Dhaka 1000",
      email: "hq@buildtrack.com",
      phone: "+880-2-9568400",
    },
  });

  console.log(" Seeding 24 Contractors...");
  const contractorDefs = [
    { name: "Rafiq Chowdhury", contact: "Rafiq Chowdhury", company: "Apex Steel & Rebar Mills Ltd", email: "contractor@buildtrack.com", phone: "+880-1711-001001", specialty: "Structural Steel & Reinforcement", rating: 4.8 },
    { name: "Mahbubur Rahman", contact: "Mahbubur Rahman", company: "Meghna Foundation & Piling", email: "meghna.piling@buildtrack.com", phone: "+880-1711-001002", specialty: "Deep Foundation & Cast-in-situ", rating: 4.6 },
    { name: "Zubair Al-Mamun", contact: "Zubair Al-Mamun", company: "Padma Pre-Cast Engineering", email: "padma.precast@buildtrack.com", phone: "+880-1711-001003", specialty: "Pre-stressed Concrete Girders", rating: 4.9 },
    { name: "Anwar Hossain", contact: "Anwar Hossain", company: "Bengal Electrical & HVAC Systems", email: "bengal.hvac@buildtrack.com", phone: "+880-1711-001004", specialty: "High Voltage MEP & Ventilation", rating: 4.3 },
    { name: "Jahangir Alam", contact: "Jahangir Alam", company: "Karnaphuli Heavy Earthmovers", email: "karnaphuli.earth@buildtrack.com", phone: "+880-1711-001005", specialty: "Excavation & Dredging", rating: 4.7 },
    { name: "Kamrul Hasan", contact: "Kamrul Hasan", company: "Dhaka Glass & Curtain Wall Facades", email: "dhaka.glass@buildtrack.com", phone: "+880-1711-001006", specialty: "Architectural Glazing & Facades", rating: 4.5 },
    { name: "Shahidul Islam", contact: "Shahidul Islam", company: "Chittagong Marine Structural Welding", email: "ctg.welding@buildtrack.com", phone: "+880-1711-001007", specialty: "Heavy Marine Welding & NDT", rating: 4.7 },
    { name: "Saifullah Mansur", contact: "Saifullah Mansur", company: "Surma Piping & Commercial Plumbing", email: "surma.plumb@buildtrack.com", phone: "+880-1711-001008", specialty: "Hydraulic Systems & Drainage", rating: 4.2 },
    { name: "Babul Kanti Das", contact: "Babul Kanti Das", company: "Barishal Waterproofing & Sealants", email: "barishal.water@buildtrack.com", phone: "+880-1711-001009", specialty: "Elastomeric Membrane Roofing", rating: 4.4 },
    { name: "Enamul Haque", contact: "Enamul Haque", company: "Jamuna Modular Scaffolding Systems", email: "jamuna.scaffold@buildtrack.com", phone: "+880-1711-001010", specialty: "Industrial Formwork & Staging", rating: 4.6 },
    { name: "Nazmul Huda", contact: "Nazmul Huda", company: "Sylhet Stone Quarry & Aggregates", email: "sylhet.stone@buildtrack.com", phone: "+880-1711-001011", specialty: "Crushed Granite & Quartz Aggregates", rating: 4.9 },
    { name: "Motiur Rahman", contact: "Motiur Rahman", company: "Rangpur Masonry & Bricklaying", email: "rangpur.masonry@buildtrack.com", phone: "+880-1711-001012", specialty: "Autoclaved Aerated Concrete Blocks", rating: 4.1 },
    { name: "Delwar Hossain", contact: "Delwar Hossain", company: "Khulna Marine Piling & Coastal Shoring", email: "khulna.piling@buildtrack.com", phone: "+880-1711-001013", specialty: "Sheet Piling & Revetments", rating: 4.5 },
    { name: "Ashraf Ali", contact: "Ashraf Ali", company: "Rajshahi Ready-Mix Concrete Solutions", email: "rajshahi.concrete@buildtrack.com", phone: "+880-1711-001014", specialty: "High Performance C60 Concrete", rating: 4.8 },
    { name: "Ziaur Rahman", contact: "Ziaur Rahman", company: "Cox's Bazar Coastal GeoTech Survey", email: "cox.geotech@buildtrack.com", phone: "+880-1711-001015", specialty: "Subsurface Drilling & CPT Testing", rating: 4.7 },
    { name: "Faruk Ahmed", contact: "Faruk Ahmed", company: "Comilla Fire Safety & Sprinklers", email: "comilla.fire@buildtrack.com", phone: "+880-1711-001016", specialty: "NFPA Fire Suppression & Detection", rating: 4.8 },
    { name: "Tanvir Hasan", contact: "Tanvir Hasan", company: "Gazipur Structural Steel Fabricators", email: "gazipur.steel@buildtrack.com", phone: "+880-1711-001017", specialty: "Heavy Portal Frames & Trusses", rating: 4.6 },
    { name: "Rezaul Karim", contact: "Rezaul Karim", company: "Narayanganj High Pressure Piping", email: "narayanganj.pipe@buildtrack.com", phone: "+880-1711-001018", specialty: "Gas & Steam Pipeline Erection", rating: 4.4 },
    { name: "Sirajul Islam", contact: "Sirajul Islam", company: "Bogura Highway Bitumen & Asphalt", email: "bogura.road@buildtrack.com", phone: "+880-1711-001019", specialty: "Heavy Duty Asphalt Paving", rating: 4.5 },
    { name: "Abul Kashem", contact: "Abul Kashem", company: "Mymensingh Heavy Earthmoving Fleet", email: "mymensingh.earth@buildtrack.com", phone: "+880-1711-001020", specialty: "Bulldozers & Motor Graders Fleet", rating: 4.3 },
    { name: "Gias Uddin", contact: "Gias Uddin", company: "Kushtia Central Chillers & Ventilation", email: "kushtia.hvac@buildtrack.com", phone: "+880-1711-001021", specialty: "Centrifugal Chillers & Ductwork", rating: 4.6 },
    { name: "Harunur Rashid", contact: "Harunur Rashid", company: "Dinajpur High-Speed Elevators", email: "dinajpur.lift@buildtrack.com", phone: "+880-1711-001022", specialty: "Traction Elevators & Escalators", rating: 4.7 },
    { name: "Golam Mostafa", contact: "Golam Mostafa", company: "Feni Thermal Roof & Wall Insulation", email: "feni.insulation@buildtrack.com", phone: "+880-1711-001023", specialty: "Rockwool & Polyurethane Cladding", rating: 4.4 },
    { name: "Selim Reza", contact: "Selim Reza", company: "Pabna Site Remediation & EHS Ltd", email: "pabna.ehs@buildtrack.com", phone: "+880-1711-001024", specialty: "Environmental Containment & Safety", rating: 4.9 },
  ];

  const contractors: any[] = [];
  for (const c of contractorDefs) {
    const created = await prisma.contractor.create({ data: c });
    contractors.push(created);
  }

  console.log(" Seeding Key Users...");
  const hashedPassword = await bcrypt.hash("Demo@1234", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@buildtrack.com",
      passwordHash: hashedPassword,
      name: "Engr. Kabir Hossain",
      role: "ADMIN",
      companyId: company.id,
      status: "ACTIVE",
    },
  });

  const pm = await prisma.user.create({
    data: {
      email: "pm@buildtrack.com",
      passwordHash: hashedPassword,
      name: "Tariqul Islam, PMP",
      role: "PROJECT_MANAGER",
      companyId: company.id,
      status: "ACTIVE",
    },
  });

  const engineer = await prisma.user.create({
    data: {
      email: "engineer@buildtrack.com",
      passwordHash: hashedPassword,
      name: "Farhana Ahmed, PE",
      role: "SITE_ENGINEER",
      companyId: company.id,
      status: "ACTIVE",
    },
  });

  const finance = await prisma.user.create({
    data: {
      email: "finance@buildtrack.com",
      passwordHash: hashedPassword,
      name: "Nasir Uddin, FCA",
      role: "FINANCE_MANAGER",
      companyId: company.id,
      status: "ACTIVE",
    },
  });

  const contractorUser = await prisma.user.create({
    data: {
      email: "contractor@buildtrack.com",
      passwordHash: hashedPassword,
      name: "Rafiq Chowdhury (Apex Steel)",
      role: "CONTRACTOR",
      contractorId: contractors[0].id,
      companyId: company.id,
      status: "ACTIVE",
    },
  });

  // Additional engineers and managers
  const engineer2 = await prisma.user.create({
    data: {
      email: "engineer2@buildtrack.com",
      passwordHash: hashedPassword,
      name: "Tanvir Rahman, Site Lead",
      role: "SITE_ENGINEER",
      companyId: company.id,
      status: "ACTIVE",
    },
  });

  const pm2 = await prisma.user.create({
    data: {
      email: "pm2@buildtrack.com",
      passwordHash: hashedPassword,
      name: "Sadia Siddiqua, Senior PM",
      role: "PROJECT_MANAGER",
      companyId: company.id,
      status: "ACTIVE",
    },
  });

  console.log(" Seeding Expense Categories...");
  const expenseCatDefs = [
    { name: "Structural & Concrete Works", code: "EXP-STR", description: "Piling, foundations, structural concrete, slabs" },
    { name: "Steel & Rebar Reinforcement", code: "EXP-STL", description: "Deformed rebar 500W, structural steel I-beams, plate girders" },
    { name: "Electrical & MEP Infrastructure", code: "EXP-MEP", description: "Substations, busbars, cabling, HVAC air handling units" },
    { name: "Heavy Equipment, Cranes & Fuel", code: "EXP-EQP", description: "Tower crane leases, crawler excavators, diesel fuel supply" },
    { name: "Specialized Subcontracting", code: "EXP-SUB", description: "Specialized engineering labor and subcontracting works" },
    { name: "Architectural Facades & Finishing", code: "EXP-FAC", description: "Curtain glazing, composite cladding, insulation" },
  ];

  const expenseCategories: any[] = [];
  for (const ec of expenseCatDefs) {
    const created = await prisma.expenseCategory.create({ data: ec });
    expenseCategories.push(created);
  }

  console.log(" Seeding Material Categories and 36 Materials...");
  const matCatDefs = [
    { name: "Cement & Binders", description: "Portland composite cement, slag cement, micro-silica" },
    { name: "Steel & Reinforcement", description: "Grade 500W deformed bars, structural steel plates, prestressing strands" },
    { name: "Aggregates & Sands", description: "Coarse crushed granite, Sylhet graded sand, river shingles" },
    { name: "Electrical & Piping", description: "High-voltage armored copper cables, CPVC fire pipes, conduits" },
    { name: "Heavy Machinery Spares", description: "Excavator bucket teeth, hydraulic fluid ISO 68, crane wire ropes" },
    { name: "Finishing & Chemical Additives", description: "Superplasticizers, waterstops, epoxy primer, facade sealants" },
  ];

  const materialCategories: any[] = [];
  for (const mc of matCatDefs) {
    const created = await prisma.materialCategory.create({ data: mc });
    materialCategories.push(created);
  }

  const materialDefs = [
    // Category 0: Cement & Binders
    { name: "Portland Composite Cement CEM-II 42.5N", sku: "MAT-CEM-001", unit: "Bags (50kg)", categoryId: materialCategories[0].id, availableQty: 1850, reorderLevel: 500, unitCost: 6.2 },
    { name: "Ordinary Portland Cement CEM-I 52.5R", sku: "MAT-CEM-002", unit: "Bags (50kg)", categoryId: materialCategories[0].id, availableQty: 240, reorderLevel: 400, unitCost: 7.8 }, // LOW STOCK!
    { name: "Slag Cement Ground Granulated Blast", sku: "MAT-CEM-003", unit: "Metric Tons", categoryId: materialCategories[0].id, availableQty: 85, reorderLevel: 30, unitCost: 95.0 },
    { name: "Non-Shrink Structural Grout Sika-212", sku: "MAT-CEM-004", unit: "Bags (25kg)", categoryId: materialCategories[0].id, availableQty: 320, reorderLevel: 100, unitCost: 18.5 },
    { name: "Condensed Micro-Silica Slurry", sku: "MAT-CEM-005", unit: "Drums (200L)", categoryId: materialCategories[0].id, availableQty: 14, reorderLevel: 25, unitCost: 220.0 }, // LOW STOCK!
    { name: "Rapid Hardening Hydraulic Cement", sku: "MAT-CEM-006", unit: "Bags (50kg)", categoryId: materialCategories[0].id, availableQty: 410, reorderLevel: 150, unitCost: 11.0 },

    // Category 1: Steel & Reinforcement
    { name: "Deformed Bar 16mm Grade 500W BSRM", sku: "MAT-STL-001", unit: "Metric Tons", categoryId: materialCategories[1].id, availableQty: 120, reorderLevel: 40, unitCost: 980.0 },
    { name: "Deformed Bar 25mm Grade 500W AKS", sku: "MAT-STL-002", unit: "Metric Tons", categoryId: materialCategories[1].id, availableQty: 28, reorderLevel: 50, unitCost: 995.0 }, // LOW STOCK!
    { name: "Pre-stressing Low-Relaxation Strand 15.2mm", sku: "MAT-STL-003", unit: "Coils (3T)", categoryId: materialCategories[1].id, availableQty: 16, reorderLevel: 10, unitCost: 3400.0 },
    { name: "Structural I-Beam HEB 300 S355JR", sku: "MAT-STL-004", unit: "Beams (12m)", categoryId: materialCategories[1].id, availableQty: 74, reorderLevel: 20, unitCost: 680.0 },
    { name: "Hot-Rolled Steel Plate 20mm Q345B", sku: "MAT-STL-005", unit: "Plates", categoryId: materialCategories[1].id, availableQty: 42, reorderLevel: 15, unitCost: 450.0 },
    { name: "Epoxy Coated Tie Wire 16 Gauge", sku: "MAT-STL-006", unit: "Bundles (25kg)", categoryId: materialCategories[1].id, availableQty: 18, reorderLevel: 35, unitCost: 42.0 }, // LOW STOCK!

    // Category 2: Aggregates & Sands
    { name: "Sylhet Coarse Sand (FM 2.5 - 2.8)", sku: "MAT-AGG-001", unit: "Cubic Feet (cft)", categoryId: materialCategories[2].id, availableQty: 14500, reorderLevel: 4000, unitCost: 0.85 },
    { name: "Crushed Black Granite Stone 20mm Down", sku: "MAT-AGG-002", unit: "Cubic Feet (cft)", categoryId: materialCategories[2].id, availableQty: 22000, reorderLevel: 6000, unitCost: 1.65 },
    { name: "River Gravel Shingles 10mm-12mm", sku: "MAT-AGG-003", unit: "Cubic Feet (cft)", categoryId: materialCategories[2].id, availableQty: 3200, reorderLevel: 5000, unitCost: 1.40 }, // LOW STOCK!
    { name: "Stone Dust Fine Filler (FM 1.5)", sku: "MAT-AGG-004", unit: "Cubic Feet (cft)", categoryId: materialCategories[2].id, availableQty: 8500, reorderLevel: 2500, unitCost: 0.55 },
    { name: "Select Granular Sub-base Fill Material", sku: "MAT-AGG-005", unit: "Cubic Meters", categoryId: materialCategories[2].id, availableQty: 1200, reorderLevel: 400, unitCost: 14.0 },
    { name: "Bentonite Drilling Mud Powder", sku: "MAT-AGG-006", unit: "Bags (25kg)", categoryId: materialCategories[2].id, availableQty: 45, reorderLevel: 100, unitCost: 19.5 }, // LOW STOCK!

    // Category 3: Electrical & Piping
    { name: "4-Core 185mm² XLPE Armored Copper Cable", sku: "MAT-ELC-001", unit: "Meters", categoryId: materialCategories[3].id, availableQty: 650, reorderLevel: 200, unitCost: 65.0 },
    { name: "CPVC Fire Sprinkler Pipe Schedule 40 4-inch", sku: "MAT-ELC-002", unit: "Lengths (6m)", categoryId: materialCategories[3].id, availableQty: 110, reorderLevel: 40, unitCost: 88.0 },
    { name: "HDPE Conduit Pipe 50mm PN10", sku: "MAT-ELC-003", unit: "Rolls (100m)", categoryId: materialCategories[3].id, availableQty: 26, reorderLevel: 15, unitCost: 125.0 },
    { name: "Cast Iron Drainage Pipe 6-inch Heavy", sku: "MAT-ELC-004", unit: "Lengths (3m)", categoryId: materialCategories[3].id, availableQty: 9, reorderLevel: 25, unitCost: 74.0 }, // LOW STOCK!
    { name: "Industrial LED High Bay Luminaire 200W", sku: "MAT-ELC-005", unit: "Fixtures", categoryId: materialCategories[3].id, availableQty: 85, reorderLevel: 30, unitCost: 115.0 },
    { name: "Copper Earthing Rod 20mm x 3m", sku: "MAT-ELC-006", unit: "Rods", categoryId: materialCategories[3].id, availableQty: 60, reorderLevel: 20, unitCost: 48.0 },

    // Category 4: Heavy Machinery Spares
    { name: "Hydraulic Fluid ISO VG 68 Anti-Wear", sku: "MAT-MCH-001", unit: "Barrels (208L)", categoryId: materialCategories[4].id, availableQty: 18, reorderLevel: 8, unitCost: 480.0 },
    { name: "Heavy Excavator Bucket Teeth CAT 336", sku: "MAT-MCH-002", unit: "Pieces", categoryId: materialCategories[4].id, availableQty: 6, reorderLevel: 15, unitCost: 95.0 }, // LOW STOCK!
    { name: "High-Tensile Crane Wire Rope 24mm (6x36)", sku: "MAT-MCH-003", unit: "Meters", categoryId: materialCategories[4].id, availableQty: 450, reorderLevel: 200, unitCost: 28.0 },
    { name: "Diesel Engine Oil 15W-40 CI-4 Heavy", sku: "MAT-MCH-004", unit: "Barrels (208L)", categoryId: materialCategories[4].id, availableQty: 12, reorderLevel: 6, unitCost: 520.0 },
    { name: "Crawler Track Shoes & Master Link Set", sku: "MAT-MCH-005", unit: "Sets", categoryId: materialCategories[4].id, availableQty: 2, reorderLevel: 4, unitCost: 3200.0 }, // LOW STOCK!
    { name: "Pneumatic High-Pressure Hose 1-inch 350 Bar", sku: "MAT-MCH-006", unit: "Meters", categoryId: materialCategories[4].id, availableQty: 140, reorderLevel: 50, unitCost: 16.5 },

    // Category 5: Finishing & Chemical Additives
    { name: "Polycarboxylate High-Range Superplasticizer", sku: "MAT-CHM-001", unit: "Totes (1000L)", categoryId: materialCategories[5].id, availableQty: 8, reorderLevel: 3, unitCost: 1450.0 },
    { name: "Hydrophilic Swellable Waterstop Bar 20x10", sku: "MAT-CHM-002", unit: "Rolls (10m)", categoryId: materialCategories[5].id, availableQty: 48, reorderLevel: 20, unitCost: 45.0 },
    { name: "Epoxy Zinc-Rich Metal Primer Anti-Corrosion", sku: "MAT-CHM-003", unit: "Pails (20L)", categoryId: materialCategories[5].id, availableQty: 34, reorderLevel: 15, unitCost: 135.0 },
    { name: "Silicone Weatherproofing Sealant Dow-791", sku: "MAT-CHM-004", unit: "Sausages (600ml)", categoryId: materialCategories[5].id, availableQty: 180, reorderLevel: 100, unitCost: 8.5 },
    { name: "Curing Compound Membrane Forming Wax", sku: "MAT-CHM-005", unit: "Drums (200L)", categoryId: materialCategories[5].id, availableQty: 4, reorderLevel: 10, unitCost: 240.0 }, // LOW STOCK!
    { name: "Thermal Acoustic Rockwool Insulation Slab", sku: "MAT-CHM-006", unit: "Packs (6m²)", categoryId: materialCategories[5].id, availableQty: 220, reorderLevel: 80, unitCost: 38.0 },
  ];

  const materials: any[] = [];
  for (const m of materialDefs) {
    const created = await prisma.material.create({ data: m });
    materials.push(created);
  }

  console.log("️ Seeding 12 Projects...");
  const projectDefs = [
    {
      name: "Dhaka Metro Elevated Viaduct Phase 3",
      description: "Construction of 8.2 km dual-track elevated pre-stressed concrete viaduct with 6 rapid-transit passenger stations.",
      location: "Agargaon to Motijheel, Dhaka",
      startDate: new Date("2024-01-15"),
      expectedEndDate: new Date("2025-12-31"),
      totalBudget: 42000000,
      status: "IN_PROGRESS",
      progress: 68,
      managerId: pm.id,
      companyId: company.id,
    },
    {
      name: "Karnaphuli River Deep-Water Terminal",
      description: "Specialized maritime container terminal with 850m deep-water berthing quay, heavy gantry crane rails, and coastal dredging.",
      location: "Patenga, Chattogram",
      startDate: new Date("2024-03-01"),
      expectedEndDate: new Date("2026-06-30"),
      totalBudget: 65000000,
      status: "IN_PROGRESS",
      progress: 44,
      managerId: pm.id,
      companyId: company.id,
    },
    {
      name: "Sylhet International Trade Center",
      description: "28-story mixed commercial and exhibition center featuring high-efficiency curtain glazing and subterranean automated parking.",
      location: "Subidbazar, Sylhet",
      startDate: new Date("2025-02-01"),
      expectedEndDate: new Date("2027-08-30"),
      totalBudget: 28000000,
      status: "PLANNING",
      progress: 10,
      managerId: pm2.id,
      companyId: company.id,
    },
    {
      name: "Padma Logistic City & Heavy Depot",
      description: "Multi-modal logistics park spanning 120 acres with 4 temperature-controlled warehouses and intermodal rail siding.",
      location: "Mawa Highway, Munshiganj",
      startDate: new Date("2023-08-01"),
      expectedEndDate: new Date("2024-10-31"), // OVERDUE / DELAYED
      totalBudget: 34000000,
      status: "DELAYED",
      progress: 52,
      managerId: pm.id,
      companyId: company.id,
    },
    {
      name: "Gulshan High-Rise Financial Spire",
      description: "36-story Grade-A financial headquarters designed with seismic dampers, double-glazed low-E facades, and helipad.",
      location: "Gulshan Avenue, Dhaka",
      startDate: new Date("2023-11-01"),
      expectedEndDate: new Date("2026-04-15"),
      totalBudget: 55000000,
      status: "IN_PROGRESS",
      progress: 58,
      managerId: pm.id,
      companyId: company.id,
    },
    {
      name: "Chattogram Port Dry Dock Expansion",
      description: "Panamax-class vessel repair drydock with 45m wide tidal caisson gate and 120-ton travelling portal jib cranes.",
      location: "Port Access Road, Chattogram",
      startDate: new Date("2022-09-01"),
      expectedEndDate: new Date("2024-08-30"),
      actualEndDate: new Date("2024-08-25"),
      totalBudget: 38000000,
      status: "COMPLETED",
      progress: 100,
      managerId: pm2.id,
      companyId: company.id,
    },
    {
      name: "Cox's Bazar Sea-View Eco Resort",
      description: "Sustainable luxury eco-resort with 120 timber-and-concrete beachfront villas, desalinization plant, and solar micro-grid.",
      location: "Marine Drive, Inani, Cox's Bazar",
      startDate: new Date("2024-02-15"),
      expectedEndDate: new Date("2025-11-30"),
      totalBudget: 19500000,
      status: "IN_PROGRESS",
      progress: 39,
      managerId: pm2.id,
      companyId: company.id,
    },
    {
      name: "Rupur Industrial Township Block D",
      description: "Residential and civic infrastructure for 4,000 engineering personnel including substation, water treatment, and community center.",
      location: "Ishwardi, Pabna",
      startDate: new Date("2023-06-01"),
      expectedEndDate: new Date("2025-05-30"),
      totalBudget: 24000000,
      status: "ON_HOLD",
      progress: 35,
      managerId: pm.id,
      companyId: company.id,
    },
    {
      name: "Tejgaon Smart Urban Flyover",
      description: "3.4 km 4-lane elevated corridor connecting central industrial hub to national expressway with intelligent LED guidance.",
      location: "Tejgaon Industrial Area, Dhaka",
      startDate: new Date("2024-04-01"),
      expectedEndDate: new Date("2025-09-15"),
      totalBudget: 31000000,
      status: "IN_PROGRESS",
      progress: 48,
      managerId: pm.id,
      companyId: company.id,
    },
    {
      name: "Khulna Power Transmission Hub",
      description: "400kV gas-insulated high-voltage substation with river-crossing steel lattice towers and SCADA control center.",
      location: "Rupsha Industrial Corridor, Khulna",
      startDate: new Date("2023-09-15"),
      expectedEndDate: new Date("2024-11-15"), // DELAYED / OVERDUE
      totalBudget: 29000000,
      status: "DELAYED",
      progress: 61,
      managerId: pm2.id,
      companyId: company.id,
    },
    {
      name: "Uttara North Commercial Complex",
      description: "14-story institutional complex with underground multi-level retail, bus concourse, and LEED Platinum certification.",
      location: "Sector 18, Uttara, Dhaka",
      startDate: new Date("2022-11-01"),
      expectedEndDate: new Date("2024-05-30"),
      actualEndDate: new Date("2024-05-20"),
      totalBudget: 22000000,
      status: "COMPLETED",
      progress: 100,
      managerId: pm.id,
      companyId: company.id,
    },
    {
      name: "Barishal Inland River Port Wharf",
      description: "Modern cargo landing wharf and passenger jetty with flood-resilient reinforced concrete revetment embankments.",
      location: "Kirtankhola Riverfront, Barishal",
      startDate: new Date("2024-05-01"),
      expectedEndDate: new Date("2026-02-28"),
      totalBudget: 17500000,
      status: "IN_PROGRESS",
      progress: 28,
      managerId: pm2.id,
      companyId: company.id,
    },
  ];

  const projects: any[] = [];
  for (const p of projectDefs) {
    const created = await prisma.project.create({ data: p });
    projects.push(created);

    // Add members
    await prisma.projectMember.create({
      data: {
        projectId: created.id,
        userId: engineer.id,
        role: "LEAD_SITE_ENGINEER",
      },
    });

    await prisma.projectMember.create({
      data: {
        projectId: created.id,
        userId: engineer2.id,
        role: "FIELD_ENGINEER",
      },
    });
  }

  // Link contractors to projects
  for (let i = 0; i < projects.length; i++) {
    const c1 = contractors[i % contractors.length];
    const c2 = contractors[(i + 5) % contractors.length];
    await prisma.projectContractor.create({
      data: { projectId: projects[i].id, contractorId: c1.id, role: "Prime Civil Subcontractor" },
    });
    await prisma.projectContractor.create({
      data: { projectId: projects[i].id, contractorId: c2.id, role: "Specialized MEP Contractor" },
    });

    // Seed contractor performance records
    await prisma.contractorPerformance.create({
      data: {
        contractorId: c1.id,
        projectId: projects[i].id,
        onTimeRate: 92.5 - (i * 2 % 15),
        qualityScore: 4.7 - (i * 0.1 % 0.8),
        delayIncidents: i % 3 === 0 ? 1 : 0,
        notes: "Strict adherence to quality and safety standards.",
      },
    });
  }

  console.log(" Seeding Milestones for 12 Projects...");
  for (const proj of projects) {
    const milestoneDefs = [
      { title: "Foundation & Subsurface Geotech Complete", description: "Bored cast-in-situ piles and pile-cap load testing approved", order: 1, targetDate: new Date("2024-04-30"), status: "COMPLETED" },
      { title: "Superstructure Steel & Concrete Framing", description: "Main vertical piers, steel I-beams, and structural floor decks", order: 2, targetDate: new Date("2024-10-31"), status: proj.status === "COMPLETED" ? "COMPLETED" : "IN_PROGRESS" },
      { title: "Building Envelope, Roofing & Waterproofing", description: "Exterior facades, curtain glazing, and elastomeric roofing", order: 3, targetDate: new Date("2025-05-30"), status: proj.status === "COMPLETED" ? "COMPLETED" : "PENDING" },
      { title: "MEP, Heavy Electromechanical & Fire Systems", description: "Substation commissioning, HVAC ductwork, and sprinkler network", order: 4, targetDate: new Date("2025-09-30"), status: proj.status === "COMPLETED" ? "COMPLETED" : "PENDING" },
      { title: "Final Fit-out, Commissioning & Handover", description: "Integrated systems testing, punch-list sign-off, client handover", order: 5, targetDate: new Date("2025-12-31"), status: proj.status === "COMPLETED" ? "COMPLETED" : "PENDING" },
    ];
    for (const m of milestoneDefs) {
      await prisma.milestone.create({
        data: {
          ...m,
          projectId: proj.id,
        },
      });
    }
  }

  console.log(" Seeding 120+ Tasks with Dependencies & Overdue States...");
  const taskTitles = [
    { title: "Soil Boring & Standard Penetration Test (SPT)", hours: 40, priority: "HIGH" },
    { title: "Site Clearing, Excavation & Dewatering", hours: 120, priority: "MEDIUM" },
    { title: "Bored Pile Cast-in-situ (600mm dia)", hours: 240, priority: "CRITICAL" },
    { title: "Pile Cap Reinforcement & Concrete Pour", hours: 160, priority: "CRITICAL" },
    { title: "Subterranean Retaining Wall Construction", hours: 180, priority: "HIGH" },
    { title: "Basement SOG (Slab-on-Grade) Waterproofing", hours: 90, priority: "MEDIUM" },
    { title: "Structural Steel Column Erection (Plaza Level)", hours: 140, priority: "HIGH" },
    { title: "Composite Metal Deck Floor Slabs Casting", hours: 200, priority: "HIGH" },
    { title: "Elevated Box Girder Segment Pre-stressing", hours: 320, priority: "CRITICAL" },
    { title: "Exterior Glass Facade Mullion Anchoring", hours: 150, priority: "MEDIUM" },
    { title: "High-Voltage Transformer Substation Rigging", hours: 110, priority: "CRITICAL" },
    { title: "Primary HVAC Chilled Water Ductwork Riser", hours: 130, priority: "MEDIUM" },
    { title: "NFPA Fire Standpipe & Wet Sprinkler Network", hours: 140, priority: "HIGH" },
    { title: "Acoustic Insulation & Drywall Partitioning", hours: 80, priority: "LOW" },
    { title: "Elevator Guide Rails Alignment & Hoistway Erection", hours: 160, priority: "HIGH" },
  ];

  const allCreatedTasks: any[] = [];
  const now = new Date();

  for (let pIdx = 0; pIdx < projects.length; pIdx++) {
    const proj = projects[pIdx];
    const projectTasks: any[] = [];

    for (let tIdx = 0; tIdx < taskTitles.length; tIdx++) {
      const tInfo = taskTitles[tIdx];
      let status = "TODO";
      let progress = 0;
      let deadline = new Date(now.getTime() + (tIdx - 4) * 5 * 24 * 60 * 60 * 1000);

      if (proj.status === "COMPLETED") {
        status = "COMPLETED";
        progress = 100;
        deadline = new Date(proj.startDate.getTime() + (tIdx + 1) * 20 * 24 * 60 * 60 * 1000);
      } else if (tIdx < 4) {
        status = "COMPLETED";
        progress = 100;
      } else if (tIdx === 4 || tIdx === 5) {
        status = "IN_PROGRESS";
        progress = 65;
      } else if (tIdx === 6) {
        status = "REVIEW";
        progress = 90;
      } else {
        status = "TODO";
        progress = 0;
      }

      // Create deliberate OVERDUE condition for project 3 (Padma Logistics) and project 9 (Khulna Power)
      if ((proj.status === "DELAYED" || pIdx === 3 || pIdx === 9) && (tIdx === 4 || tIdx === 5)) {
        deadline = new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000); // 12 days ago!
        status = "IN_PROGRESS";
      }

      const createdTask = await prisma.task.create({
        data: {
          projectId: proj.id,
          title: `${tInfo.title} - Sec ${pIdx + 1}`,
          description: `Detailed engineering and execution for ${tInfo.title} strictly adhering to BNBC 2020 specifications.`,
          assigneeId: tIdx % 2 === 0 ? engineer.id : engineer2.id,
          priority: tInfo.priority,
          deadline,
          status,
          progress,
          estimatedHours: tInfo.hours,
          actualHours: status === "COMPLETED" ? tInfo.hours * 0.95 : tInfo.hours * (progress / 100),
          completedAt: status === "COMPLETED" ? new Date() : null,
        },
      });

      projectTasks.push(createdTask);
      allCreatedTasks.push(createdTask);

      // Task History
      await prisma.taskHistory.create({
        data: {
          taskId: createdTask.id,
          userId: engineer.id,
          action: "INITIAL_CREATION",
          from: null,
          to: status,
          details: `Task initiated with estimated duration of ${tInfo.hours} hours.`,
        },
      });

      // Task Comment
      if (tIdx === 4) {
        await prisma.taskComment.create({
          data: {
            taskId: createdTask.id,
            userId: pm.id,
            content: "Please ensure slump cone testing report is certified before proceeding with the pour.",
          },
        });
        await prisma.taskComment.create({
          data: {
            taskId: createdTask.id,
            userId: engineer.id,
            content: "Understood. Slump measured at 160mm, cubes casted for 7 and 28-day break tests.",
          },
        });
      }
    }

    // Create Dependencies:
    // Task 2 depends on Task 1
    // Task 3 depends on Task 2
    // Task 7 depends on Task 4
    // Task 8 depends on Task 7
    // This allows testing blocked statuses!
    if (projectTasks.length >= 8) {
      await prisma.taskDependency.create({
        data: { taskId: projectTasks[1].id, dependsOnId: projectTasks[0].id },
      });
      await prisma.taskDependency.create({
        data: { taskId: projectTasks[2].id, dependsOnId: projectTasks[1].id },
      });
      await prisma.taskDependency.create({
        data: { taskId: projectTasks[6].id, dependsOnId: projectTasks[3].id },
      });
      await prisma.taskDependency.create({
        data: { taskId: projectTasks[7].id, dependsOnId: projectTasks[6].id },
      });
    }
  }

  console.log(` Total ${allCreatedTasks.length} Tasks seeded.`);

  console.log(" Seeding Project Budgets & 60+ Realistic Expenses across 12 Months...");
  // Create Budgets for each project across the 6 categories
  for (let i = 0; i < projects.length; i++) {
    const proj = projects[i];
    const catAllocations = [0.30, 0.25, 0.15, 0.12, 0.10, 0.08]; // sum = 1.0

    for (let c = 0; c < expenseCategories.length; c++) {
      const alloc = Math.round(proj.totalBudget * catAllocations[c]);
      await prisma.budget.create({
        data: {
          projectId: proj.id,
          categoryId: expenseCategories[c].id,
          allocated: alloc,
        },
      });
    }
  }

  // 60+ realistic expenses across the past 12 months
  const expenseDescriptions = [
    { title: "Monthly Cement & Concrete Supply Batch", catIdx: 0, baseAmount: 85000 },
    { title: "High-Tensile Deformed Rebar Delivery", catIdx: 1, baseAmount: 145000 },
    { title: "Substation Switchgear & Cabling Advance", catIdx: 2, baseAmount: 72000 },
    { title: "Tower Crane Mobilization & Diesel Fuel", catIdx: 3, baseAmount: 58000 },
    { title: "Specialized Piling Subcontractor Billing", catIdx: 4, baseAmount: 110000 },
    { title: "Glazing Mullion & Thermal Insulation Batch", catIdx: 5, baseAmount: 43000 },
  ];

  let expenseCount = 0;
  for (let monthOffset = 11; monthOffset >= 0; monthOffset--) {
    const expenseDate = new Date();
    expenseDate.setMonth(expenseDate.getMonth() - monthOffset);
    expenseDate.setDate(10 + (monthOffset % 15));

    for (let pIdx = 0; pIdx < 6; pIdx++) {
      const proj = projects[pIdx];
      const descItem = expenseDescriptions[(monthOffset + pIdx) % expenseDescriptions.length];
      const variance = 1 + ((monthOffset * 7 + pIdx * 13) % 25) / 100;
      const amount = Math.round(descItem.baseAmount * variance);

      // On Project 3 (Padma Logistics), push an expense OVER budget to trigger OVERRUN alert
      const finalAmount = (pIdx === 3 && descItem.catIdx === 0) ? amount * 3.5 : amount;

      await prisma.expense.create({
        data: {
          title: `${descItem.title} - ${proj.name.substring(0, 18)}`,
          projectId: proj.id,
          categoryId: expenseCategories[descItem.catIdx].id,
          amount: finalAmount,
          date: expenseDate,
          description: `Certified interim payment certificate #IPC-${monthOffset + 1}-${pIdx + 1} for verified materials/services.`,
          recordedById: finance.id,
          documentUrl: `/uploads/ipc_${monthOffset + 1}_${pIdx + 1}.pdf`,
        },
      });
      expenseCount++;
    }
  }
  console.log(` Seeded ${expenseCount} Expenses across 12 months.`);

  console.log(" Seeding Material Requests & Transactions...");
  for (let i = 0; i < 15; i++) {
    const mat = materials[i % materials.length];
    const proj = projects[i % projects.length];
    const reqStatus = i % 4 === 0 ? "PENDING" : i % 4 === 1 ? "APPROVED" : i % 4 === 2 ? "FULFILLED" : "REJECTED";

    const mReq = await prisma.materialRequest.create({
      data: {
        materialId: mat.id,
        projectId: proj.id,
        requesterId: contractorUser.id,
        qty: 50 + (i * 20),
        status: reqStatus,
        reason: "Required for scheduled concrete casting and framing works next week.",
        approvedBy: reqStatus === "APPROVED" || reqStatus === "FULFILLED" ? pm.id : null,
      },
    });

    // If fulfilled or approved, log a material transaction
    if (reqStatus === "FULFILLED") {
      await prisma.materialTransaction.create({
        data: {
          type: "ISSUE",
          qty: 50 + (i * 20),
          balanceAfter: Math.max(0, mat.availableQty - (50 + i * 20)),
          materialId: mat.id,
          projectId: proj.id,
          userId: engineer.id,
          notes: `Dispatched to site per request #${mReq.id.substring(0, 8)}`,
        },
      });
    }
  }

  console.log(" Seeding Progress, Site & Delay Reports...");
  for (let i = 0; i < 8; i++) {
    const proj = projects[i];

    // Progress report
    await prisma.progressReport.create({
      data: {
        projectId: proj.id,
        percentage: 60 + (i * 3),
        description: "Rebar tying and formwork inspection completed successfully for Grid Line A-E.",
        photos: JSON.stringify([
          "/demo/site-inspect-1.jpg",
          "/demo/site-inspect-2.jpg",
        ]),
        reportedById: engineer.id,
        date: new Date(now.getTime() - i * 3 * 24 * 60 * 60 * 1000),
      },
    });

    // Site report
    await prisma.siteReport.create({
      data: {
        projectId: proj.id,
        reportedById: engineer.id,
        date: new Date(now.getTime() - i * 2 * 24 * 60 * 60 * 1000),
        weather: i % 2 === 0 ? "Clear & Sunny (32°C)" : "Humid & Intermittent Rain (28°C)",
        workersCount: 84 + (i * 12),
        equipmentOnSite: "2x Tower Cranes, 4x Concrete Mixers, 1x Crawler Boom Pump",
        workCompleted: "Poured 180 m³ of grade C40 concrete in sector B pier foundation.",
        issuesFaced: i === 3 ? "Heavy rainfall delayed concrete pour by 4 hours; protective tarpaulins deployed." : "None. Work progressed according to baseline schedule.",
        safetyIncidents: 0,
        photos: JSON.stringify(["/demo/daily-1.jpg"]),
      },
    });

    // Delay report for delayed projects
    if (proj.status === "DELAYED" || i === 3) {
      await prisma.delayReport.create({
        data: {
          projectId: proj.id,
          reason: "Unanticipated subsurface water table surge requiring deep jet grouting remediation.",
          impactDays: 24,
          mitigationPlan: "De-watering pumps mobilized 24/7; double-shift night casting arranged with contractor.",
          status: "OPEN",
          reportedById: engineer.id,
        },
      });
    }
  }

  console.log(" Seeding Notifications & Activity Logs...");
  const notifDefs = [
    {
      userId: engineer.id,
      title: "New Task Assigned",
      message: "You have been assigned to 'Elevated Box Girder Segment Pre-stressing'.",
      type: "TASK_ASSIGNED",
      link: "/tasks",
    },
    {
      userId: pm.id,
      title: "Critical Path Delay Detected",
      message: "Project 'Padma Logistic City & Heavy Depot' has 2 overdue critical tasks.",
      type: "OVERDUE",
      link: `/projects/${projects[3].id}`,
    },
    {
      userId: finance.id,
      title: "Budget Overrun Warning (114%)",
      message: "Structural & Concrete Works in 'Padma Logistic City' has exceeded allocated budget limit.",
      type: "BUDGET_OVERRUN",
      link: "/budget",
    },
    {
      userId: engineer.id,
      title: "Low Stock Alert: Ordinary Portland Cement",
      message: "CEM-I 52.5R is below reorder threshold (240 bags remaining, min 400).",
      type: "LOW_STOCK",
      link: "/materials",
    },
    {
      userId: pm.id,
      title: "Material Request Submitted",
      message: "Contractor Rafiq Chowdhury requested 90 Metric Tons of Grade 500W rebar.",
      type: "REQUEST_APPROVED",
      link: "/materials",
    },
    {
      userId: pm.id,
      title: "Daily Site Report Submitted",
      message: "Site Engineer Farhana Ahmed submitted daily report for Dhaka Metro Elevated Viaduct.",
      type: "REPORT_SUBMITTED",
      link: "/reports",
    },
  ];

  for (const n of notifDefs) {
    await prisma.notification.create({ data: n });
  }

  const logDefs = [
    { actorId: admin.id, actorName: admin.name, actorRole: admin.role, action: "UPDATE", entity: "Company", entityId: company.id, meta: JSON.stringify({ field: "company_policy", status: "certified" }) },
    { actorId: pm.id, actorName: pm.name, actorRole: pm.role, action: "CREATE", entity: "Project", entityId: projects[0].id, meta: JSON.stringify({ name: projects[0].name, budget: 42000000 }) },
    { actorId: finance.id, actorName: finance.name, actorRole: finance.role, action: "CREATE", entity: "Expense", entityId: "exp-001", meta: JSON.stringify({ amount: 145000, category: "Steel & Rebar" }) },
    { actorId: engineer.id, actorName: engineer.name, actorRole: engineer.role, action: "TRANSITION", entity: "Task", entityId: allCreatedTasks[0].id, meta: JSON.stringify({ from: "IN_PROGRESS", to: "COMPLETED" }) },
    { actorId: pm.id, actorName: pm.name, actorRole: pm.role, action: "APPROVE", entity: "MaterialRequest", entityId: "mreq-001", meta: JSON.stringify({ qty: 90, material: "Grade 500W Rebar" }) },
  ];

  for (const l of logDefs) {
    await prisma.activityLog.create({ data: l });
  }

  console.log(" Seeding Documents...");
  await prisma.document.create({
    data: {
      projectId: projects[0].id,
      title: "Metro_Elevated_Viaduct_Structural_Drawings_Rev4.pdf",
      fileUrl: "/docs/drawings_metro_rev4.pdf",
      fileType: "application/pdf",
      fileSize: 14580000,
      uploadedById: engineer.id,
    },
  });

  await prisma.document.create({
    data: {
      projectId: projects[1].id,
      title: "Karnaphuli_Geotechnical_Core_Sample_Log.pdf",
      fileUrl: "/docs/geotech_karnaphuli.pdf",
      fileType: "application/pdf",
      fileSize: 8900000,
      uploadedById: engineer.id,
    },
  });

  console.log(" Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(" Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
