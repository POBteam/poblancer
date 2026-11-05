// Keep existing notification and contract links inside the new workspace.
const routes={'freelancer-dashboard':'overview','employer-dashboard':'overview',messages:'messages',profile:'profile','freelancer-meetings':'meetings','employer-meetings':'meetings','my-jobs':'jobs','jobs-applicants':'applicants','my-bought-services':'bought-services','my-services':'listings','my-projects':'listings','submission-service':'service-editor','submission-service-addon':'addons','submission-project':'project-editor','submission-job':'job-editor','my-proposals':'proposals','my-applied':'applied','jobs-alerts':'alerts',favorite:'favorites',statements:'statements',payouts:'payouts',verify:'verify','change-password':'change-password','delete-profile':'delete-profile'};
export function dashboardHash(href,home){
 let url;try{url=new URL(href,home);}catch{return null;}
 const base=new URL(home);if(url.origin!==base.origin)return null;
 const slug=url.pathname.replace(/^\/+|\/+$/g,'');
 if(slug==='pob-workspace')return url.hash||'#overview';
 if(!Object.hasOwn(routes,slug))return null;
 let route=routes[slug];const q=url.searchParams;
 for(const [key,contract] of [['service_order_id','service'],['proposal_id','project']]){
  const id=q.get(key);if(id&&/^[1-9]\d*$/.test(id))return '#contract/'+contract+'/'+id;
 }
 for(const [key,edit,list] of [['service_id','service-editor','service-orders'],['project_id','project-editor','project-proposals'],['job_id','job-editor','applicants']]){
  const id=q.get(key);if(id&&/^[1-9]\d*$/.test(id)){route=(q.get('action')==='edit'?edit:list)+'/'+id;break;}
 }
 return '#'+route;
}
