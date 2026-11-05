// Only public REST content enters this adapter. No cookies or privileged credentials.
const entities={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',rsquo:'’',lsquo:'‘',rdquo:'”',ldquo:'“',hellip:'…',ndash:'-',mdash:', '};
export function decodeText(value=''){return value.replace(/&#(x[\da-f]+|\d+);|&([a-z]+);/gi,(all,n,name)=>{if(n){const code=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return code>0&&code<=0x10ffff?String.fromCodePoint(code):'';}return entities[name]??all;}).replace(/—/g,', ').replace(/\s+/g,' ').trim();}
export function parsePublicHtml(html){
 if(typeof html!=='string'||html.length>2000000)throw new Error('Public content exceeds its allowed size.');
 const root={tag:'root',attrs:{},children:[]},stack=[root];
 // Scripts/styles are discarded, never interpreted or returned to React.
 const safe=html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,'');
 for(const token of safe.match(/<!--[\s\S]*?-->|<[^>"']*(?:"[^"]*"[^>"']*|'[^']*'[^>"']*)*>|[^<]+/g)||[]){
  if(token.startsWith('<!--')||token.startsWith('<!'))continue;
  if(token.startsWith('</')){const tag=token.slice(2).match(/^\w+/)?.[0]?.toLowerCase();for(let i=stack.length-1;i>0;i--)if(stack[i].tag===tag){stack.length=i;break;}continue;}
  if(token[0]==='<'){
   const tag=token.match(/^<([\w-]+)/)?.[1]?.toLowerCase();if(!tag)continue;
   const attrs={};const raw=token.slice(tag.length+1,-1);for(const m of raw.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))attrs[m[1].toLowerCase()]=decodeText(m[2]??m[3]??m[4]??'');
   const node={tag,attrs,children:[]};stack.at(-1).children.push(node);if(!/^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/.test(tag)&&!token.endsWith('/>'))stack.push(node);
  }else stack.at(-1).children.push(token);
 }
 return root;
}
function all(node,predicate){if(!node||typeof node==='string')return [];return [...(predicate(node)?[node]:[]),...node.children.flatMap(child=>all(child,predicate))];}
const cls=(node,name)=>(node.attrs.class||'').split(/\s+/).includes(name);
const byClass=(node,name)=>all(node,n=>cls(n,name));
const byTag=(node,tag)=>all(node,n=>n.tag===tag);
const text=node=>!node?'':typeof node==='string'?decodeText(node):decodeText(node.children.map(text).join(' '));
const firstText=(node,name)=>text(byClass(node,name)[0]);
export function publicLink(value,origin='http://poblancer.local'){
 if(typeof value!=='string'||!value.trim())return '#';
 try{const url=new URL(value,origin);return ['http:','https:'].includes(url.protocol)?url.href:'#';}catch{return '#';}
}
export function extractHomepage(html,origin){
 const root=parsePublicHtml(html),section=id=>all(root,n=>n.attrs['data-id']===id)[0];
 const heading=node=>text(all(node,n=>/^h[1-6]$/.test(n.tag))[0]);
 const image=node=>publicLink(byTag(node,'img')[0]?.attrs.src||'',origin);
 const link=node=>publicLink(byTag(node,'a')[0]?.attrs.href||'',origin);
 const widgets=id=>all(section(id),n=>!!n.attrs['data-widget_type']);
 const headingWidgets=id=>widgets(id).filter(n=>n.attrs['data-widget_type']==='heading.default').map(heading);
 const descriptions=id=>widgets(id).filter(n=>n.attrs['data-widget_type']==='text-editor.default').map(text);
 const services=byClass(root,'service-item').filter((n,i,a)=>a.findIndex(x=>link(x)===link(n))===i).map(n=>({title:firstText(n,'service-title'),href:publicLink(byTag(byClass(n,'service-title')[0],'a')[0]?.attrs.href,origin),image:publicLink(byClass(n,'service-image')[0]&&byTag(byClass(n,'service-image')[0],'img')[0]?.attrs.src,origin),category:firstText(n,'category-service'),categoryHref:link(byClass(n,'category-service')[0]),author:firstText(n,'service-author'),authorHref:link(byClass(n,'service-author')[0]),avatar:image(byClass(n,'service-author')[0]),price:firstText(n,'service-salary'),rating:firstText(n,'rating-reviews'),featured:cls(n,'is-featured')}));
 const options=byTag(root,'select').find(n=>n.attrs.name==='filter-category');
 const icon=node=>(byTag(node,'i')[0]?.attrs.class||'').split(/\s+/).find(c=>c.startsWith('flaticon-'))||(byTag(node,'i')[0]?.attrs.class?.includes('fa-male')?'fa-male':'flaticon-freelancer');
 const categories=byClass(root,'category-banner-inner').map(n=>({title:firstText(n,'title'),description:firstText(n,'des'),count:firstText(n,'number'),href:publicLink(n.attrs.href,origin),icon:icon(n)}));
 const features=id=>byClass(section(id),'item-features-inner').map(n=>({title:heading(n),description:firstText(n,'description'),icon:icon(n)}));
 const faq=byClass(root,'elementor-accordion-item').map(n=>({question:firstText(n,'elementor-accordion-title'),answer:firstText(n,'elementor-tab-content')}));
 const photos=byTag(section('3effec3'),'img');
 const testimonials=byClass(root,'testimonials-item2').map(n=>{const name=firstText(n,'name-client');return {name,quote:firstText(n,'description'),job:firstText(n,'job'),image:publicLink(photos.find(n=>n.attrs.alt===name)?.attrs.src||'',origin)};});
 const posts=byTag(section('b69f8c9'),'article').map(n=>({title:heading(n),href:link(n),image:image(n),date:firstText(n,'date'),excerpt:firstText(n,'description')}));
 const trust=section('8e3f3d6');
 const teamBanner=image(section('67dd2f7'));
 const counters=byClass(root,'elementor-counter').map(n=>({label:firstText(n,'elementor-counter-title'),value:byClass(n,'elementor-counter-number')[0]?.attrs['data-to-value']||'0',suffix:firstText(n,'elementor-counter-number-suffix')}));
 if(!heading(section('33cd6a1'))||!services.length||!faq.length||categories.length!==8||teamBanner==='#')throw new Error('Original homepage content is incomplete; refusing to publish a partial response.');
 return {hero:{title:heading(section('33cd6a1')),description:descriptions('33cd6a1')[0],popular:text(section('a04635e')),searchAction:publicLink(byTag(section('33cd6a1'),'form')[0]?.attrs.action,origin),options:byTag(options,'option').map(n=>({value:n.attrs.value||'',label:text(n)}))},categories,categoryHeading:headingWidgets('fc8de9f')[0]||'Browse services by category',categoryDescription:descriptions('fc8de9f')[0]||'Get some Inspirations from 1800+ skills',services,trendingHeading:headingWidgets('f094a24')[0],trendingDescription:descriptions('f094a24')[0],sellerHeading:headingWidgets('c0334bb')[0],sellerDescription:descriptions('c0334bb')[0],steps:features('d937fc0'),groupsHeading:headingWidgets('ce0ff36')[0],groupsDescription:descriptions('ce0ff36')[0],groupsIntro:byTag(section('43c241c'),'p').map(text),groups:features('ce0ff36'),groupsImage:image(section('ce0ff36')),trust:{title:heading(trust),description:text(all(trust,n=>n.attrs['data-widget_type']==='text-editor.default')[0])},counters,faqHeading:headingWidgets('fbad458')[0],faqDescription:descriptions('fbad458')[0],faq,testimonialsHeading:headingWidgets('3effec3')[0],testimonialsDescription:descriptions('3effec3')[0],testimonials,teamBanner,posts,blogHeading:headingWidgets('8fabeb9')[0],blogDescription:descriptions('8fabeb9')[0],cta:{title:headingWidgets('4f1224d')[0],description:descriptions('4f1224d')[0],image:image(section('4f1224d'))}};
}

export {all,byClass,byTag,text,firstText};
