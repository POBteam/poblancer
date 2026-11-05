import {notFound} from 'next/navigation';
import {PublicHeader,PublicFooter} from '../../components/public/PublicChrome';
import HomeMenuBehavior from '../../components/public/HomeMenuBehavior';
import HomeMotion from '../../components/public/HomeMotion';
import DetailContent,{type ContentNode} from '../../components/public/DetailContent';
import SellerTabs from '../../components/public/SellerTabs';
import ContactForm from '../../components/public/ContactForm';
import homeIcons from '../../lib/home-icons.json';
import {readInfoPage} from '../../lib/public-info-server';
import {infoTitles} from '../../lib/public-info.mjs';
import '../home.css';
import '../home-fidelity.css';
import '../about-v2/about.css';
import './info.css';
export const revalidate=300;
export function generateStaticParams(){return Object.keys(infoTitles).map(info=>({info}));}
export async function generateMetadata({params}:{params:Promise<{info:string}>}){const {info}=await params;return {title:((infoTitles as Record<string,string>)[info]||'Page')+' | POBlancer - POB Digital Experts',robots:{index:false,follow:false}};}
function FAQ({title,intro,items}:{title:string;intro:string;items:{question:string;answer:ContentNode}[]}){return <section className="info-wrap info-faq"><h2>{title}</h2><p>{intro}</p><div className="home-faq">{items.map((item,i)=><details key={item.question} name="info-faq" open={i===0}><summary>{item.question}</summary><div className="home-faq-answer"><DetailContent node={item.answer}/></div></details>)}</div></section>;}
export default async function InfoPage({params}:{params:Promise<{info:string}>}){
 const {info}=await params,data=await readInfoPage(info);if(!data)notFound();
 const icon=(name:string)=>(homeIcons as Record<string,string>)[name]||homeIcons['flaticon-security'];
 let content;
 if(data.kind==='seller')content=<>
  <section className="info-hero seller-hero"><div><h1>{data.hero.title}</h1><p>{data.hero.description}</p><a className="info-button" href="/register?role=freelancer">{data.hero.button} <span aria-hidden="true">↗</span></a></div></section>
  <section className="seller-tabs-band"><div className="info-wrap"><SellerTabs tabs={data.tabs}/></div></section><section className="info-wrap seller-intro"><div className="seller-intro-title"><h2>{data.intro.title}</h2><p>{data.intro.description}</p></div><div className="seller-features">{data.intro.features.map(f=><article key={f.title}><span className="info-icon" aria-hidden="true">{icon(f.icon)}</span><h3>{f.title}</h3><p>{f.description}</p></article>)}</div></section>
  <section className="seller-paths"><div><h2>{data.groups.title}</h2><p><strong><em>{data.groups.intro}</em></strong></p>{data.groups.features.map(f=><article key={f.title}><span className="info-icon" aria-hidden="true">{icon(f.icon)}</span><div><h3>{f.title}</h3><p>{f.description}</p></div></article>)}</div><img src={data.groups.image} alt="POBlancer freelancer" loading="lazy"/></section>
  <div className="info-wrap home-counters seller-counters">{data.counters.map(c=><div key={c.label}><strong data-home-counter={c.value} data-home-suffix={c.suffix}>{c.value}{c.suffix}</strong><span>{c.label}</span></div>)}</div>
  <section className="info-wrap seller-team" hidden={data.team.hidden}><h2>{data.team.title}</h2><p>{data.team.description}</p><div className="seller-team-grid">{data.team.members.map((member,i)=><article key={i} data-home-animation="slide-up"><DetailContent node={member.body}/></article>)}</div></section>
  <section className="info-wrap seller-trust"><h2>{data.trust.title}</h2><DetailContent node={data.trust.body}/><a className="info-button" href="/freelancers">{data.trust.button}</a></section>
  {data.banner!=='#'&&<div className="info-wrap seller-banner"><img src={data.banner} alt="POBlancer, property of Princesage Online Branding, Team POB Academy" loading="lazy"/></div>}
  <FAQ title={data.faqTitle} intro={data.faqIntro} items={data.faq}/>
 </>;
 else if(data.kind==='contact')content=<>
  <section className="info-hero contact-hero"><div><h1>{data.hero.title}</h1><p>{data.hero.description}</p></div></section>
  <section className="info-wrap contact-columns"><div><h2>{data.introTitle}</h2><p>{data.intro}</p><div className="contact-address"><DetailContent node={data.address}/></div></div><div className="contact-form-card"><h2>{data.formTitle}</h2><p>{data.formIntro}</p><ContactForm fields={data.form.fields}/></div></section>
  {data.map.startsWith('https://maps.google.com/')&&<div className="info-wrap contact-map"><iframe src={data.map} title="POBlancer office location" loading="lazy" referrerPolicy="strict-origin-when-cross-origin"/></div>}
  <FAQ title={data.faqTitle} intro={data.faqIntro} items={data.faq}/>
 </>;
 else if(data.kind==='legal')content=<article className="info-wrap legal-content"><h1>{data.title}</h1>{data.subtitle&&<p className="legal-subtitle">{data.subtitle}</p>}<DetailContent node={data.body}/></article>;
 else content=<FAQ title={data.faqTitle} intro={data.faqIntro} items={data.faq}/>;
 return <div className={'public-home public-about public-info info-page-'+info}><HomeMenuBehavior/><HomeMotion/><PublicHeader categories={[]} active={info==='become-seller'?'seller':info==='contact'?'contact':'info'}/><main id="main">{content}</main><PublicFooter/></div>;
}
