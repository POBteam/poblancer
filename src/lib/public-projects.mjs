import {parsePublicHtml,all,byClass,byTag,text,firstText,publicLink} from './public-home.mjs';
import {serviceQuery} from './public-services.mjs';
export function projectQuery(input){
 const extra=new Set(['filter-project_type','filter-project_duration','filter-project_level','filter-project_skill[]','filter-project_language[]']);const common=new URLSearchParams(),out=new URLSearchParams();let count=0;
 for(const [key,value] of input){if(++count>45||value.length>160)throw new Error('Too many project filters.');if(extra.has(key)){if(value)out.append(key,value);}else common.append(key,value);}
 for(const [key,value] of serviceQuery(common))if(!key.startsWith('filter-center-')&&!['filter-distance','filter-response_time','filter-delivery_time'].includes(key))out.append(key,value);
 out.sort();return out;
}
export function extractProjects(html,origin){
 const root=parsePublicHtml(html),widget=id=>all(root,n=>n.attrs['data-id']===id)[0];
 const link=n=>publicLink(byTag(n,'a')[0]?.attrs.href,origin);
 const rows=byClass(root,'project-item').map(n=>({id:Number(byClass(n,'btn-add-project-favorite')[0]?.attrs['data-project_id']),title:firstText(n,'project-title'),href:link(byClass(n,'project-title')[0]),employerHref:link(byClass(n,'employer-logo')[0])==='#'?link(byClass(n,'logo')[0]):link(byClass(n,'employer-logo')[0]),logo:publicLink(byTag(byClass(n,'employer-logo')[0],'img')[0]?.attrs.src,origin),posted:firstText(n,'project-deadline'),proposals:firstText(n,'project-proposals-count'),description:firstText(n,'project-excerpt'),price:firstText(n,'project-price'),proposalHref:publicLink(byTag(n,'a').find(a=>(a.attrs.href||'').includes('#project-proposal-form-wrapper'))?.attrs.href,origin)}));
 const form=byClass(root,'filter-listing-form').find(f=>byTag(f,'input').some(i=>i.attrs.name==='filter-project_skill[]'));const labels=byTag(form,'label');
 const groups=byClass(form,'form-group').map(n=>({label:firstText(n,'heading-label'),fields:all(n,x=>['input','select'].includes(x.tag)).map(f=>({name:f.attrs.name||'',type:f.tag==='select'?'select':f.attrs.type||'text',value:f.attrs.value||'',checked:Object.hasOwn(f.attrs,'checked'),label:text(labels.find(l=>l.attrs.for===f.attrs.id))||f.attrs['data-placeholder']||'',options:byTag(f,'option').map(o=>({value:o.attrs.value||'',label:text(o),selected:Object.hasOwn(o.attrs,'selected')}))}))})).filter(g=>g.label&&g.fields.length);
 const ordering=byTag(root,'select').find(n=>n.attrs.name==='filter-orderby');const count=firstText(root,'results-count');const pages=byClass(root,'page-numbers').reduce((m,n)=>Math.max(m,Number(text(n))||Number((n.attrs.href||'').match(/\/page\/(\d+)/)?.[1])||0),1);
 if(!widget('133e4da')||!ordering||!form||(!rows.length&&!/no\s+(?:project|result)|nothing found/i.test(text(root))))throw new Error('WordPress returned incomplete project results.');
 return {hero:{title:text(byTag(widget('133e4da'),'h2')[0]),description:text(widget('10f346a')),placeholder:byTag(root,'input').find(i=>i.attrs.name==='filter-title')?.attrs.placeholder||'Project title, keywords'},rows,groups,count:count||'No projects found.',sort:byTag(ordering,'option').map(o=>({value:o.attrs.value||'',label:text(o)})),page:Number(firstText(root,'current'))||1,pages};
}
