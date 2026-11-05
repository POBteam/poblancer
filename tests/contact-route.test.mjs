import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {POST} from '../src/app/api/contact/route.ts';
const host='http://poblancer.local:3103';
process.env.FRONTEND_ORIGIN=host;
const request=(data,origin=host)=>new Request(host+'/api/contact',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(data)});
test('Contact rejects cross-origin and invalid requests before forwarding',async()=>{
 assert.equal((await POST(request({},'https://other.example'))).status,403);const r=await POST(request({}));assert.equal(r.status,400);assert.ok((await r.json()).errors['your-email']);
});
test('Contact retains exact CF7 handler and field names without sending a real message',async t=>{
 const snapshots=JSON.parse(fs.readFileSync(new URL('../src/data/public-info-pages.json',import.meta.url)));const calls=[];
 t.mock.method(globalThis,'fetch',async(url,options)=>{calls.push({url:String(url),options});if(calls.length===1)return new Response(snapshots.contact.html);assert.match(String(url),/\/wp-json\/contact-form-7\/v1\/contact-forms\/1726\/feedback$/);assert.equal(options.method,'POST');assert.equal(options.body.get('form-control'),'Test');assert.equal(options.body.get('your-email'),'contact-test@example.invalid');assert.equal(options.body.get('_wpcf7'),'1726');return Response.json({status:'mail_sent',message:'Test response only'});});
 const response=await POST(request({'form-control':'Test','your-email':'contact-test@example.invalid','your-message':'Mocked route test'}));assert.equal(response.status,200);assert.equal((await response.json()).sent,true);assert.equal(calls.length,2);
});
