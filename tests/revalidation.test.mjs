import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {verifiedUpdate} from '../src/lib/revalidation.mjs';
test('cache refresh requires fresh, exact signed content and approved tags',()=>{
 const secret='test-only-'.repeat(8),now=Date.now(),time=String(Math.floor(now/1000)),body=JSON.stringify({tags:['public-services']});const sign=b=>createHmac('sha256',secret).update(time+'.'+b).digest('hex');
 assert.deepEqual(verifiedUpdate(body,time,sign(body),secret,now),['public-services']);
 assert.equal(verifiedUpdate(body,time,sign(body),secret,now+120000),null);
 assert.equal(verifiedUpdate(body+' ',time,sign(body),secret,now),null);
 assert.equal(verifiedUpdate(body,time,sign(body),'',now),null);
 const bad=JSON.stringify({tags:['private-account']});assert.equal(verifiedUpdate(bad,time,sign(bad),secret,now),null);
});
