<?php
/**
 * Plugin Name: POBlancer Next Auth & Session Bridge
 * Description: Production session bootstrap, sign-in, and registration form endpoints for Next.js frontend.
 */
defined('ABSPATH') || exit;

if (!defined('POB_WORKSPACE_ENABLED')) {
    define('POB_WORKSPACE_ENABLED', true);
}

function pob_next_allowed_origins() {
    $configured = get_option('pob_frontend_origin', '');
    $origins = [
        'https://pob.com.ng',
        'https://poblancer.pobacademycustomer6.workers.dev',
        'https://poblancer.workers.dev',
        'http://poblancer.local:3101',
        'http://poblancer.local:3102',
        'http://poblancer.local:3103',
        'http://localhost:3101',
        'http://localhost:3102',
        'http://localhost:3103',
        'http://localhost:3105',
    ];
    if (!empty($configured)) {
        $parts = array_map('trim', explode(',', $configured));
        $origins = array_merge($origins, $parts);
    }
    return array_unique(array_filter($origins));
}

function pob_next_guard() {
    nocache_headers();
    header('Cache-Control: private, no-store, max-age=0');
    header('X-Content-Type-Options: nosniff');
    
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        wp_send_json(['message' => 'Request method not permitted.'], 405);
    }
    if (($_SERVER['HTTP_X_POB_FRONTEND'] ?? '') !== '1') {
        wp_send_json(['message' => 'Request origin is not permitted.'], 403);
    }
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (empty($origin) && !empty($_SERVER['HTTP_REFERER'])) {
        $ref_parts = parse_url($_SERVER['HTTP_REFERER']);
        if (!empty($ref_parts['scheme']) && !empty($ref_parts['host'])) {
            $origin = $ref_parts['scheme'] . '://' . $ref_parts['host'] . (!empty($ref_parts['port']) ? ':' . $ref_parts['port'] : '');
        }
    }
    $allowed = pob_next_allowed_origins();
    if (!in_array($origin, $allowed, true)) {
        wp_send_json(['message' => 'Request origin is not permitted.'], 403);
    }
}

function pob_next_session() {
    pob_next_guard();
    $authenticated = is_user_logged_in();
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (empty($origin) && !empty($_SERVER['HTTP_REFERER'])) {
        $ref_parts = parse_url($_SERVER['HTTP_REFERER']);
        if (!empty($ref_parts['scheme']) && !empty($ref_parts['host'])) {
            $origin = $ref_parts['scheme'] . '://' . $ref_parts['host'] . (!empty($ref_parts['port']) ? ':' . $ref_parts['port'] : '');
        }
    }
    $data = [
        'authenticated'  => $authenticated,
        'home'           => home_url('/'),
        'original_login' => home_url('/login/'),
        'register'       => home_url('/pob-register/'),
        'captcha'        => class_exists('WP_Freeio_Recaptcha') && WP_Freeio_Recaptcha::is_recaptcha_enabled(),
    ];
    if ($authenticated) {
        $user = wp_get_current_user();
        $data['user']   = ['id' => $user->ID, 'name' => $user->display_name];
        $data['nonce']  = wp_create_nonce('wp_rest');
        $data['logout'] = html_entity_decode(wp_logout_url($origin . '/login'), ENT_QUOTES, 'UTF-8');
    } else {
        $data['login_nonce'] = wp_create_nonce('pob_next_login');
    }
    wp_send_json($data);
}

function pob_next_login() {
    pob_next_guard();
    if (!wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['_wpnonce'] ?? '')), 'pob_next_login')) {
        wp_send_json(['message' => 'This sign-in form has expired. Reload it and try again.'], 403);
    }
    if (class_exists('WP_Freeio_Recaptcha') && WP_Freeio_Recaptcha::is_recaptcha_enabled()) {
        wp_send_json(['message' => 'Please use the original login page for verification.'], 409);
    }
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    $key = 'pob_login_' . hash_hmac('sha256', $ip, wp_salt('auth'));
    $attempts = (int) get_transient($key);
    if ($attempts >= 8) {
        wp_send_json(['message' => 'Please wait 15 minutes before trying again.'], 429);
    }
    set_transient($key, $attempts + 1, 15 * MINUTE_IN_SECONDS);
    
    $user = wp_signon([
        'user_login'    => sanitize_text_field(wp_unslash($_POST['log'] ?? '')),
        'user_password' => wp_unslash($_POST['pwd'] ?? ''),
        'remember'      => !empty($_POST['rememberme']),
    ], is_ssl());
    
    if (is_wp_error($user)) {
        $error_message = wp_strip_all_tags($user->get_error_message());
        if (empty($error_message)) {
            $error_message = 'Sign-in failed. Check your details or use the original login page.';
        }
        wp_send_json(['message' => $error_message], 401);
    }
    
    delete_transient($key);
    wp_send_json(['authenticated' => true]);
}

function pob_next_registration() {
    pob_next_guard();
    $role = (isset($_POST['role']) && $_POST['role'] === 'employer') ? 'employer' : 'freelancer';
    $data = [
        'role'       => $role,
        'home'       => home_url('/'),
        'native_url' => home_url('/pob-register/?role=' . $role),
    ];
    if (is_user_logged_in()) {
        wp_send_json(array_merge($data, ['state' => 'authenticated']));
    }
    if (!get_option('users_can_register')) {
        wp_send_json(array_merge($data, ['state' => 'closed']));
    }
    if (!class_exists('WP_Freeio_User')) {
        wp_send_json(['message' => 'Registration is unavailable.'], 503);
    }
    if (class_exists('WP_Freeio_Recaptcha') && WP_Freeio_Recaptcha::is_recaptcha_enabled()) {
        wp_send_json(array_merge($data, ['state' => 'verification']));
    }
    
    $html = do_shortcode('[wp_freeio_register_' . $role . ']');
    ob_start();
    do_action('register_form_after');
    $providers = ob_get_clean();
    
    wp_send_json(array_merge($data, [
        'state'            => 'form',
        'html'             => $html,
        'providers_html'   => $providers,
        'provider_handoff' => (bool) preg_match('/<script\b|\son[a-z]+\s*=/i', $providers),
    ]));
}

foreach (['pob_next_session', 'pob_next_login', 'pob_next_registration'] as $action) {
    add_action('wp_ajax_' . $action, $action);
    add_action('wp_ajax_nopriv_' . $action, $action);
}
