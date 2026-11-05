'use client';
import {useEffect,useRef,useState} from 'react';
export default function HeroVideo(){
 const [playing,setPlaying]=useState(false);
 const frame=useRef<HTMLIFrameElement>(null);
 useEffect(()=>{const motion=matchMedia('(prefers-reduced-motion: reduce)');const connection=(navigator as Navigator & {connection?:{saveData?:boolean}}).connection;if(motion.matches||connection?.saveData)return;const timer=setTimeout(()=>setPlaying(true),1200);const change=()=>{if(motion.matches)setPlaying(false);};motion.addEventListener('change',change);return()=>{clearTimeout(timer);motion.removeEventListener('change',change);};},[]);
 useEffect(()=>{const iframe=frame.current,hero=iframe?.parentElement;if(!iframe||!hero)return;const size=()=>{const width=Math.max(hero.clientWidth,hero.clientHeight*16/9);iframe.style.width=width+'px';iframe.style.height=width*9/16+'px';};size();const observer=new ResizeObserver(size);observer.observe(hero);return()=>observer.disconnect();},[playing]);
 return <>{playing&&<iframe ref={frame} className="home-video" title="POB Academy team background video" src="https://www.youtube.com/embed/pIbf931Dw28?autoplay=1&mute=1&controls=0&rel=0&playsinline=1&loop=1&playlist=pIbf931Dw28&end=47" allow="autoplay; encrypted-media" tabIndex={-1} aria-hidden="true" referrerPolicy="strict-origin-when-cross-origin"/>}<button className="home-video-toggle" onClick={()=>setPlaying(v=>!v)} aria-pressed={playing}>{playing?'Pause background video':'Play background video'}</button></>;
}
