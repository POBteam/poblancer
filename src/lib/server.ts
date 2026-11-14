import 'server-only';
import {BodyError,createSubmissionAdmission,readBoundedBody} from './request-body.mjs';
const bodyState=globalThis as typeof globalThis & {pobBodyAdmission?:ReturnType<typeof createSubmissionAdmission>};
const admitBody=bodyState.pobBodyAdmission??=createSubmissionAdmission();
import {sessionCookies, validOrigin, sanitizeSetCookie} from './transport.mjs';
import {parseRegistrationResponse} from './registration-response.mjs';
import {sanitizeCustomerMessage} from './friendly-messages.mjs';
import {resolveWordPressOrigin} from './public-routes.mjs';
import {canBatchRead,batchedRead} from './read-batch-server';
export const wpOrigin = resolveWordPressOrigin();

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
export function failure(message:string,status:number) {return Response.json({message:sanitizeCustomerMessage(message)},{status,headers:privateHeaders});}
export async function proxy(request:Request, path:string, requireNonce=false) {
  if(request.method!=='GET' && !validOrigin(request, allowedFrontendOrigins)) return failure("You don't have permission to perform this action from your current browser session.",403);
  if(requireNonce && !request.headers.get('x-wp-nonce')) return failure('Your session has expired. Please sign in again to continue.',401);
  if(canBatchRead(request,path)){
    try{const out=await batchedRead(request,path);return Response.json(out.body,{status:out.status,headers:privateHeaders});}
    catch{return failure("We couldn't load this information right now. Please try again in a moment.",502);}
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
    const backendOrigin = resolveWordPressOrigin();
    const upstream=await fetch(new URL(path,backendOrigin),init);
    let body:BodyInit|null=upstream.body;
    let contentType=upstream.headers.get('content-type')||'application/json';
    if(!contentType.includes('application/json')) {
      if(path==='/?wpfi-ajax=wp_freeio_ajax_registernew'){
        try{body=JSON.stringify(parseRegistrationResponse(await upstream.text()));contentType='application/json';}
        catch(err){
          console.error('[POBlancer Registration Error]', err instanceof Error ? err.message : err);
          return failure("We couldn't confirm whether your registration completed. Please check your email inbox or try logging in before submitting again. If you need assistance, contact our support team.",502);
        }
      }else{
        const errText = await upstream.text().catch(()=>'');
        console.error('[POBlancer Upstream Non-JSON Response]', {
          path,
          targetUrl: new URL(path, backendOrigin).toString(),
          status: upstream.status,
          contentType,
          snippet: errText.slice(0, 300)
        });
        return failure("We couldn't complete your request right now. Please try again in a moment. If the problem continues, contact our support team.",502);
      }
    }
    const output=new Headers(privateHeaders);
    output.set('Content-Type',contentType);
    for(const cookie of upstream.headers.getSetCookie()) output.append('Set-Cookie', sanitizeSetCookie(cookie));
    const nonce=upstream.headers.get('x-wp-nonce');if(nonce)output.set('X-WP-Nonce',nonce);
    // REST commands must return structured results; never relay an unvalidated redirect.
    if(upstream.status>=300 && upstream.status<400) return failure('Please continue this action directly in your POBlancer dashboard.',502);
    return new Response(body,{status:upstream.status,headers:output});
  } catch(error) {
    if(error instanceof BodyError)return failure(error.message,error.status);
    console.error('[POBlancer Upstream Service Error]', error instanceof Error ? error.message : error);
    return failure("The service is temporarily unavailable. Please try again in a moment. If the problem continues, contact our support team.",502);
  }
  finally{releaseBody?.();}
}
