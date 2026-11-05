import test from 'node:test';
import assert from 'node:assert/strict';
import {createSessionReader} from '../src/lib/session-read.mjs';
const expired={status:403,body:{code:'rest_cookie_invalid_nonce'}};
const session={authenticated:true,nonce:'old',user:{id:7}};
test('nonce rejection refreshes same account and retries only once',async()=>{
 const calls=[];let refreshes=0;
 const reader=createSessionReader({fetchRead:async(p,n)=>{calls.push(n);return expired;},refreshSession:async()=>{refreshes++;return {...session,nonce:'fresh'};}});
 reader.remember(session);assert.equal(await reader.read('profile','old'),expired);
 assert.deepEqual(calls,['old','fresh']);assert.equal(refreshes,1);
});
test('parallel rejected reads share one pending session refresh',async()=>{
 let refreshes=0,release;const pending=new Promise(r=>{release=r;});
 const reader=createSessionReader({fetchRead:async(p,n)=>n==='fresh'?{status:200,body:p}:expired,refreshSession:async()=>{refreshes++;await pending;return {...session,nonce:'fresh'};}});
 reader.remember(session);const requests=[reader.read('profile','old'),reader.read('messages','old')];
 await new Promise(r=>setImmediate(r));release();const result=await Promise.all(requests);
 assert.equal(refreshes,1);assert.deepEqual(result.map(x=>x.body),['profile','messages']);
});
test('mounted screens reuse the refreshed nonce without another bootstrap',async()=>{
 const calls=[];let refreshes=0;
 const reader=createSessionReader({fetchRead:async(p,n)=>{calls.push(n);return n==='old'?expired:{status:200,body:p};},refreshSession:async()=>{refreshes++;return {...session,nonce:'fresh'};}});
 reader.remember(session);await reader.read('profile','old');await reader.read('messages','old');
 assert.deepEqual(calls,['old','fresh','fresh']);assert.equal(refreshes,1);
 assert.equal(reader.credential(session),'fresh');
 assert.equal(reader.credential({...session,user:{id:8}}),'old');
});
test('changed or logged-out account is never retried',async()=>{
 for(const next of [{authenticated:false},{...session,user:{id:8}}]){
 let calls=0;const reader=createSessionReader({fetchRead:async()=>{calls++;return expired;},refreshSession:async()=>next});
 reader.remember(session);await assert.rejects(reader.read('profile','old'),/account changed or expired/);assert.equal(calls,1);
 }
});
test('ordinary errors, unknown nonce and successful reads do not refresh',async()=>{
 for(const response of [{status:403,body:{code:'rest_forbidden'}},{status:502,body:{}},{status:200,body:{}}]){
 const reader=createSessionReader({fetchRead:async()=>response,refreshSession:async()=>{throw Error('must not refresh');}});
 reader.remember(session);assert.equal(await reader.read('profile','old'),response);
 }
 const reader=createSessionReader({fetchRead:async()=>expired,refreshSession:async()=>{throw Error('must not refresh');}});
 assert.equal(await reader.read('profile','unknown'),expired);
});
test('network failures and aborted callers never trigger a second read',async()=>{
 const reader=createSessionReader({fetchRead:async()=>{throw Error('network');},refreshSession:async()=>{throw Error('must not refresh');}});
 reader.remember(session);await assert.rejects(reader.read('profile','old'),/network/);
 const controller=new AbortController();let calls=0;
 const cancelled=createSessionReader({fetchRead:async()=>{calls++;return expired;},refreshSession:async()=>{controller.abort();return {...session,nonce:'fresh'};}});
 cancelled.remember(session);await assert.rejects(cancelled.read('profile','old',controller.signal),{name:'AbortError'});assert.equal(calls,1);
});
