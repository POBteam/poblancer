import type {Metadata} from 'next';
import './globals.css';
import FeedbackWidget from '../components/FeedbackWidget';
export const metadata:Metadata={title:'POBlancer | POB Digital Experts',metadataBase:new URL(process.env.FRONTEND_ORIGIN||(process.env.NODE_ENV==='production'?'https://poblancer.workers.dev':'http://poblancer.local:3103')),icons:{icon:"/pob-favicon.png",apple:"/pob-favicon.png"},robots:{index:false,follow:false}};
export default function Layout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}<FeedbackWidget/></body></html>;}
