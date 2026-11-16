import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getCachedEditor,
  setCachedEditor,
  invalidateEditorCache,
  clearEditorCache,
  prefetchEditorData,
  getEditorCacheKey,
  CACHE_TTL_MS
} from '../src/lib/editor-cache.mjs';

test('editor cache key formats consistently with role/user context', () => {
  assert.equal(getEditorCacheKey('service', 0, 42), '42:service:0');
  assert.equal(getEditorCacheKey('service', 123, 'admin'), 'admin:service:123');
  assert.equal(getEditorCacheKey('project', 0, undefined), 'anon:project:0');
});

test('editor cache stores and retrieves within TTL', () => {
  clearEditorCache();
  const sample = { id: 0, fields: [{ id: 'title', value: '' }], packages: [] };
  setCachedEditor('service', 0, 10, sample);

  const retrieved = getCachedEditor('service', 0, 10);
  assert.deepEqual(retrieved, sample);

  // Expired maxAge returns null
  const expired = getCachedEditor('service', 0, 10, -1);
  assert.equal(expired, null);
});

test('invalidateEditorCache evicts specific entry', () => {
  clearEditorCache();
  setCachedEditor('service', 0, 10, { id: 0 });
  setCachedEditor('service', 5, 10, { id: 5 });

  invalidateEditorCache('service', 0, 10);
  assert.equal(getCachedEditor('service', 0, 10), null);
  assert.deepEqual(getCachedEditor('service', 5, 10), { id: 5 });
});

test('prefetchEditorData fetches, stores and avoids duplicate in-flight requests', async () => {
  clearEditorCache();
  let fetchCount = 0;
  const mockFetcher = async (url, nonce) => {
    fetchCount++;
    await new Promise(r => setTimeout(r, 20));
    return { id: 0, fields: [{ id: 'service_title', value: '' }], packages: [] };
  };

  const session = { nonce: 'test_nonce', user: { id: 99 } };

  // Concurrent prefetch calls
  const [res1, res2] = await Promise.all([
    prefetchEditorData(mockFetcher, session, 'service', 0),
    prefetchEditorData(mockFetcher, session, 'service', 0),
  ]);

  assert.equal(fetchCount, 1, 'Only one network call was dispatched for concurrent prefetch');
  assert.equal(res1.id, 0);
  assert.equal(res2.id, 0);

  // Subsequent call hits cache directly
  const cached = await prefetchEditorData(mockFetcher, session, 'service', 0);
  assert.equal(fetchCount, 1, 'Cache hit avoided subsequent network request');
  assert.deepEqual(cached, res1);
});
