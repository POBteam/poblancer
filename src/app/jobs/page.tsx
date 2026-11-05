import type {Metadata} from 'next';
import {PublicHeader} from '../../components/public/PublicChrome';
import HomeMenuBehavior from '../../components/public/HomeMenuBehavior';
import JobsBrowser from '../../components/public/JobsBrowser';
import {initialJobs,readJobs} from '../../lib/public-jobs-server';
import '../home.css';
import '../home-fidelity.css';
import '../about-v2/about.css';
import '../services/services.css';
import './jobs.css';
export const revalidate=300;
export const metadata:Metadata={title:'Jobs | POBlancer - POB Digital Experts',robots:{index:false,follow:false}};
export default async function Jobs(){let data=initialJobs();if(process.env.POB_LOCAL_BUILD_SNAPSHOT!=='1')try{data=await readJobs(new URLSearchParams());}catch{console.warn('Jobs preview is using its verified public WordPress snapshot.');}return <div className="public-home public-about public-jobs"><HomeMenuBehavior/><PublicHeader categories={[]} active="jobs"/><main id="main"><JobsBrowser initial={data}/></main></div>;}
