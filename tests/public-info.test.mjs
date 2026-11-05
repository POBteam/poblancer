import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {extractInfoPage} from '../src/lib/public-info.mjs';
import {publicReactLink} from '../src/lib/public-routes.mjs';
import {parsePublicHtml,all,text} from '../src/lib/public-home.mjs';
const snapshots=JSON.parse(fs.readFileSync(new URL('../src/data/public-info-pages.json',import.meta.url)));
const origin='http://poblancer.local';
const flat=n=>typeof n==='string'?n:(n?.children||[]).map(flat).join(' ');
const normalized=s=>s.replace(/\s+/g,' ').trim();
test('Legal migration preserves every word of the original policy bodies',()=>{
 for(const slug of ['terms','privacy-policy','refund_returns-2']){const source=parsePublicHtml(snapshots[slug].html),original=all(source,n=>slug==='terms'?n.attrs['data-id']==='aaa8b21':n.attrs.id==='main')[0];const data=extractInfoPage(snapshots[slug].html,slug,origin);assert.equal(normalized(flat(data.body)),normalized(text(original)));}
});
test('Seller and contact retain original sections, FAQ answers and exact form field names',()=>{
 const seller=extractInfoPage(snapshots['become-seller'].html,'become-seller',origin);assert.equal(seller.tabs.length,2);assert.equal(seller.team.members.length,5);assert.equal(seller.groups.features.length,4);assert.equal(seller.faq.length,10);
 const contact=extractInfoPage(snapshots.contact.html,'contact',origin);assert.deepEqual(contact.form.fields.map(f=>f.name),['form-control','your-email','your-message']);assert.equal(contact.form.id,'1726');assert.equal(contact.faq.length,10);assert.match(contact.map,/^https:\/\/maps.google.com\//);
 assert.doesNotMatch(JSON.stringify(contact),/ajax_nonce|data-nonce|<script/);
});
test('Footer categories map to verified React filters and external social destinations stay external',()=>{
 assert.equal(publicReactLink(origin+'/project-category/business/'),'/projects?filter-category=54');assert.equal(publicReactLink(origin+'/job-category/developers/'),'/jobs?filter-category=69');assert.equal(publicReactLink(origin+'/service-category/video-animation/'),'/services?filter-category=143');assert.equal(publicReactLink('https://pob.com.ng/privacy-policy'),'/privacy-policy/');assert.equal(publicReactLink('https://facebook.com/pobranding'),'https://facebook.com/pobranding');assert.equal(publicReactLink('https://other.example/contact/'),'https://other.example/contact/');
});
test('Agreement downloads resolve to complete PDFs bundled with the React site',()=>{
 for(const name of ['Partnership-Agreement-POB-Freelancers.pdf','Partnership-Agreement-POB-External-Freelancer.pdf']){
  const original='https://princesageonlinebranding.com/wp-content/uploads/2026/05/'+name;
  assert.equal(publicReactLink(original),'/downloads/'+name);
  const bytes=fs.readFileSync(new URL('../public/downloads/'+name,import.meta.url));
  assert.equal(bytes.subarray(0,5).toString(),'%PDF-');assert.ok(bytes.length>100000);
 }
});
