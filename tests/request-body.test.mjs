import test from 'node:test';
import assert from 'node:assert/strict';
import {readBoundedBody,createBodyAdmission,createSubmissionAdmission} from '../src/lib/request-body.mjs';
const request=(body,extra={})=>new Request('http://localhost/api',{method:'POST',body,duplex:'half',...extra});
test('multipart and binary bytes are preserved exactly',async()=>{
 const bytes=new Uint8Array([0,255,13,10,45,45,1]);
 assert.deepEqual(await readBoundedBody(request(bytes)),bytes);
});
test('declared oversized body is rejected before a reader is acquired',async()=>{
 let touched=false;
 await assert.rejects(readBoundedBody({headers:new Headers({'content-length':'21'}),get body(){touched=true;return null;}},{limit:20}),e=>e.status===413);
 assert.equal(touched,false);
});
test('stream size limit also applies without a content length',async()=>{
 let cancelled=false;
 const stream=new ReadableStream({start(c){c.enqueue(new Uint8Array(11));},cancel(){cancelled=true;}});
 await assert.rejects(readBoundedBody(request(stream),{limit:10}),e=>e.status===413);
 assert.equal(cancelled,true);
});
test('a stalled body times out and cancels its reader',async()=>{
 let cancelled=false;
 await assert.rejects(readBoundedBody(request(new ReadableStream({cancel(){cancelled=true;}})),{timeoutMs:10}),e=>e.status===408);
 assert.equal(cancelled,true);
});
test('client abort cancels a pending body read',async()=>{
 const controller=new AbortController();let cancelled=false;
 const result=readBoundedBody(request(new ReadableStream({cancel(){cancelled=true;}}),{signal:controller.signal}));
 controller.abort();await assert.rejects(result,e=>e.status===408);assert.equal(cancelled,true);
});
test('submission admission has a fixed bound and idempotent release',()=>{
 const acquire=createBodyAdmission(2),one=acquire(),two=acquire();
 assert.throws(acquire,e=>e.status===429);one();one();const three=acquire();
 assert.throws(acquire,e=>e.status===429);two();three();acquire()();
});
test('small JSON and large uploads have independent bounded admission',()=>{
 const acquire=createSubmissionAdmission(),small=[],large=[];
 const json=()=>request('{}',{headers:{'content-type':'application/json','content-length':'2'}});
 for(let i=0;i<64;i++)small.push(acquire(json()));
 assert.throws(()=>acquire(json()),e=>e.status===429);
 for(let i=0;i<4;i++)large.push(acquire(request('upload')));
 assert.throws(()=>acquire(request('upload')),e=>e.status===429);
 assert.equal(small[0].limit,256*1024);assert.equal(large[0].limit,20*1024*1024);
 small[0].release();acquire(json()).release();small.forEach(x=>x.release());large.forEach(x=>x.release());
});
test('a false small-body declaration cannot exceed the small JSON byte budget',async()=>{
 const acquire=createSubmissionAdmission();const incoming=request(new Uint8Array(257*1024),{headers:{'content-type':'application/json','content-length':'2'}}),slot=acquire(incoming);
 try{await assert.rejects(readBoundedBody(incoming,{limit:slot.limit}),e=>e.status===413);}finally{slot.release();}
});
test('unbounded, non-JSON and larger declared bodies use upload admission',()=>{
 const acquire=createSubmissionAdmission();
 for(const headers of [{'content-type':'application/json'},{'content-type':'multipart/form-data','content-length':'10'},{'content-type':'application/json','content-length':'262145'},{'content-type':'application/json','content-length':'bogus'}]){
 const slot=acquire(request('{}',{headers}));assert.equal(slot.kind,'large-or-unknown');slot.release();
 }
});
