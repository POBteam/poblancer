export class BodyError extends Error {
  constructor(message,status){super(message);this.status=status;}
}
// Admission is per Node process, held until the upstream response headers arrive.
export function createBodyAdmission(limit=4){
  let active=0;
  return ()=>{
    if(active>=limit)throw new BodyError('Too many submissions are processing. Please wait before trying again.',429);
    active++;let released=false;
    return ()=>{if(!released){released=true;active--;}};
  };
}
export function createSubmissionAdmission(){
  const small=createBodyAdmission(64),large=createBodyAdmission(4);
  return request=>{
    const length=request.headers.get('content-length'),type=(request.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
    const boundedJson=type==='application/json'&&length!==null&&/^\d+$/.test(length)&&Number.isSafeInteger(Number(length))&&Number(length)<=256*1024;
    // The reader enforces this byte limit even if a caller lies about its length.
    return {release:(boundedJson?small:large)(),limit:boundedJson?256*1024:20*1024*1024,kind:boundedJson?'small-json':'large-or-unknown'};
  };
}
export async function readBoundedBody(request,{limit=20*1024*1024,timeoutMs=30000}={}){
  const declared=request.headers.get('content-length');
  if(declared!==null&&(!/^\d+$/.test(declared)||!Number.isSafeInteger(Number(declared))))throw new BodyError('Invalid request size.',400);
  if(Number(declared)>limit)throw new BodyError('The request is too large.',413);
  if(!request.body)return undefined;
  const reader=request.body.getReader();let timer,abort;let complete=false;
  const interrupted=new Promise((_,reject)=>{
    timer=setTimeout(()=>reject(new BodyError('The upload took too long. Please try again.',408)),timeoutMs);
    abort=()=>reject(new BodyError('The request was cancelled.',408));
    request.signal.addEventListener('abort',abort,{once:true});
    if(request.signal.aborted)abort();
  });
  try{
    const chunks=[];let size=0;
    for(;;){const {done,value}=await Promise.race([reader.read(),interrupted]);if(done)break;
      size+=value.byteLength;if(size>limit)throw new BodyError('The request is too large.',413);chunks.push(value);
    }
    const bytes=new Uint8Array(size);let offset=0;
    for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
    complete=true;return bytes;
  }finally{
    clearTimeout(timer);request.signal.removeEventListener('abort',abort);
    if(!complete)void reader.cancel().catch(()=>{});
  }
}
