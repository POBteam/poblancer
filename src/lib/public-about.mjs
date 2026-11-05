import {parsePublicHtml,all,byClass,byTag,text,firstText,publicLink} from './public-home.mjs';

// Public Elementor content becomes typed page data, never executable markup.
export function extractAboutPage(html,origin){
 const root=parsePublicHtml(html),widget=id=>all(root,n=>n.attrs['data-id']===id)[0];
 const heading=id=>text(all(widget(id),n=>/^h[1-6]$/.test(n.tag))[0]);
 const paragraphs=id=>byTag(widget(id),'p').map(text).filter(Boolean);
 const image=id=>{const n=byTag(widget(id),'img')[0];return {src:publicLink(n?.attrs.src,origin),width:Number(n?.attrs.width)||600,height:Number(n?.attrs.height)||600,alt:n?.attrs.alt||''};};
 const button=id=>{const a=byTag(widget(id),'a')[0];const url=publicLink(a?.attrs.href,origin);return {label:firstText(a,'elementor-button-text'),href:/^https?:\/\/(?:www\.)?princesageonlinebranding\.com\/freelancers\/?$/.test(url)?new URL('/freelancers/',origin).href:url};};
 const feature=id=>{const n=widget(id);return {title:firstText(n,'title'),description:firstText(n,'description'),icon:(byTag(n,'i')[0]?.attrs.class||'').split(/\s+/).find(x=>x.startsWith('flaticon-'))||'flaticon-security'};};
 const counters=all(root,n=>n.attrs['data-widget_type']==='counter.default').map(n=>({label:firstText(n,'elementor-counter-title'),value:Number(byClass(n,'elementor-counter-number')[0]?.attrs['data-to-value'])||0,suffix:firstText(n,'elementor-counter-number-suffix')}));
 const quotes=byClass(widget('3cc27f7'),'testimonials-item4').map(n=>firstText(n,'description'));
 const testimonials=byClass(widget('3cc27f7'),'item-testimonials4').map((n,i)=>({quote:quotes[i],name:firstText(n,'name-client'),job:firstText(n,'job'),image:publicLink(byTag(n,'img')[0]?.attrs.src,origin)}));
 const faq=byClass(widget('cb3a761'),'elementor-accordion-item').map(n=>({question:firstText(n,'elementor-accordion-title'),answer:firstText(n,'elementor-tab-content')}));
 const stats=['1aca6b9','9a8904f','31f4c78'].map(id=>({title:firstText(widget(id),'elementor-icon-box-title'),description:firstText(widget(id),'elementor-icon-box-description')}));
 const data={banner:image('a770b00'),intro:{image:image('3c799ce'),title:heading('089fc53'),paragraphs:paragraphs('6564370'),benefits:byTag(widget('e16622b'),'li').map(text),button:button('d458166')},counters,talent:{title:heading('05d5e85'),features:['46dd5cc','b55f6c3','cb9f687'].map(feature),image:image('e7d707a')},growth:{title:heading('b7f3c32'),paragraphs:paragraphs('ecbf321'),button:button('da9b2f9'),stats},testimonialsTitle:heading('d4a6543'),testimonialsIntro:paragraphs('6f7cfed'),testimonials,stepsTitle:heading('4fecd54'),stepsIntro:paragraphs('6a23e43'),steps:['833af86','e5336a3','348c0ac'].map(feature),faqTitle:heading('9abd150'),faqIntro:paragraphs('55cc878'),faq};
 if(!data.intro.title||data.banner.src==='#'||data.counters.length!==4||data.testimonials.length!==4||data.faq.length!==10)throw new Error('The original About page is incomplete; keep the last successful version.');
 return data;
}
