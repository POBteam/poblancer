import {parsePublicHtml,byTag,byClass} from '../../../lib/public-home.mjs';
import {readBoundedBody} from '../../../lib/request-body.mjs';
export const dynamic='force-dynamic';
const origin=new URL(process.env.WORDPRESS_ORIGIN||'http://poblancer.local').origin;
const attempts=new Map<string,{count:number;until:number}>();
export async function POST(request:Request){
 const expected=new URL(process.env.FRONTEND_ORIGIN||request.url).origin;
 if(request.headers.get('origin')!==expected)return Response.json({message:'Please send your message from this website.'},{status:403});
 if(!request.headers.get('content-type')?.startsWith('application/json')||Number(request.headers.get('content-length'))>12000)return Response.json({message:'Please check your message.'},{status:400});
 let input:Record<string,unknown>;try{const bytes=await readBoundedBody(request,{limit:12000,timeoutMs:10000});input=JSON.parse(new TextDecoder().decode(bytes));if(!input||Array.isArray(input)||typeof input!=='object')throw new Error();}catch{return Response.json({message:'Please check your message.'},{status:400});}
 if(input.website)return Response.json({message:'Unable to send this message.'},{status:400});
 const name=typeof input['form-control']==='string'?input['form-control'].trim():'',email=typeof input['your-email']==='string'?input['your-email'].trim():'',message=typeof input['your-message']==='string'?input['your-message'].trim():'';
 const errors:Record<string,string>={};if(!name||name.length>400)errors['form-control']='Enter your name.';if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>400)errors['your-email']='Enter a valid email address.';if(!message||message.length>2000)errors['your-message']='Enter a message of up to 2,000 characters.';
 if(Object.keys(errors).length)return Response.json({message:'Please check the highlighted fields.',errors},{status:400});
 // Bound this process-local abuse guard; deployment still needs edge rate limiting.
 const now=Date.now();for(const [key,item] of attempts)if(item.until<now)attempts.delete(key);if(attempts.size>2000)attempts.clear();
 const prior=attempts.get(email);if(prior&&prior.count>=3)return Response.json({message:'Please wait before sending another message.'},{status:429});attempts.set(email,{count:(prior?.count||0)+1,until:prior?.until||now+600000});
 try{
  const source=await fetch(new URL('/contact/',origin),{cache:'no-store',signal:AbortSignal.timeout(12000)});if(!source.ok)throw new Error();const html=await source.text();if(html.length>2000000)throw new Error();
  const form=byClass(parsePublicHtml(html),'wpcf7-form')[0],hidden=byTag(form,'input').filter(n=>n.attrs.type==='hidden');const formId=hidden.find(n=>n.attrs.name==='_wpcf7')?.attrs.value;
  if(formId!=='1726')throw new Error('Unexpected contact form.');
  // Preserve Contact Form 7 validation, mail and existing submission hooks.
  const body=new FormData();for(const n of hidden)if(['_wpcf7','_wpcf7_version','_wpcf7_locale','_wpcf7_unit_tag','_wpcf7_container_post','_wpcf7_posted_data_hash','_wpcf7_ak_js'].includes(n.attrs.name))body.append(n.attrs.name,n.attrs.value||'');
  body.set('form-control',name);body.set('your-email',email);body.set('your-message',message);body.set('_wpcf7_ak_hp_textarea','');
  const r=await fetch(new URL('/wp-json/contact-form-7/v1/contact-forms/1726/feedback',origin),{method:'POST',body,cache:'no-store',signal:AbortSignal.timeout(20000)});const result=await r.json();
  const sent=r.ok&&result.status==='mail_sent';const fieldErrors:Record<string,string>={};for(const item of result.invalid_fields||[])if(['form-control','your-email','your-message'].includes(item.field)&&typeof item.message==='string')fieldErrors[item.field]=item.message;
  return Response.json({sent,message:typeof result.message==='string'?result.message:sent?'Thank you for your message.':'Unable to send your message. Please try again.',errors:fieldErrors},{status:sent?200:422,headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({message:'Unable to send your message right now. Please try again or use the contact details on this page.'},{status:502,headers:{'Cache-Control':'no-store'}});}
}
