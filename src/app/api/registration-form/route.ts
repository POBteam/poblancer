import {proxy} from '@/lib/server';
export const dynamic='force-dynamic';
export function POST(request:Request){return proxy(request,'/?pob_ajax=pob_next_registration');}
