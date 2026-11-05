import test from 'node:test';
import assert from 'node:assert/strict';
import {localBatchOrigin} from '../src/lib/transport.mjs';
test('isolated batching origin requires an explicit server flag and exact loopback endpoint',()=>{
 assert.equal(localBatchOrigin('http://poblancer.local'),true);
 assert.equal(localBatchOrigin('http://127.0.0.1:8001'),false);
 assert.equal(localBatchOrigin('http://127.0.0.1:8001',true),true);
 for(const origin of ['http://127.0.0.1:8002','http://localhost:8001','https://pob.com.ng','https://evil.example','http://127.0.0.1:8001.evil.example'])assert.equal(localBatchOrigin(origin,true),false);
 assert.equal(localBatchOrigin('http://127.0.0.1:8001','1'),false);
});
