import {supportMarkup} from './support-ui.js?v=0.6.3';
export function bindDemo(root,cfg,data,exit){
 const toolbar=document.createElement('div');toolbar.className='listing-toolbar';
 toolbar.innerHTML=`<button class="button" id="support-demo">View populated example</button>${data.user.admin?`<a class="button" href="${cfg.home}wp-admin/admin.php?page=pob-support">WordPress support admin</a>`:''}`;
 root.prepend(toolbar);
 toolbar.querySelector('button').onclick=()=>load('primary');
 async function load(role){
  try{
   const response=await fetch(cfg.supportApi+'/demo?role='+role,{headers:{'X-WP-Nonce':cfg.nonce},credentials:'same-origin',cache:'no-store'}),demo=await response.json();if(!response.ok)throw new Error(demo.message);
   root.innerHTML=`<div class="alert"><strong>Demonstration only.</strong> Sample names, amounts and assignments. No real order or payout is changed.</div><div class="listing-toolbar"><label>View example as<select id="demo-role"><option value="primary">Primary freelancer</option><option value="supporter">Supporting freelancer</option><option value="employer">Employer</option>${data.user.admin?'<option value="admin">POB admin</option>':''}</select></label><button class="button" id="leave-demo">Back to my real records</button></div>${supportMarkup(demo)}`;
   root.dataset.demo='true';
   root.querySelector('#demo-role').value=role;root.querySelector('#demo-role').onchange=e=>load(e.target.value);root.querySelector('#leave-demo').onclick=exit;
   root.querySelectorAll('.support-action input,.support-action textarea,.support-action select,.support-action button,[data-alert]').forEach(el=>el.disabled=true);
   root.querySelector('#support-refresh').onclick=()=>load(role);
   root.querySelectorAll('[data-view]').forEach(el=>el.onclick=()=>{});
  }catch(e){toolbar.textContent=e.message||'Example unavailable.';}
 }
}
