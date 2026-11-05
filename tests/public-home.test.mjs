import {test} from 'node:test';
import assert from 'node:assert/strict';
import {decodeText,parsePublicHtml,publicLink,extractHomepage} from '../src/lib/public-home.mjs';
test('public source markup is data only: scripts and styles are discarded and attribute delimiters remain intact',()=>{
 const tree=parsePublicHtml('<div title="x > y"><script>stealCookies()</script><style>body{display:none}</style><p>POB &amp; Experts &#8358;</p><img src="/team.jpg"><p>Next</p></div>');
 const serialized=JSON.stringify(tree);assert.ok(!serialized.includes('stealCookies'));assert.ok(!serialized.includes('display:none'));assert.equal(tree.children[0].attrs.title,'x > y');assert.equal(tree.children[0].children[2].tag,'p');assert.equal(decodeText('POB &amp; Experts &#8358;'),'POB & Experts ₦');
});
test('public links reject executable schemes and missing URLs',()=>{
 assert.equal(publicLink('javascript:alert(1)'),'#');assert.equal(publicLink('data:text/html,hello'),'#');assert.equal(publicLink(undefined),'#');assert.equal(publicLink('/services/','http://poblancer.local'),'http://poblancer.local/services/');
});
test('an incomplete WordPress response cannot silently replace the cached homepage with a partial port',()=>{
 assert.throws(()=>extractHomepage('<h1>Temporary error</h1>','http://poblancer.local'),/incomplete/);assert.throws(()=>parsePublicHtml('x'.repeat(2000001)),/allowed size/);
});
