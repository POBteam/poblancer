import { resolveWordPressOrigin } from '../../../lib/public-routes.mjs';
import { sessionCookies } from '../../../lib/transport.mjs';

export const dynamic = 'force-dynamic';

const privateHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  'Vary': 'Cookie',
  'X-Content-Type-Options': 'nosniff',
};

function getClearingCookies(cookieHeader: string | null): string[] {
  const names = new Set<string>([
    'wordpress_logged_in',
    'wordpress_sec',
    'wordpress',
    'wp-settings',
    'wp-settings-time',
    'wp_woocommerce_session',
    'woocommerce_cart_hash',
    'woocommerce_items_in_cart',
    'service_add_new_update',
    'job_add_new_update',
    'project_add_new_update',
  ]);

  if (cookieHeader) {
    for (const part of cookieHeader.split(';')) {
      const name = part.split('=')[0]?.trim();
      if (name) {
        names.add(name);
      }
    }
  }

  const result: string[] = [];
  for (const name of names) {
    result.push(`${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly; SameSite=Lax; Secure`);
    result.push(`${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; SameSite=Lax; Secure`);
  }
  return result;
}

async function handleLogout(request: Request) {
  const cookie = request.headers.get('cookie') || '';
  const backendOrigin = resolveWordPressOrigin();

  // Invalidate session on WordPress backend
  try {
    const headers = new Headers({
      'Accept': 'application/json',
      'Origin': 'https://pob.com.ng',
      'X-POB-Frontend': '1',
      'User-Agent': request.headers.get('user-agent') || 'POBlancer/1.0',
    });
    const sCookies = sessionCookies(cookie);
    if (sCookies) headers.set('Cookie', sCookies);

    await fetch(new URL('/?pob_ajax=pob_next_logout', backendOrigin), {
      method: 'POST',
      headers,
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
  } catch (e) {
    console.warn('[Logout Upstream Warning]', e instanceof Error ? e.message : e);
  }

  const clearHeaders = new Headers(privateHeaders);
  for (const c of getClearingCookies(cookie)) {
    clearHeaders.append('Set-Cookie', c);
  }

  const isPost = request.method === 'POST';
  const acceptsJson = request.headers.get('accept')?.includes('application/json');

  if (isPost && acceptsJson) {
    return Response.json({ authenticated: false, redirect: '/login' }, {
      status: 200,
      headers: clearHeaders,
    });
  }

  const loginUrl = new URL('/login', request.url);
  clearHeaders.set('Location', loginUrl.toString());
  return new Response(null, {
    status: 303,
    headers: clearHeaders,
  });
}

export { handleLogout as GET, handleLogout as POST };
