import {parsePublicHtml,all,byClass,byTag,text,firstText,publicLink} from './public-home.mjs';
export function privateServiceQuery(params){return [...params.keys()].some(key=>key.startsWith('filter-center-'));}
export function serviceQuery(input){
 const out=new URLSearchParams();
 const allowed=new Set(['filter-title','filter-author','filter-category[]','filter-category','filter-date-posted','filter-response_time','filter-delivery_time','filter-price-from','filter-price-to','filter-english_level','filter-location[]','filter-center-location','filter-center-latitude','filter-center-longitude','filter-distance','filter-orderby','paged']);
 let count=0;
 for(const [key,value] of input){if(!allowed.has(key)||!value)continue;if(value.length>160||++count>45)throw new Error('Too many filter values.');
  if(['paged','filter-price-from','filter-price-to','filter-distance','filter-center-latitude','filter-center-longitude'].includes(key)&&!Number.isFinite(Number(value)))throw new Error('Enter a valid filter number.');
  if(key==='filter-author'&&(!/^\d+$/.test(value)||Number(value)<1))throw new Error('Invalid author.');
  if(key==='paged'&&(!/^\d+$/.test(value)||Number(value)<1||Number(value)>1000))throw new Error('Invalid results page.');
  if(key==='filter-orderby'&&!['menu_order','newest','oldest','price-lowest','price-highest','random'].includes(value))throw new Error('Invalid sort order.');
  out.append(key,value);
 }out.sort();return out;
}
export function extractServices(html,origin){
 const root=parsePublicHtml(html),widget=id=>all(root,n=>n.attrs['data-id']===id)[0];
 const link=n=>publicLink(byTag(n,'a')[0]?.attrs.href,origin);
 const img=n=>publicLink(byTag(n,'img')[0]?.attrs.src,origin);
 const cards=byClass(root,'service-item').map(n=>({id:Number((n.attrs.class||'').match(/\bpost-(\d+)/)?.[1]),title:firstText(n,'service-title'),href:link(byClass(n,'service-title')[0]),image:img(byClass(n,'service-image')[0]),category:firstText(n,'category-service'),categoryHref:link(byClass(n,'category-service')[0]),author:firstText(n,'service-author'),authorHref:link(byClass(n,'service-author')[0]),avatar:img(byClass(n,'service-author')[0]),price:firstText(n,'service-salary'),rating:firstText(n,'rating-reviews'),featured:(n.attrs.class||'').split(' ').includes('is-featured')}));
 const form=byClass(root,'filter-listing-form')[0];const labels=byTag(form,'label');
 const groups=byClass(form,'form-group').map(n=>({label:firstText(n,'heading-label'),fields:all(n,x=>['input','select'].includes(x.tag)).map(f=>({name:f.attrs.name||'',type:f.tag==='select'?'select':f.attrs.type||'text',value:f.attrs.value||'',checked:Object.hasOwn(f.attrs,'checked'),label:text(labels.find(l=>l.attrs.for===f.attrs.id))||f.attrs['data-placeholder']||'',options:byTag(f,'option').map(o=>({value:o.attrs.value||'',label:text(o),selected:Object.hasOwn(o.attrs,'selected')}))}))})).filter(g=>g.label&&g.fields.length);
 const ordering=byTag(root,'select').find(n=>n.attrs.name==='filter-orderby');
 const count=firstText(root,'results-count');const max=byClass(root,'page-numbers').reduce((m,n)=>Math.max(m,Number(text(n))||Number((n.attrs.href||'').match(/\/page\/(\d+)/)?.[1])||0),1);
 if(!widget('482ab07')||!ordering||(!cards.length&&!/no\s+(?:service|result)|nothing found/i.test(text(byClass(root,'services-listing-wrapper')[0])||text(root))))throw new Error('WordPress returned incomplete service results.');
 return {hero:{title:text(byTag(widget('482ab07'),'h2')[0]),description:text(widget('831c786')),video:link(widget('2b96e42')),videoLabel:firstText(widget('2b96e42'),'title')},cards,count:count||'No results found.',groups,distanceUnit:firstText(form,'search-distance-label').match(/miles|km/i)?.[0]||'miles',sort:byTag(ordering,'option').map(o=>({value:o.attrs.value||'',label:text(o)})),page:Number(firstText(root,'current'))||1,pages:max};
}
