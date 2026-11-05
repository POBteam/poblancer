import 'server-only';
import {createHmac} from 'node:crypto';
import {createReadBatcher,batchableReadPath} from './read-batcher.mjs';
import {sessionCookies,localBatchOrigin} from './transport.mjs';
import {createLatencySummary} from './latency-summary.mjs';
const secret=process.env.WORDPRESS_READ_BATCH_SECRET||'';
const wp=new URL(process.env.WORDPRESS_ORIGIN||'http://poblancer.local').origin;
const local=localBatchOrigin(wp,process.env.POB_ISOLATED_BENCHMARK==='1');
const state=globalThis as typeof globalThis & {pobReadBatcher?:ReturnType<typeof createReadBatcher>;pobWordPressTiming?:ReturnType<typeof createLatencySummary>};
const wordpressTiming=state.pobWordPressTiming??=createLatencySummary(['bootstrap_ms','handler_ms','query_count','peak_mb']);
function instance(){return state.pobReadBatcher??=createReadBatcher({send:async(requests:unknown[])=>{
 const raw=JSON.stringify({requests}),time=String(Math.floor(Date.now()/1000));
 const signature=createHmac('sha256',secret).update(time+'.'+raw).digest('hex');
 const response=await fetch(wp+'/wp-json/poblancer/v1/read-batch',{method:'POST',redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(30000),headers:{'Content-Type':'application/json','X-POB-Batch-Time':time,'X-POB-Batch-Signature':signature},body:raw});
 if(!response.ok)throw new Error('WordPress could not confirm this read batch. No automatic retry was performed.');
 const result=await response.json();
 for(const name of ['bootstrap_ms','handler_ms','query_count','peak_mb'])wordpressTiming.add(name,result.timing?.[name]);
 return result.results;
 }});}
export function canBatchRead(request:Request,path:string){return process.env.POB_ENABLE_READ_BATCH==='1'&&local&&secret.length>=32&&request.method==='GET'&&batchableReadPath(path);}
export async function batchedRead(request:Request,path:string){
 const cookie=sessionCookies(request.headers.get('cookie')||''),nonce=request.headers.get('x-wp-nonce')||'';
 if(cookie.length>8192||nonce.length>128)throw new Error('Invalid read credentials.');
 return await instance().enqueue({path:path.replace(/^\/wp-json/,''),cookie,nonce},request.signal) as {status:number;body:unknown};
}
export function batchStats(){return {...(state.pobReadBatcher?.stats()||{reads:0,batches:0,failed:0,aborted:0,pending:0,active:0,maxPending:0,maxActive:0}),wordpress:wordpressTiming.snapshot()};}
export function validMetricsRequest(request:Request){
 if(!local||secret.length<32)return false;
 const time=request.headers.get('x-pob-metrics-time')||'',signature=request.headers.get('x-pob-metrics-signature')||'';
 if(!/^\d+$/.test(time)||Math.abs(Date.now()/1000-Number(time))>30)return false;
 // Constant-time comparison without accepting an arbitrary-length input.
 if(!/^[a-f0-9]{64}$/.test(signature))return false;
 const expected=createHmac('sha256',secret).update(time+'.metrics').digest('hex');let diff=0;for(let i=0;i<64;i++)diff|=expected.charCodeAt(i)^signature.charCodeAt(i);return diff===0;
}
