const cache = new Map();
const inFlight = new Map();
export const REGISTRATION_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function getCachedRegistrationForm(role, maxAgeMs = REGISTRATION_CACHE_TTL_MS) {
  const entry = cache.get(role);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > maxAgeMs) {
    cache.delete(role);
    return null;
  }
  return entry.data;
}

export function setCachedRegistrationForm(role, data) {
  cache.set(role, { data, timestamp: Date.now() });
}

export function clearRegistrationFormCache() {
  cache.clear();
  inFlight.clear();
}

export async function fetchRegistrationForm(role, options = {}) {
  const cached = getCachedRegistrationForm(role);
  if (cached) return cached;

  if (inFlight.has(role)) {
    return inFlight.get(role);
  }

  const promise = (async () => {
    try {
      const r = await fetch('/api/registration-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ role }),
        credentials: 'same-origin',
        cache: 'no-store',
        signal: options.signal,
      });
      const out = await r.json();
      if (!r.ok) {
        throw new Error(out.message || 'Unable to load registration.');
      }
      if (out && (out.state === 'form' || out.state === 'authenticated' || out.state === 'closed' || out.state === 'verification')) {
        setCachedRegistrationForm(role, out);
      }
      return out;
    } finally {
      inFlight.delete(role);
    }
  })();

  inFlight.set(role, promise);
  return promise;
}

export function prefetchRegistrationForm(role) {
  if (getCachedRegistrationForm(role) || inFlight.has(role)) return;
  fetchRegistrationForm(role).catch(() => {});
}

