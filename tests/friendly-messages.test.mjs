import test from 'node:test';
import assert from 'node:assert/strict';
import {
  stripHtml,
  containsTechnicalJargon,
  sanitizeCustomerMessage
} from '../src/lib/friendly-messages.mjs';

test('stripHtml strips HTML tags and normalizes whitespace', () => {
  assert.equal(stripHtml('<strong>Error:</strong> Invalid password!'), 'Error: Invalid password!');
  assert.equal(stripHtml('<p>Please check <span>fields</span></p>'), 'Please check fields');
  assert.equal(stripHtml(''), '');
  assert.equal(stripHtml(null), '');
});

test('containsTechnicalJargon detects technical implementation keywords', () => {
  assert.equal(containsTechnicalJargon('WordPress could not confirm the result'), true);
  assert.equal(containsTechnicalJargon('Database connection error in table wp_users'), true);
  assert.equal(containsTechnicalJargon('Status code 502 returned from worker'), true);
  assert.equal(containsTechnicalJargon('CORS origin failure'), true);
  assert.equal(containsTechnicalJargon('PHP Fatal Exception'), true);
  assert.equal(containsTechnicalJargon('nonce verification failed'), true);
  assert.equal(containsTechnicalJargon('Please enter your name.'), false);
  assert.equal(containsTechnicalJargon('Thank you for your message.'), false);
});

test('sanitizeCustomerMessage handles incorrect password', () => {
  const result = sanitizeCustomerMessage('<strong>Error:</strong> The password you entered for the username admin is incorrect.');
  assert.equal(result, "The password you entered is incorrect. Please check your password or use 'Forgotten password' to reset it.");
});

test('sanitizeCustomerMessage handles unknown account or email', () => {
  const result = sanitizeCustomerMessage('Error: Unknown email address. Check again or try your username.');
  assert.equal(result, "We couldn't find an account matching those details. Please check your email or username and try again.");
});

test('sanitizeCustomerMessage handles already registered email or username', () => {
  const result = sanitizeCustomerMessage('An account is already registered with your email address. Please log in.');
  assert.equal(result, "An account with this email address or username already exists. Please log in or use 'Forgotten password'.");
});

test('sanitizeCustomerMessage handles expired session or nonce', () => {
  const result = sanitizeCustomerMessage('rest_cookie_invalid_nonce: Cookie nonce is invalid');
  assert.equal(result, 'Your session has expired. Please refresh the page and sign in again.');
});

test('sanitizeCustomerMessage handles permissions and origin rejection', () => {
  const result = sanitizeCustomerMessage('Request origin is not permitted.');
  assert.equal(result, "You don't have permission to perform this action from your current browser session.");
});

test('sanitizeCustomerMessage handles uncertain registration outcome', () => {
  const result = sanitizeCustomerMessage('WordPress could not confirm registration. Check your email or sign in before trying again.', 'register');
  assert.equal(result, "We couldn't confirm whether your registration completed. Please check your email inbox or try logging in before submitting again. If you need assistance, contact our support team.");
});

test('sanitizeCustomerMessage handles general uncertain outcomes without tech jargon', () => {
  const result = sanitizeCustomerMessage('WordPress could not confirm the result. No automatic retry was performed.');
  assert.equal(result, "We couldn't complete your request right now. Please try again in a moment. If the problem continues, contact our support team.");
});

test('sanitizeCustomerMessage handles passwords mismatch', () => {
  const result = sanitizeCustomerMessage('The passwords do not match.');
  assert.equal(result, 'The passwords do not match. Please re-enter your password.');
});

test('sanitizeCustomerMessage preserves clean non-technical messages', () => {
  const msg = 'Please check the highlighted fields.';
  assert.equal(sanitizeCustomerMessage(msg), msg);
});

