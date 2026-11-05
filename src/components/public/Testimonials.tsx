'use client';
import {useState} from 'react';
type Testimonial={name:string;quote:string;job:string;image:string};
export default function Testimonials({items}:{items:Testimonial[]}){
 const [selected,setSelected]=useState(0);if(!items.length)return null;
 const item=items[selected],wrap=(value:number)=>(value+items.length)%items.length;
 const visible=items.length>5?[-2,-1,0,1,2].map(offset=>wrap(selected+offset)):items.map((_,index)=>index);
 return <div className="home-testimonial-stage" data-home-animation="scale" data-home-delay="700">
  <figure className="home-testimonial" aria-live="polite" aria-atomic="true"><blockquote>{item.quote}</blockquote><figcaption><strong>{item.name}</strong><span>{item.job}</span></figcaption></figure>
  <div className="home-testimonial-thumbnails" aria-label="Choose a client testimonial">{visible.map(index=><button key={index} type="button" aria-label={'Show testimonial by '+items[index].name} aria-pressed={index===selected} onClick={()=>setSelected(index)}>{items[index].image!=='#'&&<img src={items[index].image} width="72" height="72" loading="lazy" alt=""/>}</button>)}</div>
 </div>;
}
