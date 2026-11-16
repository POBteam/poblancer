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

// 1. Capture authenticated user ID from valid WordPress auth cookie before REST core resets it for non-nonce requests
add_filter('determine_current_user', function($user_id) {
    if (!empty($user_id)) {
        $GLOBALS['pob_authenticated_user_id'] = (int) $user_id;
    }
    return $user_id;
}, 25);

// 2. Prevent rest_cookie_check_errors from rejecting login, logout, register, and session bootstrap with rest_cookie_invalid_nonce
add_filter('rest_authentication_errors', function($result) {
    $rest_route = $GLOBALS['wp']->query_vars['rest_route'] ?? '';
    if (strpos($rest_route, '/poblancer/v1/login') !== false ||
        strpos($rest_route, '/poblancer/v1/logout') !== false ||
        strpos($rest_route, '/poblancer/v1/register') !== false ||
        strpos($rest_route, '/poblancer/v1/session') !== false ||
        strpos($rest_route, '/poblancer/v1/workspace') !== false ||
        strpos($rest_route, '/poblancer/v1/registration-form') !== false) {
        
        if (is_wp_error($result) && $result->get_error_code() === 'rest_cookie_invalid_nonce') {
            return true;
        }
    }
    return $result;
}, 101);

function pob_next_guard() {
    nocache_headers();
    header('Cache-Control: private, no-store, max-age=0');
    header('X-Content-Type-Options: nosniff');
    
    $method = $_SERVER['REQUEST_METHOD'] ?? '';
    if ($method !== 'POST' && $method !== 'GET') {
        wp_send_json(['message' => 'This action is not supported.'], 405);
    }
    if (($_SERVER['HTTP_X_POB_FRONTEND'] ?? '') !== '1') {
        wp_send_json(['message' => "You don't have permission to perform this action from your current browser session."], 403);
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
        wp_send_json(['message' => "You don't have permission to perform this action from your current browser session."], 403);
    }
}

function pob_next_session($request = null) {
    pob_next_guard();
    
    // If a valid WordPress auth cookie exists but was unset by REST core due to missing nonce, restore it
    if (empty(get_current_user_id()) && !empty($GLOBALS['pob_authenticated_user_id'])) {
        wp_set_current_user($GLOBALS['pob_authenticated_user_id']);
    }
    
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
        $data['logout'] = '/api/logout';

        // Single-trip workspace snapshot to eliminate serial waterfalls
        $include_workspace = false;
        $view = '';
        if ($request instanceof WP_REST_Request) {
            $include_workspace = (bool) $request->get_param('workspace');
            $view = (string) ($request->get_param('view') ?: '');
        } elseif (!empty($_GET['workspace']) || !empty($_POST['workspace'])) {
            $include_workspace = true;
            $view = (string) ($_GET['view'] ?? $_POST['view'] ?? '');
        }

        if ($include_workspace && class_exists('POB_Workspace')) {
            $snapshot = POB_Workspace::snapshot($view);
            if (!is_wp_error($snapshot)) {
                $snapshot['logout'] = '/api/logout';
                $data['workspace'] = $snapshot;
            }
        }
    } else {
        $data['login_nonce'] = wp_create_nonce('pob_next_login');
    }
    wp_send_json($data);
}

function pob_next_logout($request = null) {
    pob_next_guard();
    if (empty(get_current_user_id()) && !empty($GLOBALS['pob_authenticated_user_id'])) {
        wp_set_current_user($GLOBALS['pob_authenticated_user_id']);
    }
    wp_destroy_current_session();
    wp_clear_auth_cookie();
    wp_set_current_user(0);
    wp_send_json(['authenticated' => false, 'logged_out' => true]);
}

function pob_next_login($request = null) {
    pob_next_guard();
    $nonce = $_POST['_wpnonce'] ?? '';
    $log = $_POST['log'] ?? '';
    $pwd = $_POST['pwd'] ?? '';
    $remember = !empty($_POST['rememberme']);
    if ($request instanceof WP_REST_Request) {
        $n = $request->get_param('_wpnonce');
        if ($n !== null) $nonce = $n;
        $l = $request->get_param('log');
        if ($l !== null) $log = $l;
        $p = $request->get_param('pwd');
        if ($p !== null) $pwd = $p;
        $r = $request->get_param('rememberme');
        if ($r !== null) $remember = (bool)$r;
    }
    if (!wp_verify_nonce(sanitize_text_field(wp_unslash($nonce)), 'pob_next_login')) {
        wp_send_json(['message' => 'Your sign-in session has expired. Please refresh the page and sign in again.'], 403);
    }
    if (class_exists('WP_Freeio_Recaptcha') && WP_Freeio_Recaptcha::is_recaptcha_enabled()) {
        wp_send_json(['message' => 'Please complete sign-in using our standard login verification form.'], 409);
    }
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    $key = 'pob_login_' . hash_hmac('sha256', $ip, wp_salt('auth'));
    $attempts = (int) get_transient($key);
    if ($attempts >= 8) {
        wp_send_json(['message' => 'Too many sign-in attempts. Please wait 15 minutes before trying again.'], 429);
    }
    set_transient($key, $attempts + 1, 15 * MINUTE_IN_SECONDS);
    
    $user = wp_signon([
        'user_login'    => sanitize_text_field(wp_unslash($log)),
        'user_password' => wp_unslash($pwd),
        'remember'      => $remember,
    ], is_ssl());
    
    if (is_wp_error($user)) {
        $code = $user->get_error_code();
        if (in_array($code, ['invalid_username', 'invalid_email'], true)) {
            $error_message = "We couldn't find an account matching those details. Please check your email or username and try again.";
        } elseif ($code === 'incorrect_password') {
            $error_message = "The password you entered is incorrect. Please check your password or use 'Forgotten password' to reset it.";
        } elseif (in_array($code, ['empty_username', 'empty_password'], true)) {
            $error_message = "Please enter both your email or username and your password.";
        } else {
            $raw = wp_strip_all_tags($user->get_error_message());
            if (empty($raw) || preg_match('/wordpress|php|database|wp_|sql|table/i', $raw)) {
                $error_message = "The email, username, or password you entered is incorrect. Please try again.";
            } else {
                $error_message = $raw;
            }
        }
        wp_send_json(['authenticated' => false, 'message' => $error_message], 401);
    }
    
    delete_transient($key);
    wp_set_current_user($user->ID);
    wp_set_auth_cookie($user->ID, $remember, is_ssl());
    wp_send_json(['authenticated' => true]);
}

function pob_next_registration($request = null) {
    pob_next_guard();
    $role = 'freelancer';
    if ($request instanceof WP_REST_Request) {
        $r = $request->get_param('role');
        if ($r === 'employer') $role = 'employer';
    } elseif (isset($_POST['role']) && $_POST['role'] === 'employer') {
        $role = 'employer';
    }
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
        wp_send_json(['message' => 'Registration is temporarily unavailable. Please try again in a moment.'], 503);
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

function pob_next_register($request = null) {
    pob_next_guard();
    if ($request instanceof WP_REST_Request) {
        $params = $request->get_params();
        foreach ($params as $k => $v) {
            $_POST[$k] = $v;
            $_REQUEST[$k] = $v;
        }
    }
    try {
        if (class_exists('WP_Freeio_User')) {
            WP_Freeio_User::process_register_new();
        } else {
            wp_send_json(['status' => false, 'msg' => 'Registration is temporarily unavailable. Please try again in a moment.'], 503);
        }
    } catch (Throwable $e) {
        wp_send_json([
            'status' => false,
            'message' => 'Registration could not be completed at this time.',
        ], 500);
    }
}

foreach (['pob_next_session', 'pob_next_login', 'pob_next_logout', 'pob_next_registration', 'pob_next_register'] as $action) {
    add_action('wp_ajax_' . $action, $action);
    add_action('wp_ajax_nopriv_' . $action, $action);
}

// Support direct frontend endpoints outside /wp-admin/
add_action('wp_loaded', function() {
    $action = $_GET['pob_ajax'] ?? $_POST['pob_ajax'] ?? '';
    if (in_array($action, ['pob_next_session', 'pob_next_login', 'pob_next_logout', 'pob_next_registration', 'pob_next_register'], true)) {
        call_user_func($action);
        exit;
    }
});

add_filter('rest_post_dispatch', function($response, $server, $request) {
    if ($response instanceof WP_REST_Response) {
        $data = $response->get_data();
        if (is_array($data) && isset($data['logout'])) {
            $data['logout'] = '/api/logout';
            $response->set_data($data);
        }
    }
    return $response;
}, 10, 3);

add_action('rest_api_init', function() {
    register_rest_route('poblancer/v1', '/session', [
        'methods'             => ['GET', 'POST'],
        'callback'            => 'pob_next_session',
        'permission_callback' => '__return_true',
    ]);
    register_rest_route('poblancer/v1', '/login', [
        'methods'             => 'POST',
        'callback'            => 'pob_next_login',
        'permission_callback' => '__return_true',
    ]);
    register_rest_route('poblancer/v1', '/logout', [
        'methods'             => ['GET', 'POST'],
        'callback'            => 'pob_next_logout',
        'permission_callback' => '__return_true',
    ]);
    register_rest_route('poblancer/v1', '/registration-form', [
        'methods'             => 'POST',
        'callback'            => 'pob_next_registration',
        'permission_callback' => '__return_true',
    ]);
    register_rest_route('poblancer/v1', '/register', [
        'methods'             => 'POST',
        'callback'            => 'pob_next_register',
        'permission_callback' => '__return_true',
    ]);
});
