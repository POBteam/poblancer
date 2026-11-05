import type {Metadata} from 'next';
import {PublicHeader,PublicFooter} from '../../components/public/PublicChrome';
import HomeMenuBehavior from '../../components/public/HomeMenuBehavior';
import ProjectsBrowser from '../../components/public/ProjectsBrowser';
import {initialProjects,readProjects} from '../../lib/public-projects-server';
import '../home.css';
import '../home-fidelity.css';
import '../about-v2/about.css';
import '../services/services.css';
import './projects.css';
export const revalidate=300;
export const metadata:Metadata={title:'Projects | POBlancer - POB Digital Experts',robots:{index:false,follow:false}};
export default async function Projects(){let data=initialProjects();if(process.env.POB_LOCAL_BUILD_SNAPSHOT!=='1')try{data=await readProjects(new URLSearchParams());}catch{console.warn('Projects preview is using its verified public WordPress snapshot.');}return <div className="public-home public-about public-projects"><HomeMenuBehavior/><PublicHeader categories={[]} active="projects"/><main id="main"><ProjectsBrowser initial={data}/></main><PublicFooter/></div>;}
