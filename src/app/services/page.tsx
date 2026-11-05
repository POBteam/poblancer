import type {Metadata} from 'next';
import {PublicHeader,PublicFooter} from '../../components/public/PublicChrome';
import HomeMenuBehavior from '../../components/public/HomeMenuBehavior';
import ServicesBrowser from '../../components/public/ServicesBrowser';
import {initialServices,readServices} from '../../lib/public-services-server';
import '../home.css';
import '../home-fidelity.css';
import '../about-v2/about.css';
import './services.css';
export const revalidate=300;
export const metadata:Metadata={title:'Services | POBlancer - POB Digital Experts',description:'POB Digital Experts are committed to quality delivery and prompt deadlines.',robots:{index:false,follow:false}};
export default async function Services(){
 let data=initialServices();
 if(process.env.POB_LOCAL_BUILD_SNAPSHOT!=='1')try{data=await readServices(new URLSearchParams());}catch{console.warn('Services preview is using its verified public WordPress snapshot.');}
 return <div className="public-home public-about public-services"><HomeMenuBehavior/><PublicHeader categories={[]} active="services"/><main id="main"><ServicesBrowser initial={data}/></main><PublicFooter/></div>;
}
