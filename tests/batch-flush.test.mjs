import test from 'node:test';
import assert from 'node:assert/strict';
import {createReadBatcher} from '../src/lib/read-batcher.mjs';
function timers(){
 const jobs=[];
 return {jobs,setTimer(fn,delay){const job={fn,delay,cancelled:false};jobs.push(job);return job;},clearTimer(job){job.cancelled=true;}};
}
test('a full batch replaces the pending collection wait with immediate dispatch',async()=>{
 const scheduler=timers(),controller=new AbortController();let sends=0;
 const queue=createReadBatcher({delayMs:10000,maxBatchSize:2,maxConcurrent:1,...scheduler,send:async entries=>{sends++;return entries.map(e=>({id:e.id,status:200,body:e.cookie}));}});
 const first=queue.enqueue({cookie:'first'},controller.signal),second=queue.enqueue({cookie:'second'},controller.signal);
 try{
  assert.equal(scheduler.jobs.length,2);assert.equal(scheduler.jobs[0].cancelled,true);assert.equal(scheduler.jobs[1].delay,0);
  scheduler.jobs[1].fn();assert.deepEqual((await Promise.all([first,second])).map(x=>x.body),['first','second']);assert.equal(sends,1);
 }finally{controller.abort();await Promise.allSettled([first,second]);}
});
test('cancelling every queued read removes the collection timer and never sends a batch',async()=>{
 const scheduler=timers(),controller=new AbortController();let sends=0;
 const queue=createReadBatcher({delayMs:10000,...scheduler,send:async()=>{sends++;return [];}});
 const pending=queue.enqueue({},controller.signal);controller.abort();await assert.rejects(pending,{name:'AbortError'});
 assert.equal(scheduler.jobs[0].cancelled,true);assert.equal(sends,0);assert.equal(queue.stats().pending,0);
});
