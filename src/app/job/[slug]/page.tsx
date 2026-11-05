import {publicMetadata} from '../../../lib/public-metadata';
import {notFound} from 'next/navigation';
import {PublicHeader,PublicFooter} from '../../../components/public/PublicChrome';
import HomeMenuBehavior from '../../../components/public/HomeMenuBehavior';
import ListingDetail from '../../../components/public/ListingDetail';
import {readDetail} from '../../../lib/public-detail-server';
import '../../home.css';
import '../../home-fidelity.css';
import '../../about-v2/about.css';
import '../../detail.css';
export const revalidate=300;
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const d=await readDetail('job',slug);return d?publicMetadata(d.title,d.description,d.path):{title:'Page not found | POBlancer'};}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const data=await readDetail('job',slug);if(!data)notFound();return <div className="public-home public-about public-detail"><HomeMenuBehavior/><PublicHeader categories={[]} active="jobs"/><main id="main"><ListingDetail data={data}/></main><PublicFooter/></div>;}
