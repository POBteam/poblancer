'use client';
import {detailLink} from '../../lib/public-detail.mjs';
import {useEffect,useRef,useState} from 'react';
import {youtubeEmbedUrl} from '../../lib/public-video.mjs';
import homeIcons from '../../lib/home-icons.json';
import type {extractFreelancers} from '../../lib/public-freelancers.mjs';
type Data=ReturnType<typeof extractFreelancers>;
export default function FreelancersBrowser({initial}:{initial:Data}){
 const [data,setData]=useState(initial),[busy,setBusy]=useState(false),[error,setError]=useState(''),[query,setQuery]=useState('');
 const filter=useRef<HTMLDialogElement>(null),video=useRef<HTMLDialogElement>(null),pending=useRef<AbortController|null>(null);
 const [play,setPlay]=useState(false);
 async function load(params:URLSearchParams){pending.current?.abort();const abort=new AbortController();pending.current=abort;setBusy(true);setError('');
  try{const r=await fetch('/api/public/freelancers?'+params,{signal:abort.signal});const next=await r.json();if(!r.ok)throw new Error(next.message||'Unable to load freelancers.');if(abort.signal.aborted)return;setData(next);setQuery(params.toString());history.replaceState(null,'','/freelancers'+(params.size?'?'+params:''));}
  catch(e){if(!abort.signal.aborted)setError(e instanceof Error?e.message:'Unable to load freelancers.');}finally{if(!abort.signal.aborted)setBusy(false);}
 }
 useEffect(()=>{const params=new URLSearchParams(location.search);if(params.size)void load(params);const pop=()=>void load(new URLSearchParams(location.search));addEventListener('popstate',pop);return()=>{pending.current?.abort();removeEventListener('popstate',pop);};},[]);
 function change(key:string,value:string){const params=new URLSearchParams(query);params.set(key,value);if(key!=='paged')params.delete('paged');void load(params);}
 const params=new URLSearchParams(query);
 const videoUrl=youtubeEmbedUrl(data.hero.video);
 return <>
  <nav className="services-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/ Freelancers</span></nav>
  <section className="services-hero"><div><h1>{data.hero.title}</h1><p>{data.hero.description}</p><a className="services-video" href={data.hero.video} onClick={e=>{if(videoUrl){e.preventDefault();setPlay(true);video.current?.showModal();}}}><span aria-hidden="true">▶</span>{data.hero.videoLabel}</a></div></section>
  <section className="services-results" aria-label="Freelancer listings" aria-busy={busy}>
   <div className="services-toolbar"><p role="status">{busy?'Loading freelancers…':data.count}</p><div><button className="services-filter-button" onClick={()=>filter.current?.showModal()}>☷ <span>Filter</span></button><label><span className="home-visually-hidden">Sort freelancers</span><select value={params.get('filter-orderby')||'menu_order'} onChange={e=>change('filter-orderby',e.target.value)}>{data.sort.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label></div></div>
   {error&&<p className="services-error" role="alert">{error}</p>}
   <div className="freelancers-grid">{data.cards.map(c=><article className="freelancer-card" key={c.id}>{c.featured&&<span className="freelancer-featured">Featured</span>}<a className="freelancer-save" href={c.href} aria-label={'View '+c.title+' to save it'}>♡</a><a href={c.href}><img className="freelancer-avatar" src={c.image} width="90" height="90" alt="" loading="lazy"/></a><h2><a href={c.href}>{c.title}</a></h2><p className="freelancer-job">{c.job}</p><p className="freelancer-rating"><span aria-hidden="true">★ </span>{c.rating}</p><div className="freelancer-card-meta"><span>{c.location}</span><span>{c.projects}</span></div><a className="freelancer-profile-link" href={c.href}>View Profile ↗</a></article>)}</div>
   {!data.cards.length&&<p>No freelancers match these filters.</p>}
   {data.pages>1&&<nav className="services-pagination" aria-label="Results pages">{Array.from({length:data.pages},(_,i)=>i+1).map(page=><button key={page} aria-current={page===data.page?'page':undefined} disabled={busy} onClick={()=>change('paged',String(page))}>{page}</button>)}{data.page<data.pages&&<button disabled={busy} aria-label="Next results page" onClick={()=>change('paged',String(data.page+1))}>›</button>}</nav>}
  </section>
  <dialog className="services-filters" ref={filter}><header><h2>All Filters</h2><button type="button" aria-label="Close filters" onClick={()=>filter.current?.close()}>×</button></header><form key={query} onSubmit={e=>{e.preventDefault();const next=new URLSearchParams();for(const [name,value] of new FormData(e.currentTarget)){if(typeof value==='string'&&value)next.append(name,value);}if(params.has('filter-orderby'))next.set('filter-orderby',params.get('filter-orderby')!);filter.current?.close();void load(next);}}>
   {data.groups.map(g=><fieldset key={g.label}><legend>{g.label}</legend><div className={g.label==='Categories'?'services-category-options':undefined}>{g.fields.map((f,i)=>{const chosen=params.getAll(f.name);const value=chosen.length?chosen[Math.min(i,chosen.length-1)]:f.value;
    if(f.type==='checkbox'||f.type==='radio')return <label className="services-check" key={f.name+f.value}><input type={f.type} name={f.name} value={f.value} defaultChecked={chosen.length?chosen.includes(f.value):f.checked}/>{f.label}</label>;
    if(f.type==='select')return <label key={f.name+i}><span className="home-visually-hidden">{f.label||g.label}</span><select name={f.name} defaultValue={chosen[i]||f.options.find(o=>o.selected)?.value||''}>{f.options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label>;
    if(f.name==='filter-price-from'||f.name==='filter-price-to')return <label key={f.name}>{f.name.endsWith('from')?'From (₦)':'To (₦)'}<input type="number" name={f.name} min="0" defaultValue={value} step="any"/></label>;
    return <input key={f.name} type={f.type==='hidden'?'hidden':'text'} name={f.name} defaultValue={value} aria-label={g.label}/>;
   })}</div></fieldset>)}
   <div className="services-filter-actions"><button type="button" onClick={()=>{filter.current?.close();void load(new URLSearchParams());}}>Reset</button><button type="submit">Search</button></div>
  </form></dialog>
  <dialog className="services-video-dialog" ref={video} onClose={()=>setPlay(false)}><button type="button" aria-label="Close video" onClick={()=>video.current?.close()}>×</button>{play&&<iframe src={videoUrl} referrerPolicy="strict-origin-when-cross-origin" title={data.hero.videoLabel} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen/>}</dialog>
 </>;
}
