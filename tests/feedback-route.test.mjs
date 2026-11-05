import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {GET,POST} from '../src/app/api/feedback/route.ts';
const host='http://poblancer.local:3103';process.env.FRONTEND_ORIGIN=host;
const html=JSON.parse(fs.readFileSync(new URL('../src/data/public-info-pages.json',import.meta.url))).contact.html;
const req=(data,origin=host)=>new Request(host+'/api/feedback',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(data)});
test('Feedback configuration exposes no nonce and creates no impression record',async t=>{
 let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;return new Response(html);});const r=await GET(),data=await r.json();assert.equal(data.question,'What would make this website better?');assert.equal(data.nonce,undefined);assert.equal(calls,1);
});
test('Feedback rejects cross-origin and oversized messages without writing',async()=>{
 assert.equal((await POST(req({message:'Test'},'https://other.example'))).status,403);assert.equal((await POST(req({message:'x'.repeat(401)}))).status,400);
});
test('Feedback preserves the existing survey endpoint and question ID without a real submission',async t=>{
 const calls=[];t.mock.method(globalThis,'fetch',async(url,options)=>{calls.push(String(url));if(calls.length===1)return new Response(html);assert.match(String(url),/\/wp-json\/userfeedback\/v1\/surveys\/1\/responses$/);const body=JSON.parse(options.body);assert.equal(body.answers[0].question_id,'df37cf96-359c-4542-88f0-6bdbc414fb9d');assert.equal(body.answers[0].value,'Mocked feedback only');assert.equal(body.page_submitted.url,host+'/projects');assert.ok(body.nonce);return Response.json({success:true,response_id:0});});
 const result=await POST(req({message:'Mocked feedback only',path:'/projects?private=query'}));assert.equal(result.status,200);assert.equal((await result.json()).success,true);assert.equal(calls.length,2);
});
