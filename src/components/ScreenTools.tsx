'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {api,sessionNonce,type Session} from '@/lib/client';
export function useResource(path:string,session:Session,enabled=true){
 const [data,setData]=useState<any>(null),[error,setError]=useState(''),[version,setVersion]=useState(0);
 useEffect(()=>{let active=true;const c=new AbortController();setData(null);setError('');if(enabled)api(path,session.nonce!,c.signal).then(out=>{if(active)setData(out);}).catch(e=>{if(active&&e.name!=='AbortError')setError(e.message);});return()=>{active=false;c.abort();};},[path,session,version,enabled]);
 return {data,error,refresh:()=>setVersion(v=>v+1)};
}
export function plain(value:string){return new DOMParser().parseFromString(value,'text/html').body.textContent||'';}
export function requestKey(){const b=new Uint8Array(16);crypto.getRandomValues(b);return Array.from(b,n=>n.toString(16).padStart(2,'0')).join('');}
export async function mutate(endpoint:string,session:Session,body:object|FormData){const multipart=body instanceof FormData;const r=await fetch('/api/wp/'+endpoint,{method:'POST',credentials:'same-origin',headers:{'X-WP-Nonce':sessionNonce(session),...(!multipart?{'Content-Type':'application/json'}:{})},body:multipart?body:JSON.stringify(body)});let out;try{out=await r.json();}catch{throw new Error('The server could not confirm the result. Check the saved state before trying again.');}if(!r.ok||out.status===false){const e=new Error(out.message||plain(out.msg||'Unable to save.'));Object.assign(e,{details:out.data});throw e;}return out;}
export function navigateBackend(destination:string,session:Session){const url=new URL(destination,session.home);if(url.origin!==new URL(session.home).origin)throw new Error('Unexpected destination.');location.assign(/^\/checkout(?:\/|$)/.test(url.pathname)?'/checkout':url.href);}
export function Heading({title,children}:{title:string;children?:ReactNode}){return <section className="page-heading"><h1>{title}</h1>{children}</section>;}
export function Pager({page,pages,total,change}:{page:number;pages:number;total?:number;change:(page:number)=>void}){return <div className="listing-toolbar"><button className="button" disabled={page<=1} onClick={()=>change(page-1)}>Previous</button><span>{page} / {Math.max(1,pages)}{total!==undefined?` · ${total} records`:''}</span><button className="button" disabled={page>=pages} onClick={()=>change(page+1)}>Next</button></div>;}
export function LoadState({error,loading}:{error:string;loading:boolean}){return error?<p role="alert">{error}</p>:loading?<p role="status">Loading your records…</p>:null;}
export function ActionForm({children,label='Save',submit,onSuccess}:{children:ReactNode;label?:string;submit:(form:FormData)=>Promise<any>;onSuccess?:(out:any)=>void|Promise<void>}){
 const pending=useRef(false),[busy,setBusy]=useState(false),[status,setStatus]=useState('');
 return <form className="account-form" onSubmit={async e=>{e.preventDefault();if(pending.current)return;const body=new FormData(e.currentTarget);pending.current=true;setBusy(true);setStatus('');try{const out=await submit(body);setStatus(out.message||plain(out.msg||'Saved successfully.'));await onSuccess?.(out);}catch(e){setStatus(e instanceof Error?e.message:'Unable to save.');}finally{pending.current=false;setBusy(false);}}}><fieldset disabled={busy} className="action-fields">{children}<button type="submit" className="button primary">{busy?'Saving…':label}</button></fieldset><p role="status">{status}</p></form>;
}
