import test from 'node:test';
import assert from 'node:assert/strict';
import {selectPresentation} from '../src/lib/select-values.mjs';
test('saved legacy package choice is visible without conversion to another delivery time',()=>{
 const options=[{value:'1',label:'12hrs'},{value:'7',label:'1 Week'}];
 const out=selectPresentation('7 Days',options);
 assert.equal(out.value,'7 Days');assert.deepEqual(out.options.at(-1),{value:'7 Days',label:'7 Days'});assert.equal(options.length,2);
});
test('native hierarchy leaf is displayed while the original path remains unchanged',()=>{
 const path=[10,20,30],options=[{value:'10',label:'Country'},{value:'20',label:'State'},{value:'30',label:'City'}];
 assert.equal(selectPresentation(path,options,false,'30').value,'30');assert.deepEqual(path,[10,20,30]);
 assert.equal(selectPresentation('40',options,false,'30').value,'40');
});
test('multiple saved choices retain their values and missing legacy options',()=>{
 const out=selectPresentation([1,'old'],[{value:'1',label:'Current'}],true);
 assert.deepEqual(out.value,['1','old']);assert.deepEqual(out.options.at(-1),{value:'old',label:'old'});
});
test('empty and unexpected values never become object-shaped dropdown labels',()=>{
 for(const value of [null,undefined,{},[]])assert.equal(selectPresentation(value).value,'');
 assert.equal(selectPresentation([9],[],false,'unrelated').value,'9');
});
