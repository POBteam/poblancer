'use client';
import {useState} from 'react';
type Item={name:string;quote:string;job:string;image:string};
export default function AboutTestimonials({items}:{items:Item[]}){
 const [selected,setSelected]=useState(0);if(!items.length)return null;
 const visible=items.length>3?[-1,0,1].map(offset=>(selected+offset+items.length)%items.length):items.map((_,i)=>i);
 return <div><blockquote aria-live="polite" aria-atomic="true">{items[selected].quote}</blockquote><div className="about-testimonial-people" aria-label="Choose a client testimonial">{visible.map(i=>{const item=items[i];return <button type="button" key={item.name} aria-label={'Show testimonial by '+item.name} aria-pressed={i===selected} onClick={()=>setSelected(i)}><img src={item.image} width="60" height="60" alt="" loading="lazy"/><span><strong>{item.name}</strong><small>{item.job}</small></span></button>;})}</div></div>;
}
