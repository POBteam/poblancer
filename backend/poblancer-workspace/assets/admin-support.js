import {supportMarkup,bindSupport} from './support-ui.js?v=0.6.3';
const cfg=JSON.parse(document.querySelector('#pob-admin-config').textContent),root=document.querySelector('#pob-support-admin');
let demo=false;
async function load(){
 try{
  const response=await fetch(cfg.api+(demo?'/demo?role=admin':''),{headers:{'X-WP-Nonce':cfg.nonce},credentials:'same-origin',cache:'no-store'}),data=await response.json();
  if(!response.ok)throw new Error(data.message);
  root.innerHTML=`<p><button id="demo-toggle" class="button">${demo?'Show real support records':'Show populated demonstration'}</button></p>${demo?'<div class="alert">Demonstration only. These sample people, amounts and records are not real assignments. Actions are disabled.</div>':''}`+supportMarkup(data);
  root.querySelector('#demo-toggle').onclick=()=>{demo=!demo;load();};
  if(demo)root.querySelectorAll('.support-action input,.support-action select,.support-action textarea,.support-action button,[data-alert]').forEach(el=>el.disabled=true);
  else bindSupport(root,data,{api:cfg.api,nonce:cfg.nonce,refresh:load});
  root.querySelector('#support-refresh')?.addEventListener('click',()=>{if(demo)load();});
 }catch(e){root.textContent=e.message||'Unable to load support records.';}
}
load();
