import {createSessionReader} from './session-read.mjs';
export type Session={authenticated:boolean;nonce?:string;login_nonce?:string;home:string;original_login:string;register:string;logout?:string;captcha?:boolean;user?:{name:string;id:number}};
const sessionReader=createSessionReader({refreshSession:getSession,fetchRead:async(path:string,nonce:string,signal?:AbortSignal)=>{
 const r=await fetch('/api/wp/poblancer/v1/'+path,{credentials:'same-origin',cache:'no-store',headers:{'X-WP-Nonce':nonce},signal});
 return {status:r.status,body:await r.json()};
}});
export async function getSession():Promise<Session> {
 const r=await fetch('/api/session',{method:'POST',credentials:'same-origin',cache:'no-store'});
 const data=await r.json();if(!r.ok)throw new Error(data.message||'Unable to connect to WordPress.');sessionReader.remember(data);return data;
}
export async function api(path:string,nonce:string,signal?:AbortSignal) {
 const {status,body:data}=await sessionReader.read(path,nonce,signal);
 if(status<200||status>=300)throw new Error(data.message||'Unable to load your account.');return data;
}
export function sessionNonce(session:Session):string{return sessionReader.credential(session)||'';}
export function configuration(session:Session):Record<string,string> {
 const base=location.origin+'/api/wp/poblancer/v1/';
 return {nonce:session.nonce||'',home:session.home,login:'/login',register:'/register',assetBase:'/legacy/',mediaApi:location.origin+'/api/wp/wp/v2/media',...Object.fromEntries(Object.entries({api:'workspace',supportApi:'support',listingsApi:'listings',viewsApi:'page-views',addonsApi:'addons',editorApi:'service-editor',termsApi:'editor-terms',messagesApi:'messages',profileApi:'profile',toolsApi:'account-tool',collectionApi:'collection',employerEditorApi:'employer-editor',managementApi:'management',contractApi:'contract'}).map(([k,v])=>[k,base+v]))};
}
