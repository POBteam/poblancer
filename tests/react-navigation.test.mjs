import test from 'node:test';
import assert from 'node:assert/strict';
import {publicReactLink} from '../src/lib/public-routes.mjs';
import {projectQuery} from '../src/lib/public-projects.mjs';
import {serviceQuery} from '../src/lib/public-services.mjs';
test('old archive aliases retain author filters in React',()=>{
 for(const [old,next] of [['projects-2','projects'],['jobs-2','jobs'],['service-layout-1','services']])assert.equal(publicReactLink('http://poblancer.local/'+old+'/?filter-author=22'),'/'+next+'?filter-author=22');
 assert.equal(serviceQuery(new URLSearchParams('filter-author=22')).get('filter-author'),'22');
 assert.throws(()=>serviceQuery(new URLSearchParams('filter-author=-1')));
});
test('taxonomy links keep context and supported backend filter names',()=>{
 assert.equal(publicReactLink('http://poblancer.local/location/nigeria/',undefined,'employers'),'/employers?filter-location[]=nigeria');
 assert.equal(publicReactLink('http://poblancer.local/service-category/ugc-videos-presenting/'),'/services?filter-category=ugc-videos-presenting');
 const duration=publicReactLink('http://poblancer.local/project-duration/2-3-weeks/');assert.equal(projectQuery(new URLSearchParams(duration.split('?')[1])).get('filter-project_duration'),'2-3-weeks');
 assert.equal(publicReactLink('https://example.com/project/elsewhere/'),'https://example.com/project/elsewhere/');
});
