import {publicReactLink} from '../lib/public-routes.mjs';
import {detailLink} from '../lib/public-detail.mjs';
import homeSnapshot from '../data/home-source.json';
import {PublicHeader,PublicFooter} from '../components/public/PublicChrome';
import type {Metadata} from 'next';
import homeIcons from '../lib/home-icons.json';
import RailControls from '../components/public/RailControls';
import HomeMenuBehavior from '../components/public/HomeMenuBehavior';
import Testimonials from '../components/public/Testimonials';
import HomeMotion from '../components/public/HomeMotion';
import HeroVideo from '../components/public/HeroVideo';
import {extractHomepage} from '../lib/public-home.mjs';
import './home.css';
import './home-fidelity.css';

// Public, shared cache only. No session cookies or privileged credentials.
export const revalidate=300;
export const metadata:Metadata={title:'POBLancer - POB Digital Experts',description:'Connect with skilled POBLancers to deliver excellence.',robots:{index:false,follow:false}};
const origin=new URL(process.env.WORDPRESS_ORIGIN||(process.env.NODE_ENV==='production'?'https://pob.com.ng':'http://poblancer.local')).origin;
const native=(path:string)=>['/services/','/freelancers/'].includes(path)?path:new URL(path,origin).href;

async function loadHome(){
 if(process.env.POB_LOCAL_BUILD_SNAPSHOT==='1'||origin.includes('.local')){
  return homeSnapshot;
 }
 try{
  const response=await fetch(native('/wp-json/wp/v2/pages/9935?_fields=id,content,modified'),{
   next:{revalidate:300,tags:['public-home']},
   headers:{Accept:'application/json'},
   signal:AbortSignal.timeout(10000)
  });
  if(!response.ok)throw new Error('WordPress homepage source returned non-OK status');
  return await response.json();
 }catch(error){
  console.warn('Homepage is using verified public snapshot because WordPress API fetch could not complete:', (error as Error).message);
  return homeSnapshot;
 }
}

export default async function Home(){
 const page=await loadHome();
 const home=extractHomepage(page.content?.rendered,origin);
 const icon=(name:string)=>(homeIcons as Record<string,string>)[name]||homeIcons['flaticon-developer'];
 return <div className="public-home"><HomeMotion/><HomeMenuBehavior/>
  <section className="home-hero" aria-label="POBlancer introduction"><HeroVideo/>
   <PublicHeader categories={home.categories}/>
   <div className="home-wrap home-intro"><h1 data-home-animation="slide-up">{home.hero.title}</h1><p data-home-animation="slide-up" data-home-delay="200">{home.hero.description}</p><form id="home-search" data-home-animation="slide-up" data-home-delay="400" className="home-search" action={publicReactLink(home.hero.searchAction,origin)} method="get" role="search"><label><span className="home-visually-hidden">What are you looking for?</span><svg className="home-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/></svg><input type="search" name="filter-title" placeholder="What are you looking for?"/></label><label><span className="home-visually-hidden">Service category</span><select name="filter-category" defaultValue="">{home.hero.options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label><button type="submit">Search</button></form><p className="home-popular" data-home-animation="slide-up" data-home-delay="600">{home.hero.popular||'Popular Searches : Website Development, UGC Videos, Video Editing, AI Automation & Chatbots'}</p></div>
  </section>
  <main id="main">
   <section className="home-section"><div className="home-wrap"><div className="home-section-heading"><div><h2>{home.categoryHeading}</h2><p>{home.categoryDescription}</p></div><a href={native('/services/')}>All Categories ↗</a></div><div className="home-category-grid" data-home-animation="slide-up">{home.categories.map(c=><a className="home-category" key={c.title} href={c.href==='#'?'/services/':publicReactLink(c.href,origin)}><span className="home-category-icon" aria-hidden="true">{icon(c.icon)}</span><small>{c.count}</small><h3>{c.title}</h3><p>{c.description}</p></a>)}</div></div></section>
   <section className="home-section home-services"><div className="home-wrap"><div className="home-section-heading"><div><h2>{home.trendingHeading}</h2><p>{home.trendingDescription}</p></div><a href={native('/services/')}>All Categories ↗</a></div></div><div className="home-services-band"><div className="home-wrap"><div id="trending-services" className="home-card-rail" tabIndex={0} aria-label="Trending services, scroll for more">{home.services.map(s=><article className="home-service" key={s.href}><div className="home-service-media"><a href={detailLink(s.href,origin)}><img src={s.image} width="495" height="370" loading="lazy" decoding="async" alt={s.title}/></a>{s.featured&&<span className="home-featured">Featured</span>}</div><div className="home-service-body"><small><a href={publicReactLink(s.categoryHref,origin)}>{s.category}</a></small><h3><a href={detailLink(s.href,origin)}>{s.title}</a></h3>{s.rating&&<p>{s.rating}</p>}<div className="home-service-bottom"><a className="home-service-author" href={detailLink(s.authorHref,origin)}>{s.avatar!=='#'&&<img src={s.avatar} alt="" width="30" height="30" loading="lazy"/>}{s.author}</a><span>{s.price}</span></div></div></article>)}</div><RailControls target="trending-services" autoAdvanceMs={7000} label="Browse trending services"/></div></div></section>
   <section className="home-callout"><h2 data-home-animation="slide-up">{home.sellerHeading}</h2><p data-home-animation="slide-up" data-home-delay="100">{home.sellerDescription}</p></section>
   <section className="home-section"><div className="home-wrap home-steps" data-home-animation="slide-up" data-home-delay="300">{home.steps.map((s,i)=><article key={s.title}><span className="home-step-icon" aria-hidden="true">{icon(s.icon)}</span><h3>{s.title}</h3><p>{s.description}</p></article>)}</div></section>
   <section className="home-section home-tint"><div className="home-wrap home-groups"><div data-home-animation="slide-up"><h2>{home.groupsHeading}</h2><div className="home-groups-intro">{home.groupsIntro.map((line:string)=><p key={line}><strong><em>{line}</em></strong></p>)}</div>{home.groups.map(g=><article className="home-group" key={g.title}><span aria-hidden="true">{g.icon==='fa-male'?<svg viewBox="0 0 16 32" width="16" height="30" fill="currentColor"><circle cx="8" cy="4" r="4"/><path d="M5 9h6a3 3 0 0 1 3 3v9h-3v10H5V21H2v-9a3 3 0 0 1 3-3Z"/></svg>:icon(g.icon)}</span><div><h3>{g.title}</h3><p>{g.description}</p></div></article>)}</div>{home.groupsImage!=='#'&&<img data-home-animation="scale" data-home-delay="300" src={home.groupsImage} width="600" height="600" loading="lazy" decoding="async" alt="POBlancer freelancer community"/>}</div></section>
   <section className="home-trust" data-home-animation="slide-up"><h2>{home.trust.title}</h2><p>{home.trust.description}</p><a className="home-cta-link" href={native('/freelancers/')}>Find Freelancer</a></section>
   <div className="home-wrap home-counters">{home.counters.map(c=><div key={c.label}><strong data-home-counter={c.value} data-home-suffix={c.suffix}>{c.value}{c.suffix}</strong><span>{c.label}</span></div>)}</div>
   <section className="home-section home-tint"><div className="home-wrap"><div className="home-section-heading home-centered"><div style={{width:'100%'}}><h2 data-home-animation="slide-up">{home.faqHeading}</h2><p>{home.faqDescription}</p></div></div><div className="home-faq">{home.faq.map((f,i)=><details name="home-faq" key={f.question} open={i===0}><summary>{f.question}</summary><div className="home-faq-answer"><p>{f.answer}</p></div></details>)}</div></div></section>
   <section className="home-section"><div className="home-wrap"><div className="home-section-heading home-centered"><div style={{width:'100%'}}><h2 data-home-animation="slide-up" data-home-delay="600">{home.testimonialsHeading}</h2><p data-home-animation="slide-up" data-home-delay="600">{home.testimonialsDescription}</p></div></div><Testimonials items={home.testimonials}/></div></section>
   {home.teamBanner!=='#'&&<section className="home-team-banner" aria-label="Team POB Academy"><img src={home.teamBanner} width="1536" height="512" loading="lazy" decoding="async" alt="POBlancer, property of Princesage Online Branding, Team POB Academy"/></section>}
   <section className="home-section home-tint"><div className="home-wrap"><div className="home-section-heading"><div><h2 data-home-animation="slide-up">{home.blogHeading}</h2><p>{home.blogDescription}</p></div><a href="https://princesageonlinebranding.com/blog">All Categories ↗</a></div><div className="home-blog-grid">{home.posts.map(p=><article data-home-animation="slide-up" data-home-delay="300" className="home-blog" key={p.href}><a href={p.href}>{p.image!=='#'&&<img src={p.image} alt="" width="400" height="300" loading="lazy"/>}<h3>{p.title}</h3></a>{p.date&&<small>{p.date}</small>}</article>)}</div></div></section>
   <section className="home-section home-bottom-cta"><div className="home-wrap"><div data-home-animation="slide-up" data-home-delay="100"><h2>{home.cta.title}</h2><p>{home.cta.description}</p><a className="home-cta-link" href={native('/freelancers/')}>Find Talent</a></div>{home.cta.image!=='#'&&<img data-home-animation="scale" data-home-delay="500" src={home.cta.image} alt="" width="600" height="400" loading="lazy"/>}</div></section>
  </main>
  <PublicFooter/>
 </div>;
}
