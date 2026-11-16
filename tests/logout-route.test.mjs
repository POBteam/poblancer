import test from 'node:test';
import assert from 'node:assert/strict';
import { GET, POST } from '../src/app/api/logout/route.ts';

test('logout route GET redirects to /login and clears authentication cookies', async () => {
  const req = new Request('https://pob.com.ng/api/logout', {
    method: 'GET',
    headers: {
      'cookie': 'wordpress_logged_in_abc123=test_token; other_cookie=123',
    },
  });

  const res = await GET(req);
  assert.equal(res.status, 303);
  assert.equal(res.headers.get('Location'), 'https://pob.com.ng/login');

  const cookies = res.headers.getSetCookie();
  assert.ok(cookies.length > 0, 'Must emit Set-Cookie clearing headers');
  
  const loggedInCleared = cookies.some(c => c.includes('wordpress_logged_in_abc123=') && c.includes('Max-Age=0'));
  assert.ok(loggedInCleared, 'wordpress_logged_in cookie must be cleared with Max-Age=0');
});

test('logout route POST with JSON accept returns 200 JSON with clearing headers', async () => {
  const req = new Request('https://pob.com.ng/api/logout', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'cookie': 'wordpress_sec_token=secret_val',
    },
  });

  const res = await POST(req);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.authenticated, false);
  assert.equal(data.redirect, '/login');

  const cookies = res.headers.getSetCookie();
  assert.ok(cookies.some(c => c.includes('wordpress_sec_token=') && c.includes('Max-Age=0')));
});
