export function youtubeEmbedUrl(value){
 try{const u=new URL(value);if(!['https:','http:'].includes(u.protocol))return '';let id='';
  if(['youtube.com','www.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(u.hostname))id=u.searchParams.get('v')||u.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1]||'';
  else if(u.hostname==='youtu.be')id=u.pathname.slice(1);
  return /^[A-Za-z0-9_-]{11}$/.test(id)?`https://www.youtube.com/embed/${id}?autoplay=1&rel=0`:'';
 }catch{return '';}
}
