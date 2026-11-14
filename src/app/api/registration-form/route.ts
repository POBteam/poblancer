import {resolveWordPressOrigin} from '@/lib/public-routes.mjs';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const backendOrigin = resolveWordPressOrigin();
    const targetUrl = new URL('/?pob_ajax=pob_next_registration', backendOrigin);
    const bodyText = await request.text();
    const upstream = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Origin': 'https://pob.com.ng',
        'X-POB-Frontend': '1',
        'Content-Type': request.headers.get('content-type') || 'application/x-www-form-urlencoded',
        'User-Agent': request.headers.get('user-agent') || 'Mozilla/5.0 (compatible; POBlancer/1.0; +https://pob.com.ng)',
      },
      body: bodyText,
    });
    const status = upstream.status;
    const ct = upstream.headers.get('content-type') || '';
    const text = await upstream.text();
    
    return new Response(text, {
      status,
      headers: {
        'Content-Type': ct || 'application/json',
        'X-Upstream-Status': String(status),
        'X-Upstream-Target': targetUrl.toString(),
      }
    });
  } catch (err: any) {
    return Response.json({
      error: err.message,
      stack: err.stack,
    }, { status: 502 });
  }
}
