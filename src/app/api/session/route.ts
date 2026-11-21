import {proxy} from '@/lib/server';

export const dynamic = 'force-dynamic';

function handle(request: Request) {
  const query = new URL(request.url).search;
  const target = query
    ? `/?pob_ajax=pob_next_session&${query.slice(1)}`
    : '/?pob_ajax=pob_next_session';
  return proxy(request, target);
}

export { handle as GET, handle as POST };
