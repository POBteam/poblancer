export async function mountViews(root,cfg,data){
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 try{
  const url=new URL(cfg.listingsApi);url.searchParams.set('view',data.user.role);
  const r=await fetch(url,{headers:{'X-WP-Nonce':cfg.nonce},credentials:'same-origin',cache:'no-store'});const list=await r.json();if(!r.ok)throw new Error(list.message);
  root.innerHTML=`<div class="panel-heading"><h2>Page Views</h2></div>${list.rows.length?`<form class="listing-toolbar"><label>Projects<select name="id">${list.rows.map(row=>`<option value="${row.id}">${esc(row.title)}</option>`).join('')}</select></label><label>Number Days<select name="days"><option>7</option><option selected>15</option><option>30</option></select></label></form><div class="views-plot" aria-live="polite"></div>`:'<p>Page views will appear when you have a listing.</p>'}`;
  if(!list.rows.length)return;
  let serial=0;
  async function draw(){
   const current=++serial,params=new FormData(root.querySelector('form')),url=new URL(cfg.viewsApi);for(const [k,v] of params)url.searchParams.set(k,v);
   const target=root.querySelector('.views-plot');target.textContent='Loading page views…';
   try{const r=await fetch(url,{headers:{'X-WP-Nonce':cfg.nonce},credentials:'same-origin',cache:'no-store'});const out=await r.json();if(!r.ok)throw new Error(out.message);if(current!==serial)return;
    const max=Math.max(1,...out.points.map(p=>p.views));
    const path=out.points.map((p,i)=>`${i?'L':'M'} ${20+i*760/(out.points.length-1)} ${170-p.views/max*140}`).join(' ');
    target.innerHTML=`<svg viewBox="0 0 800 200" role="img" aria-label="Page views for selected listing"><title>${out.points.reduce((s,p)=>s+p.views,0)} views in selected period</title><path d="M20 170H780" stroke="#ddd"/><path d="${path}" fill="none" stroke="#130d5e" stroke-width="3"/><text x="20" y="195">${out.points[0].date}</text><text x="660" y="195">${out.points.at(-1).date}</text></svg><details><summary>View daily figures</summary><table><thead><tr><th>Date</th><th>Views</th></tr></thead><tbody>${out.points.map(p=>`<tr><td>${p.date}</td><td>${p.views}</td></tr>`).join('')}</tbody></table></details>`;
   }catch(e){if(current===serial)target.textContent=e.message||'Unable to load page views.';}
  }
  root.querySelector('form').addEventListener('submit',e=>e.preventDefault());root.querySelector('form').addEventListener('change',draw);await draw();
 }catch(e){root.textContent=e.message||'Page views are unavailable.';}
}
