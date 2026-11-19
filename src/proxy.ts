import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const proto = request.headers.get('x-forwarded-proto') || request.nextUrl.protocol.replace(':', '');
  const host = request.headers.get('host') || request.nextUrl.host;

  // In production, enforce HTTPS for requests arriving over HTTP
  if (proto === 'http' && (host === 'pob.com.ng' || host === 'www.pob.com.ng')) {
    const httpsUrl = new URL(request.url);
    httpsUrl.protocol = 'https:';
    httpsUrl.host = host;
    return NextResponse.redirect(httpsUrl.href, 301);
  }

  const response = NextResponse.next();
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('Content-Security-Policy', 'upgrade-insecure-requests');
  return response;
}

export default proxy;

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|brand/|downloads/).*)',
  ],
};
