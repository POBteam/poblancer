import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {extractServices,serviceQuery,privateServiceQuery} from '../src/lib/public-services.mjs';
const source=JSON.parse(readFileSync(new URL('../src/data/services-source.json',import.meta.url))).html;
test('Services preserve original records, prices, Freeio filter keys and page count without guest nonces',()=>{
 const d=extractServices(source,'http://poblancer.local');
 assert.equal(d.cards.length,12);assert.equal(d.pages,2);assert.equal(d.cards[0].id,11233);assert.equal(d.cards[0].price,'Starting at: ₦ 80,000.00');assert.equal(d.cards[0].featured,true);
 assert.match(d.count,/18 results/);assert.equal(d.groups.find(g=>g.label==='Categories').fields.length,31);assert.ok(d.groups.some(g=>g.fields.some(f=>f.name==='filter-response_time')));assert.equal(d.sort.length,6);assert.equal(d.distanceUnit,'miles');
 assert.ok(!JSON.stringify(d).includes('data-nonce'));assert.ok(!JSON.stringify(d).includes('<script'));
});
test('Public filter URLs are bounded, fixed to approved keys and retain repeated category values',()=>{
 const q=serviceQuery(new URLSearchParams('filter-category[]=166&filter-category[]=168&paged=2&url=https://bad.example&filter-orderby=price-lowest'));
 assert.deepEqual(q.getAll('filter-category[]'),['166','168']);assert.equal(q.has('url'),false);assert.equal(q.get('paged'),'2');
 assert.throws(()=>serviceQuery(new URLSearchParams('paged=-1')));assert.throws(()=>serviceQuery(new URLSearchParams('filter-orderby=sql')));assert.throws(()=>serviceQuery(new URLSearchParams('filter-price-from=NaN')));
 assert.equal(privateServiceQuery(q),false);assert.equal(privateServiceQuery(new URLSearchParams('filter-center-latitude=6.4')),true);
});
test('Partial archive responses cannot replace existing results',()=>{assert.throws(()=>extractServices('<h1>WordPress error</h1>','http://poblancer.local'),/incomplete/);});
