import {notFound} from 'next/navigation';
import {PublicHeader,PublicFooter} from '../../../components/public/PublicChrome';
import HomeMenuBehavior from '../../../components/public/HomeMenuBehavior';
import FreelancerProfile from '../../../components/public/FreelancerProfile';
import {readFreelancerProfile} from '../../../lib/public-freelancers-server';
import '../../home.css';
import '../../home-fidelity.css';
import '../../about-v2/about.css';
import '../../detail.css';
import '../../freelancers/freelancers.css';
export const revalidate=300;
export const metadata={title:'Freelancer | POBlancer - POB Digital Experts',robots:{index:false,follow:false}};
export default async function Profile({params}:{params:Promise<{slug:string}>}){const {slug}=await params,data=await readFreelancerProfile(slug);if(!data)notFound();return <div className="public-home public-about public-detail public-freelancer-profile"><HomeMenuBehavior/><PublicHeader categories={[]} active="freelancers"/><main id="main"><FreelancerProfile data={data}/></main><PublicFooter/></div>;}
