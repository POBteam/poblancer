'use client';
import {useEffect,useState} from 'react';
export default function RailControls({target,label,autoAdvanceMs=0}:{target:string;label:string;autoAdvanceMs?:number}){
 const [paused,setPaused]=useState(false);
 useEffect(()=>{
  const rail=document.getElementById(target);if(!rail||!autoAdvanceMs||paused)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');let visible=false;let interacting=false;
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;},{threshold:.25});observer.observe(rail);
  const enter=()=>{interacting=true;};const leave=()=>{interacting=false;};
  const region=rail.parentElement!;
  region.addEventListener('pointerenter',enter);region.addEventListener('pointerleave',leave);region.addEventListener('focusin',enter);region.addEventListener('focusout',leave);
  const timer=setInterval(()=>{if(!visible||interacting||document.hidden||reduced.matches)return;const first=rail.firstElementChild as HTMLElement|null;const second=first?.nextElementSibling as HTMLElement|null;const step=first&&second?second.offsetLeft-first.offsetLeft:rail.clientWidth;const end=rail.scrollLeft+rail.clientWidth>=rail.scrollWidth-2;rail.scrollTo({left:end?0:rail.scrollLeft+step,behavior:'smooth'});},autoAdvanceMs);
  return()=>{clearInterval(timer);observer.disconnect();region.removeEventListener('pointerenter',enter);region.removeEventListener('pointerleave',leave);region.removeEventListener('focusin',enter);region.removeEventListener('focusout',leave);};
 },[target,autoAdvanceMs,paused]);
 const move=(direction:number)=>{const rail=document.getElementById(target);if(!rail)return;const first=rail.firstElementChild as HTMLElement|null;const second=first?.nextElementSibling as HTMLElement|null;const step=first&&second?second.offsetLeft-first.offsetLeft:rail.clientWidth;rail.scrollBy({left:direction*step,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});};
 return <div className="home-rail-controls" aria-label={label}><button type="button" aria-label="Previous" aria-controls={target} onClick={()=>move(-1)}>←</button>{autoAdvanceMs>0&&<button className="home-rail-pause" type="button" aria-label={paused?'Resume automatic sliding':'Pause automatic sliding'} aria-pressed={paused} onClick={()=>setPaused(!paused)}>{paused?'▶':'Ⅱ'}</button>}<button type="button" aria-label="Next" aria-controls={target} onClick={()=>move(1)}>→</button></div>;
}
