import {frontendOrigin} from '@/lib/server';
const cache=new Map<string,{until:number;rows:any[]}>();let next=0;
export async function GET(request:Request){
 const q=new URL(request.url).searchParams.get('q')?.trim()||'';
 if(q.length<2||q.length>160)return Response.json({message:'Enter a location between 2 and 160 characters.'},{status:422});
 // Reuses Freeio's existing Nominatim provider for this single local preview.
 // Production requires provider configuration and a shared rate limiter across instances.
 if(new URL(frontendOrigin).hostname!=='poblancer.local')return Response.json({message:'Location search needs a configured hosting provider. Choose a point on the map or enter coordinates.'},{status:503});
 const saved=cache.get(q.toLowerCase());if(saved&&saved.until>Date.now())return Response.json(saved.rows);
 if(Date.now()<next)return Response.json({message:'Please wait a moment before searching again.'},{status:429});next=Date.now()+1100;
 try{const response=await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q='+encodeURIComponent(q),{headers:{'User-Agent':'POBlancer-local-service-location/1.0 (https://pob.com.ng)','Accept':'application/json'},signal:AbortSignal.timeout(8000),cache:'no-store'});if(!response.ok)throw new Error();const raw=await response.json();const rows=raw.map((r:any)=>({lat:r.lat,lon:r.lon,display_name:r.display_name}));if(cache.size>=100)cache.delete(cache.keys().next().value!);cache.set(q.toLowerCase(),{until:Date.now()+86400000,rows});return Response.json(rows);}catch{return Response.json({message:'Location search is unavailable. Try again later or choose a point on the map.'},{status:503});}
}
