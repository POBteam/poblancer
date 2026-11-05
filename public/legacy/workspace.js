import {bridgeLinks} from './bridge-links.js?v=0.6.3';
import {mountManagement} from './management.js?v=0.6.3';
import {mountContract} from './contracts.js?v=0.6.3';
import {mountAccountTool} from './account-tools.js?v=0.6.3';
import {mountCollection} from './collections.js?v=0.6.3';
import {mountMessages} from './messages.js?v=0.6.3';
import {mountServiceEditor} from './service-editor.js?v=0.6.3';
import {mountAddons} from './addons.js?v=0.6.3';
import {bindDemo} from './support-demo.js?v=0.6.3';
import {mountViews} from './page-views.js?v=0.6.3';
import {supportMarkup, supportSummary, bindSupport} from './support-ui.js?v=0.6.3';
import {mountListings} from './listings.js?v=0.6.3';
const cfg=JSON.parse(document.querySelector('#pob-config').textContent);
const app=document.querySelector('#app');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let data, view=['jobs','applicants','bought-services','meetings','project-proposals','service-orders','switch-role','contract','listings','support','addons','service-editor','messages','profile','job-editor','project-editor','favorites','statements','payouts','verify','change-password','delete-profile','proposals','applied','alerts'].includes(location.hash.slice(1).split('/')[0])?location.hash.slice(1).split('/')[0]:'overview', supportTimer, editing=false;
const money=(n,c=data?.currency||'NGN')=>new Intl.NumberFormat('en-NG',{style:'currency',currency:c,maximumFractionDigits:2}).format(n);
const icons={Dashboard:'▦','My Services':'▤',Messages:'◫',Meetings:'◷',Profile:'◎',Payouts:'↗',Statements:'≡',Favorite:'♡','My Projects':'▤','Submit Service':'+','Submit Project':'+',Verify:'◇'};
const localNav=()=>`<button class="nav-item ${view==='overview'?'selected':''}" data-view="overview"><span>▦</span>Dashboard</button>${data.support&&(data.support.eligible||data.support.admin||data.support.cases.length)?`<button class="nav-item ${view==='support'?'selected':''}" data-view="support"><span>◈</span>Project support</button>`:""}`;
const publicNav=()=>`<a href="${esc(cfg.home)}">Home</a><a href="${esc(cfg.home)}about-v2/">About</a><details class="public-dropdown"><summary>Browse Jobs ⌄</summary><div><a href="${esc(cfg.home)}services/">Services</a><a href="${esc(cfg.home)}projects/">Projects</a><a href="${esc(cfg.home)}jobs/">Jobs</a></div></details><details class="public-dropdown"><summary>Overview ⌄</summary><div><a href="${esc(cfg.home)}employers/">Employers</a><a href="${esc(cfg.home)}freelancers/">Freelancers</a><a href="${esc(cfg.home)}become-seller/">Become Seller</a><a href="${esc(cfg.home)}contact/">Contact</a></div></details><a href="${esc(cfg.home)}become-seller/">Become A Seller</a>`;
window.addEventListener('hashchange',()=>{const next=location.hash.slice(1).split('/')[0];view=['jobs','applicants','bought-services','meetings','project-proposals','service-orders','switch-role','contract','listings','support','addons','service-editor','messages','profile','job-editor','project-editor','favorites','statements','payouts','verify','change-password','delete-profile','proposals','applied','alerts'].includes(next)?next:'overview';if(data)render();});
async function load() {
  try {
    const q=new URLSearchParams(location.search), url=new URL(cfg.api);
    if(q.get('view')) url.searchParams.set('view',q.get('view'));
    const response=await fetch(url,{credentials:'same-origin',headers:{'X-WP-Nonce':cfg.nonce},cache:'no-store'});
    const payload=await response.json();
    if(!response.ok) throw new Error(payload.message||'Unable to load this account.');
    data=payload; render(); startSupportPolling();
  } catch(error) {
    app.innerHTML=`<main class="error-card"><h1>Dashboard unavailable</h1><p>${esc(error.message)}</p><a class="button primary" href="${esc(cfg.login)}">Sign in</a><a class="button" href="${esc(cfg.home)}">Back to website</a></main>`;
  }
}
function render() {
  const employer=data.user.role==='employer';
  app.innerHTML=`<div class="workspace"><aside class="sidebar" id="sidebar"><a class="brand" href="${esc(cfg.home)}"><img src="${esc(cfg.home)}wp-content/uploads/2022/10/1-1.png" alt="POBlancer"></a><div class="account-label">${employer?'Employer':'Freelancer'} workspace</div><nav aria-label="Account navigation">${localNav()}<div class="nav-divider"></div>${data.menu.map(m=>`<a class="nav-item ${m.route===view?'selected':''}" ${m.route===view?'aria-current="page"':''} href="${esc(m.url)}"><span aria-hidden="true">${icons[m.label]||'·'}</span>${esc(m.label)}</a>`).join('')}</nav><div class="sidebar-foot"><a href="#switch-role">⇄ Switch Account / Switch Role</a><a href="${esc(data.logout)}">Log out ↗</a></div></aside>
  <div class="workspace-body"><header class="topbar"><button class="mobile-menu" aria-label="Toggle navigation" aria-expanded="false">☰</button><nav aria-label="Website navigation">${publicNav()}</nav><details class="account-menu"><summary><img src="${esc(data.user.avatar)}" alt=""><span>${esc(data.user.name)}<small>${employer?'Employer':'Freelancer'}</small></span><span>⌄</span></summary><div><a href="${esc(cfg.home)}pob-workspace/#profile">Profile</a><a href="#switch-role">Switch Account / Switch Role</a><a href="${esc(data.logout)}">Log out</a></div></details></header>
  <main id="main"><div class="pilot-banner"><span class="status-dot"></span>Local workspace pilot <span class="pilot-description">Your current account pages remain available.</span><a href="${esc(data.native_dashboard)}">Original dashboard ↗</a></div>
  ${data.user.admin?`<div class="admin-preview">Administrator view uses this account’s own records. <a href="?view=freelancer">Freelancer layout</a><a href="?view=employer">Employer layout</a></div>`:''}
  ${['jobs','applicants','bought-services','meetings','project-proposals','service-orders','switch-role'].includes(view)?'<div id="management-screen"></div>':view==='contract'?'<div id="contract-screen"></div>':['job-editor','project-editor','favorites','statements','payouts','verify','change-password','delete-profile','proposals','applied','alerts'].includes(view)?'<div id="account-screen"></div>':view==='profile'?'<div id="profile-screen"></div>':view==='messages'?'<div id="messages-screen"></div>':view==='service-editor'?'<div id="service-editor-screen"></div>':view==='addons'?'<div id="addons-screen"></div>':view==='listings'?'<div id="listings-screen"></div>':view==='overview'?overview(employer):'<div id="support-screen">'+supportMarkup(data.support)+'</div>'}
  ${view!=='overview'&&data.support?.whatsapp_html?`<section class="whatsapp-notice">${data.support.whatsapp_html}</section>`:''}<footer class="workspace-footer"><span>POBlancer · POB Digital Experts</span><a href="${esc(cfg.home)}contact/">Contact Us</a><a href="${esc(cfg.home)}terms/">Terms of Service</a></footer></main></div></div>`;
  bridgeLinks(app,cfg.home);
  bind();
  if(['jobs','applicants','bought-services','meetings','project-proposals','service-orders','switch-role'].includes(view))mountManagement(document.querySelector('#management-screen'),cfg,view,Number(location.hash.split('/')[1])||0);
  if(view==='contract')mountContract(document.querySelector('#contract-screen'),cfg,location.hash.split('/')[1],Number(location.hash.split('/')[2]));
  if(['job-editor','project-editor'].includes(view))mountServiceEditor(document.querySelector('#account-screen'),cfg,Number(location.hash.split('/')[1])||0,view.split('-')[0]);
  if(['favorites','statements','proposals','applied','alerts'].includes(view))mountCollection(document.querySelector('#account-screen'),cfg,view);
  if(['payouts','verify','change-password','delete-profile'].includes(view))mountAccountTool(document.querySelector('#account-screen'),cfg,view);
  if(view==='profile')mountServiceEditor(document.querySelector('#profile-screen'),cfg,0,'profile');
  if(view==='messages')mountMessages(document.querySelector('#messages-screen'),cfg);
  if(view==='service-editor')mountServiceEditor(document.querySelector('#service-editor-screen'),cfg,Number(location.hash.split('/')[1])||0);
  if(view==='addons')mountAddons(document.querySelector('#addons-screen'),cfg);
  if(view==='support')bindDemo(document.querySelector('#support-screen'),cfg,data,render);
  if(view==='overview')mountViews(document.querySelector('#page-views'),cfg,data);
  if(view==='listings')mountListings(document.querySelector('#listings-screen'),cfg,data);
}
function overview(employer) {
  const title=employer?'Your projects, in one place.':'Your work, in one place.';
  return `<section class="page-heading"><div><span class="eyebrow">YOUR DASHBOARD</span><h1>${title}</h1><p>Welcome back, ${esc(data.user.name)}.</p></div><a class="button primary" href="${esc(cfg.home)}${employer?'pob-workspace/#project-editor':'pob-workspace/#service-editor'}">+ ${employer?'Submit Project':'Submit Service'}</a></section>
  ${supportSummary(data.support)}<section class="stat-grid" aria-label="Account statistics">${data.stats.map((s,i)=>`<article class="stat"><span class="stat-icon s${i}" aria-hidden="true">${['▤','✓','◷','☆'][i]}</span><div><span>${esc(s.label)}</span><strong>${esc(s.value)}</strong></div></article>`).join('')}</section>
  <section class="panel" id="page-views"></section><div class="overview-grid"><section class="panel recent"><div class="panel-heading"><div><span class="eyebrow">WORK ACTIVITY</span><h2>${employer?'Recent Proposals':'Recent Service Orders'}</h2></div><a href="#listings">View all ↗</a></div>${data.recent.length?`<div class="table-scroll"><table><thead><tr><th>Title</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead><tbody>${data.recent.map(r=>`<tr><td><strong>${esc(r.title)}</strong><small>${esc(r.parent)}</small></td><td><span class="badge">${esc(r.status)}</span></td><td>${esc(r.date)}</td><td><a href="${esc(r.url)}">View History ↗</a></td></tr>`).join('')}</tbody></table></div>`:`<div class="empty"><span>▤</span><h3>${employer?'No proposals found.':'No service orders found.'}</h3><p>Your account’s recent activity will appear here.</p></div>`}<div class="panel-foot">Cost, delivery details and order actions are available in View History.</div></section>
  <aside class="panel account-panel"><span class="eyebrow">YOUR ACCOUNT</span><h2>${employer?'Employer profile':'Freelancer profile'}</h2>${data.balance!==null?`<div class="balance"><span>Available balance</span><strong>${money(data.balance)}</strong><a href="${esc(cfg.home)}pob-workspace/#payouts">Payouts ↗</a></div>`:''}${data.groups.length?data.groups.map(g=>`<span class="group-pill">${esc(g)}</span>`).join(''):'<p>Your freelancer category is managed in your existing profile.</p>'}<a class="button" href="${esc(cfg.home)}pob-workspace/#profile">Edit Profile ↗</a>${data.user.profile_url?`<a class="subtle" href="${esc(data.user.profile_url)}">View public profile ↗</a>`:''}</aside>
  <section class="panel notifications"><div class="panel-heading"><div><span class="eyebrow">LATEST UPDATES</span><h2>Notifications</h2></div><span class="count">${data.notifications.length}</span></div>${data.notifications.length?`<ul>${data.notifications.map(n=>`<li><span class="notification-dot"></span><div>${n.html}</div></li>`).join('')}</ul>`:'<div class="empty small"><p>No notifications found.</p></div>'}</section>
  <section class="panel support-card"><span class="eyebrow">WORKING TOGETHER</span><h2>Support before the deadline.</h2><p>Propose the remaining work and a share. Another freelancer can accept or counter.</p><div class="mini-timeline"><span>Start</span><i></i><strong>70% review</strong><i></i><span>Deadline</span></div><button class="button" data-view="support">Open project support →</button><p class="fine">Offers and agreements are saved here. Existing payouts remain unchanged.</p></section></div>
  ${data.support?.whatsapp_html?`<section class="whatsapp-notice">${data.support.whatsapp_html}</section>`:""}<section class="community"><div><span class="eyebrow">YOUR EXISTING CONNECTIONS</span><h2>Community</h2><p>Your existing community connections remain available. Report support arranged on Slack or ClickUp in the assignment progress update.</p></div><a class="button" href="${esc(data.native_dashboard)}">Open current dashboard ↗</a></section><p class="sync-note">Account overview updated ${esc(new Date(data.generated_at).toLocaleTimeString())}. <button class="text-button" id="refresh">Refresh</button></p>`;
}
function bind() {
 editing=false;
 document.querySelectorAll('.sidebar a.nav-item').forEach(link=>{if(['My Services','My Projects','Service Addon','Submit Service'].includes(link.textContent.replace('▤','').trim())){link.addEventListener('click',event=>{event.preventDefault();view=link.textContent.includes('Service Addon')?'addons':link.textContent.includes('Submit Service')?'service-editor':'listings';history.replaceState(null,'','#'+view);render();});}});
 document.querySelectorAll('form.support-action').forEach(f=>f.addEventListener('input',()=>{editing=true;}));
 document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.view;history.replaceState(null,'',view==='overview'?location.pathname+location.search:'#'+view);render();window.scrollTo({top:0,behavior:'instant'});}));
 document.querySelector('.mobile-menu')?.addEventListener('click',e=>{const open=document.querySelector('.workspace').classList.toggle('menu-open');e.currentTarget.setAttribute('aria-expanded',String(open));});
 document.querySelector('#refresh')?.addEventListener('click',load);
 bindSupport(app,data.support,{api:cfg.supportApi,nonce:cfg.nonce,refresh:refreshSupport});
}
async function refreshSupport() {
 const r=await fetch(cfg.supportApi,{credentials:'same-origin',headers:{'X-WP-Nonce':cfg.nonce},cache:'no-store'});
 const out=await r.json();if(!r.ok)throw new Error(out.message||'Unable to refresh support.');
 data.support=out;render();
}

function startSupportPolling() {
 clearInterval(supportTimer);
 if(!data.support||( !data.support.eligible&&!data.support.admin&&!data.support.cases.length)) return;
 supportTimer=setInterval(async()=>{
  if(document.hidden||editing||document.querySelector('[data-demo="true"]')||document.activeElement?.matches('input,textarea,select')) return;
  try {
   const r=await fetch(cfg.supportApi,{credentials:'same-origin',headers:{'X-WP-Nonce':cfg.nonce},cache:'no-store'});
   if(!r.ok)return;
   const next=await r.json();
   if(JSON.stringify(next.alerts)!==JSON.stringify(data.support.alerts)){
    data.support.alerts=next.alerts;
    const panel=document.querySelector('.deadline-notices');
    if(panel){
     panel.outerHTML=supportSummary(data.support);
     const fresh=document.querySelector('.deadline-notices');
     bindSupport(fresh,data.support,{api:cfg.supportApi,nonce:cfg.nonce,refresh:refreshSupport});
     fresh.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{view='support';render();window.scrollTo({top:0,behavior:'instant'});}));
    }
   }
  }catch{/* Keep the existing dashboard visible; the next refresh may recover. */}
 },60000);
}
load();
