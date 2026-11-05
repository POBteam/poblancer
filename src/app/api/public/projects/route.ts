import {readProjects} from '../../../../lib/public-projects-server';
import {projectQuery} from '../../../../lib/public-projects.mjs';
export async function GET(request:Request){let query:URLSearchParams;try{query=projectQuery(new URL(request.url).searchParams);}catch{return Response.json({message:'Check your project filters.'},{status:400});}
 try{return Response.json(await readProjects(query),{headers:{'Cache-Control':'public, max-age=60, s-maxage=300','X-Content-Type-Options':'nosniff'}});}catch{return Response.json({message:'Could not load these projects. Your previous results are still shown. Please try again.'},{status:502,headers:{'Cache-Control':'no-store'}});}}
