import {proxy} from '@/lib/server';
export const dynamic='force-dynamic';
export function POST(request:Request) {return proxy(request,'/wp-admin/admin-ajax.php?action=pob_next_session');}
