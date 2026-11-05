import {proxy} from '@/lib/server';
export const dynamic='force-dynamic';
// Exact native callback: CMB nonce/validation/user hooks remain authoritative.
export function POST(request:Request){return proxy(request,'/?wpfi-ajax=wp_freeio_ajax_registernew');}
