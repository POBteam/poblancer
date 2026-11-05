import 'server-only';
import {extractServices,serviceQuery,privateServiceQuery} from './public-services.mjs';
import assetMap from '../data/service-assets.json';
import snapshot from '../data/services-source.json';
const origin=new URL(process.env.WORDPRESS_ORIGIN||'http://poblancer.local').origin;
export function serviceAssets(data:ReturnType<typeof extractServices>){return {...data,cards:data.cards.map(c=>({...c,image:asset(c.image),avatar:asset(c.avatar)}))};}
function asset(url:string){try{return (assetMap as Record<string,string>)[new URL(url,origin).pathname]||url;}catch{return url;}}
export function initialServices(){return serviceAssets(extractServices(snapshot.html,origin));}
export async function readServices(params:URLSearchParams){
 const query=serviceQuery(params),page=query.get('paged')||'1';query.delete('paged');
 const path=Number(page)>1?`/services/page/${page}/`:'/services/';
 const url=new URL(path,origin);url.search=query.toString();
 const cache=privateServiceQuery(query)?{cache:'no-store' as const}:{next:{revalidate:300,tags:['public-services']}};
 const response=await fetch(url,{...cache,headers:{Accept:'text/html'},signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error('WordPress could not load these service results.');
 const declared=Number(response.headers.get('content-length'));if(declared>2000000)throw new Error('Service results are too large.');
 return serviceAssets(extractServices(await response.text(),origin));
}
