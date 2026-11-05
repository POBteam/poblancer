import Registration from '@/components/Registration';
export const metadata={title:'Sign Up | POBlancer'};
export default async function Page({searchParams}:{searchParams:Promise<{role?:string}>}){
 const query=await searchParams;
 return <Registration initialRole={query.role==='employer'?'employer':'freelancer'}/>;
}
