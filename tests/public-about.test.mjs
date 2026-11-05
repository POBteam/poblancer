import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {extractAboutPage} from '../src/lib/public-about.mjs';
const source=JSON.parse(readFileSync(new URL('../src/data/about-source.json',import.meta.url))).content.rendered;
test('About adapter preserves original sections, complete testimonials, target counters and FAQ',()=>{
 const d=extractAboutPage(source,'http://poblancer.local');
 assert.equal(d.intro.title,"Join World's Best Marketplace for Workers");
 assert.equal(d.intro.benefits.length,3);assert.equal(d.talent.features.length,3);assert.equal(d.growth.stats.length,3);assert.equal(d.steps.length,3);
 assert.deepEqual(d.counters.map(x=>x.value),[250,250,980,700]);
 assert.equal(d.testimonials.length,4);assert.match(d.testimonials[0].quote,/Service: Branding & Graphic Design/);assert.equal(d.faq.length,10);
 assert.equal(d.intro.button.href,'http://poblancer.local/freelancers/');
});
test('About source rejects missing content and cannot pass through executable markup or links',()=>{
 assert.throws(()=>extractAboutPage('<h2>Partial response</h2>','http://poblancer.local'),/incomplete/);
 const d=extractAboutPage(source.replaceAll('https://princesageonlinebranding.com/freelancers/','javascript:alert(1)')+'<script>secretPayload()</script>','http://poblancer.local');
 assert.equal(d.intro.button.href,'#');assert.ok(!JSON.stringify(d).includes('secretPayload'));
});
