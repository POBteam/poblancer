// Translate existing dashboard notification links without changing public pages.
export function bridgeLinks(root,home){
 const base=new URL(home),routes={'freelancer-dashboard':'','employer-dashboard':'','messages':'messages','profile':'profile','freelancer-meetings':'meetings','employer-meetings':'meetings','my-jobs':'jobs','jobs-applicants':'applicants','my-bought-services':'bought-services','my-services':'listings','my-projects':'listings','submission-service':'service-editor','submission-service-addon':'addons','submission-project':'project-editor','submission-job':'job-editor','my-proposals':'proposals','my-applied':'applied','jobs-alerts':'alerts','favorite':'favorites','statements':'statements','payouts':'payouts','verify':'verify','change-password':'change-password','delete-profile':'delete-profile'};
 root.querySelectorAll('a[href]').forEach(link=>{if(link.closest('.pilot-banner,.community'))return;let url;try{url=new URL(link.href,home);}catch{return;}if(url.origin!==base.origin)return;const slug=url.pathname.replace(base.pathname,'').replace(/^\/+|\/+$/g,'');if(!Object.hasOwn(routes,slug))return;let route=routes[slug],id;
  if((id=url.searchParams.get('service_order_id')))route='contract/service/'+Number(id);
  else if((id=url.searchParams.get('proposal_id')))route='contract/project/'+Number(id);
  else if((id=url.searchParams.get('service_id')))route=url.searchParams.get('action')==='edit'?'service-editor/'+Number(id):'service-orders/'+Number(id);
  else if((id=url.searchParams.get('project_id')))route=url.searchParams.get('action')==='edit'?'project-editor/'+Number(id):'project-proposals/'+Number(id);
  else if((id=url.searchParams.get('job_id')))route=url.searchParams.get('action')==='edit'?'job-editor/'+Number(id):'applicants/'+Number(id);
  link.href=home+'pob-workspace/'+(route?'#'+route:'');
 });
}
