'use client';
import {useEffect} from 'react';
export default function HomeMenuBehavior(){
 useEffect(()=>{const cleanups:Array<()=>void>=[];document.querySelectorAll<HTMLDetailsElement>('.home-nav details').forEach(menu=>{
  const enter=(event:PointerEvent)=>{if(event.pointerType==='mouse'||event.pointerType==='pen')menu.open=true;};
  const leave=()=>{if(!menu.contains(document.activeElement))menu.open=false;};
  const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){menu.open=false;menu.querySelector<HTMLElement>('summary')?.focus();}};
  menu.addEventListener('pointerenter',enter);menu.addEventListener('pointerleave',leave);menu.addEventListener('keydown',key);
  cleanups.push(()=>{menu.removeEventListener('pointerenter',enter);menu.removeEventListener('pointerleave',leave);menu.removeEventListener('keydown',key);});
 });return()=>cleanups.forEach(cleanup=>cleanup());},[]);
 return null;
}
