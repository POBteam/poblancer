import {parseFeedbackSurvey} from '../../../lib/feedback-survey.mjs';
import {readBoundedBody} from '../../../lib/request-body.mjs';
export const dynamic='force-dynamic';
const origin=new URL(process.env.WORDPRESS_ORIGIN||'http://poblancer.local').origin;
let active=0;
async function survey(){const r=await fetch(new URL('/contact/',origin),{next:{revalidate:300,tags:['public-feedback-config']},signal:AbortSignal.timeout(12000)});if(!r.ok)throw new Error();const html=await r.text();if(html.length>2000000)throw new Error();return parseFeedbackSurvey(html);}
export async function GET(){try{const s=await survey();return Response.json({question:s.question,maxLength:400},{headers:{'Cache-Control':'public,max-age=60'}});}catch{return Response.json({message:'Feedback is temporarily unavailable. Please try again later.'},{status:503});}}
export async function POST(request:Request){
 const expected=new URL(process.env.FRONTEND_ORIGIN||request.url).origin;
 if(request.headers.get('origin')!==expected)return Response.json({message:'Please use the feedback form on this website.'},{status:403});
 if(!request.headers.get('content-type')?.startsWith('application/json'))return Response.json({message:'Please check your feedback.'},{status:400});
 let input:Record<string,unknown>;try{input=JSON.parse(new TextDecoder().decode(await readBoundedBody(request,{limit:4096,timeoutMs:10000})));}catch{return Response.json({message:'Please check your feedback.'},{status:400});}
 if(!input||typeof input!=='object'||Array.isArray(input)||typeof input.message!=='string'||!input.message.trim()||new TextEncoder().encode(input.message.trim()).length>400||input.website)return Response.json({message:'Please enter feedback of up to 400 characters.'},{status:400});
 if(active>=8)return Response.json({message:'Feedback is busy. Please try again shortly.'},{status:429});active++;
 try{const s=await survey();const path=typeof input.path==='string'&&input.path.startsWith('/')&&!input.path.startsWith('//')?input.path.split(/[?#]/)[0].slice(0,250):'/';
 // Existing survey handler owns persistence and userfeedback_survey_response hooks.
 const response=await fetch(new URL('/wp-json/userfeedback/v1/surveys/1/responses',origin),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nonce:s.nonce,answers:[{question_id:s.questionId,value:input.message.trim()}],page_submitted:{id:0,name:path,url:expected+path}}),cache:'no-store',signal:AbortSignal.timeout(15000)});const out=await response.json();if(!response.ok||!out?.success)throw new Error();return Response.json({success:true,message:s.thankYou},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({message:'Your feedback could not be confirmed. Please try again later.'},{status:502,headers:{'Cache-Control':'no-store'}});}finally{active--;}
}
