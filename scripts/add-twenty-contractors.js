/**
 * BuildTrack 20+ Contractors Expansion Script
 * Adds 22 authentic, certified civil engineering & infrastructure contracting firms
 * with full relational project assignments, evaluation performance records, and contact dossiers.
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const NEW_CONTRACTORS = [
  {
    name: "Engr. Tareq Mahmud",
    company: "Delta Marine Dredging & Reclamation Ltd",
    contact: "Tareq Mahmud (Managing Director)",
    email: "delta.marine@buildtrack.com",
    phone: "+880 1711-200101",
    specialty: "Marine Dredging & Sub-river Tunneling",
    rating: 4.9,
    performanceNotes: "Maintained continuous cutter-suction dredging with 99.4% channel depth clearance compliance.",
    onTimeRate: 98,
    qualityScore: 4.9,
    delayIncidents: 0,
  },
  {
    name: "Mostafa Kamal, PE",
    company: "Karnaphuli Pre-Stressed Viaduct Systems Ltd",
    contact: "Mostafa Kamal (Chief Technical Officer)",
    email: "viaduct.systems@buildtrack.com",
    phone: "+880 1819-200102",
    specialty: "Pre-stressed Concrete & Viaduct Girders",
    rating: 4.8,
    performanceNotes: "Erected 48 pre-cast box girder segments ahead of monsoon window with zero tendon slip.",
    onTimeRate: 96,
    qualityScore: 4.8,
    delayIncidents: 0,
  },
  {
    name: "Engr. Shafiul Alam",
    company: "National Geotechnical Piling & Shoring Co",
    contact: "Shafiul Alam (Head of Piling Ops)",
    email: "national.piling@buildtrack.com",
    phone: "+880 1912-200103",
    specialty: "Geotechnical Piling & Deep Foundations",
    rating: 4.7,
    performanceNotes: "PDA dynamic pile load testing achieved 2200kN allowable capacity without settlement anomalies.",
    onTimeRate: 94,
    qualityScore: 4.7,
    delayIncidents: 1,
  },
  {
    name: "Shahadat Hossain",
    company: "Trans-National Rail Infrastructure Consortium",
    contact: "Shahadat Hossain (Project Director)",
    email: "rail.infra@buildtrack.com",
    phone: "+880 1714-200104",
    specialty: "Ballastless Track & Rail Infrastructure",
    rating: 4.9,
    performanceNotes: "Installed dual-gauge continuous welded rail with laser track geometry tolerance under 1mm.",
    onTimeRate: 100,
    qualityScore: 5.0,
    delayIncidents: 0,
  },
  {
    name: "Engr. Mizanur Rahman",
    company: "Apex High-Voltage Electromechanical Works Ltd",
    contact: "Mizanur Rahman (VP Engineering)",
    email: "apex.hvmep@buildtrack.com",
    phone: "+880 1611-200105",
    specialty: "MEP & Electromechanical Systems",
    rating: 4.8,
    performanceNotes: "132kV GIS SF6 gas insulation test certified with zero partial discharge below 5pC threshold.",
    onTimeRate: 97,
    qualityScore: 4.8,
    delayIncidents: 0,
  },
  {
    name: "Aminul Islam",
    company: "Jamuna Heavy Structural Rebar Fabrication Ltd",
    contact: "Aminul Islam (Works Manager)",
    email: "jamuna.rebar@buildtrack.com",
    phone: "+880 1817-200106",
    specialty: "Structural Steel & Reinforcement",
    rating: 4.7,
    performanceNotes: "Fabricated and delivered 3400 metric tons of Grade 500W rebar with 100% mill certificate traceability.",
    onTimeRate: 95,
    qualityScore: 4.7,
    delayIncidents: 0,
  },
  {
    name: "Engr. Masud Rana",
    company: "Brahmaputra Hydraulic & Coastal Engineering Ltd",
    contact: "Masud Rana (Marine Superintendent)",
    email: "coastal.eng@buildtrack.com",
    phone: "+880 1718-200107",
    specialty: "Marine Dredging & Sub-river Tunneling",
    rating: 4.6,
    performanceNotes: "Constructed 4.2km geotextile tube revetment sustaining peak river discharge without toe scouring.",
    onTimeRate: 92,
    qualityScore: 4.6,
    delayIncidents: 1,
  },
  {
    name: "Nurul Absar",
    company: "Chittagong High-Tech Diaphragm Walls Ltd",
    contact: "Nurul Absar (Deep Excavation Lead)",
    email: "diaphragm.ctg@buildtrack.com",
    phone: "+880 1915-200108",
    specialty: "Geotechnical Piling & Deep Foundations",
    rating: 4.9,
    performanceNotes: "Completed 42m deep bentonite slurry diaphragm wall trench with zero ground loss in urban zone.",
    onTimeRate: 99,
    qualityScore: 4.9,
    delayIncidents: 0,
  },
  {
    name: "Kazi Faruk",
    company: "Bengal Superstructure Post-Tensioning Ltd",
    contact: "Kazi Faruk (Stressing Specialist)",
    email: "posttension.bengal@buildtrack.com",
    phone: "+880 1618-200109",
    specialty: "Pre-stressed Concrete & Viaduct Girders",
    rating: 4.8,
    performanceNotes: "Calibrated multi-strand hydraulic jacks achieving exact calculated elongation within 2% variance.",
    onTimeRate: 97,
    qualityScore: 4.8,
    delayIncidents: 0,
  },
  {
    name: "Engr. Shamsur Rahman",
    company: "Eastern Rail Catenary & Signalling Systems Ltd",
    contact: "Shamsur Rahman (Traction Lead)",
    email: "catenary.rail@buildtrack.com",
    phone: "+880 1713-200110",
    specialty: "Ballastless Track & Rail Infrastructure",
    rating: 4.8,
    performanceNotes: "Commissioned 25kV overhead catenary masts and track circuits with zero interlocking safety trips.",
    onTimeRate: 98,
    qualityScore: 4.8,
    delayIncidents: 0,
  },
  {
    name: "Asaduzzaman Noor",
    company: "Dhaka Power Grid Substation Builders Ltd",
    contact: "Asaduzzaman Noor (GIS Substation Lead)",
    email: "powergrid.dhaka@buildtrack.com",
    phone: "+880 1812-200111",
    specialty: "MEP & Electromechanical Systems",
    rating: 4.7,
    performanceNotes: "Energized 230/33kV step-down transformer bays with full harmonic distortion compliance (THD < 2.5%).",
    onTimeRate: 95,
    qualityScore: 4.7,
    delayIncidents: 0,
  },
  {
    name: "Engr. Lutfur Rahman",
    company: "Surma Structural Truss & Heavy Rigging Ltd",
    contact: "Lutfur Rahman (Chief Rigging Engineer)",
    email: "surma.truss@buildtrack.com",
    phone: "+880 1917-200112",
    specialty: "Structural Steel & Reinforcement",
    rating: 4.9,
    performanceNotes: "Executed 120-ton tandem crane roof truss lift with millimeter alignment onto cast anchor pedestals.",
    onTimeRate: 100,
    qualityScore: 4.9,
    delayIncidents: 0,
  },
  {
    name: "Captain Jahid Hasan",
    company: "Padma Deep Sea Berth & Jetty Contractors Ltd",
    contact: "Jahid Hasan (Harbor Works Director)",
    email: "jetty.padma@buildtrack.com",
    phone: "+880 1719-200113",
    specialty: "Marine Dredging & Sub-river Tunneling",
    rating: 4.8,
    performanceNotes: "Driven 160 steel tubular piles in marine saline environment with sacrificial zinc anode protection.",
    onTimeRate: 96,
    qualityScore: 4.8,
    delayIncidents: 0,
  },
  {
    name: "Engr. Monirul Islam",
    company: "Barind Soil Dynamic Compaction & Jet Grouting",
    contact: "Monirul Islam (Soil Treatment Lead)",
    email: "barind.soil@buildtrack.com",
    phone: "+880 1615-200114",
    specialty: "Geotechnical Piling & Deep Foundations",
    rating: 4.6,
    performanceNotes: "High-pressure jet grouting stabilized subterranean water inflow during deep basement excavation.",
    onTimeRate: 93,
    qualityScore: 4.6,
    delayIncidents: 1,
  },
  {
    name: "Habibullah Bahar",
    company: "Meghna Segmental Pre-Cast Box Girders Ltd",
    contact: "Habibullah Bahar (Casting Yard Manager)",
    email: "boxgirder.meghna@buildtrack.com",
    phone: "+880 1814-200115",
    specialty: "Pre-stressed Concrete & Viaduct Girders",
    rating: 4.9,
    performanceNotes: "Steam-cured 180 deck segments achieving 45 MPa early compressive strength at 72 hours.",
    onTimeRate: 99,
    qualityScore: 4.9,
    delayIncidents: 0,
  },
  {
    name: "Engr. Tanvir Ahmed",
    company: "Matarbari SCADA & Industrial Instrumentation Ltd",
    contact: "Tanvir Ahmed (Automation Manager)",
    email: "scada.matarbari@buildtrack.com",
    phone: "+880 1716-200116",
    specialty: "MEP & Electromechanical Systems",
    rating: 4.8,
    performanceNotes: "Redundant dual-hot standby PLC field network integrated with optical telemetry telemetry rings.",
    onTimeRate: 98,
    qualityScore: 4.8,
    delayIncidents: 0,
  },
  {
    name: "Anisur Rahman",
    company: "South Asian Trackworks & Turnouts Ltd",
    contact: "Anisur Rahman (Permanent Way Engineer)",
    email: "trackworks.sa@buildtrack.com",
    phone: "+880 1919-200117",
    specialty: "Ballastless Track & Rail Infrastructure",
    rating: 4.7,
    performanceNotes: "Installed 1:12 high-speed turnout crossovers on reinforced concrete plinth slabs without vibration.",
    onTimeRate: 95,
    qualityScore: 4.7,
    delayIncidents: 0,
  },
  {
    name: "Engr. Feroz Khan",
    company: "Purbachal Skyrise Structural Fabrication Ltd",
    contact: "Feroz Khan (Structural Director)",
    email: "purbachal.steel@buildtrack.com",
    phone: "+880 1612-200118",
    specialty: "Structural Steel & Reinforcement",
    rating: 4.8,
    performanceNotes: "Box-column full penetration butt welds passed 100% PAUT ultrasonic testing with zero re-welds.",
    onTimeRate: 97,
    qualityScore: 4.8,
    delayIncidents: 0,
  },
  {
    name: "Dr. Engr. Rezaul Haque",
    company: "Rooppur Containment Heavy Concrete Tech Ltd",
    contact: "Rezaul Haque (Nuclear Concrete Consultant)",
    email: "containment.rooppur@buildtrack.com",
    phone: "+880 1715-200119",
    specialty: "Pre-stressed Concrete & Viaduct Girders",
    rating: 5.0,
    performanceNotes: "High-density heavy magnetite concrete mix verified for radiation shielding and 60 MPa break strength.",
    onTimeRate: 100,
    qualityScore: 5.0,
    delayIncidents: 0,
  },
  {
    name: "Nazir Ahmed",
    company: "Teesta River Revetment & Geotextile Armor Ltd",
    contact: "Nazir Ahmed (River Training Specialist)",
    email: "teesta.revetment@buildtrack.com",
    phone: "+880 1816-200120",
    specialty: "Marine Dredging & Sub-river Tunneling",
    rating: 4.7,
    performanceNotes: "Placed 250,000 CC blocks over non-woven geotextile filter mattress along vulnerable embankment curve.",
    onTimeRate: 94,
    qualityScore: 4.7,
    delayIncidents: 0,
  },
  {
    name: "Engr. Faizur Rahman",
    company: "Sylhet Underground Hydro-Excavation & Piling Ltd",
    contact: "Faizur Rahman (Site Superintendent)",
    email: "hydro.sylhet@buildtrack.com",
    phone: "+880 1913-200121",
    specialty: "Geotechnical Piling & Deep Foundations",
    rating: 4.8,
    performanceNotes: "Non-destructive vacuum hydro-excavation exposed live municipal fiber and gas utilities safely.",
    onTimeRate: 97,
    qualityScore: 4.8,
    delayIncidents: 0,
  },
  {
    name: "Engr. Badrul Huda",
    company: "Mongla Port Container Crane Erection Consortium",
    contact: "Badrul Huda (Heavy Lifting Manager)",
    email: "crane.mongla@buildtrack.com",
    phone: "+880 1712-200122",
    specialty: "Structural Steel & Reinforcement",
    rating: 4.9,
    performanceNotes: "Erected two 65-ton ship-to-shore gantry cranes and conducted 125% dynamic proof overload trials.",
    onTimeRate: 99,
    qualityScore: 4.9,
    delayIncidents: 0,
  },
];

async function main() {
  console.log("=== BuildTrack 20+ Contractors Expansion ===");

  const initialCount = await prisma.contractor.count();
  console.log(`Current contractors in database: ${initialCount}`);

  // Fetch all projects to assign new contractors to realistic projects
  const projects = await prisma.project.findMany({
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });

  let createdContractorsCount = 0;
  let createdAssignmentsCount = 0;
  let createdPerformancesCount = 0;

  for (let i = 0; i < NEW_CONTRACTORS.length; i++) {
    const cData = NEW_CONTRACTORS[i];

    // Upsert contractor by email
    const contractor = await prisma.contractor.upsert({
      where: { email: cData.email },
      update: {
        name: cData.name,
        company: cData.company,
        contact: cData.contact,
        phone: cData.phone,
        specialty: cData.specialty,
        rating: cData.rating,
        status: "ACTIVE",
      },
      create: {
        name: cData.name,
        company: cData.company,
        contact: cData.contact,
        email: cData.email,
        phone: cData.phone,
        specialty: cData.specialty,
        rating: cData.rating,
        status: "ACTIVE",
      },
    });

    createdContractorsCount++;

    // Assign to 2 projects across the portfolio
    const proj1 = projects[i % projects.length];
    const proj2 = projects[(i + 7) % projects.length];

    const assignedProjs = [proj1, proj2];

    for (const proj of assignedProjs) {
      // Upsert project assignment
      try {
        await prisma.projectContractor.upsert({
          where: {
            projectId_contractorId: {
              projectId: proj.id,
              contractorId: contractor.id,
            },
          },
          update: {},
          create: {
            projectId: proj.id,
            contractorId: contractor.id,
          },
        });
        createdAssignmentsCount++;
      } catch (e) {
        // Ignored if exists
      }

      // Add performance evaluation record
      await prisma.contractorPerformance.create({
        data: {
          contractorId: contractor.id,
          projectId: proj.id,
          onTimeRate: cData.onTimeRate,
          qualityScore: cData.qualityScore,
          delayIncidents: cData.delayIncidents,
          notes: `${cData.performanceNotes} Evaluated on project: ${proj.name}.`,
          evaluatedAt: new Date(Date.now() - (i * 2 + 1) * 86400000),
        },
      });
      createdPerformancesCount++;
    }

    console.log(`[${i + 1}/${NEW_CONTRACTORS.length}] Added contractor: ${contractor.company} (${contractor.name})`);
  }

  const finalContractorCount = await prisma.contractor.count();
  const finalAssignmentsCount = await prisma.projectContractor.count();
  const finalPerformancesCount = await prisma.contractorPerformance.count();

  console.log("\n========================================================");
  console.log(`Expansion Complete!`);
  console.log(`Contractors added/updated: ${createdContractorsCount}`);
  console.log(`Total contractors in database: ${finalContractorCount}`);
  console.log(`Total project assignments: ${finalAssignmentsCount}`);
  console.log(`Total performance evaluations: ${finalPerformancesCount}`);
  console.log("========================================================");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Contractor expansion error:", err);
  prisma.$disconnect();
  process.exit(1);
});

