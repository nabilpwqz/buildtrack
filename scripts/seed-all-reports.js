const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function run() {
  const projects = await prisma.project.findMany({
    include: {
      tasks: { select: { id: true, title: true } },
    },
  });

  const engineers = await prisma.user.findMany({
    where: { role: { in: ['SITE_ENGINEER', 'PROJECT_MANAGER', 'ADMIN'] } },
  });

  const defaultUser = engineers[0] || (await prisma.user.findFirst());
  if (!defaultUser) {
    console.error('No users found in database');
    return;
  }

  console.log(`Seeding reports for ${projects.length} projects with reporter ${defaultUser.name}...`);

  const sampleWeathers = [
    'Clear & Sunny (32°C, 45% Humidity)',
    'Overcast & Breezy (26°C, Wind: 18 km/h)',
    'Scattered Cloud Cover (29°C, Dry Pavement)',
    'Tropical Light Drizzle (25°C, Monitored)',
    'Controlled Enclosed Atmospheric (24°C)',
    'Bright High-Visibility (31°C, Wind: 10 km/h)',
  ];

  const sampleEquipment = [
    '2x 200T Gantry Cranes, 4x Ready-Mix Agitators, 1x Crawler Boom Pump',
    '1x Slurry Shield TBM, 6x Muck Cars, 2x Grout Injection Pumps',
    '3x Hydraulic Piling Rigs (Bauer BG36), 2x Mud Desanders, 1x Service Crane',
    '2x Tower Cranes (Comedil CTT 332), 1x Concrete Placing Boom, 4x Site Dumpers',
    '4x Heavy Excavators (CAT 336), 8x 30T Dump Trucks, 2x Soil Compactors',
    '1x Marine Spud Barge, 2x Tugboats, 1x 150T Floating Crane, 2x Vibratory Hammers',
    '3x Rotary Drilling Rigs, 2x Bentonite Slurry Plants, 2x Mobile Concrete Mixers',
  ];

  const siteWorkTemplates = [
    'Erected segmental box girders on spans. Post-tensioning tendon grouting certified with zero void defects. Concrete slump test measured 180mm.',
    'Continuous boring cycle completed 18m advancement. Ring segment erection certified with dual EPDM gasket alignment and zero water ingress.',
    'Completed bored cast-in-place test piling to 48m depth. Rebar cage ultrasonic logging verified 100% acoustic integrity and cover compliance.',
    'Poured Level structural shear walls and floor diaphragm (240 m³ C45/55 mix). Internal poker vibrator grid monitored with thermal maturity sensors.',
    'Excavation and geotechnical soil nailing in Subgrade Zone. Ground tieback anchors stressed to 450 kN proof load with zero creep detected.',
    'Pre-cast quay wall block placement in marine tidal zone. High-precision laser bathymetric survey confirmed sub-millimeter foundation tolerance.',
    'Installed 400 kV gas-insulated switchgear foundation pads. High-voltage underground conduit trenching and pull-box placement completed.',
    'HVAC central plant chilled water piping hydro-test conducted at 1.5x working pressure for 4 hours with zero pressure drop recorded.',
  ];

  const progressTemplates = [
    { pct: 85, desc: 'Substructure deep pile foundations and load-bearing pile caps certified complete by third-party testing agency.' },
    { pct: 60, desc: 'Structural steel framing assembly, portal bracing, and high-strength friction-grip bolted joints 100% torque verified.' },
    { pct: 45, desc: 'Core shear wall slipform vertical advancement reached milestone design elevation with embedded MEP conduit sleeves.' },
    { pct: 92, desc: 'Marine revetment rock armor placement and high-performance geotextile layer installation completed along coastal line.' },
    { pct: 35, desc: 'Main terminal viaduct pier caps cast and prestressed post-tensioning strand cutting approved under supervision.' },
    { pct: 70, desc: 'Substation civil foundation slabs and perimeter security retaining walls structurally inspected and certified.' },
    { pct: 55, desc: 'External architectural curtain glazing and double-glazed insulated unit installations progressing along south facade.' },
    { pct: 40, desc: 'Heavy equipment foundation slabs and transformer plinth casting finished with high-durability microsilica concrete.' },
  ];

  const delayTemplates = [
    {
      reason: 'Monsoon flash flooding elevated river water table by 1.6m, temporarily inundating lower coffer dam access berm.',
      impactDays: 8,
      mitigationPlan: 'Installed twin 12-inch high-discharge submersible dewatering pumps and reinforced riprap bund to resume excavation 48 hours early.',
      status: 'MITIGATED',
    },
    {
      reason: 'International port logistics congestion delayed shipment of high-strength structural strand post-tensioning anchor heads.',
      impactDays: 14,
      mitigationPlan: 'Secured air-freight emergency allotment from alternate European ISO-9001 certified supplier; reallocated site labor to deck rebar fixing.',
      status: 'RESOLVED',
    },
    {
      reason: 'Geotechnical shear failure plane detected at 14m depth during retaining wall excavation, differing from preliminary borelogs.',
      impactDays: 10,
      mitigationPlan: 'Mobilized micro-pile drill rig for supplemental soil stabilization and increased ground anchor density with consultant sign-off.',
      status: 'OPEN',
    },
    {
      reason: 'Municipal utility corridor conflict: 33kV high-voltage underground feeder cable discovered crossing pier foundation footprint.',
      impactDays: 12,
      mitigationPlan: 'Coordinated planned shutdown with national grid operator; executed directional horizontal drilling relocation to clear footing zone.',
      status: 'RESOLVED',
    },
    {
      reason: 'Cement batch plant mixer gearbox breakdown during high-volume nocturnal slab casting schedule.',
      impactDays: 4,
      mitigationPlan: 'Activated backup commercial ready-mix supply contract with twin dispatch facilities and dedicated traffic escort.',
      status: 'MITIGATED',
    },
    {
      reason: 'Severe coastal tropical squall with sustained wind gusts >75 km/h halting all tower crane and mobile hoist lifting operations.',
      impactDays: 6,
      mitigationPlan: 'Re-sequenced ground-level pre-fabrication of rebar cages and precast culverts inside sheltered fabrication bays.',
      status: 'OPEN',
    },
  ];

  for (let pIdx = 0; pIdx < projects.length; pIdx++) {
    const proj = projects[pIdx];
    const user = engineers[pIdx % engineers.length] || defaultUser;
    const task = proj.tasks.length > 0 ? proj.tasks[0] : null;

    // 1. Ensure at least 2 SiteReports per project
    const existingSiteCount = await prisma.siteReport.count({ where: { projectId: proj.id } });
    const targetSiteCount = Math.max(3, 3 - existingSiteCount);

    for (let i = 0; i < targetSiteCount; i++) {
      const dayOffset = (i + 1) * 2;
      await prisma.siteReport.create({
        data: {
          projectId: proj.id,
          reportedById: user.id,
          date: new Date(Date.now() - dayOffset * 86400000),
          weather: sampleWeathers[(pIdx + i) % sampleWeathers.length],
          workersCount: 85 + ((pIdx * 17 + i * 23) % 95),
          equipmentOnSite: sampleEquipment[(pIdx + i) % sampleEquipment.length],
          workCompleted: siteWorkTemplates[(pIdx + i) % siteWorkTemplates.length],
          issuesFaced: i === 0 ? 'Normal site operations. Material logistics on critical schedule.' : 'None. Safety protocols strictly adhered to.',
          safetyIncidents: 0,
          photos: JSON.stringify([`/demo/daily-${(pIdx % 4) + 1}.jpg`]),
        },
      });
    }

    // 2. Ensure at least 2 ProgressReports per project
    const existingProgCount = await prisma.progressReport.count({ where: { projectId: proj.id } });
    const targetProgCount = Math.max(2, 2 - existingProgCount);

    for (let i = 0; i < targetProgCount; i++) {
      const template = progressTemplates[(pIdx + i) % progressTemplates.length];
      const dayOffset = (i + 1) * 4;
      await prisma.progressReport.create({
        data: {
          projectId: proj.id,
          taskId: task ? task.id : null,
          percentage: Math.min(100, Math.max(15, (proj.progress || 30) + (i * 12) - 6)),
          description: template.desc,
          reportedById: user.id,
          date: new Date(Date.now() - dayOffset * 86400000),
          photos: JSON.stringify([`/demo/progress-${(pIdx % 3) + 1}.jpg`]),
        },
      });
    }

    // 3. Ensure at least 2 DelayReports per project
    const existingDelayCount = await prisma.delayReport.count({ where: { projectId: proj.id } });
    const targetDelayCount = Math.max(2, 2 - existingDelayCount);

    for (let i = 0; i < targetDelayCount; i++) {
      const dTemplate = delayTemplates[(pIdx * 2 + i) % delayTemplates.length];
      await prisma.delayReport.create({
        data: {
          projectId: proj.id,
          taskId: task ? task.id : null,
          reason: dTemplate.reason,
          impactDays: dTemplate.impactDays,
          mitigationPlan: dTemplate.mitigationPlan,
          status: i === 0 ? dTemplate.status : (i % 2 === 0 ? 'OPEN' : 'RESOLVED'),
          reportedById: user.id,
        },
      });
    }
  }

  const [totalSite, totalProgress, totalDelay] = await Promise.all([
    prisma.siteReport.count(),
    prisma.progressReport.count(),
    prisma.delayReport.count(),
  ]);

  console.log('SUCCESS! Updated database reports counts:', {
    siteReports: totalSite,
    progressReports: totalProgress,
    delayReports: totalDelay,
  });
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

