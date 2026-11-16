const cache = new Map();
const inFlight = new Map();
export const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function getEditorCacheKey(kind, id, userId) {
 return `${userId || 'anon'}:${kind}:${id}`;
}

export function getCachedEditor(kind, id, userId, maxAgeMs = CACHE_TTL_MS) {
 const key = getEditorCacheKey(kind, id, userId);
 const entry = cache.get(key);
 if (!entry) return null;
 if (Date.now() - entry.timestamp > maxAgeMs) {
  cache.delete(key);
  return null;
 }
 return entry.data;
}

export function setCachedEditor(kind, id, userId, data) {
 const key = getEditorCacheKey(kind, id, userId);
 cache.set(key, { data, timestamp: Date.now() });
}

export function invalidateEditorCache(kind, id, userId) {
 const key = getEditorCacheKey(kind, id, userId);
 cache.delete(key);
 inFlight.delete(key);
}

export function clearEditorCache() {
 cache.clear();
 inFlight.clear();
}

export async function prefetchEditorData(fetcher, session, kind, id) {
 if (!session?.nonce) return null;
 const key = getEditorCacheKey(kind, id, session.user?.id);
 const existing = getCachedEditor(kind, id, session.user?.id);
 if (existing) return existing;

 if (inFlight.has(key)) {
  return inFlight.get(key);
 }

 const endpoint = kind === 'profile' ? 'profile' : ['job', 'project'].includes(kind) ? 'employer-editor' : 'service-editor';
 const promise = (async () => {
  try {
   const out = await fetcher(endpoint + '?' + new URLSearchParams({ kind, id: String(id) }), session.nonce);
   if (out && out.fields) {
    setCachedEditor(kind, id, session.user?.id, out);
   }
   return out;
  } catch {
   return null;
  } finally {
   inFlight.delete(key);
  }
 })();

 inFlight.set(key, promise);
 return promise;
}
