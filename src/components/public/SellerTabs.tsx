'use client';
import {useState} from 'react';
import DetailContent,{type ContentNode} from './DetailContent';
function tabBody(node:ContentNode,role:string):ContentNode{
 if(typeof node==='string')return node.replace(/,\s*Join as a Freelancer\.\s*/gi,'');
 if(!node)return null;
 const attrs=node.tag==='a'&&/^\/register\/?$/.test(node.attrs.href||'')?{...node.attrs,href:'/register?role='+role}:node.attrs;
 return {...node,attrs,children:node.children.map(child=>tabBody(child,role))};
}
export default function SellerTabs({tabs}:{tabs:{label:string;body:ContentNode}[]}){
 const [active,setActive]=useState(0);const tab=tabs[active],role=active===0?'freelancer':'employer';
 return <div className="seller-tabs"><div role="tablist" aria-label="Ways to use POBlancer">{tabs.map((t,i)=><button type="button" key={t.label} role="tab" id={'seller-tab-'+i} aria-controls={'seller-panel-'+i} aria-selected={i===active} onClick={()=>setActive(i)}>{t.label}</button>)}</div>{tab&&<div key={role} role="tabpanel" id={'seller-panel-'+active} aria-labelledby={'seller-tab-'+active}><DetailContent node={tabBody(tab.body,role)}/><div className="seller-tab-video"><iframe key={role} title={role==='freelancer'?'Welcome to POBlancer for freelancers':'Welcome to POBlancer for employers'} src={'https://www.youtube-nocookie.com/embed/'+(role==='freelancer'?'KULfjCAbdc0':'ii3bwrYBsAQ')+'?rel=0&playsinline=1'} loading="lazy" allow="encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/></div></div>}</div>;
}
