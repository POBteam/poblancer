import {PublicHeader,PublicFooter} from '../../components/public/PublicChrome';
import HomeMenuBehavior from '../../components/public/HomeMenuBehavior';
import EmployersBrowser from '../../components/public/EmployersBrowser';
import {initialEmployers,readEmployers} from '../../lib/public-employers-server';
import '../home.css';
import '../home-fidelity.css';
import '../about-v2/about.css';
import '../services/services.css';
import './employers.css';
export const revalidate=300;
export const metadata={title:'Employers | POBlancer - POB Digital Experts',robots:{index:false,follow:false}};
export default async function Employers(){let data=initialEmployers();if(process.env.POB_LOCAL_BUILD_SNAPSHOT!=='1')try{data=await readEmployers(new URLSearchParams());}catch{console.warn('Employers preview is using its verified public WordPress snapshot.');}return <div className="public-home public-about public-employers"><HomeMenuBehavior/><PublicHeader categories={[]} active="employers"/><main id="main"><EmployersBrowser initial={data}/></main><PublicFooter/></div>;}
