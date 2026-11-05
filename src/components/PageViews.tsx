'use client';
import {useEffect,useState} from 'react';
import {api,type Session} from '@/lib/client';
type Listing={id:number;title:string};
type Point={date:string;views:number};
export default function PageViews({session,role}:{session:Session;role:string}){
 const [rows,setRows]=useState<Listing[]>([]),[id,setId]=useState(0),[days,setDays]=useState('15'),[points,setPoints]=useState<Point[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{let active=true;const controller=new AbortController();setLoading(true);setError('');setRows([]);setId(0);setPoints([]);
  api('listings?view='+encodeURIComponent(role),session.nonce!,controller.signal).then(out=>{if(active){setRows(out.rows);setId(out.rows[0]?.id||0);setLoading(false);}}).catch(e=>{if(active&&e.name!=='AbortError'){setError(e.message);setLoading(false);}});
  return()=>{active=false;controller.abort();};
 },[session,role]);
 useEffect(()=>{if(!id)return;let active=true;const controller=new AbortController();setLoading(true);setError('');setPoints([]);
  api('page-views?'+new URLSearchParams({id:String(id),days}),session.nonce!,controller.signal).then(out=>{if(active){setPoints(out.points);setLoading(false);}}).catch(e=>{if(active&&e.name!=='AbortError'){setError(e.message);setLoading(false);}});
  return()=>{active=false;controller.abort();};
 },[id,days,session]);
 const max=Math.max(1,...points.map(p=>p.views));
 const path=points.map((p,i)=>`${i?'L':'M'} ${20+i*760/Math.max(1,points.length-1)} ${170-p.views/max*140}`).join(' ');
 return <><div className="panel-heading"><h2>Page Views</h2></div>{rows.length>0&&<form className="listing-toolbar" onSubmit={e=>e.preventDefault()}><label>Projects<select value={id} onChange={e=>setId(Number(e.target.value))}>{rows.map(row=><option key={row.id} value={row.id}>{row.title}</option>)}</select></label><label>Number Days<select value={days} onChange={e=>setDays(e.target.value)}>{[7,15,30].map(n=><option key={n}>{n}</option>)}</select></label></form>}<div className="views-plot" aria-live="polite" aria-busy={loading}>{error?<p role="alert">{error}</p>:loading?<p>Loading page views…</p>:!rows.length?<p>Page views will appear when you have a listing.</p>:points.length>0?<><svg viewBox="0 0 800 200" role="img" aria-label="Page views for selected listing"><title>{points.reduce((sum,p)=>sum+p.views,0)} views in selected period</title><path d="M20 170H780" stroke="#ddd"/><path d={path} fill="none" stroke="#130d5e" strokeWidth="3"/><text x="20" y="195">{points[0].date}</text><text x="660" y="195">{points.at(-1)?.date}</text></svg><details><summary>View daily figures</summary><div className="table-scroll"><table><thead><tr><th>Date</th><th>Views</th></tr></thead><tbody>{points.map(p=><tr key={p.date}><td>{p.date}</td><td>{p.views}</td></tr>)}</tbody></table></div></details></>:<p>No page views available.</p>}</div></>;
}
