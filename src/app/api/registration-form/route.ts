import {proxy} from '@/lib/server';

export const dynamic = 'force-dynamic';

export function POST(request: Request) {
  return proxy(request, '/wp-json/poblancer/v1/registration-form');
}
