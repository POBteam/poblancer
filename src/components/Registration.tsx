'use client';
import Link from 'next/link';
import FreelancerWelcomeVideo from './FreelancerWelcomeVideo';
import {publicReactLink} from '../lib/public-routes.mjs';
import {useEffect,useRef,useState} from 'react';
type Registration={role:string;home:string;native_url:string;state:'form'|'authenticated'|'closed'|'verification';html?:string;providers_html?:string;provider_handoff?:boolean};
export default function Registration({initialRole}:{initialRole:'freelancer'|'employer'}){
 const [role,setRole]=useState(initialRole),[schema,setSchema]=useState<Registration|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const host=useRef<HTMLDivElement>(null),result=useRef<HTMLParagraphElement>(null);
 useEffect(()=>{const controller=new AbortController();setSchema(null);setError('');
  if(result.current)result.current.textContent='';
  fetch('/api/registration-form',{method:'POST',body:new URLSearchParams({role}),credentials:'same-origin',cache:'no-store',signal:controller.signal}).then(async r=>{const out=await r.json();if(!r.ok)throw new Error(out.message||'Unable to load registration.');if(!controller.signal.aborted)setSchema(out);}).catch(e=>{if(e.name!=='AbortError')setError(e.message);});
  return()=>controller.abort();
 },[role]);
 useEffect(()=>{
  const root=host.current;if(!root||schema?.state!=='form')return;
  const form=root.querySelector('form');if(!form)return;
  form.action='/api/register';
  for(const a of form.querySelectorAll<HTMLAnchorElement>('a[href]')){const href=publicReactLink(a.href);if(/^\/(terms|privacy-policy)\//.test(href)){a.href=href;a.target='_blank';a.rel='noopener noreferrer';}}
  const submit=async(e:Event)=>{
   e.preventDefault();if(!form.reportValidity())return;
   const password=form.querySelector<HTMLInputElement>('[name$="_password"]'),confirmation=form.querySelector<HTMLInputElement>('[name$="_confirmpassword"]');
   const status=result.current;if(!status)return;
   if(password&&confirmation&&password.value!==confirmation.value){status.textContent='The passwords do not match.';confirmation.focus();return;}
   const buttons=[...form.querySelectorAll<HTMLInputElement|HTMLButtonElement>('[type=submit]')];
   if(buttons.some(b=>b.disabled))return;
   buttons.forEach(b=>b.disabled=true);setBusy(true);status.textContent='Submitting your registration…';
   let uncertain=false;
   try{
    const r=await fetch('/api/register',{method:'POST',credentials:'same-origin',body:new FormData(form),cache:'no-store'}),out=await r.json();
    const message=new DOMParser().parseFromString(String(out.msg||out.message||'Unable to complete registration.'),'text/html').body.textContent;
    status.textContent=message;if(!r.ok)throw new Error(message||'Unable to complete registration.');
    if(out.status){form.reset();form.hidden=true;if(out.redirect)location.assign('/workspace');}
   }catch{uncertain=true;status.textContent='Unable to confirm registration. Check your email or try logging in before submitting again.';}
   finally{if(!uncertain){buttons.forEach(b=>b.disabled=false);setBusy(false);}}
  };
  form.addEventListener('submit',submit);return()=>form.removeEventListener('submit',submit);
 },[schema]);
 function choose(next:'freelancer'|'employer'){if(busy)return;setRole(next);history.replaceState(null,'','/register?role='+next);}
 const home=schema?.home||'http://poblancer.local/';
 return <div className="login-layout registration-layout"><aside className="login-story"><a href="/"><img className="brand-image" src="/brand.png" alt="POBlancer"/></a><div className="registration-story-content">{role==='freelancer'&&<figure className="registration-team"><img src="/images/pob-academy-team-banner.png" width="1536" height="512" alt="POB Academy team, Princesage Online Branding" decoding="async"/></figure>}<div><span className="eyebrow">POB Digital Experts</span><h1>Join POBlancer as a freelancer or employer.</h1><p>We welcome both growing talent and experienced professionals, while POB-branded freelancers are held to verified quality, ethics, and service standards.</p></div>{role==='freelancer'&&<FreelancerWelcomeVideo/>}{role==='employer'&&<div className="employer-signup-video"><iframe title="Welcome to POBlancer for employers" src="https://www.youtube-nocookie.com/embed/ii3bwrYBsAQ?rel=0&playsinline=1&controls=0&cc_load_policy=0" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/></div>}</div></aside><main id="main" className="login-main registration"><section><span className="eyebrow">POBlancer</span><h2>Sign Up</h2><nav className="auth-tabs" aria-label="Account type">{(['freelancer','employer'] as const).map(value=><button key={value} className={'button '+(role===value?'primary':'')} aria-pressed={role===value} disabled={busy} onClick={()=>choose(value)}>{value==='freelancer'?'Freelancer':'Employer'}</button>)}</nav>
 {error&&<p className="alert" role="alert">{error} <a href={home+'pob-register/?role='+role}>Use the original registration form</a></p>}
 {!schema&&!error&&<p role="status">Loading registration…</p>}
 {schema?.state==='authenticated'&&<><p>You are already signed in.</p><Link className="button primary" href="/workspace" prefetch={false}>Open dashboard</Link></>}
 {schema?.state==='closed'&&<p>Registration is currently closed.</p>}
 {schema?.state==='verification'&&<><p>Please complete registration using the existing verification form.</p><a className="button" href={schema.native_url}>Continue to registration</a></>}
 {schema?.state==='form'&&<><div ref={host} dangerouslySetInnerHTML={{__html:schema.html||''}}/>{schema.providers_html&&(schema.provider_handoff?<p><a href={schema.native_url}>Use the original registration page for additional sign-in options</a></p>:<div dangerouslySetInnerHTML={{__html:schema.providers_html}}/>)}</>}
 <p ref={result} className="register-result" role="status" aria-live="polite"/><p>Already have an account? <Link href="/login" prefetch={false}>Log In</Link></p></section></main></div>;
}
