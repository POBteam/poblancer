import {resolveWordPressOrigin} from '@/lib/public-routes.mjs';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const backendOrigin = resolveWordPressOrigin();
  const res = await fetch(new URL('/wp-json/poblancer/v1/echo-headers', backendOrigin), {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'application/json',
    }
  });
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { 'Content-Type': 'application/json', 'X-Upstream-Status': String(res.status) }
  });
}
