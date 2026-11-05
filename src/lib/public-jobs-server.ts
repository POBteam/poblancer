import 'server-only';
import snapshot from '../data/jobs-source.json';
import assets from '../data/job-assets.json';
import {extractJobs,jobQuery} from './public-jobs.mjs';
const origin=new URL(process.env.WORDPRESS_ORIGIN||'http://poblancer.local').origin;
function mapped(data:ReturnType<typeof extractJobs>){return {...data,cards:data.cards.map(card=>({...card,image:(assets as Record<string,string>)[new URL(card.image,origin).pathname]||card.image}))};}
export function initialJobs(){return mapped(extractJobs(snapshot.html,origin));}
export async function readJobs(input:URLSearchParams){const query=jobQuery(input),page=query.get('paged')||'1';query.delete('paged');const url=new URL(Number(page)>1?`/jobs/page/${page}/`:'/jobs/',origin);url.search=query.toString();const response=await fetch(url,{next:{revalidate:300,tags:['public-jobs']},headers:{Accept:'text/html'},signal:AbortSignal.timeout(15000)});if(!response.ok||Number(response.headers.get('content-length'))>2000000)throw new Error('Job source unavailable.');return mapped(extractJobs(await response.text(),origin));}
