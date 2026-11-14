// Customer-facing message sanitization for POBlancer.
// Strips technical jargon, stack traces, and internal platform references
// (WordPress, PHP, Cloudflare, Nonces, CORS, status codes) to present clear,
// friendly, and accurate messages to users.

export function stripHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function containsTechnicalJargon(str) {
  if (typeof str !== 'string') return false;
  return /\b(wordpress|wp_|wp-[\w]+|php|mysql|database|sql|table|nonce|rest_cookie|cors|origin|status\s*code|502|503|504|403|401|404|400|500|cloudflare|worker|stack\s*trace|exception|undefined|null|object|array|function|eval)\b/i.test(str);
}

export function sanitizeCustomerMessage(raw, context = 'general') {
  if (!raw) {
    if (context === 'login') return 'Sign-in is temporarily unavailable. Please try again in a moment.';
    if (context === 'register') return "We couldn't complete your registration right now. Please check your details and try again.";
    return "We couldn't complete your request right now. Please try again in a moment. If the problem continues, contact our support team.";
  }

  const clean = stripHtml(String(raw));

  // 1. Incorrect email or password
  if (/(?:password.*(?:incorrect|invalid|wrong|mismatch)|incorrect.*password|invalid.*password)/i.test(clean)) {
    return "The password you entered is incorrect. Please check your password or use 'Forgotten password' to reset it.";
  }

  // 2. Account not found / invalid username or email
  if (/(?:unknown.*(?:username|email)|not registered|no account found|could not find.*account|account.*not found)/i.test(clean)) {
    return "We couldn't find an account matching those details. Please check your email or username and try again.";
  }

  // 3. Email or username already registered
  if (/(?:already registered|already in use|already exists|username.*already taken|email.*already taken)/i.test(clean)) {
    return "An account with this email address or username already exists. Please log in or use 'Forgotten password'.";
  }

  // 4. Passwords do not match
  if (/(?:passwords? (?:do not|must) match)/i.test(clean)) {
    return "The passwords do not match. Please re-enter your password.";
  }

  // 5. Session expired / nonce error
  if (/(?:expired|sign in again|session.*expired|invalid session|session credentials|nonce)/i.test(clean)) {
    return "Your session has expired. Please refresh the page and sign in again.";
  }

  // 6. Permission denied / origin / CORS
  if (/(?:permission|not permitted|access denied|unauthorized|forbidden|cross-origin)/i.test(clean)) {
    return "You don't have permission to perform this action from your current browser session.";
  }

  // 7. Account requires verification or approval
  if (/(?:pending approval|requires approval|account verification|verification document|pending verification)/i.test(clean)) {
    return "Your account has been submitted and is pending verification. We will notify you once it has been approved.";
  }

  // 8. Rate limiting
  if (/(?:too many attempts|wait \d+ minutes|wait before trying)/i.test(clean)) {
    return "Too many attempts. Please wait a few minutes before trying again.";
  }

  // 9. Uncertain registration / could not confirm
  if (/(?:could not confirm|no automatic retry|uncertain)/i.test(clean)) {
    if (context === 'register') {
      return "We couldn't confirm whether your registration completed. Please check your email inbox or try logging in before submitting again. If you need assistance, contact our support team.";
    }
    return "We couldn't complete your request right now. Please try again in a moment. If the problem continues, contact our support team.";
  }

  // 10. Unavailable / timeout / connection error
  if (/(?:unavailable|connection|timeout|failed to fetch|network error|offline)/i.test(clean)) {
    if (context === 'login') return "Sign-in is temporarily unavailable. Please try again in a moment.";
    if (context === 'register') return "Registration is temporarily unavailable. Please try again in a moment.";
    return "Connection temporarily unavailable. Please check your connection or try again shortly.";
  }

  // 11. If contains technical keywords, sanitize to friendly fallback
  if (containsTechnicalJargon(clean)) {
    if (context === 'login') return "Sign-in is temporarily unavailable. Please try again in a moment.";
    if (context === 'register') return "We couldn't complete your registration right now. Please check your details and try again.";
    return "We couldn't complete your request right now. Please try again in a moment. If the problem continues, contact our support team.";
  }

  // If clean human-readable text without jargon, return it
  return clean;
}
