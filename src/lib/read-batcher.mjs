import {randomUUID} from 'node:crypto';
import {createLatencySummary} from './latency-summary.mjs';
const routes=new Set(['listings','page-views','messages','addons','collection','account-tool','management','contract','workspace','support']);
export function batchableReadPath(path){
 if(typeof path!=='string'||path.length>4096||path.includes('#')||path.includes('\\'))return false;
 const match=/^\/wp-json\/poblancer\/v1\/([a-z-]+)(?:\?[^#]*)?$/.exec(path);
 return Boolean(match&&routes.has(match[1]));
}
// No cached responses or authorization decisions. Every read is checked by WordPress.
export function createReadBatcher({send,delayMs=150,maxBatchSize=20,maxConcurrent=2,maxPending=2000,timeoutMs=30000,makeId=randomUUID,clock=()=>performance.now(),setTimer=setTimeout,clearTimer=clearTimeout}){
 let queue=[],timer=null,timerDue=Infinity,active=0;const pending=new Set();
 const counters={reads:0,batches:0,failed:0,aborted:0,maxPending:0,maxActive:0};
 const timing=createLatencySummary(['queue_ms','batch_ms','batch_size']);
 const abortError=()=>Object.assign(new Error('Read cancelled.'),{name:'AbortError'});
 function settle(job,error,value){if(job.settled)return;job.settled=true;pending.delete(job);clearTimeout(job.deadline);job.signal?.removeEventListener('abort',job.abort);if(error)job.reject(error);else job.resolve(value);}
 function schedule(){
  queue=queue.filter(job=>!job.settled);
  if(!queue.length){if(timer!==null)clearTimer(timer);timer=null;timerDue=Infinity;return;}
  if(active>=maxConcurrent)return;
  const now=Date.now(),due=queue.length>=maxBatchSize?now:Math.max(now,queue[0].created+delayMs);
  if(timer!==null&&due>=timerDue)return;
  if(timer!==null)clearTimer(timer);
  timerDue=due;timer=setTimer(()=>{timer=null;timerDue=Infinity;drain();},Math.max(0,due-now));
 }
 function drain(){
  queue=queue.filter(job=>!job.settled);
  while(queue.length&&active<maxConcurrent){
   if(queue.length<maxBatchSize&&Date.now()<queue[0].created+delayMs){schedule();break;}
   const jobs=queue.splice(0,maxBatchSize);active++;counters.batches++;counters.maxActive=Math.max(counters.maxActive,active);
   const started=clock();for(const job of jobs)timing.add('queue_ms',Math.max(0,started-job.measuredCreated));
   Promise.resolve().then(()=>send(jobs.map(job=>({...job.entry,id:job.id})))).then(results=>{
    if(!Array.isArray(results)||results.length!==jobs.length)throw new Error('Incomplete read batch response.');
    const byId=new Map();for(const row of results){if(!row||byId.has(row.id)||!jobs.some(job=>job.id===row.id)||!Number.isInteger(row.status)||row.status<200||row.status>599||!Object.hasOwn(row,'body'))throw new Error('Invalid read batch response.');byId.set(row.id,row);}
    for(const job of jobs)settle(job,null,byId.get(job.id));
   }).catch(error=>{counters.failed+=jobs.filter(job=>!job.settled).length;for(const job of jobs)settle(job,error);}).finally(()=>{timing.add('batch_ms',Math.max(0,clock()-started));timing.add('batch_size',jobs.length);active--;schedule();});
  }
  schedule();
 }
 function enqueue(entry,signal){
  if(signal?.aborted)return Promise.reject(abortError());
  if(pending.size>=maxPending)return Promise.reject(new Error('Read queue is busy. Please try again.'));
  return new Promise((resolve,reject)=>{
   const job={id:makeId(),entry,resolve,reject,signal,created:Date.now(),measuredCreated:clock(),settled:false,abort:null,deadline:null};
   job.abort=()=>{counters.aborted++;settle(job,abortError());schedule();};
   job.deadline=setTimeout(()=>{counters.failed++;settle(job,new Error('The read timed out. No automatic retry was performed.'));schedule();},timeoutMs);
   pending.add(job);queue.push(job);counters.reads++;counters.maxPending=Math.max(counters.maxPending,pending.size);signal?.addEventListener('abort',job.abort,{once:true});schedule();
  });
 }
 return {enqueue,stats:()=>({...counters,pending:pending.size,active,timing:timing.snapshot()})};
}
