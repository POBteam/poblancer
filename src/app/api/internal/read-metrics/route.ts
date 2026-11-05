import {batchStats,validMetricsRequest} from '@/lib/read-batch-server';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 if(!validMetricsRequest(request))return Response.json({message:'Unavailable.'},{status:404,headers:{'Cache-Control':'private, no-store'}});
 return Response.json(batchStats(),{headers:{'Cache-Control':'private, no-store'}});
}
