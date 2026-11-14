export const endpoints = new Set(['workspace','page-views','listings','addons','service-editor','video-portfolio','proposal-submit','public-action','commerce','job-application','availability','editor-terms','employer-editor','profile','messages','collection','account-tool','management','contract','support','support/action','support/demo']);
export function localBatchOrigin(origin,isolatedBenchmark=false){
  return origin==='http://poblancer.local'||(isolatedBenchmark===true&&origin==='http://127.0.0.1:8001');
}
export function allowedPath(parts) {
  const path=parts.join('/');
  return (parts[0]==='poblancer' && parts[1]==='v1' && endpoints.has(parts.slice(2).join('/'))) || path==='wp/v2/media';
}
export function validOrigin(request, expected) {
  let reqOrigin = request.headers.get('origin');
  if (!reqOrigin || reqOrigin === 'null') {
    const referer = request.headers.get('referer');
    if (referer) {
      try {
        reqOrigin = new URL(referer).origin;
      } catch {
        return false;
      }
    }
  }
  if (!reqOrigin || reqOrigin === 'null') return false;
  let normalizedReq;
  try {
    normalizedReq = new URL(reqOrigin).origin;
  } catch {
    return false;
  }
  const allowedList = Array.isArray(expected)
    ? expected
    : expected instanceof Set
      ? Array.from(expected)
      : typeof expected === 'string'
        ? expected.split(',').map(s => s.trim()).filter(Boolean)
        : [expected];
  for (const item of allowedList) {
    try {
      if (normalizedReq === new URL(item).origin) return true;
    } catch {
      // ignore invalid item
    }
  }
  return false;
}
export function sanitizeSetCookie(cookie) {
  if (typeof cookie !== 'string') return cookie;
  return cookie.replace(/;\s*domain=[^;]+/gi, '');
}
export function sessionCookies(value='') {
  return value.split(';').map(s=>s.trim()).filter(s=>
    /^(wordpress_logged_in_[a-z0-9]+|wordpress_sec_[a-z0-9]+|wordpress_[a-z0-9]+|wp_woocommerce_session_[a-z0-9]+|woocommerce_cart_hash|woocommerce_items_in_cart)=/i.test(s)||
    // Freeio's final native notice handler consumes these preview-step markers.
    /^(service|job|project)_add_new_update=(new|update)$/.test(s)
  ).join('; ');
}
export function safeReturnPath(value) {
  return typeof value==='string' && /^\/workspace(?:[/?#]|$)/.test(value) && !value.includes('\\') ? value : '/workspace';
}
