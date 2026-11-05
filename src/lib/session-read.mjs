// Only WordPress's pre-dispatch nonce rejection qualifies for one read retry.
// Never use this for writes, network failures or ordinary permission failures.
export function createSessionReader({fetchRead,refreshSession}){
  const owners=new Map();let refreshing;
  function remember(session){
    if(session.authenticated&&session.nonce&&session.user?.id){
      // Existing mounted screens may still hold the previous nonce. Reuse only
      // the refreshed credential for that same identity, never cached account data.
      for(const value of owners.values())if(value.id===session.user.id)value.nonce=session.nonce;
      owners.set(session.nonce,{id:session.user.id,nonce:session.nonce});
      if(owners.size>32)owners.delete(owners.keys().next().value);
    }
  }
  async function read(path,nonce,signal){
    const owner=owners.get(nonce);
    const first=await fetchRead(path,owner?.nonce||nonce,signal);
    if(first.status!==403||first.body?.code!=='rest_cookie_invalid_nonce')return first;
    if(!owner)return first;
    if(!refreshing)refreshing=Promise.resolve().then(refreshSession).finally(()=>{refreshing=undefined;});
    const session=await refreshing;
    if(signal?.aborted)throw new DOMException('Request cancelled.','AbortError');
    if(!session.authenticated||session.user?.id!==owner.id||!session.nonce){
      throw new Error('Your signed-in account changed or expired. Sign in again before continuing.');
    }
    remember(session);
    return fetchRead(path,session.nonce,signal);
  }
  function credential(session){const known=owners.get(session.nonce);return known?.id===session.user?.id?known.nonce:session.nonce;}
  return {remember,read,credential};
}
