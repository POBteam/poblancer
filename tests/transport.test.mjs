import test from 'node:test';
import assert from 'node:assert/strict';
import {allowedPath,sessionCookies,validOrigin,safeReturnPath} from '../src/lib/transport.mjs';
import {dashboardHash} from '../src/lib/link-bridge.mjs';
import {parseRegistrationResponse} from '../src/lib/registration-response.mjs';
test('only explicit WordPress interfaces can be proxied',()=>{
 assert.equal(allowedPath(['poblancer','v1','workspace']),true);
 assert.equal(allowedPath(['poblancer','v1','support','action']),true);
 for(const path of [['wp','v2','users'],['..','wp-admin'],['poblancer','v1','workspace','extra'],['https:','evil.invalid'],['poblancer','v1','%2e%2e']])assert.equal(allowedPath(path),false);
});
test('unrelated cookies never reach the WordPress backend',()=>{
 assert.equal(sessionCookies('analytics=secret; wordpress_logged_in_ab12=session; arbitrary=1; wp_woocommerce_session_cd34=cart'),'wordpress_logged_in_ab12=session; wp_woocommerce_session_cd34=cart');
});
test('native submission markers survive while unrelated or malformed cookies are excluded',()=>{
 assert.equal(sessionCookies('service_add_new_update=new; job_add_new_update=update; project_add_new_update=new; analytics=private'),
  'service_add_new_update=new; job_add_new_update=update; project_add_new_update=new');
 for(const cookie of ['service_add_new_update_extra=new','other_add_new_update=new','service_add_new_update=anything','service_add_new_update=new=extra','job_add_new_update=%6eew'])assert.equal(sessionCookies(cookie),'');
});
test('mutations require exact frontend origin',()=>{
 assert.equal(validOrigin(new Request('http://poblancer.local:3101/api/session',{headers:{Origin:'http://poblancer.local:3101'}}),'http://poblancer.local:3101'),true);
 for(const origin of ['http://evil.invalid','null','http://poblancer.local:3102'])assert.equal(validOrigin(new Request('http://poblancer.local:3101',{headers:{Origin:origin}}),'http://poblancer.local:3101'),false);
});
test('external or ambiguous return destinations rejected',()=>{for(const url of ['//evil.invalid','https://evil.invalid','/workspace\\evil','/workspaces'])assert.equal(safeReturnPath(url),'/workspace');assert.equal(safeReturnPath('/workspace#messages'),'/workspace#messages');});
test('native dashboard history links preserve IDs without changing public pages',()=>{
 const home='http://poblancer.local/';
 assert.equal(dashboardHash(home+'my-services/?service_order_id=11399',home),'#contract/service/11399');
 assert.equal(dashboardHash(home+'my-projects/?project_id=12&action=edit',home),'#project-editor/12');
 assert.equal(dashboardHash(home+'freelancer-dashboard/',home),'#overview');
 assert.equal(dashboardHash(home+'pob-workspace/#messages',home),'#messages');
 for(const href of [home+'freelancer/omotoshoa/',home+'services/','https://evil.invalid/my-services/'])assert.equal(dashboardHash(href,home),null);
});
test('native JSON response accepted even under legacy HTML headers, actual HTML rejected',()=>{
 assert.deepEqual(parseRegistrationResponse('{"status":true,"msg":"Registered","redirect":true}'),{status:true,msg:'Registered',redirect:true});
 assert.equal(parseRegistrationResponse('{"status":false,"msg":"Invalid email"}').status,false);
 for(const raw of ['<html>PHP error</html>','null','[]','{"admin":true}'])assert.throws(()=>parseRegistrationResponse(raw));
});
