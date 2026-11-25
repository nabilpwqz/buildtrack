const http = require('http');

async function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

(async () => {
  try {
    // 1. Get CSRF token
    const csrfRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/csrf',
      method: 'GET'
    });
    const csrfData = JSON.parse(csrfRes.data);
    const csrfToken = csrfData.csrfToken;
    const cookies = csrfRes.headers['set-cookie'] || [];
    const cookieHeader = cookies.map(c => c.split(';')[0]).join('; ');

    console.log('CSRF Token retrieved:', csrfToken ? 'YES' : 'NO');

    // 2. Sign in as admin@buildtrack.com
    const formBody = new URLSearchParams({
      csrfToken: csrfToken,
      email: 'admin@buildtrack.com',
      password: 'password123',
      redirect: 'false',
      json: 'true'
    }).toString();

    const signinRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/callback/credentials',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(formBody),
        'Cookie': cookieHeader
      }
    }, formBody);

    console.log('SignIn Response Status:', signinRes.statusCode);
    const sessionCookies = signinRes.headers['set-cookie'] || [];
    const authCookieHeader = [
      cookieHeader,
      ...sessionCookies.map(c => c.split(';')[0])
    ].filter(Boolean).join('; ');

    // 3. Test all 15 expected pages with the authenticated session cookie
    const pages = [
      '/login',
      '/register',
      '/dashboard',
      '/projects',
      '/projects/new',
      '/tasks',
      '/tasks/kanban',
      '/budget',
      '/expenses',
      '/materials',
      '/contractors',
      '/reports',
      '/users',
      '/settings/profile',
      '/settings/system'
    ];

    console.log('\nVerifying 15 Expected Pages with Authenticated ADMIN Session:');
    for (const page of pages) {
      const pageRes = await request({
        hostname: 'localhost',
        port: 3000,
        path: page,
        method: 'GET',
        headers: {
          'Cookie': authCookieHeader,
          'User-Agent': 'Node-HealthCheck'
        }
      });
      console.log(`  ${page.padEnd(20)} => HTTP ${pageRes.statusCode} (${pageRes.statusCode === 200 ? 'OK' : 'REDIRECT/ERROR'})`);
    }

    // 4. Test project details and timeline on first real project ID
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const firstProject = await prisma.project.findFirst({ select: { id: true, name: true } });
    if (firstProject) {
      console.log(`\nTesting Dynamic Project Pages for Project ID: ${firstProject.id} (${firstProject.name})`);
      const detailRes = await request({
        hostname: 'localhost',
        port: 3000,
        path: `/projects/${firstProject.id}`,
        method: 'GET',
        headers: { 'Cookie': authCookieHeader }
      });
      console.log(`  ${`/projects/${firstProject.id}`.padEnd(20)} => HTTP ${detailRes.statusCode} (${detailRes.statusCode === 200 ? 'OK' : 'FAIL'})`);

      const timelineRes = await request({
        hostname: 'localhost',
        port: 3000,
        path: `/projects/${firstProject.id}/timeline`,
        method: 'GET',
        headers: { 'Cookie': authCookieHeader }
      });
      console.log(`  ${`/projects/${firstProject.id}/timeline`.padEnd(20)} => HTTP ${timelineRes.statusCode} (${timelineRes.statusCode === 200 ? 'OK' : 'FAIL'})`);
    }
    await prisma.$disconnect();
  } catch (err) {
    console.error('Test error:', err);
  }
})();
