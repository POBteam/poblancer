import {revalidateTag} from 'next/cache';
import {allowedPath} from '@/lib/transport.mjs';
import {proxy,failure} from '@/lib/server';
export const dynamic='force-dynamic';
async function handle(request:Request,context:{params:Promise<{path:string[]}>}) {
 const {path}=await context.params;
 if(!allowedPath(path))return failure('Endpoint unavailable.',404);
 if(path.join('/')==='wp/v2/media' && request.method!=='POST')return failure('Method unavailable.',405);
 const query=new URL(request.url).search;
 const response=await proxy(request,'/wp-json/'+path.join('/')+query,true);
 if(request.method==='POST'&&path.join('/')==='poblancer/v1/video-portfolio'&&response.ok){const out=await response.clone().json();if(Number.isInteger(out.id)&&out.id>0)revalidateTag('public-video-portfolio-'+out.id,{expire:0});}
 if(request.method==='POST'&&response.ok&&path[0]==='poblancer'&&['service-editor','employer-editor','profile','proposal-submit','public-action'].includes(path[2])){const result=await response.clone().json().catch(()=>null);if(result&&result.status!==false&&!result.code){for(const tag of ['public-services','public-projects','public-jobs','public-details','public-freelancers','public-freelancer-profiles','public-employers','public-employer-profiles'])revalidateTag(tag,{expire:0});}}
 return response;
}
export {handle as GET,handle as POST};
