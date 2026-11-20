import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Cookie consent component enforces NDPA 2023 compliance, distinct categories, and consent state', () => {
  const content = fs.readFileSync(new URL('../src/components/CookieConsent.tsx', import.meta.url), 'utf8');

  // Verify NDPA 2023 and legal references
  assert.ok(content.includes('Nigeria Data Protection Act (NDPA 2023)'), 'Banner must cite NDPA 2023');

  // Verify three standard user action buttons
  assert.ok(content.includes('Accept All'), 'Must have Accept All button');
  assert.ok(content.includes('Reject Non-Essential'), 'Must have Reject Non-Essential button');
  assert.ok(content.includes('Manage Preferences'), 'Must have Manage Preferences button');

  // Verify four categories
  assert.ok(content.includes('Strictly Essential Cookies'), 'Must have Essential cookies category');
  assert.ok(content.includes('Always Active'), 'Essential category must be marked Always Active');
  assert.ok(content.includes('Preferences') && content.includes('User Experience'), 'Must have Preferences category');
  assert.ok(content.includes('Performance') && content.includes('Analytics'), 'Must have Analytics category');
  assert.ok(content.includes('Third-Party Media Embeds'), 'Must have Media category');

  // Verify custom event listeners for reopening
  assert.ok(content.includes('poblancer:open-cookie-preferences'), 'Must listen to global open event');
  assert.ok(content.includes('poblancer_cookie_consent_v1'), 'Must use versioned storage key');

  // Verify accessibility
  assert.ok(content.includes('role="region"'), 'Banner must have role="region"');
  assert.ok(content.includes('role="dialog"'), 'Preferences modal must have role="dialog"');
  assert.ok(content.includes('aria-modal="true"'), 'Modal must have aria-modal attribute');
});
