import test from 'node:test';
import assert from 'node:assert/strict';
import {createLatencySummary} from '../src/lib/latency-summary.mjs';
import {createReadBatcher} from '../src/lib/read-batcher.mjs';
test('timing storage remains fixed and rejects unknown/nonfinite observations',()=>{
 const summary=createLatencySummary(['queue_ms']);summary.add('queue_ms',10);summary.add('queue_ms',40);
 for(const value of [NaN,Infinity,-1,'12',undefined,1e13])assert.equal(summary.add('queue_ms',value),false);
 assert.equal(summary.add('account-secret',7),false);const snapshot=summary.snapshot();
 assert.equal(snapshot.queue_ms.count,2);assert.equal(snapshot.queue_ms.sum,50);assert.equal(snapshot.queue_ms.max,40);
 assert.deepEqual(snapshot.queue_ms.counts,[1,1,0,0,0,0,0,0,0]);snapshot.queue_ms.counts[0]=100;
 assert.equal(summary.snapshot().queue_ms.counts[0],1);assert.deepEqual(Object.keys(snapshot),['queue_ms']);
});
test('batch diagnostics distinguish queue wait from backend round trip without altering result',async()=>{
 let time=100;const batcher=createReadBatcher({delayMs:0,clock:()=>time,send:async entries=>{time=200;return entries.map(e=>({id:e.id,status:200,body:'native result'}));}});
 const result=batcher.enqueue({path:'read'});time=125;assert.equal((await result).body,'native result');
 await new Promise(resolve=>setImmediate(resolve));const timing=batcher.stats().timing;
 assert.equal(timing.queue_ms.sum,25);assert.equal(timing.batch_ms.sum,75);assert.equal(timing.batch_size.sum,1);
});
