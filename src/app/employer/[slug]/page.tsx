import {notFound} from 'next/navigation';
import {PublicHeader,PublicFooter} from '../../../components/public/PublicChrome';
import HomeMenuBehavior from '../../../components/public/HomeMenuBehavior';
import EmployerProfile from '../../../components/public/EmployerProfile';
import {readEmployerProfile} from '../../../lib/public-employers-server';
import '../../home.css';
import '../../home-fidelity.css';
import '../../about-v2/about.css';
import '../../detail.css';
import '../../employers/employers.css';
export const revalidate=300;
export const metadata={title:'Employer | POBlancer - POB Digital Experts',robots:{index:false,follow:false}};
export default async function Profile({params}:{params:Promise<{slug:string}>}){const {slug}=await params,data=await readEmployerProfile(slug);if(!data)notFound();return <div className="public-home public-about public-detail public-employer-profile"><HomeMenuBehavior/><PublicHeader categories={[]} active="employers"/><main id="main"><EmployerProfile data={data}/></main><PublicFooter/></div>;}
