import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getCachedRegistrationForm,
  setCachedRegistrationForm,
  clearRegistrationFormCache,
  fetchRegistrationForm,
  prefetchRegistrationForm,
  REGISTRATION_CACHE_TTL_MS
} from '../src/lib/registration-cache.mjs';

test('registration cache stores and retrieves within TTL', () => {
  clearRegistrationFormCache();
  const sample = { role: 'freelancer', state: 'form', html: '<form></form>' };
  setCachedRegistrationForm('freelancer', sample);

  assert.deepEqual(getCachedRegistrationForm('freelancer'), sample);
  assert.equal(getCachedRegistrationForm('freelancer', -1), null);
  assert.equal(getCachedRegistrationForm('employer'), null);
});

test('clearRegistrationFormCache clears all entries', () => {
  clearRegistrationFormCache();
  setCachedRegistrationForm('freelancer', { role: 'freelancer' });
  setCachedRegistrationForm('employer', { role: 'employer' });

  clearRegistrationFormCache();
  assert.equal(getCachedRegistrationForm('freelancer'), null);
  assert.equal(getCachedRegistrationForm('employer'), null);
});

test('fetchRegistrationForm caches and deduplicates concurrent calls', async () => {
  clearRegistrationFormCache();
  let calls = 0;
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => {
    calls++;
    await new Promise(r => setTimeout(r, 25));
    return {
      ok: true,
      json: async () => ({ role: 'employer', state: 'form', html: '<form id="emp"></form>' })
    };
  };

  try {
    const [res1, res2] = await Promise.all([
      fetchRegistrationForm('employer'),
      fetchRegistrationForm('employer'),
    ]);

    assert.equal(calls, 1, 'Concurrent calls for the same role should share a single fetch');
    assert.equal(res1.role, 'employer');
    assert.equal(res2.role, 'employer');

    // Subsequent call should hit cache without network
    const cached = await fetchRegistrationForm('employer');
    assert.equal(calls, 1, 'Cached entry returned without network call');
    assert.deepEqual(cached, res1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

