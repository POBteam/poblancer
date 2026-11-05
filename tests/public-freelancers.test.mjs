import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {extractFreelancers,extractFreelancerProfile,freelancerQuery} from '../src/lib/public-freelancers.mjs';
const origin='http://poblancer.local';
const source=JSON.parse(fs.readFileSync(new URL('../src/data/freelancers-source.json',import.meta.url)));
const profiles=JSON.parse(fs.readFileSync(new URL('../src/data/freelancer-profiles.json',import.meta.url)));
test('All seven freelancers retain local profile destinations and original filter choices',()=>{
 const d=extractFreelancers(source.html,origin);assert.equal(d.cards.length,7);assert.equal(d.groups.length,5);assert.equal(d.groups[0].fields.length,9);
 for(const c of d.cards){assert.match(c.href,/^\/freelancer\/[a-z0-9-]+\/$/);assert.ok(c.id>0);assert.ok(profiles[c.href]);}
 assert.equal(d.hero.video,'https://www.youtube.com/watch?v=6w_xxOkFmtQ');
 assert.doesNotMatch(JSON.stringify(d),/data-nonce|ajax_nonce/);
});
test('All profiles preserve business content and safe skill percentages',()=>{
 for(const [path,html] of Object.entries(profiles)){const p=extractFreelancerProfile(html,origin,path);assert.ok(p.title);assert.ok(p.description);assert.ok(p.overview);assert.ok(p.stats);assert.ok(p.reviews);assert.doesNotMatch(JSON.stringify(p),/data-nonce|ajax_nonce|onClick/);}
 const d=extractFreelancerProfile(profiles['/freelancer/bayopob/'],origin,'/freelancer/bayopob/');assert.match(JSON.stringify(d.skills),/"width":"96%"/);assert.match(JSON.stringify(d.services),/\/service\/i-will-build/);
});
test('Type and gender filters survive normalization; invalid paging is rejected',()=>{
 const q=freelancerQuery(new URLSearchParams('filter-freelancer_type=pob-internally-trained&filter-gender=male&filter-category%5B%5D=12&filter-category%5B%5D=13'));assert.equal(q.get('filter-gender'),'male');assert.equal(q.getAll('filter-category[]').length,2);assert.throws(()=>freelancerQuery(new URLSearchParams('paged=-1')));
});
