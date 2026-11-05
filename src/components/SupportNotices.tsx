'use client';
import {useEffect,useState} from "react";
import {api,type Session} from "@/lib/client";
import {mutate} from "./ScreenTools";
export default function SupportNotices({support,session,refresh,embedded=false}:{support:any;session:Session;refresh:()=>void;embedded?:boolean}){
 const [value,setValue]=useState(support),[busy,setBusy]=useState(false),[error,setError]=useState("");
 useEffect(()=>setValue(support),[support]);
 useEffect(()=>{
  if(!support||!(support.eligible||support.admin||support.cases?.length))return;
  let active=true,timer:ReturnType<typeof setTimeout>,request:AbortController|undefined;
  const tick=async()=>{
   if(!active)return;
   if(!document.hidden&&!document.activeElement?.matches("input,textarea,select")&&!document.querySelector("[data-demo=true]")){
    request=new AbortController();const timeout=setTimeout(()=>request?.abort(),15000);
    try{const next=await api("support",session.nonce!,request.signal);if(active)setValue(next);}catch{}finally{clearTimeout(timeout);request=undefined;}
   }
   // Schedule after completion so slow WordPress requests never overlap.
   if(active)timer=setTimeout(tick,60000);
  };
  // Spread refreshes across sessions; initial notices already come from workspace.
  timer=setTimeout(tick,45000+Math.floor(Math.random()*15000));
  return()=>{active=false;clearTimeout(timer);request?.abort();};
 },[support,session]);
 if(!value||!(value.eligible||value.admin||value.cases?.length))return null;
 const unread=value.alerts.filter((a:any)=>!Number(a.seen));
 return <section className="deadline-notices panel"><div className="panel-heading"><div><span className="eyebrow">DEADLINES AND SUPPORT</span><h2>{unread.length?"Updates need your attention":"Assignment updates"}</h2></div><a className="text-button" href="#support">Project support →</a></div>{unread.slice(0,4).map((a:any)=><div className="deadline-notice" key={a.id}><p>{a.message}</p><button className="text-button" disabled={busy} onClick={async()=>{setBusy(true);setError("");try{await mutate("poblancer/v1/support/action",session,{action:"seen",alert_id:a.id});refresh();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>Mark read</button></div>)}{!unread.length&&<p>{value.cases.length?"No unread deadline notices.":"No managed assignment has a confirmed deadline yet."}</p>}{value.eligible&&<p className="fine">{value.offers.filter((o:any)=>o.state==="open"&&!o.mine).length} open support offers. <a className="text-button" href="#support">Browse offers</a></p>}{error&&<p role="alert">{error}</p>}</section>;
}
