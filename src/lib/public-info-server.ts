import 'server-only';
import snapshots from '../data/public-info-pages.json';
import {extractInfoPage,infoTitles} from './public-info.mjs';
const origin=new URL(process.env.WORDPRESS_ORIGIN||(process.env.NODE_ENV==='production'?'https://pob.com.ng':'http://poblancer.local')).origin;
export async function readInfoPage(slug:string){
 if(!Object.hasOwn(infoTitles,slug))return null;
 const saved=(snapshots as Record<string,{html:string}>)[slug];
 if(process.env.POB_LOCAL_BUILD_SNAPSHOT==='1')return extractInfoPage(saved.html,slug,origin);
 try{const r=await fetch(new URL('/'+slug+'/',origin),{next:{revalidate:300,tags:['public-info-'+slug]},signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error('Unavailable');const html=await r.text();if(html.length>2000000)throw new Error('Invalid source');return extractInfoPage(html,slug,origin);}catch{return extractInfoPage(saved.html,slug,origin);}
}
