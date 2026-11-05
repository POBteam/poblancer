import {createHmac,timingSafeEqual} from 'node:crypto';
export const publicTags=['public-home','public-about','public-services','public-projects','public-jobs','public-details','public-freelancers','public-freelancer-profiles','public-employers','public-employer-profiles','public-info-become-seller','public-info-contact','public-info-terms','public-info-privacy-policy','public-info-refund_returns-2','public-info-faq'];
export function verifiedUpdate(body,timestamp,signature,secret,now=Date.now()){
 if(!secret||secret.length<32||!/^\d{10}$/.test(timestamp||'')||Math.abs(now/1000-Number(timestamp))>60||!/^([a-f0-9]{64})$/.test(signature||''))return null;
 const expected=createHmac('sha256',secret).update(timestamp+'.'+body).digest();if(!timingSafeEqual(expected,Buffer.from(signature,'hex')))return null;
 let data;try{data=JSON.parse(body);}catch{return null;}if(!Array.isArray(data.tags)||!data.tags.length||data.tags.length>30)return null;
 const tags=[...new Set(data.tags)];return tags.every(t=>publicTags.includes(t)||/^public-video-portfolio-[1-9]\d{0,10}$/.test(t))?tags:null;
}
