const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function run() {
  const projects = await prisma.project.findMany();
  const engineer = await prisma.user.findFirst({ where: { role: 'SITE_ENGINEER' } });
  const pm = await prisma.user.findFirst({ where: { role: 'PROJECT_MANAGER' } });
  const reporterId = engineer?.id || pm?.id;

  if (!reporterId || projects.length === 0) {
    console.log('No user or projects found');
    return;
  }

  const extraDelays = [
    {
      projName: 'Dhaka Metro Elevated Viaduct Phase 3',
      reason: 'Unmapped legacy underground gas distribution line encountered at Pier 114 footing excavation.',
      impactDays: 7,
      mitigationPlan: 'Joint utility corridor trenchless micro-tunneling executed with Titas Gas; shifted pier cap staging to Pier 115-118 in parallel.',
      status: 'RESOLVED',
    },
    {
      projName: 'Chattogram Port Dry Dock Expansion',
      reason: 'Specialized 200T marine mooring bollards and pneumatic fenders delayed in Singapore port congestion.',
      impactDays: 21,
      mitigationPlan: 'Direct bonded maritime charter rerouted through Colombo; accelerated dry-dock slab slipform casting on non-critical path.',
      status: 'OPEN',
    },
    {
      projName: 'Karnaphuli River Deep-Water Terminal',
      reason: 'Flash monsoon hydraulic scouring near Quay Wall Berth-3 exceeding baseline sediment model by 1.8m.',
      impactDays: 14,
      mitigationPlan: 'Deployed 2,500 m² geotextile filtration mattresses and 400T stone riprap revetment with twin cutter suction dredgers.',
      status: 'MITIGATED',
    },
    {
      projName: 'Sylhet International Trade Center',
      reason: 'Structural steel portal frame trusses fabrication bottleneck at secondary regional foundry.',
      impactDays: 12,
      mitigationPlan: 'Dispatched dedicated Level-3 metallurgical NDT inspector; shifted 45% secondary bracing to pre-qualified certified fabricator.',
      status: 'MITIGATED',
    },
    {
      projName: 'Gulshan High-Rise Financial Spire',
      reason: 'Vortex shedding wind speeds (>68 km/h) exceeding tower crane hoisting safety limits above Level 38.',
      impactDays: 5,
      mitigationPlan: 'Automated ultrasonic anemometer interlocking engaged; rescheduled core-wall hydraulic climbing formwork pours to nocturnal calm windows.',
      status: 'RESOLVED',
    },
    {
      projName: 'Padma Logistic City & Heavy Depot',
      reason: 'Geotechnical soil consolidation settlement variance in Sub-base Sector C4.',
      impactDays: 10,
      mitigationPlan: 'Pre-fabricated vertical drains (PVD) surcharge acceleration installed with continuous piezometer settlement monitoring.',
      status: 'OPEN',
    }
  ];

  for (const d of extraDelays) {
    const proj = projects.find(pr => pr.name.includes(d.projName.split(' ')[0])) || projects[0];
    const exists = await prisma.delayReport.findFirst({
      where: { projectId: proj.id, reason: { contains: d.reason.substring(0, 20) } }
    });
    if (!exists) {
      await prisma.delayReport.create({
        data: {
          projectId: proj.id,
          reason: d.reason,
          impactDays: d.impactDays,
          mitigationPlan: d.mitigationPlan,
          status: d.status,
          reportedById: reporterId,
        }
      });
      console.log('Seeded delay report for:', proj.name);
    }
  }

  const [sCount, prCount, dCount] = await Promise.all([
    prisma.siteReport.count(),
    prisma.progressReport.count(),
    prisma.delayReport.count()
  ]);
  console.log('Final DB Counts:', { siteReports: sCount, progressReports: prCount, delayReports: dCount });
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

