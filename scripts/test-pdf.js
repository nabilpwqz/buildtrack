const http = require('http');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPdf() {
  const p = await prisma.project.findFirst({ select: { id: true, name: true } });
  if (!p) { console.log('No project'); return; }
  console.log('Testing PDF generation for:', p.id, p.name);

  return new Promise((resolve) => {
    http.get(`http://localhost:3000/api/v1/reports/financial/${p.id}`, (res) => {
      console.log('PDF HTTP Status:', res.statusCode);
      console.log('Content-Type:', res.headers['content-type']);
      console.log('Content-Disposition:', res.headers['content-disposition']);
      let size = 0;
      res.on('data', c => size += c.length);
      res.on('end', () => {
        console.log('Downloaded PDF bytes:', size);
        resolve(size);
      });
    });
  });
}

testPdf().finally(() => prisma.$disconnect());

