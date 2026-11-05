const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=t=>new Date(Number(t)*1000).toLocaleString('en-NG',{dateStyle:'medium',timeStyle:'short'});
const amount=(c,currency)=>new Intl.NumberFormat('en-NG',{style:'currency',currency}).format(Number(c)/100);
const label=s=>String(s).replaceAll('_',' ');
function hidden(action,c,more={}) {return Object.entries({action,case_id:c.id,revision:c.revision,...more}).map(([k,v])=>`<input type="hidden" name="${esc(k)}" value="${esc(v)}">`).join('');}
const form=(content,cls='')=>`<form class="support-action ${cls}">${content}<p class="form-message" role="status"></p></form>`;
const button=(text)=>`<button class="button" type="submit">${text}</button>`;
export function supportSummary(s) {
 if(!s) return '';
 if(!s.eligible&&!s.admin&&!s.cases.length) return '';
 const unread=s.alerts.filter(a=>!Number(a.seen));
 return `<section class="deadline-notices panel"><div class="panel-heading"><div><span class="eyebrow">DEADLINES AND SUPPORT</span><h2>${unread.length?'Updates need your attention':'Assignment updates'}</h2></div><button class="text-button" data-view="support">Project support →</button></div>${unread.slice(0,4).map(a=>`<div class="deadline-notice"><p>${esc(a.message)}</p><button class="text-button" data-alert="${a.id}">Mark read</button></div>`).join('')}${!unread.length?`<p>${s.cases.length?'No unread deadline notices.':'No managed assignment has a confirmed deadline yet.'}</p>`:''}${s.eligible?`<p class="fine">${s.offers.filter(o=>o.state==='open'&&!o.mine).length} open support offers. <button class="text-button" data-view="support">Browse offers</button></p>`:''}</section>`;
}
export function supportMarkup(s) {
 if(!s) return '<section class="panel"><h1>Project support is unavailable.</h1></section>';
 const canAccess=s.eligible||s.admin||s.cases.length;
 return `<section class="page-heading"><div><span class="eyebrow">PROJECT SUPPORT</span><h1>Keep the deadline. Share the work.</h1><p>Confirmed dates, clear responsibilities and agreed earnings shares.</p></div><button class="button" id="support-refresh">Refresh</button></section>
 <div class="support-mode">${s.demo?'Read-only example with sample data. No records are saved by these demonstration controls.':`${s.local?'Local test environment. ':''}Agreements and notices are saved in WordPress. Existing payouts are unchanged; no money is transferred here.`}</div>
 ${!canAccess?`<section class="panel"><h2>POB-managed assignments</h2><p>This workflow is available to POB Internally Trained and POB Experienced Freelancers. Your normal account tools remain available.</p></section>`:''}
 ${supportSummary(s)}
 ${s.whatsapp_html?`<section class="whatsapp-notice">${s.whatsapp_html}</section>`:''}
 ${s.admin?setup(s)+policy(s):''}
 ${s.admin?`<section class="panel"><span class="eyebrow">POB EXCEPTION QUEUE</span><h2>${s.exceptions.length} assignments need review</h2>${s.exceptions.map(e=>`<p><a href="#case-${e.id}">${esc(e.title)}</a> · ${esc(e.flags.map(label).join(', '))}</p>`).join('')||'<p>No unresolved deadline or dispute signals.</p>'}</section>`:''}
 <section class="support-cases"><div class="section-heading"><h2>Your assignments</h2><span>${s.cases.length}</span></div>${s.cases.map(c=>caseCard(c,s)).join('')||'<div class="panel empty"><h3>No confirmed assignments yet.</h3><p>POB confirms the dates against an existing hired order. The earnings amount is read from that order.</p></div>'}</section>
 ${s.eligible||s.admin?`<section class="support-board"><div class="section-heading"><h2>Support offers</h2><span>POB freelancer community</span></div><p class="fine">Publish only the remaining support scope. Keep client passwords and private documents out of public offers.</p>${s.offers.map(o=>offerCard(o,s)).join('')||'<div class="panel empty"><h3>No support offers yet.</h3><p>Offers appear when an eligible primary freelancer requests help.</p></div>'}</section>`:''}`;
}
function setup(s) {
 return `<details class="panel setup-panel"><summary>POB: confirm an existing assignment’s dates</summary><p>The amount is read from Freeio’s stored freelancer earnings, not entered manually. Confirm the agreed deadline in your task records first.</p>${s.sources.length?form(`<input type="hidden" name="action" value="setup"><label>Active assignment<select name="source_id" required>${s.sources.map(o=>`<option value="${o.id}" ${o.pool_cents===null||!o.currency?'disabled':''}>${esc(o.title)} · ${o.pool_cents!==null&&o.currency?amount(o.pool_cents,o.currency):'Earnings or currency need verification'}</option>`).join('')}</select></label><div class="two-col"><label>Agreed start<input type="datetime-local" name="start" required></label><label>Client deadline<input type="datetime-local" name="due" required></label></div><label class="check"><input type="checkbox" required> I checked these dates against the agreed task deadline.</label>${button('Confirm dates')}`):'<p>No unconfigured hired assignments for eligible POB freelancers were found.</p>'}</details>`;
}
function policy(s) {
 return `<details class="panel setup-panel"><summary>POB: review thresholds</summary>${form(`<input type="hidden" name="action" value="policy"><div class="two-col"><label>Distinct declines before review<input name="decline_threshold" type="number" min="2" max="20" value="${s.policy.decline_threshold}" required></label><label>Maximum review window (hours)<input name="review_hours" type="number" min="1" max="24" value="${s.policy.review_hours}" required></label></div><p class="fine">Escalation uses the shorter of this window and half the remaining delivery time. The 70% submission checkpoint stays unchanged.</p>${button('Save thresholds')}`)}</details>`;
}
function caseCard(c,s) {
 const uid=Number(s.user_id),primary=uid===Number(c.primary_user),active=c.source_status==='hired',reserved=c.agreements.filter(a=>!['declined','cancelled'].includes(a.state));
 const cents=reserved.reduce((n,a)=>n+Number(a.amount_cents),0),bps=reserved.reduce((n,a)=>n+Number(a.share_bps),0);
 return `<article class="panel case-card" id="case-${c.id}"><div class="panel-heading"><div><span class="eyebrow">ASSIGNMENT #${c.source_id}</span><h2>${esc(c.title)}</h2><p>${esc(c.primary_name)} · ${esc(label(c.state))}</p></div><span class="badge">${esc(c.source_status)}</span></div>
 <div class="assignment-dates"><span>Start<strong>${date(c.started_at)}</strong></span><span>70% submission checkpoint<strong>${date(c.signals.checkpoint)}</strong></span><span>Client deadline<strong>${date(c.due_at)}</strong></span></div><div class="time-track"><i style="width:${c.signals.progress}%"></i></div><p class="fine">${c.signals.progress}% of the agreed time has elapsed. This is not a measure of work completed.</p>
 ${c.signals.flags.length?`<div class="callout">${c.signals.flags.map(f=>`<p>${esc(label(f))}</p>`).join('')}</div>`:''}
 <div class="earnings-grid"><div>Freelancer earnings after POB’s fee<strong>${amount(c.pool_cents,c.currency)}</strong></div><div>Primary share after reserved agreements<strong>${amount(Number(c.pool_cents)-cents,c.currency)} <small>(${(10000-bps)/100}%)</small></strong></div></div>${!c.source_current?'<p class="alert">The original earnings changed. New agreements are blocked until the basis is reviewed.</p>':''}
 ${c.progress_note?`<div class="progress-note"><strong>Latest progress</strong><p>${esc(c.progress_note)}</p>${c.evidence?`<a href="${esc(c.evidence)}" target="_blank" rel="noopener noreferrer">Open submitted evidence ↗</a>`:''}</div>`:''}
 ${primary&&active&&!['submitted','completed'].includes(c.state)?`<details><summary>Update progress or submit work</summary>${form(`${hidden('progress',c)}<label>Progress<select name="state"><option value="on_track">On track</option><option value="needs_support">Need support</option><option value="submitted">Work submitted</option></select></label><label>Progress, challenges and support discussed on Slack or ClickUp<textarea name="note" minlength="10" maxlength="3000" required></textarea></label><label>Delivery or evidence link<input type="url" name="evidence" placeholder="https://"></label>${button('Save progress')}`)}</details>`:''}
 ${primary&&active&&!['submitted','completed'].includes(c.state)?`<details><summary>Publish a support offer</summary>${form(`${hidden('offer',c)}<label>Remaining work and handover requirements<textarea name="scope" minlength="25" maxlength="3000" required></textarea></label><div class="two-col"><label>Required skills<input name="skills" maxlength="250" minlength="2" required></label><label>Proposed earnings share (%)<input type="number" name="share" min="0.01" max="100" step="0.01" required></label></div><p class="fine">The support amount is calculated from the stored freelancer earnings above. No extra platform fee is introduced.</p>${button('Publish offer')}`)}</details>`:''}
 <h3 class="subheading">Support agreements</h3>${c.agreements.map(a=>agreement(a,c,s)).join('')||'<p class="fine">No support agreements. The primary freelancer retains the full earnings share.</p>'}
 ${s.admin&&active?`<details><summary>POB: request a progress or offer review</summary>${form(`${hidden('request_revision',c)}<label>Message to the primary freelancer<textarea name="note" minlength="15" required></textarea></label>${button('Send dashboard notice')}`)}</details>`:''}
 <details class="audit"><summary>Activity history</summary>${c.audit.map(a=>`<div><strong>${esc(label(a.action))}</strong> · ${date(a.created_at)}${JSON.parse(a.details||'{}').note?`<p>${esc(JSON.parse(a.details).note)}</p>`:''}</div>`).join('')}</details></article>`;
}
function agreement(a,c,s) {
 const mine=Number(a.assignee_id)===Number(s.user_id),primary=Number(c.primary_user)===Number(s.user_id),active=c.source_status==='hired';
 return `<div class="agreement"><div class="panel-heading"><div><h3>${esc(a.assignee_name)}</h3><span class="fine">${esc(label(a.state))} · ${Number(a.share_bps)/100}% · ${amount(a.amount_cents,c.currency)}</span></div></div><p>${esc(a.scope)}</p><p class="fine">Deadline: ${date(c.due_at)}. Both parties’ acceptances are recorded against this scope and share.</p>${a.evidence?`<a href="${esc(a.evidence)}" target="_blank" rel="noopener noreferrer">Support delivery ↗</a>`:''}
 ${mine&&active&&a.state==='awaiting_confirmation'?form(`${hidden('confirm',c,{agreement_id:a.id})}<label class="check"><input name="accepted" type="checkbox" required> I accept this scope, deadline and earnings share.</label>${button('Accept final agreement')}`)+form(`${hidden('decline_selection',c,{agreement_id:a.id})}${button('Decline selection')}`):''}
 ${mine&&active&&a.state==='active'?form(`${hidden('deliver',c,{agreement_id:a.id})}<label>Completed support work link<input type="url" name="evidence" required></label>${button('Submit support work')}`):''}
 ${primary&&active&&a.state==='submitted'?form(`${hidden('accept_delivery',c,{agreement_id:a.id})}${button('Accept support delivery')}`):''}
 ${active&&(mine||primary)&&['active','submitted','accepted'].includes(a.state)?`<details><summary>Raise a dispute</summary>${form(`${hidden('dispute',c,{agreement_id:a.id})}<label>Explain the issue<textarea name="note" minlength="15" required></textarea></label>${button('Request POB review')}`)}</details>`:''}
 ${s.admin&&active&&a.state==='disputed'?form(`${hidden('resolve',c,{agreement_id:a.id})}<label>Return to<select name="state"><option value="active">Active work</option><option value="submitted">Submitted for review</option></select></label><label>Review outcome<textarea name="note" minlength="20" required></textarea></label>${button('Record review outcome')}`):''}
 ${a.state==='accepted'?'<p class="fine settlement-note">Delivery accepted. Share recorded for settlement review. This does not automatically credit a payout balance.</p>':''}</div>`;
}
function offerCard(o,s) {
 const c={id:o.case_id,revision:o.case_revision};
 return `<article class="panel offer-card"><div class="panel-heading"><div><span class="eyebrow">SUPPORT OFFER #${o.id} · VERSION ${o.version}</span><h2>${esc(o.skills)}</h2><p>Posted by ${esc(o.primary_name)}</p></div><span class="badge">${esc(o.state)}</span></div><p>${esc(o.scope)}</p><div class="offer-terms"><strong>${amount(o.amount_cents,o.currency)} <small>(${Number(o.share_bps)/100}%)</small></strong><span>Due ${date(o.due_at)}</span></div><div class="feedback-counts"><span>👍 ${o.interested} interested</span><span>↔ ${o.countered} counteroffers</span><span>👎 ${o.declined} declined</span></div>
 ${s.eligible&&!o.mine&&o.state==='open'?form(`${hidden('respond',c,{offer_id:o.id,offer_version:o.version})}<div class="two-col"><label>Your response<select name="kind"><option value="interest">Interested at the offered share</option><option value="counter">Suggest another share</option><option value="decline">Decline</option></select></label><label>Reason if declining<select name="reason"><option value="">Choose a reason</option><option value="low_payment">Payment too low</option><option value="unclear_scope">Scope unclear</option><option value="insufficient_time">Not enough delivery time</option><option value="unavailable">Unavailable</option></select></label></div><label>Counteroffer share (%) if suggesting another amount<input type="number" name="share" min="0.01" max="100" step="0.01" value="${Number(o.share_bps)/100}"></label><label>Comment<textarea name="note" maxlength="1000"></textarea></label>${button('Save response')}`):''}
 ${o.mine&&Number(s.user_id)===Number(o.author_id)&&o.state==='open'?`<details><summary>Revise this offer</summary>${form(`${hidden('edit_offer',c,{offer_id:o.id})}<label>Remaining scope<textarea name="scope" minlength="25" required>${esc(o.scope)}</textarea></label><label>Required skills<input name="skills" value="${esc(o.skills)}" required></label><label>Proposed share (%)<input name="share" type="number" min="0.01" max="100" step="0.01" value="${Number(o.share_bps)/100}" required></label><p class="fine">Changing terms creates a new version. Existing feedback will not count as acceptance of the new terms.</p>${button('Save new offer version')}`)}</details>${form(`${hidden('close_offer',c,{offer_id:o.id})}${button('Close this open offer')}`)}`:''}
 ${o.responses.length?`<div class="offer-responses"><h3>${o.mine?'Responses':'Your response'}</h3>${o.responses.map(r=>`<div><strong>${esc(r.name)}</strong> · ${esc(label(r.kind))}${r.kind==='counter'?` · ${Number(r.share_bps)/100}%`:''}${r.reason?` · ${esc(label(r.reason))}`:''}<p>${esc(r.note)}</p>${o.mine&&Number(s.user_id)===Number(o.author_id)&&o.state==='open'&&r.kind!=='decline'?form(`${hidden('select',c,{offer_id:o.id,response_id:r.id})}${button('Select and confirm these terms')}`):''}</div>`).join('')}</div>`:''}</article>`;
}
export function bindSupport(root,s,{api,nonce,refresh}) {
 root.querySelector('#support-refresh')?.addEventListener('click',async e=>{
  const b=e.currentTarget;b.disabled=true;
  try{await refresh();}catch(error){b.textContent=error.message;b.disabled=false;}
 });
 root.querySelectorAll('[data-alert]').forEach(b=>b.addEventListener('click',async()=>{
  b.disabled=true;
  try{await send({action:'seen',alert_id:b.dataset.alert});await refresh(false);}catch(e){b.disabled=false;b.textContent=e.message;}
 }));
 root.querySelectorAll('form.support-action').forEach(f=>f.addEventListener('submit',async e=>{
  e.preventDefault();const body=Object.fromEntries(new FormData(f));
  if(body.action==='setup'){body.start=new Date(body.start).toISOString();body.due=new Date(body.due).toISOString();}
  const buttons=[...f.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);
  const message=f.querySelector('.form-message');message.textContent='Saving…';
  try{
   await send(body);await refresh(false);
   const notice=document.createElement('div');notice.className='save-toast';notice.setAttribute('role','status');notice.textContent='Saved successfully.';root.prepend(notice);setTimeout(()=>notice.remove(),4500);
  }catch(error){message.textContent=error.message;buttons.forEach(b=>b.disabled=false);}
 }));
 async function send(body) {
  const res=await fetch(api+'/action',{method:'POST',credentials:'same-origin',headers:{'X-WP-Nonce':nonce,'Content-Type':'application/json'},body:JSON.stringify(body)});
  const out=await res.json();if(!res.ok)throw new Error(out.message||'Unable to save.');return out;
 }
}
