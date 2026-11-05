import {readServices} from '../../../../lib/public-services-server';
import {serviceQuery,privateServiceQuery} from '../../../../lib/public-services.mjs';
export async function GET(request:Request){
 let query:URLSearchParams;
 try{query=serviceQuery(new URL(request.url).searchParams);}catch{return Response.json({message:'Check your service filters.'},{status:400});}
 try{return Response.json(await readServices(query),{headers:{'Cache-Control':privateServiceQuery(query)?'private, no-store':'public, max-age=60, s-maxage=300','X-Content-Type-Options':'nosniff'}});}
 catch{return Response.json({message:'Could not load these results. Your previous results are still shown. Please try again.'},{status:502,headers:{'Cache-Control':'no-store'}});}
}
