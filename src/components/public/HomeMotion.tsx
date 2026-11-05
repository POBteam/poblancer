'use client';
import {useEffect} from 'react';

// One observer, no scroll listener and no backend requests. Content stays visible
// if JavaScript is unavailable; each original entrance runs only when it is seen.
export default function HomeMotion(){
 useEffect(()=>{
  const root=document.querySelector('.public-home');if(!root)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  if(reduced.matches||!('IntersectionObserver' in window))return;
  const animations=new Set<Animation>();const frames=new Set<number>();
  const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;const element=entry.target as HTMLElement;observer.unobserve(element);element.dataset.homeRevealed='true';
   if(element.dataset.homeCounter){const target=Number(element.dataset.homeCounter),suffix=element.dataset.homeSuffix||'',start=performance.now();const tick=(now:number)=>{if(reduced.matches){element.textContent=target+suffix;return;}const progress=Math.min(1,(now-start)/2000);element.textContent=Math.round(target*progress)+suffix;if(progress<1){const id=requestAnimationFrame(t=>{frames.delete(id);tick(t);});frames.add(id);}};tick(start);continue;}
   const scale=element.dataset.homeAnimation==='scale';
   const animation=element.animate([{opacity:0,transform:scale?'scale(.8) translateY(50px)':'translate3d(0, 3rem, 0)'},{opacity:1,transform:'none'}],{duration:1000,delay:Number(element.dataset.homeDelay)||0,easing:'cubic-bezier(.215,.61,.355,1)',fill:'both'});
   animations.add(animation);animation.onfinish=()=>{animations.delete(animation);animation.cancel();};
  }},{threshold:.08});
  root.querySelectorAll('[data-home-animation],[data-home-counter]').forEach(element=>observer.observe(element));
  const change=()=>{if(reduced.matches){observer.disconnect();animations.forEach(a=>a.finish());}};reduced.addEventListener('change',change);
  return()=>{observer.disconnect();reduced.removeEventListener('change',change);animations.forEach(a=>a.cancel());frames.forEach(cancelAnimationFrame);};
 },[]);
 return null;
}
