import 'server-only';
import {BodyError,createSubmissionAdmission,readBoundedBody} from './request-body.mjs';
const bodyState=globalThis as typeof globalThis & {pobBodyAdmission?:ReturnType<typeof createSubmissionAdmission>};
const admitBody=bodyState.pobBodyAdmission??=createSubmissionAdmission();
import {sessionCookies, validOrigin, sanitizeSetCookie} from './transport.mjs';
import {parseRegistrationResponse} from './registration-response.mjs';
import {canBatchRead,batchedRead} from './read-batch-server';
export const wpOrigin = new URL(process.env.WORDPRESS_ORIGIN || (process.env.NODE_ENV==='production'?'https://poblancer.pob.com.ng':'http://poblancer.local')).origin;

const standardProductionOrigins = [
  'https://pob.com.ng',
  'https://poblancer.pobacademycustomer6.workers.dev',
  'https://poblancer.workers.dev',
];
const standardDevelopmentOrigins = [
  'http://poblancer.local:3101',
  'http://poblancer.local:3102',
  'http://poblancer.local:3103',
  'http://localhost:3101',
  'http://localhost:3102',
  'http://localhost:3103',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3105'
];

const configuredOrigins = process.env.FRONTEND_ORIGIN
  ? process.env.FRONTEND_ORIGIN.split(',').map(s=>s.trim()).filter(Boolean)
  : [];

export const allowedFrontendOrigins = Array.from(new Set([
  ...(process.env.NODE_ENV === 'production' ? standardProductionOrigins : standardDevelopmentOrigins),
  ...configuredOrigins
]));

export const frontendOrigin = new URL(
  process.env.FRONTEND_ORIGIN?.split(',')[0].trim() ||
  (process.env.NODE_ENV === 'production' ? 'https://pob.com.ng' : 'http://poblancer.local:3101')
).origin;
export const privateHeaders = {'Cache-Control':'private, no-store, max-age=0','Vary':'Cookie','X-Content-Type-Options':'nosniff'};
export function failure(message:string,status:number) {return Response.json({message},{status,headers:privateHeaders});}
export async function proxy(request:Request, path:string, requireNonce=false) {
  if(request.method!=='GET' && !validOrigin(request, allowedFrontendOrigins)) return failure('Request origin is not permitted.',403);
  if(requireNonce && !request.headers.get('x-wp-nonce')) return failure('Please sign in again.',401);
  if(canBatchRead(request,path)){
    try{const out=await batchedRead(request,path);return Response.json(out.body,{status:out.status,headers:privateHeaders});}
    catch{return failure('WordPress could not complete this read. No automatic retry was performed.',502);}
  }
  const originHeader = request.headers.get('origin') || request.headers.get('referer');
  const upstreamOrigin = (originHeader && validOrigin(request, allowedFrontendOrigins)) ? new URL(originHeader).origin : frontendOrigin;
  const headers=new Headers({'Accept':'application/json','Origin':upstreamOrigin,'X-POB-Frontend':'1'});
  const cookies=sessionCookies(request.headers.get('cookie')||'');if(cookies)headers.set('Cookie',cookies);
  for(const name of ['content-type','x-wp-nonce']) {const value=request.headers.get(name);if(value)headers.set(name,value);}
  // No credentials, forwarded IP, upstream URL or account identity accepted from request data.
  let releaseBody:(()=>void)|undefined;
  try {
    const hasBody=request.method!=='GET' && request.method!=='HEAD' && request.body;
    const admission=hasBody?admitBody(request):undefined;
    releaseBody=admission?.release;
    const bytes=hasBody?await readBoundedBody(request,{limit:admission!.limit}):undefined;
    const init:RequestInit & {duplex?:string}={method:request.method,headers,redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(30000)};
    if(bytes)init.body=bytes;
    const upstream=await fetch(new URL(path,wpOrigin),init);
    let body:BodyInit|null=upstream.body;
    let contentType=upstream.headers.get('content-type')||'application/json';
    if(!contentType.includes('application/json')) {
      if(path==='/?wpfi-ajax=wp_freeio_ajax_registernew'){
        try{body=JSON.stringify(parseRegistrationResponse(await upstream.text()));contentType='application/json';}
        catch{return failure('WordPress could not confirm registration. Check your email or sign in before trying again.',502);}
      }else{
        await upstream.body?.cancel();
        return failure('WordPress could not confirm the result. No automatic retry was performed.',502);
      }
    }
    const output=new Headers(privateHeaders);
    output.set('Content-Type',contentType);
    for(const cookie of upstream.headers.getSetCookie()) output.append('Set-Cookie', sanitizeSetCookie(cookie));
    const nonce=upstream.headers.get('x-wp-nonce');if(nonce)output.set('X-WP-Nonce',nonce);
    // REST commands must return structured results; never relay an unvalidated redirect.
    if(upstream.status>=300 && upstream.status<400) return failure('WordPress requested a native-page handoff. Please use the current dashboard.',502);
    return new Response(body,{status:upstream.status,headers:output});
  } catch(error) {if(error instanceof BodyError)return failure(error.message,error.status);return failure('WordPress is unavailable. Your submission has not been automatically retried.',502);}
  finally{releaseBody?.();}
}
