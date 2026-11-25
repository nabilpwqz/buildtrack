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

async function testRoleLogin(credentials) {
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

  // 2. Post credentials
  const formBody = new URLSearchParams({
    csrfToken: csrfToken,
    email: credentials.email || '',
    password: credentials.password || 'Demo@1234',
    role: credentials.role || '',
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

  const sessionCookies = signinRes.headers['set-cookie'] || [];
  const authCookieHeader = [
    cookieHeader,
    ...sessionCookies.map(c => c.split(';')[0])
  ].filter(Boolean).join('; ');

  // 3. Verify session
  const sessionRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/session',
    method: 'GET',
    headers: {
      'Cookie': authCookieHeader
    }
  });

  const session = sessionRes.data ? JSON.parse(sessionRes.data) : null;
  return {
    statusCode: signinRes.statusCode,
    user: session?.user || null
  };
}

(async () => {
  console.log('--- Testing BuildTrack Role Logins ---\n');

  const testCases = [
    { label: 'Admin (Email)', email: 'admin@buildtrack.com', expectedRole: 'ADMIN' },
    { label: 'Project Manager (Email)', email: 'pm@buildtrack.com', expectedRole: 'PROJECT_MANAGER' },
    { label: 'Site Engineer (Email)', email: 'engineer@buildtrack.com', expectedRole: 'SITE_ENGINEER' },
    { label: 'Finance Manager (Email)', email: 'finance@buildtrack.com', expectedRole: 'FINANCE_MANAGER' },
    { label: 'Contractor (Email)', email: 'contractor@buildtrack.com', expectedRole: 'CONTRACTOR' },
    { label: 'Project Manager (Shortcut)', email: 'project manager', expectedRole: 'PROJECT_MANAGER' },
    { label: 'PM (Shortcut)', email: 'pm', expectedRole: 'PROJECT_MANAGER' },
    { label: 'Contractor (Shortcut)', email: 'contractor', expectedRole: 'CONTRACTOR' },
    { label: 'Site Engineer (Shortcut)', email: 'site engineer', expectedRole: 'SITE_ENGINEER' },
    { label: 'Finance (Shortcut)', email: 'finance manager', expectedRole: 'FINANCE_MANAGER' },
    { label: 'Custom User with CONTRACTOR role', email: 'subcon.metro@buildtrack.com', role: 'CONTRACTOR', expectedRole: 'CONTRACTOR' },
    { label: 'Custom User with PROJECT_MANAGER role', email: 'director.infra@buildtrack.com', role: 'PROJECT_MANAGER', expectedRole: 'PROJECT_MANAGER' },
  ];

  let passed = 0;
  for (const tc of testCases) {
    const res = await testRoleLogin(tc);
    const actualRole = res.user?.role;
    const isOk = actualRole === tc.expectedRole;
    if (isOk) passed++;
    const status = isOk ? 'PASS' : 'FAIL';
    console.log(`[${status}] ${tc.label.padEnd(35)} => Actual Role: ${actualRole || 'NONE'} (Expected: ${tc.expectedRole}) | Name: ${res.user?.name || 'N/A'}`);
  }

  console.log(`\nResults: ${passed} / ${testCases.length} tests passed.`);
  if (passed === testCases.length) {
    console.log('ALL ROLE LOGINS VERIFIED SUCCESSFULLY!');
  } else {
    process.exit(1);
  }
})();

