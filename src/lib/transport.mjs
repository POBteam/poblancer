export const endpoints = new Set(['workspace','page-views','listings','addons','service-editor','video-portfolio','proposal-submit','public-action','commerce','job-application','availability','editor-terms','employer-editor','profile','messages','collection','account-tool','management','contract','support','support/action','support/demo']);
export function localBatchOrigin(origin,isolatedBenchmark=false){
  return origin==='http://poblancer.local'||(isolatedBenchmark===true&&origin==='http://127.0.0.1:8001');
}
export function allowedPath(parts) {
  const path=parts.join('/');
  return (parts[0]==='poblancer' && parts[1]==='v1' && endpoints.has(parts.slice(2).join('/'))) || path==='wp/v2/media';
}
export function validOrigin(request, expected) {
  return request.headers.get('origin')===new URL(expected).origin;
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
