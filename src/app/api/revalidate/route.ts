import {revalidateTag} from 'next/cache';
import {verifiedUpdate} from '../../../lib/revalidation.mjs';
import {readBoundedBody} from '../../../lib/request-body.mjs';
export async function POST(request:Request){
 let body:string;try{body=new TextDecoder().decode(await readBoundedBody(request,{limit:2048,timeoutMs:3000}));}catch{return Response.json({ok:false},{status:400});}
 const tags=verifiedUpdate(body,request.headers.get('x-pob-timestamp'),request.headers.get('x-pob-signature'),process.env.WORDPRESS_REVALIDATE_SECRET);
 if(!tags)return Response.json({ok:false},{status:403});for(const tag of tags)revalidateTag(tag,{expire:0});return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
}
