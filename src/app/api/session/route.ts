import {proxy} from '@/lib/server';

export const dynamic = 'force-dynamic';

function handle(request: Request) {
  const query = new URL(request.url).search;
  return proxy(request, '/wp-json/poblancer/v1/session' + query);
}

export { handle as GET, handle as POST };
