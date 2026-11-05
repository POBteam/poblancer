import test from 'node:test';
import assert from 'node:assert/strict';
import {createReadBatcher,batchableReadPath} from '../src/lib/read-batcher.mjs';
test('only audited read paths qualify; editors and write-like routes stay native',()=>{
 assert.equal(batchableReadPath('/wp-json/poblancer/v1/listings?page=2'),true);
 assert.equal(batchableReadPath('/wp-json/poblancer/v1/workspace'),true);
 assert.equal(batchableReadPath('/wp-json/poblancer/v1/support'),true);
 for(const path of ['/wp-json/poblancer/v1/service-editor','/wp-json/poblancer/v1/support/action','/wp-json/wp/v2/media','https://other.invalid/wp-json/poblancer/v1/messages','/wp-json/poblancer/v1/messages#x','/wp-json/poblancer/v1/../messages'])assert.equal(batchableReadPath(path),false);
});
test('interleaved accounts map by server ID even when backend replies out of order',async()=>{
 let sends=0;const queue=createReadBatcher({delayMs:1,send:async entries=>{sends++;return entries.map(e=>({id:e.id,status:200,body:{account:e.cookie}})).reverse();}});
 const out=await Promise.all(Array.from({length:10},(_,i)=>queue.enqueue({cookie:'account-'+i,path:'read',nonce:'n'})));
 out.forEach((r,i)=>assert.equal(r.body.account,'account-'+i));assert.equal(sends,1);
});
test('no cached result bypasses a later native revocation',async()=>{
 let revoked=false,sends=0;const queue=createReadBatcher({delayMs:1,send:async entries=>{sends++;return entries.map(e=>({id:e.id,status:revoked?401:200,body:{}}));}});
 assert.equal((await queue.enqueue({cookie:'same-session'})).status,200);revoked=true;
 assert.equal((await queue.enqueue({cookie:'same-session'})).status,401);assert.equal(sends,2);
});
test('cancelled queued reads never reach WordPress',async()=>{
 let sends=0;const queue=createReadBatcher({delayMs:10,send:async entries=>{sends++;return entries.map(e=>({id:e.id,status:200,body:{}}));}});
 const controller=new AbortController();const cancelled=queue.enqueue({cookie:'cancel'},controller.signal);controller.abort();
 await assert.rejects(cancelled,{name:'AbortError'});await queue.enqueue({cookie:'keep'});assert.equal(sends,1);assert.equal(queue.stats().reads,2);
});
test('responses with duplicate or unexpected IDs fail closed',async()=>{
 const queue=createReadBatcher({delayMs:1,send:async entries=>entries.map(()=>({id:'unexpected',status:200,body:{private:'must not escape'}}))});
 await assert.rejects(queue.enqueue({cookie:'account'}),/Invalid read batch/);
});
test('origin concurrency remains bounded for a burst',async()=>{
 let active=0,max=0;const queue=createReadBatcher({delayMs:1,maxBatchSize:2,maxConcurrent:2,send:async entries=>{active++;max=Math.max(max,active);await new Promise(resolve=>setTimeout(resolve,2));active--;return entries.map(e=>({id:e.id,status:200,body:{}}));}});
 await Promise.all(Array.from({length:10},()=>queue.enqueue({cookie:'fixture'})));assert.equal(max,2);assert.equal(queue.stats().batches,5);
});
test('a failed native batch is not retried automatically',async()=>{
 let calls=0;const queue=createReadBatcher({delayMs:1,send:async()=>{calls++;throw new Error('Unavailable');}});
 await assert.rejects(queue.enqueue({cookie:'fixture'}),/Unavailable/);assert.equal(calls,1);
});
