'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {getSession,type Session} from '@/lib/client';
import {sanitizeCustomerMessage} from '@/lib/friendly-messages.mjs';

export default function Login(){
 const [session,setSession]=useState<Session|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{getSession().then(setSession).catch(e=>setError(sanitizeCustomerMessage(e.message,'login')));},[]);
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(!session?.login_nonce)return;setBusy(true);setError('');
  try{const body=new FormData(e.currentTarget);body.set('_wpnonce',session.login_nonce);
   const r=await fetch('/api/sign-in',{method:'POST',credentials:'same-origin',body});const out=await r.json().catch(()=>({}));
   if(!r.ok||out.authenticated===false)throw new Error(sanitizeCustomerMessage(out.message,'login')||'Sign-in failed. Please check your details and try again.');
   const back=new URLSearchParams(location.search).get('returnTo')||'';location.assign(/^\/(?:project|service|job|employer|freelancer)\/[a-z0-9-]+\/?(?:#project-proposal-form-wrapper)?$/.test(back)?back:'/workspace');
  }catch(e){setError(sanitizeCustomerMessage((e as Error).message,'login'));setBusy(false);}
 }
 const defaultHome=process.env.NODE_ENV==='production'?'https://poblancer.pob.com.ng/':'http://poblancer.local/';
 const home=session?.home||defaultHome;
 return <div className="login-layout"><aside className="login-story"><a href="/"><img className="brand-image" src="/brand.png" alt="POBlancer"/></a><div className="registration-story-content"><figure className="registration-team"><img src="/images/pob-academy-team-banner.png" width="1536" height="512" alt="POB Academy team, Princesage Online Branding" decoding="async"/></figure><div><span className="eyebrow">POB Digital Experts</span><h1>Sign in to manage your projects, jobs, and account as a freelancer or employer.</h1></div></div>{process.env.NODE_ENV!=='production'&&<span className="pilot-label">Local workspace pilot</span>}</aside><main id="main" className="login-main"><a className="back-link" href="/">← Back to website</a><section><span className="eyebrow">POBlancer</span><h2>Log In</h2>{error&&<p className="alert" role="alert">{error}</p>}
 {session?.authenticated?<><p>You are already signed in.</p><Link className="button primary" href="/workspace" prefetch={false}>Open dashboard</Link></>:session?.captcha?<><p>Security verification is required. Please refresh the page to try again, or contact our support team.</p></>:<form onSubmit={submit}><label>Email<input name="log" autoComplete="username" required/></label><label>Password<input name="pwd" type="password" autoComplete="current-password" required/></label><div className="form-row"><label className="check"><input type="checkbox" name="rememberme"/>Keep me signed in</label><a href={home+'wp-login.php?action=lostpassword'}>Forgotten password?</a></div><button className="primary" disabled={busy||!session?.login_nonce}>{busy?'Signing in…':'Login'}</button></form>}
 <p><Link href="/register" prefetch={false}>Sign Up</Link></p></section></main></div>;
}
