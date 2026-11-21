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

const administrativeFallbackMap: Record<string, string> = {
  '/wp-json/poblancer/v1/session': '/?pob_ajax=pob_next_session',
  '/wp-json/poblancer/v1/login': '/?pob_ajax=pob_next_login',
  '/wp-json/poblancer/v1/registration-form': '/?pob_ajax=pob_next_registration',
  '/wp-json/poblancer/v1/register': '/?pob_ajax=pob_next_register',
  '/wp-json/poblancer/v1/logout': '/?pob_ajax=pob_next_logout',
};

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
  const userAgent = request.headers.get('user-agent');
  const finalUserAgent = (!userAgent || userAgent === 'Mozilla/5.0')
    ? 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
    : userAgent;
  headers.set('User-Agent', finalUserAgent);
  const cookies=sessionCookies(request.headers.get('cookie')||'');if(cookies)headers.set('Cookie',cookies);
  for(const name of ['content-type','x-wp-nonce']) {const value=request.headers.get(name);if(value)headers.set(name,value);}
  // No credentials, forwarded IP, upstream URL or account identity accepted from request data.
  let releaseBody:(()=>void)|undefined;
  try {
    const hasBody=request.method!=='GET' && request.method!=='HEAD' && request.body;
    const admission=hasBody?admitBody(request):undefined;
    releaseBody=admission?.release;
    const bytes=hasBody?await readBoundedBody(request,{limit:admission!.limit}):undefined;
    if(releaseBody){releaseBody();releaseBody=undefined;}
    const timeoutMs = (path === '/wp-json/poblancer/v1/register' || path === '/?pob_ajax=pob_next_register' || path === '/?wpfi-ajax=wp_freeio_ajax_registernew') ? 90000 : 30000;
    const init:RequestInit & {duplex?:string}={method:request.method,headers,redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(timeoutMs)};
    if(bytes)init.body=bytes;
    const backendOrigin = resolveWordPressOrigin();
    const upstream=await fetch(new URL(path,backendOrigin),init);
    let body:BodyInit|null=upstream.body;
    let contentType=upstream.headers.get('content-type')||'application/json';
    if(!contentType.includes('application/json')) {
      if(path==='/wp-json/poblancer/v1/register' || path==='/?pob_ajax=pob_next_register' || path==='/?wpfi-ajax=wp_freeio_ajax_registernew'){
        try{body=JSON.stringify(parseRegistrationResponse(await upstream.text()));contentType='application/json';}
        catch(err){
          console.error('[POBlancer Registration Error]', err instanceof Error ? err.message : err);
          return failure("We couldn't confirm whether your registration completed. Please check your email inbox or try logging in before submitting again. If you need assistance, contact our support team.",502);
        }
      }else{
        const errText = await upstream.text().catch(()=>'');
        const basePath = path.split('?')[0];
        const search = path.includes('?') ? '&' + path.split('?')[1] : '';
        const fallbackTarget = administrativeFallbackMap[basePath];
        if (fallbackTarget && (upstream.status === 403 || errText.includes('administrative rules'))) {
          try {
            const fallbackUpstream = await fetch(new URL(fallbackTarget + search, backendOrigin), init);
            const fbCt = fallbackUpstream.headers.get('content-type') || 'application/json';
            if (fbCt.includes('application/json')) {
              const fbOutput = new Headers(privateHeaders);
              fbOutput.set('Content-Type', fbCt);
              for (const cookie of fallbackUpstream.headers.getSetCookie()) fbOutput.append('Set-Cookie', sanitizeSetCookie(cookie));
              const nonce = fallbackUpstream.headers.get('x-wp-nonce'); if (nonce) fbOutput.set('X-WP-Nonce', nonce);
              if (fallbackUpstream.status >= 300 && fallbackUpstream.status < 400) return failure('Please continue this action directly in your POBlancer dashboard.', 502);
              return new Response(fallbackUpstream.body, { status: fallbackUpstream.status, headers: fbOutput });
            }
          } catch (fbErr) {
            console.error('[POBlancer Fallback Error]', fbErr instanceof Error ? fbErr.message : fbErr);
          }
        }
        console.error('[POBlancer Upstream Non-JSON Response]', {
          path,
          targetUrl: new URL(path, backendOrigin).toString(),
          status: upstream.status,
          contentType,
          snippet: errText.slice(0, 300)
        });
        const failRes = failure("We couldn't complete your request right now. Please try again in a moment. If the problem continues, contact our support team.",502);
        failRes.headers.set('X-Upstream-Status', String(upstream.status));
        failRes.headers.set('X-Upstream-ContentType', contentType);
        failRes.headers.set('X-Upstream-Target', new URL(path, backendOrigin).toString());
        failRes.headers.set('X-Upstream-Snippet', errText.slice(0, 200).replace(/[\r\n]+/g, ' '));
        const dumpHeaders: Record<string, string> = {};
        upstream.headers.forEach((v, k) => { dumpHeaders[k] = v; });
        failRes.headers.set('X-Upstream-All-Headers', JSON.stringify(dumpHeaders).slice(0, 500));
        return failRes;
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
    const failRes = failure("The service is temporarily unavailable. Please try again in a moment. If the problem continues, contact our support team.",502);
    failRes.headers.set('X-Upstream-Catch', error instanceof Error ? error.message : String(error));
    return failRes;
  }
  finally{releaseBody?.();}
}
