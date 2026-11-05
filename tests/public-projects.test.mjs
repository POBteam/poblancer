import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {extractProjects,projectQuery} from '../src/lib/public-projects.mjs';
import {youtubeEmbedUrl} from '../src/lib/public-video.mjs';
test('Projects preserve original listings, seven filter groups and native proposal destinations',()=>{const data=extractProjects(JSON.parse(fs.readFileSync(new URL('../src/data/projects-source.json',import.meta.url))).html,'http://poblancer.local');assert.equal(data.rows.length,6);assert.equal(data.groups.length,7);assert.equal(data.rows[0].id,10935);assert.match(data.rows[0].price,/250,000/);assert.match(data.rows[0].proposalHref,/#project-proposal-form-wrapper$/);assert.ok(!JSON.stringify(data).includes('_nonce'));assert.ok(data.groups.flatMap(g=>g.fields).some(f=>f.name==='filter-project_skill[]'));});
test('Projects retain repeated approved filters and bound input',()=>{const query=projectQuery(new URLSearchParams('filter-project_skill[]=1&filter-project_skill[]=2&filter-project_type=fixed'));assert.deepEqual(query.getAll('filter-project_skill[]'),['1','2']);assert.throws(()=>projectQuery(new URLSearchParams('filter-title='+ 'a'.repeat(161))));});
test('Original Services video resolves to the same YouTube embed and rejects unsafe URLs',()=>{assert.equal(youtubeEmbedUrl('https://www.youtube.com/watch?v=6w_xxOkFmtQ'),'https://www.youtube.com/embed/6w_xxOkFmtQ?autoplay=1&rel=0');assert.equal(youtubeEmbedUrl('https://example.com/watch?v=6w_xxOkFmtQ'),'');assert.equal(youtubeEmbedUrl('javascript:alert(1)'),'');});
