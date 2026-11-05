import {PublicHeader,PublicFooter} from '../../components/public/PublicChrome';
import HomeMenuBehavior from '../../components/public/HomeMenuBehavior';
import FreelancersBrowser from '../../components/public/FreelancersBrowser';
import {initialFreelancers,readFreelancers} from '../../lib/public-freelancers-server';
import '../home.css';
import '../home-fidelity.css';
import '../about-v2/about.css';
import '../services/services.css';
import './freelancers.css';
export const revalidate=300;
export const metadata={title:'Freelancers | POBlancer - POB Digital Experts',robots:{index:false,follow:false}};
export default async function Freelancers(){let data=initialFreelancers();if(process.env.POB_LOCAL_BUILD_SNAPSHOT!=='1')try{data=await readFreelancers(new URLSearchParams());}catch{console.warn('Freelancers preview is using its verified public WordPress snapshot.');}return <div className="public-home public-about public-services public-freelancers"><HomeMenuBehavior/><PublicHeader categories={[]} active="freelancers"/><main id="main"><FreelancersBrowser initial={data}/></main><PublicFooter/></div>;}
