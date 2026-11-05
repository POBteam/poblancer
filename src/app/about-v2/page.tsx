import {publicReactLink} from '../../lib/public-routes.mjs';
import type {Metadata} from 'next';
import {PublicHeader,PublicFooter} from '../../components/public/PublicChrome';
import HomeMenuBehavior from '../../components/public/HomeMenuBehavior';
import HomeMotion from '../../components/public/HomeMotion';
import AboutTestimonials from '../../components/public/AboutTestimonials';
import homeIcons from '../../lib/home-icons.json';
import {extractAboutPage} from '../../lib/public-about.mjs';
import {extractHomepage} from '../../lib/public-home.mjs';
import assetMap from '../../data/about-assets.json';
import homeSnapshot from '../../data/home-source.json';
import snapshot from '../../data/about-source.json';
import '../home.css';
import '../home-fidelity.css';
import './about.css';

export const revalidate=300;
export const metadata:Metadata={title:'About | POBlancer - POB Digital Experts',description:'Learn about POBlancer, our freelancers and the POB Digital Experts community.',robots:{index:false,follow:false}};
const origin=new URL(process.env.WORDPRESS_ORIGIN||(process.env.NODE_ENV==='production'?'https://pob.com.ng':'http://poblancer.local')).origin;
const native=(path:string)=>new URL(path,origin).href;
const asset=(url:string)=>{const path=new URL(url,origin).pathname;return (assetMap as Record<string,string>)[path]||url;};
async function loadAbout(){
 if(process.env.POB_LOCAL_BUILD_SNAPSHOT==='1'||origin.includes('.local'))return extractAboutPage(snapshot.content.rendered,origin);
 try{const r=await fetch(native('/wp-json/wp/v2/pages/9946?_fields=id,content,modified'),{next:{revalidate:300,tags:['public-about']},signal:AbortSignal.timeout(8000)});if(!r.ok)throw new Error('About source unavailable');const p=await r.json();return extractAboutPage(p.content?.rendered,origin);}
 catch{console.warn('About preview is using the verified 24 October public snapshot because WordPress is unavailable.');return extractAboutPage(snapshot.content.rendered,origin);}
}
export default async function About(){
 const data=await loadAbout();
 const categories=extractHomepage(homeSnapshot.content.rendered,origin).categories;
 const icon=(key:string)=>(homeIcons as Record<string,string>)[key]||homeIcons['flaticon-security'];
 return <div className="public-home public-about"><HomeMotion/><HomeMenuBehavior/><PublicHeader categories={categories} active="about"/>
  <main id="main">
   <div className="about-banner about-wrap"><img src={asset(data.banner.src)} width={data.banner.width} height={data.banner.height} alt="POBlancer, property of Princesage Online Branding, Team POB Academy" fetchPriority="high"/></div>
   <section className="about-wrap about-intro about-two-column"><img className="about-photo" src={asset(data.intro.image.src)} width={data.intro.image.width} height={data.intro.image.height} alt={data.intro.image.alt} loading="lazy"/><div data-home-animation="slide-up"><h1>{data.intro.title}</h1>{data.intro.paragraphs.map(p=><p key={p}>{p}</p>)}<ul className="about-benefits">{data.intro.benefits.map(p=><li key={p}>{p}</li>)}</ul><a className="about-button" href={publicReactLink(data.intro.button.href,origin)}>{data.intro.button.label}<span aria-hidden="true">↗</span></a></div></section>
   <div className="about-wrap home-counters about-counters">{data.counters.map(c=><div key={c.label}><strong data-home-counter={c.value} data-home-suffix={c.suffix}>{c.value}{c.suffix}</strong><span>{c.label}</span></div>)}</div>
   <div className="about-rule about-wrap"/>
   <section className="about-wrap about-talent about-two-column"><div data-home-animation="slide-up"><h2>{data.talent.title}</h2>{data.talent.features.map(f=><article className="about-feature" key={f.title}><span className="about-icon" aria-hidden="true">{icon(f.icon)}</span><div><h3>{f.title}</h3><p>{f.description}</p></div></article>)}</div><img className="about-photo" data-home-animation="scale" data-home-delay="300" src={asset(data.talent.image.src)} width={data.talent.image.width} height={data.talent.image.height} alt={data.talent.image.alt} loading="lazy"/></section>
   <section className="about-growth"><div className="about-wrap about-two-column"><div data-home-animation="slide-up"><h2>{data.growth.title}</h2>{data.growth.paragraphs.map(p=><p key={p}>{p}</p>)}<a className="about-button" href={publicReactLink(data.growth.button.href,origin)}>{data.growth.button.label}<span aria-hidden="true">↗</span></a></div><div className="about-stat-grid">{data.growth.stats.map((s,i)=><article key={s.title} className={i===2?'about-award':''}><h3>{s.title}</h3><p>{s.description}</p></article>)}</div></div></section>
   <section className="about-wrap about-testimonials"><h2>{data.testimonialsTitle}</h2>{data.testimonialsIntro.map(p=><p key={p}>{p}</p>)}<div className="about-quote-mark" aria-hidden="true">&quot;</div><AboutTestimonials items={data.testimonials.map(t=>({...t,image:asset(t.image)}))}/></section>
   <section className="about-how" style={{backgroundImage:`url("${asset(native('/wp-content/uploads/2025/11/bg1.jpg'))}")`}}><div className="about-wrap"><h2>{data.stepsTitle}</h2>{data.stepsIntro.map(p=><p key={p}>{p}</p>)}<div className="about-steps">{data.steps.map(s=><article key={s.title} data-home-animation="slide-up"><span className="about-icon" aria-hidden="true">{icon(s.icon)}</span><h3>{s.title}</h3><p>{s.description}</p></article>)}</div></div></section>
   <section className="about-wrap about-faq"><h2>{data.faqTitle}</h2>{data.faqIntro.map(p=><p key={p}>{p}</p>)}<div className="home-faq">{data.faq.map((f,i)=><details name="about-faq" key={f.question} open={i===0}><summary>{f.question}</summary><div className="home-faq-answer"><p>{f.answer}</p></div></details>)}</div></section>
  </main><PublicFooter/>
 </div>;
}
