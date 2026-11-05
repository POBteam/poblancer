import 'server-only';
import {extractProjects,projectQuery} from './public-projects.mjs';
import snapshot from '../data/projects-source.json';
import assets from '../data/project-assets.json';
const origin=new URL(process.env.WORDPRESS_ORIGIN||'http://poblancer.local').origin;
function mapped(data:ReturnType<typeof extractProjects>){return {...data,rows:data.rows.map(row=>({...row,logo:(assets as Record<string,string>)[new URL(row.logo,origin).pathname]||row.logo}))};}
export function initialProjects(){return mapped(extractProjects(snapshot.html,origin));}
export async function readProjects(input:URLSearchParams){const query=projectQuery(input),page=query.get('paged')||'1';query.delete('paged');const url=new URL(Number(page)>1?`/projects/page/${page}/`:'/projects/',origin);url.search=query.toString();const r=await fetch(url,{next:{revalidate:300,tags:['public-projects']},headers:{Accept:'text/html'},signal:AbortSignal.timeout(15000)});if(!r.ok||Number(r.headers.get('content-length'))>2000000)throw new Error('Project source unavailable.');return mapped(extractProjects(await r.text(),origin));}
