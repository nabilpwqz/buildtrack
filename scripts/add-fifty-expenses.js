/**
 * BuildTrack 50+ Certified Civil Engineering Expenses Expansion Script
 * Adds 60 authentic, certified civil engineering expense disbursement records
 * across all 23 active megaprojects and 6 official capital expenditure categories.
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const EXPENSE_TEMPLATES = [
  // 1. Structural & Concrete Works (EXP-STR)
  {
    categoryCode: "EXP-STR",
    title: "Mass Concrete Pouring - Pier Shaft 12 to 14",
    amount: 485000,
    desc: "Disbursement for 820m³ C45/55 structural concrete mix with silica fume admixture. Certified batch delivery tickets and thermocouple thermal gradient records attached.",
  },
  {
    categoryCode: "EXP-STR",
    title: "High-Early-Strength C60 Self-Compacting Ready-Mix",
    amount: 340000,
    desc: "Supply and pump placement of 540m³ self-consolidating high-early strength concrete for pre-cast segmental match casting yard beds.",
  },
  {
    categoryCode: "EXP-STR",
    title: "Pre-Cast Diaphragm Segment Grouting & Stressing",
    amount: 275000,
    desc: "Specialized non-shrink thixotropic grout injection into multi-strand tendon duct assemblies following two-end hydraulic stressing signoff.",
  },
  {
    categoryCode: "EXP-STR",
    title: "Foundation Mat Raft Concrete Pour Stage 3",
    amount: 620000,
    desc: "Continuous 36-hour monolithic pour of 1200m³ low-heat Portland pozzolana concrete for central core foundation slab.",
  },
  {
    categoryCode: "EXP-STR",
    title: "Deep Piling Tremie Concrete Discharge - 42m Depth",
    amount: 195000,
    desc: "Sub-surface tremie pipe concrete casting under bentonite slurry for six 1200mm bored cast-in-place friction piles.",
  },
  {
    categoryCode: "EXP-STR",
    title: "Shotcrete Application & Rock Bolt Consolidation",
    amount: 140000,
    desc: "Pneumatically projected fiber-reinforced shotcrete layer (150mm) and resin-anchored rock bolts along excavated approach cut slope.",
  },
  {
    categoryCode: "EXP-STR",
    title: "Slipform Superstructure Core Wall Continuous Pour",
    amount: 530000,
    desc: "Hydraulic slipform climbing platform concrete pour for Level 14 to 18 vertical elevator core shear walls.",
  },
  {
    categoryCode: "EXP-STR",
    title: "Marine Pier Collar Anti-Scour Concrete Infill",
    amount: 310000,
    desc: "Anti-washout underwater concrete placement inside pre-cast sacrificial collar jackets to fortify riverbed bridge piers against high velocity monsoon currents.",
  },
  {
    categoryCode: "EXP-STR",
    title: "Pre-Stressed Voided Slab Casting Batch #8",
    amount: 225000,
    desc: "Fabrication of 24 pre-tensioned voided deck slab panels with high-frequency external consolidation and steam accelerated curing.",
  },
  {
    categoryCode: "EXP-STR",
    title: "Retaining Abutment Wall Curing & Formwork Striking",
    amount: 165000,
    desc: "Engineered timber-steel modular formwork rental, chemical release agent, and wet burlap polythene curing maintenance for reinforced abutments.",
  },

  // 2. Steel & Rebar Reinforcement (EXP-STL)
  {
    categoryCode: "EXP-STL",
    title: "1200 Metric Tons High-Yield Deformed Rebar Grade 500W",
    amount: 890000,
    desc: "Procurement and delivery of 16mm, 25mm, and 32mm thermo-mechanically treated (TMT) high-yield rebar with complete heat chemical analysis certificates.",
  },
  {
    categoryCode: "EXP-STL",
    title: "Low-Relaxation 7-Wire Pre-Stressing Strand Spools (ASTM A416)",
    amount: 420000,
    desc: "Importation of 15.2mm diameter high-tensile 1860 MPa pre-stressing steel strand coils for longitudinal bridge deck post-tensioning.",
  },
  {
    categoryCode: "EXP-STL",
    title: "Heavy Box Girder Flange Plate Welded Assembly",
    amount: 760000,
    desc: "Shop fabrication and ultrasonic flaw detection testing of structural steel Grade S355J2+N plate girders with full penetration submerged arc butt welds.",
  },
  {
    categoryCode: "EXP-STL",
    title: "Marine Tubular Steel Piles (1400mm OD, 24mm WT)",
    amount: 610000,
    desc: "Spiral-welded heavy-wall structural carbon steel pipe piles for deep sea container berth jetty support, coated with solvent-free marine epoxy.",
  },
  {
    categoryCode: "EXP-STL",
    title: "Structural Truss Gantry Fabricated Modules Rev-B",
    amount: 510000,
    desc: "Off-site CNC plasma cutting, assembly, and trial shop fit-up of 45-meter clear-span roof canopy space truss components.",
  },
  {
    categoryCode: "EXP-STL",
    title: "Epoxy-Coated Seismic Shear Reinforcement Cages",
    amount: 330000,
    desc: "Pre-tied fusion-bonded epoxy coated (FBEC) stirrups and cross-ties designed for ductile performance under severe seismic Zone 4 design forces.",
  },
  {
    categoryCode: "EXP-STL",
    title: "Expansion Joint Finger Plates & Elastomeric Seals",
    amount: 185000,
    desc: "Modular cantilever finger expansion joint assemblies accommodating 320mm longitudinal thermal expansion and seismic bridge movement.",
  },
  {
    categoryCode: "EXP-STL",
    title: "Crane Runway Heavy Rail Beam Reinforcement",
    amount: 290000,
    desc: "A75 profile crane gantry rails with continuous elastomeric pad underlay, adjustable forged steel clips, and high-strength holding down bolts.",
  },
  {
    categoryCode: "EXP-STL",
    title: "Tower Crane Anchorage Steel Bracing Collars",
    amount: 155000,
    desc: "Custom heavy steel tie-back struts and concrete wall anchorage brackets for internal climbing tower crane mast stability at Level 22.",
  },
  {
    categoryCode: "EXP-STL",
    title: "Cantilevered Steel Canopy Framing Sub-Assembly",
    amount: 245000,
    desc: "Architectural hollow structural section (HSS) curved rafters with factory applied three-coat zinc/polyurethane protective coating.",
  },

  // 3. Electrical & MEP Infrastructure (EXP-MEP)
  {
    categoryCode: "EXP-MEP",
    title: "132kV Gas-Insulated Switchgear (GIS) Substation Bays",
    amount: 1250000,
    desc: "Procurement, factory acceptance testing (FAT), and cleanroom delivery of four 132kV SF6 gas-insulated switchgear feeder bays and circuit breakers.",
  },
  {
    categoryCode: "EXP-MEP",
    title: "Medium Voltage (33kV) Armored Copper Feeder Cabling",
    amount: 480000,
    desc: "Underground cross-linked polyethylene (XLPE) insulated, lead sheathed, steel wire armored power transmission cable (3x300mm²).",
  },
  {
    categoryCode: "EXP-MEP",
    title: "1500kVA Standby Diesel Generator Set & Acoustic Canopy",
    amount: 395000,
    desc: "Heavy-duty 1500kVA turbo-charged emergency diesel generator with automated transfer switchgear (ATS) and 75 dBA acoustic attenuator canopy.",
  },
  {
    categoryCode: "EXP-MEP",
    title: "Central Chilled Water Centrifugal Pumps & Header Piping",
    amount: 310000,
    desc: "Dual primary and secondary chilled water distribution pumps with variable frequency drives (VFD) and insulated welded steel manifold piping.",
  },
  {
    categoryCode: "EXP-MEP",
    title: "Fire Suppression Automated Deluge Valve Skids",
    amount: 220000,
    desc: "Factory pre-assembled NFPA 16 compliant foam-water deluge skids with pneumatic detection release and turbine flow meters for transformer yard.",
  },
  {
    categoryCode: "EXP-MEP",
    title: "SCADA Redundant Optical Fiber Telemetry Backbone",
    amount: 175000,
    desc: "Armored 48-core single-mode underground optical fiber loop linking remote terminal units (RTUs) to master supervisory control center.",
  },
  {
    categoryCode: "EXP-MEP",
    title: "Variable Frequency Drives (VFD) Motor Control Center",
    amount: 260000,
    desc: "Form 4b compartmentalized motor control center switchboards equipped with active harmonic filters and Modbus communications.",
  },
  {
    categoryCode: "EXP-MEP",
    title: "High-Mast Airfield / Marine LED Floodlight Clusters",
    amount: 145000,
    desc: "30-meter motorized lowering-head high mast lighting towers with 1200W marine-grade asymmetric LED floodlights and aviation obstruction beacons.",
  },
  {
    categoryCode: "EXP-MEP",
    title: "Cathodic Impressed Current (ICCP) Ground Bed Anodes",
    amount: 190000,
    desc: "Mixed metal oxide (MMO) tubular anode strings and transformer-rectifier units for long-term corrosion prevention of submerged marine sheet piles.",
  },
  {
    categoryCode: "EXP-MEP",
    title: "Smoke Evacuation Heavy Axial Fans & Fire Dampers",
    amount: 160000,
    desc: "400°C / 2-hour rated high-capacity axial reversible tunnel ventilation jet fans with motorized stainless steel fire dampers.",
  },

  // 4. Heavy Equipment, Cranes & Fuel (EXP-EQP)
  {
    categoryCode: "EXP-EQP",
    title: "Monthly Mobilization: 2x 250-Ton Crawler Cranes",
    amount: 280000,
    desc: "Monthly lease, certified crane operator crew, and rigging gear maintenance for tandem dual-crane superstructure segment lifts.",
  },
  {
    categoryCode: "EXP-EQP",
    title: "Ultra-Deep Rotary Hydraulic Piling Rig (Bauer BG36) Rental",
    amount: 340000,
    desc: "Rotary drilling rig operating lease with telescoping kelly bar, continuous flight auger tooling, and on-site mechanical field support.",
  },
  {
    categoryCode: "EXP-EQP",
    title: "Low-Sulfur Marine Diesel Fuel Delivery (120,000 Liters)",
    amount: 145000,
    desc: "Bulk delivery of low-sulfur automotive/marine diesel fuel to site bulk fuel storage tanks for generators, excavators, and dump trucks.",
  },
  {
    categoryCode: "EXP-EQP",
    title: "52m Truck-Mounted Concrete Boom Pumps Operation",
    amount: 195000,
    desc: "Pumping equipment rental and technician crew for elevated bridge deck and high-rise core wall concrete placement.",
  },
  {
    categoryCode: "EXP-EQP",
    title: "Cutter-Suction Dredger Daily Operating Lease",
    amount: 420000,
    desc: "24-inch cutter-suction dredger operation including pipeline discharge pontoon maintenance and GPS hydrographic bathymetric positioning.",
  },
  {
    categoryCode: "EXP-EQP",
    title: "Hydraulic Soil Vibratory Hammer & Power Pack Lease",
    amount: 165000,
    desc: "High-frequency variable-moment vibratory hammer for driving 18m steel sheet piles with zero peripheral structural resonance.",
  },
  {
    categoryCode: "EXP-EQP",
    title: "Heavy Low-Bed Multi-Axle Transporter Convoys",
    amount: 130000,
    desc: "Specialized hydraulic platform trailer convoys with police escort for moving 140-ton pre-cast segmental girders from casting yard to launch gantry.",
  },
  {
    categoryCode: "EXP-EQP",
    title: "Tower Crane Climbing Telescopic Jacking Frame Crew",
    amount: 115000,
    desc: "Specialized rigging crew for telescopic mast climbing extension, anchor tie installation, and load moment limiter recalibration.",
  },
  {
    categoryCode: "EXP-EQP",
    title: "Heavy Excavators & Off-Highway Dump Trucks Fleet Fuel",
    amount: 185000,
    desc: "Operating fuel and lubricants for site earthmoving fleet comprising eight 30-ton hydraulic excavators and twelve articulated haulers.",
  },
  {
    categoryCode: "EXP-EQP",
    title: "Stationary Concrete Batching Plant Generator Diesel",
    amount: 95000,
    desc: "Dedicated power generation fuel supply for continuous operation of two 120m³/hr twin-shaft planetary concrete batching plants.",
  },

  // 5. Specialized Subcontracting (EXP-SUB)
  {
    categoryCode: "EXP-SUB",
    title: "Sub-Aqueous Ultrasonic NDT Inspection & Sonar Bathymetry",
    amount: 190000,
    desc: "Multi-beam sonar scanning and diver-assisted non-destructive ultrasonic testing of submerged bridge foundation caissons and scour aprons.",
  },
  {
    categoryCode: "EXP-SUB",
    title: "Dynamic Pile Load Testing (PDA/CAPWAP Signal Matching)",
    amount: 125000,
    desc: "High-strain drop hammer instrumentation, shock wave velocity acquisition, and CAPWAP numerical simulation for 12 deep foundation test piles.",
  },
  {
    categoryCode: "EXP-SUB",
    title: "Ground Improvement High-Pressure Jet Grouting Package",
    amount: 450000,
    desc: "Triple-fluid jet grouting ground treatment forming continuous overlapping soil-cement columns to prevent water ingress into deep tunnel shafts.",
  },
  {
    categoryCode: "EXP-SUB",
    title: "Geotechnical In-Situ Borehole Core Drilling & CPT Testing",
    amount: 110000,
    desc: "Rotary diamond core drilling to 60m depth with continuous standard penetration tests (SPT) and electric piezocone penetration (CPTu) profiling.",
  },
  {
    categoryCode: "EXP-SUB",
    title: "Specialized Epoxy Joint Bonding for Segmental Bridges",
    amount: 215000,
    desc: "Application of two-component high-modulus structural epoxy adhesive on match-cast segment shear keys prior to temporary prestress clamping.",
  },
  {
    categoryCode: "EXP-SUB",
    title: "Rail Thermite Welding & Continuous Track Neutralization",
    amount: 280000,
    desc: "Alumino-thermic field welding of 60kg/m UIC rails and hydraulic stress tensor de-stressing for continuous welded rail (CWR) installation.",
  },
  {
    categoryCode: "EXP-SUB",
    title: "Post-Tensioning Stressing Specialist Technicians Roster",
    amount: 160000,
    desc: "Certified post-tensioning field engineers executing hydraulic multi-strand jacking, wedge seating, and computerized load-elongation verification.",
  },
  {
    categoryCode: "EXP-SUB",
    title: "Confined Space Hazardous Gas Monitoring & Safety Standby",
    amount: 85000,
    desc: "Trained rescue technicians, continuous multigas detectors, and positive-pressure breathing apparatus monitoring for deep tunnel box inspections.",
  },
  {
    categoryCode: "EXP-SUB",
    title: "Marine Diving Team Seabed Geotextile Scour Protection",
    amount: 230000,
    desc: "Commercial dive team laying underwater articulated concrete mattress block revetments around marine approach trestle bents.",
  },
  {
    categoryCode: "EXP-SUB",
    title: "Independent Third-Party Concrete Laboratory Break Certification",
    amount: 75000,
    desc: "Third-party ISO 17025 accredited laboratory testing of 7-day and 28-day concrete cylinder compressive strength, rapid chloride permeability, and water absorption.",
  },

  // 6. Architectural Facades & Finishing (EXP-FAC)
  {
    categoryCode: "EXP-FAC",
    title: "Blast-Resistant Double-Glazed Structural Curtain Wall Panels",
    amount: 670000,
    desc: "Supply and bracket mounting of unitized structural glazed facade panels with laminated Low-E insulated glass units (IGU) tested to ASTM E1300.",
  },
  {
    categoryCode: "EXP-FAC",
    title: "Architectural Perforated Aluminum Composite Louver Panels",
    amount: 340000,
    desc: "PVDF coated 4mm architectural aluminum cladding panels with laser-cut geometric ventilation motifs and concealed sub-frame fasteners.",
  },
  {
    categoryCode: "EXP-FAC",
    title: "Heavy-Duty Industrial Polyurethane Anti-Corrosion Floor Screed",
    amount: 185000,
    desc: "Seamless 6mm heavy-duty polyurethane resin screed with aggregate broadcast for terminal baggage handling and utility maintenance workshop floors.",
  },
  {
    categoryCode: "EXP-FAC",
    title: "Fire-Rated Composite Acoustic Ceiling Baffle Systems",
    amount: 210000,
    desc: "Suspended non-combustible Class A acoustic baffles with sound absorption coefficient NRC 0.85 for passenger concourse and public spaces.",
  },
  {
    categoryCode: "EXP-FAC",
    title: "Multi-Layer Elastomeric SBS Roof Waterproofing Membrane",
    amount: 195000,
    desc: "Torch-applied double layer 4mm SBS elastomeric bitumen waterproofing membrane with mineral granule protective cap sheet on podium flat roofs.",
  },
  {
    categoryCode: "EXP-FAC",
    title: "Tempered Structural Glass Balustrades & Stainless Stanchions",
    amount: 145000,
    desc: "19mm clear tempered laminated safety glass railings with Grade 316 brushed stainless steel bottom shoe profiles and top handrail channels.",
  },
  {
    categoryCode: "EXP-FAC",
    title: "Anti-Carbonation Protective Silane Coating for Exposed Concrete",
    amount: 120000,
    desc: "Waterborne acrylic anti-carbonation coating with water vapor permeability complying with EN 1504-2 for elevated viaduct piers and parapets.",
  },
  {
    categoryCode: "EXP-FAC",
    title: "Cleanroom Epoxy Wall Cladding for Control Substation Rooms",
    amount: 160000,
    desc: "Joint-free solvent-free high-gloss antimicrobial epoxy wall coating system for electrical switchgear and telecom server rooms.",
  },
  {
    categoryCode: "EXP-FAC",
    title: "Polished Architectural Terrazzo Terminal Concourse Flooring",
    amount: 290000,
    desc: "Heavy-traffic epoxy terrazzo flooring with Bangladesh river quartz marble aggregate chips, ground and polished to 3000-grit diamond luster.",
  },
  {
    categoryCode: "EXP-FAC",
    title: "External Louvered Sunshade Aerofoil Extrusions",
    amount: 175000,
    desc: "Motorized extruded aluminum aerofoil sun louvers with intelligent solar tracking actuator integration along southern building facade elevation.",
  },
];

async function main() {
  console.log("=== BuildTrack 50+ Certified Civil Engineering Expenses Expansion ===");

  const initialCount = await prisma.expense.count();
  console.log(`Current expense records in database: ${initialCount}`);

  // Fetch all 23 active projects
  const projects = await prisma.project.findMany({
    select: { id: true, name: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Fetch all expense categories
  const categories = await prisma.expenseCategory.findMany({
    select: { id: true, code: true, name: true },
  });

  const categoryMap = new Map();
  for (const cat of categories) {
    categoryMap.set(cat.code, cat.id);
  }

  // Fetch Finance Manager or Project Manager to act as recordedById
  const financeManager = await prisma.user.findFirst({
    where: { role: "FINANCE_MANAGER" },
  });
  const pmUser = await prisma.user.findFirst({
    where: { role: "PROJECT_MANAGER" },
  });

  const recorderId = financeManager ? financeManager.id : pmUser.id;
  const recorderName = financeManager ? financeManager.name : pmUser.name;
  console.log(`Recording disbursements under authorized signatory: ${recorderName}`);

  let createdExpensesCount = 0;
  const now = Date.now();

  // We will insert all 60 templates, distributed across the 23 projects
  for (let i = 0; i < EXPENSE_TEMPLATES.length; i++) {
    const tpl = EXPENSE_TEMPLATES[i];
    const categoryId = categoryMap.get(tpl.categoryCode);

    if (!categoryId) {
      console.warn(`Category code ${tpl.categoryCode} not found in database! Skipping.`);
      continue;
    }

    // Distribute across projects
    const project = projects[i % projects.length];

    // Dates spread from 5 days ago to 150 days ago
    const daysAgo = 5 + (i * 2.3);
    const expenseDate = new Date(now - daysAgo * 86400000);
    const voucherNumber = `VCH-${new Date(expenseDate).getFullYear()}-${String(1000 + i + 1).padStart(5, "0")}`;

    await prisma.expense.create({
      data: {
        title: `${project.name.split(" - ")[0].split(" Phase")[0]} — ${tpl.title}`,
        projectId: project.id,
        categoryId: categoryId,
        amount: tpl.amount,
        date: expenseDate,
        description: `${tpl.desc} Certified payment voucher ${voucherNumber}. Audited and approved by ${recorderName}.`,
        recordedById: recorderId,
        documentUrl: `/vouchers/${voucherNumber}.pdf`,
      },
    });

    createdExpensesCount++;
    console.log(`[${i + 1}/${EXPENSE_TEMPLATES.length}] Created Expense: ${voucherNumber} - $${tpl.amount.toLocaleString()} [${tpl.categoryCode}] for ${project.name}`);
  }

  const finalExpenseCount = await prisma.expense.count();
  const aggregateResult = await prisma.expense.aggregate({
    _sum: { amount: true },
    _avg: { amount: true },
  });

  console.log("\n========================================================");
  console.log(`Expansion Complete!`);
  console.log(`New expenses added: ${createdExpensesCount}`);
  console.log(`Total expense records in database: ${finalExpenseCount}`);
  console.log(`Total capital disbursed: $${Math.round(aggregateResult._sum.amount || 0).toLocaleString()}`);
  console.log(`Average certificate amount: $${Math.round(aggregateResult._avg.amount || 0).toLocaleString()}`);
  console.log("========================================================");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Expense expansion error:", err);
  prisma.$disconnect();
  process.exit(1);
});

