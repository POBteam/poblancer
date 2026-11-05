'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {getSession,type Session} from '@/lib/client';
export default function Login(){
 const [session,setSession]=useState<Session|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{getSession().then(setSession).catch(e=>setError(e.message));},[]);
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(!session?.login_nonce)return;setBusy(true);setError('');
  try{const body=new FormData(e.currentTarget);body.set('_wpnonce',session.login_nonce);
   const r=await fetch('/api/sign-in',{method:'POST',credentials:'same-origin',body});const out=await r.json();
   if(!r.ok)throw new Error(out.message||'Sign-in failed.');const back=new URLSearchParams(location.search).get('returnTo')||'';location.assign(/^\/(?:project|service|job|employer|freelancer)\/[a-z0-9-]+\/?(?:#project-proposal-form-wrapper)?$/.test(back)?back:'/workspace');
  }catch(e){setError((e as Error).message);setBusy(false);}
 }
 const home=session?.home||'http://poblancer.local/';
 return <div className="login-layout"><aside className="login-story"><a href="/"><img className="brand-image" src="/brand.png" alt="POBlancer"/></a><div><span className="eyebrow">POB Digital Experts</span><h1>Sign in to manage your projects, jobs, and account as a freelancer or employer.</h1></div><span className="pilot-label">Local workspace pilot</span></aside><main id="main" className="login-main"><a className="back-link" href="/">← Back to website</a><section><span className="eyebrow">POBlancer</span><h2>Log In</h2>{error&&<p className="alert" role="alert">{error}</p>}
 {session?.authenticated?<><p>You are already signed in.</p><Link className="button primary" href="/workspace" prefetch={false}>Open dashboard</Link></>:session?.captcha?<><p>Please complete sign-in using the existing verification form.</p><a className="button" href={session.original_login}>Continue to login</a></>:<form onSubmit={submit}><label>Email<input name="log" autoComplete="username" required/></label><label>Password<input name="pwd" type="password" autoComplete="current-password" required/></label><div className="form-row"><label className="check"><input type="checkbox" name="rememberme"/>Keep me signed in</label><a href={home+'wp-login.php?action=lostpassword'}>Forgotten password?</a></div><button className="primary" disabled={busy||!session?.login_nonce}>{busy?'Signing in…':'Login'}</button></form>}
 <p><Link href="/register" prefetch={false}>Sign Up</Link></p><a className="subtle" href={session?.original_login||home+'login/'}>Use the original login page</a></section></main></div>;
}
