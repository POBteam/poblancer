'use client';
import {useEffect,useRef,useState} from 'react';
import {configuration,type Session} from '@/lib/client';
type Props={route:string;session:Session;data:any;refresh:()=>void};
// Transitional DOM islands preserve completed screens while each view is ported to React.
export default function LegacyScreen({route,session,data,refresh}:Props){
 const root=useRef<HTMLDivElement>(null),[error,setError]=useState('');
 useEffect(()=>{
  const host=root.current;if(!host)return;setError('');host.replaceChildren();
  let active=true;
  const cfg=configuration(session);const [screen,kind,id]=route.split('/');
  const load=(name:string)=>import(/* webpackIgnore: true */ '/legacy/'+name+'.js');
  async function mount(){
   if(!active)return;
   if(screen==='support'){
    const ui=await load('support-ui');if(!active)return;
    host!.innerHTML=ui.supportMarkup(data.support);
    ui.bindSupport(host,data.support,{api:cfg.supportApi,nonce:cfg.nonce,refresh});
    const demo=await load('support-demo');if(active)demo.bindDemo(host,cfg,data,refresh);
   }else if(['jobs','applicants','bought-services','meetings','project-proposals','service-orders','switch-role'].includes(screen)){
    const m=await load('management');if(active)await m.mountManagement(host,cfg,screen,Number(kind)||0);
   }else if(screen==='contract'){
    const m=await load('contracts');if(active)await m.mountContract(host,cfg,kind,Number(id));
   }else if(['service-editor','job-editor','project-editor','profile'].includes(screen)){
    const m=await load('service-editor');if(active)await m.mountServiceEditor(host,cfg,Number(kind)||0,screen==='profile'?'profile':screen.split('-')[0]);
   }else if(['favorites','statements','proposals','applied','alerts'].includes(screen)){
    const m=await load('collections');if(active)await m.mountCollection(host,cfg,screen);
   }else if(['payouts','verify','change-password','delete-profile'].includes(screen)){
    const m=await load('account-tools');if(active)await m.mountAccountTool(host,cfg,screen);
   }else if(screen==='messages'){
    const m=await load('messages');if(active)await m.mountMessages(host,cfg);
   }else if(screen==='addons'){
    const m=await load('addons');if(active)await m.mountAddons(host,cfg);
   }else if(screen==='listings'){
    const m=await load('listings');if(active)await m.mountListings(host,cfg,data);
   }else if(screen==='page-views'){
    const m=await load('page-views');if(active)await m.mountViews(host,cfg,data);
   }else throw new Error('This screen is unavailable.');
  }
  void mount().catch(e=>{if(active)setError(e.message||'Unable to load this screen.');});
  return ()=>{active=false;host.replaceChildren();};
 },[route,session,data,refresh]);
 return <>{error&&<p className="alert" role="alert">{error}</p>}<div ref={root} data-legacy-screen/></>;
}
