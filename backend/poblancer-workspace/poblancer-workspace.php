<?php
/**
 * Plugin Name: POBlancer Workspace
 * Description: Local pilot of a lightweight account frontend backed by Freeio.
 * Version: 0.6.3
 */
defined('ABSPATH') || exit;

final class POB_Workspace {
    const VERSION = '0.6.3';
    public static function boot() {
        add_action('template_redirect', [__CLASS__, 'render'], -100);
        add_action('rest_api_init', [__CLASS__, 'routes']);
        add_action('admin_post_nopriv_pob_workspace_login', [__CLASS__, 'login']);
        add_action('admin_post_pob_workspace_login', [__CLASS__, 'login']);
    }
    public static function allowed() {
        return wp_get_environment_type() === 'local' || (defined('POB_WORKSPACE_ENABLED') && POB_WORKSPACE_ENABLED);
    }
    public static function routes() {
        register_rest_route('poblancer/v1', '/workspace', [
            'methods' => 'GET', 'callback' => [__CLASS__, 'api'],
            'permission_callback' => function () { return self::allowed() && is_user_logged_in(); },
        ]);
    }
    public static function api($request) {
        $result = self::snapshot($request->get_param('view'));
        if (is_wp_error($result)) return $result;
        $response = new WP_REST_Response($result);
        $response->header('Cache-Control', 'private, no-store, max-age=0');
        $response->header('Vary', 'Cookie');
        return $response;
    }
    private static function count_posts($type, $statuses, $author, $meta = []) {
        $args = ['post_type' => $type, 'post_status' => $statuses, 'posts_per_page' => 1,
            'fields' => 'ids', 'ignore_sticky_posts' => true, 'update_post_meta_cache' => false,
            'update_post_term_cache' => false];
        if ($author) $args['author'] = $author;
        if ($meta) $args['meta_query'] = $meta;
        return (int) (new WP_Query($args))->found_posts;
    }
    private static function ids($type, $user) {
        $ids = get_posts(['post_type' => $type, 'post_status' => ['publish','hired','completed','cancelled'],
            'author' => $user, 'numberposts' => -1, 'fields' => 'ids']);
        $all = [0];
        foreach ($ids as $id) {
            $translated = apply_filters('wp-freeio-translations-post-ids', $id);
            $all = array_merge($all, is_array($translated) && $translated ? $translated : [$id]);
        }
        return array_values(array_unique(array_map('absint', $all)));
    }
    public static function menu($role) {
        $definitions = $role === 'employer' ? [
            'Submit Job'=>'submission-job','Submit Project'=>'submission-project','My Jobs'=>'my-jobs',
            'My Projects'=>'my-projects','Messages'=>'messages','Meetings'=>'employer-meetings',
            'Jobs Applicants'=>'jobs-applicants','Bought Services'=>'my-bought-services',
            'Favorite'=>'favorite','Verify'=>'verify','Profile'=>'profile',
            'Delete Profile'=>'delete-profile','Change Password'=>'change-password',
        ] : [
            'Submit Service'=>'submission-service','Service Addon'=>'submission-service-addon',
            'My Services'=>'my-services','Messages'=>'messages','Meetings'=>'freelancer-meetings',
            'Proposals'=>'my-proposals','Jobs Applied'=>'my-applied','Jobs Alerts'=>'jobs-alerts',
            'Favorite'=>'favorite','Statements'=>'statements','Payouts'=>'payouts',
            'Verify'=>'verify','Profile'=>'profile','Delete Profile'=>'delete-profile','Change Password'=>'change-password',
        ];
        $items = [];
        $routes=['my-jobs'=>'jobs','jobs-applicants'=>'applicants','my-bought-services'=>'bought-services','freelancer-meetings'=>'meetings','employer-meetings'=>'meetings','my-services'=>'listings','my-projects'=>'listings','submission-service-addon'=>'addons','submission-service'=>'service-editor','messages'=>'messages','profile'=>'profile','submission-job'=>'job-editor','submission-project'=>'project-editor','favorite'=>'favorites','statements'=>'statements','payouts'=>'payouts','verify'=>'verify','change-password'=>'change-password','delete-profile'=>'delete-profile','my-proposals'=>'proposals','my-applied'=>'applied','jobs-alerts'=>'alerts'];
        foreach ($definitions as $label => $path) { $route=$routes[$path]??null; $items[] = ['label'=>$label,'route'=>$route,'url'=>$route ? home_url('/pob-workspace/#'.$route) : home_url('/'.$path.'/'), 'native'=>!$route]; }
        return $items;
    }
    public static function snapshot($view = '') {
        if (!is_user_logged_in()) return new WP_Error('pob_auth', 'Please sign in.', ['status'=>401]);
        if (!class_exists('WP_Freeio_User')) return new WP_Error('pob_freeio', 'The marketplace is unavailable.', ['status'=>503]);
        $user = wp_get_current_user();
        $owner = WP_Freeio_User::get_user_id();
        $employer = WP_Freeio_User::is_employer();
        $freelancer = WP_Freeio_User::is_freelancer();
        $admin = current_user_can('manage_options');
        // Preview changes presentation only. It never impersonates another account.
        $role = $employer ? 'employer' : 'freelancer';
        if ($admin && in_array($view, ['freelancer','employer'], true)) $role = $view;
        if (!$admin && !$employer && !$freelancer) return new WP_Error('pob_role', 'This account does not have a marketplace profile.', ['status'=>403]);
        $profile = $role === 'employer' ? WP_Freeio_User::get_employer_by_user_id($owner) : WP_Freeio_User::get_freelancer_by_user_id($owner);
        $key = 'pobws_'.self::VERSION.'_'.$user->ID.'_'.$owner.'_'.$role;
        $data = get_transient($key);
        if (!is_array($data)) {
            $status = ['publish','hired','completed','cancelled'];
            $type = $role === 'employer' ? 'project' : 'service';
            $ids = self::ids($type, $owner);
            $prefix = $role === 'employer' ? WP_FREEIO_PROJECT_PROPOSAL_PREFIX : WP_FREEIO_SERVICE_ORDER_PREFIX;
            $meta = [['key'=>$prefix.($role === 'employer' ? 'project_id':'service_id'), 'value'=>$ids, 'compare'=>'IN']];
            $related = $role === 'employer' ? 'project_proposal' : 'service_order';
            $stats = $role === 'employer' ? [
                ['label'=>'Posted Projects','value'=>self::count_posts('project',$status,$owner)],
                ['label'=>'Completed Projects','value'=>self::count_posts('project','completed',$owner)],
                ['label'=>'Proposals','value'=>self::count_posts($related,$status,0,$meta)],
            ] : [
                ['label'=>'Posted Services','value'=>self::count_posts('service',$status,$owner)],
                ['label'=>'Completed Services','value'=>self::count_posts($related,'completed',0,$meta)],
                ['label'=>'In Queue Services','value'=>self::count_posts($related,'hired',0,$meta)],
            ];
            $stats[] = ['label'=>'Reviews','value'=>$profile && class_exists('WP_Freeio_Review') ? (int) WP_Freeio_Review::get_total_reviews($profile) : 0];
            $rows = get_posts(['post_type'=>$related, 'post_status'=>$role === 'employer' ? $status : ['hired','completed','cancelled'],
                'posts_per_page'=>5, 'meta_query'=>$meta]);
            $recent = [];
            foreach ($rows as $row) {
                $parent = absint(get_post_meta($row->ID,$prefix.($role === 'employer' ? 'project_id':'service_id'),true));
                $url = $role === 'employer' ? home_url('/my-projects/') : add_query_arg(['service_id'=>$parent,'service_order_id'=>$row->ID,'action'=>'view-history'],home_url('/my-services/'));
                $state = get_post_status_object($row->post_status);
                $recent[] = ['id'=>$row->ID,'title'=>get_the_title($row),'parent'=>get_the_title($parent),
                    'status'=>$state ? $state->label : $row->post_status,'date'=>get_the_date('j M Y',$row),'url'=>'#contract/'.($role==='employer'?'project':'service').'/'.$row->ID];
            }
            $notifications = [];
            if ($profile && class_exists('WP_Freeio_User_Notification')) {
                foreach (array_slice((array) WP_Freeio_User_Notification::get_notifications($profile,$role),0,8) as $note) {
                    $notifications[] = ['html'=>wp_kses_post(WP_Freeio_User_Notification::display_notify($note))];
                }
            }
            $group = $profile && $role === 'freelancer' ? get_post_meta($profile, WP_FREEIO_FREELANCER_PREFIX.'freelancer_type',true) : '';
            $groups = is_string($group) && $group !== '' ? [sanitize_text_field($group)] : [];
            $balance = $role === 'freelancer' && class_exists('WP_Freeio_Post_Type_Withdraw') ? WP_Freeio_Post_Type_Withdraw::get_freelancer_balance($owner) : null;
            $data = ['stats'=>$stats,'recent'=>$recent,'notifications'=>$notifications,
                'groups'=>is_wp_error($groups) ? [] : $groups,
                'balance'=>is_array($balance) && isset($balance['current_balance']) ? (float) $balance['current_balance'] : null,
                'generated_at'=>gmdate('c')];
            set_transient($key,$data,20);
        }
        $support = class_exists('POB_Support') ? POB_Support::read() : null;
        return array_merge($data,[
            'support'=>$support instanceof WP_REST_Response ? $support->get_data() : null,
            'user'=>['name'=>$user->display_name,'role'=>$role,'admin'=>$admin,'profile_url'=>$profile ? get_permalink($profile) : null,
                'avatar'=>get_avatar_url($user->ID,['size'=>80])],
            'menu'=>self::menu($role), 'currency'=>function_exists('get_woocommerce_currency') ? get_woocommerce_currency() : null,
            'native_dashboard'=>home_url('/'.$role.'-dashboard/'),
            'logout'=>wp_logout_url(home_url('/pob-login/')),
        ]);
    }
    public static function login() {
        if (!self::allowed()) wp_die('Not available.', '', ['response'=>404]);
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') wp_die('Method not allowed.', '', ['response'=>405]);
        check_admin_referer('pob_workspace_login');
        if (class_exists('WP_Freeio_Recaptcha') && WP_Freeio_Recaptcha::is_recaptcha_enabled()) {
            wp_safe_redirect(home_url('/login/')); exit;
        }
        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        $key = 'pob_login_'.hash_hmac('sha256',$ip,wp_salt('auth'));
        $attempts = (int) get_transient($key);
        if ($attempts >= 8) { wp_safe_redirect(home_url('/pob-login/?error=limited')); exit; }
        set_transient($key,$attempts+1,15*MINUTE_IN_SECONDS);
        $result = wp_signon(['user_login'=>sanitize_text_field(wp_unslash($_POST['log'] ?? '')),
            'user_password'=>wp_unslash($_POST['pwd'] ?? ''),'remember'=>!empty($_POST['rememberme'])],is_ssl());
        if (is_wp_error($result)) { wp_safe_redirect(home_url('/pob-login/?error=invalid')); exit; }
        delete_transient($key);
        wp_safe_redirect(home_url('/pob-workspace/')); exit;
    }
    public static function render() {
        $path = trim((string) wp_parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH),'/');
        if (!in_array($path,['pob-login','pob-register','pob-workspace'],true) || !self::allowed()) return;
        if (!defined('DONOTCACHEPAGE')) define('DONOTCACHEPAGE',true);
        nocache_headers();
        status_header(200);
        if ($path === 'pob-workspace' && !is_user_logged_in()) { wp_safe_redirect(home_url('/pob-login/')); exit; }
        $login = $path === 'pob-login';
        $base = plugin_dir_url(__FILE__);
        $config = ['api'=>rest_url('poblancer/v1/workspace'),'supportApi'=>rest_url('poblancer/v1/support'),'nonce'=>wp_create_nonce('wp_rest'),
            'home'=>home_url('/'),'login'=>home_url('/pob-login/'),'register'=>home_url('/pob-register/'),'listingsApi'=>rest_url('poblancer/v1/listings'),'viewsApi'=>rest_url('poblancer/v1/page-views'),'addonsApi'=>rest_url('poblancer/v1/addons'),'editorApi'=>rest_url('poblancer/v1/service-editor'),'termsApi'=>rest_url('poblancer/v1/editor-terms'),'messagesApi'=>rest_url('poblancer/v1/messages'),'profileApi'=>rest_url('poblancer/v1/profile'),'toolsApi'=>rest_url('poblancer/v1/account-tool'),'collectionApi'=>rest_url('poblancer/v1/collection'),'employerEditorApi'=>rest_url('poblancer/v1/employer-editor'),'managementApi'=>rest_url('poblancer/v1/management'),'contractApi'=>rest_url('poblancer/v1/contract'),'mediaApi'=>rest_url('wp/v2/media'),
            'assetBase'=>$base.'assets/'];
        header('X-Robots-Tag: noindex, nofollow',true);
        header('X-Content-Type-Options: nosniff');
        ?><!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title><?php echo $login ? 'Login' : ($path === 'pob-register' ? 'Sign Up' : 'Dashboard'); ?> | POBlancer</title><link rel="stylesheet" href="<?php echo esc_url($base.'assets/workspace.css?v='.self::VERSION); ?>"></head><body>
        <a class="skip" href="#main">Skip to content</a>
        <?php if ($path === 'pob-register') : POB_Account::registration(); elseif ($login) : ?>
        <div class="login-layout"><aside class="login-story"><a href="<?php echo esc_url(home_url('/')); ?>"><img class="brand-image" src="<?php echo esc_url(content_url('/uploads/2022/10/1-1.png')); ?>" alt="POBlancer"></a><div><span class="eyebrow">POB Digital Experts</span><h1>Sign in to manage your projects, jobs, and account as a freelancer or employer.</h1></div><span class="pilot-label">Local workspace pilot</span></aside>
        <main id="main" class="login-main"><a class="back-link" href="<?php echo esc_url(home_url('/')); ?>">← Back to website</a><section><span class="eyebrow">POBlancer</span><h2>Log In</h2>
        <?php if (!empty($_GET['error'])) : ?><div class="alert" role="alert"><?php echo $_GET['error']==='limited' ? 'Please wait 15 minutes before trying again.' : 'Sign-in failed. Check your details or use the original login page for additional verification.'; ?></div><?php endif; ?>
        <form action="<?php echo esc_url(admin_url('admin-post.php')); ?>" method="post"><input type="hidden" name="action" value="pob_workspace_login"><?php wp_nonce_field('pob_workspace_login'); do_action('login_form'); ?>
        <label>Email<input name="log" autocomplete="username" required></label><label>Password<input type="password" name="pwd" autocomplete="current-password" required></label>
        <div class="form-row"><label class="check"><input type="checkbox" name="rememberme"> Keep me signed in</label><a href="<?php echo esc_url(wp_lostpassword_url()); ?>">Forgotten password?</a></div><button class="primary" type="submit">Login</button></form>
        <p><a href="<?php echo esc_url(home_url('/pob-register/')); ?>">Sign Up</a></p><a class="subtle" href="<?php echo esc_url(home_url('/login/')); ?>">Use the original login page</a></section></main></div>
        <?php else : ?>
        <div id="app"><main id="main" class="loading" role="status">Loading your dashboard…</main></div>
        <script id="pob-config" type="application/json"><?php echo wp_json_encode($config,JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT); ?></script><script type="module" src="<?php echo esc_url($base.'assets/workspace.js?v='.self::VERSION); ?>"></script>
        <?php endif; ?></body></html><?php exit;
    }
}
POB_Workspace::boot();
require_once __DIR__.'/account.php';
require_once __DIR__.'/addons.php';
require_once __DIR__.'/service-editor.php';
require_once __DIR__.'/messages.php';
require_once __DIR__.'/profile.php';
require_once __DIR__.'/account-tools.php';
require_once __DIR__.'/collections.php';
require_once __DIR__.'/employer-editors.php';
require_once __DIR__.'/contracts.php';
require_once __DIR__.'/management.php';
require_once __DIR__.'/support.php';
require_once __DIR__.'/support-admin.php';
POB_Support::boot();
add_action('init',function() { if (POB_Workspace::allowed()) POB_Support::install(); });

require_once __DIR__.'/video-portfolio.php';

require_once __DIR__.'/proposal-submit.php';

require_once __DIR__.'/public-actions.php';

require_once __DIR__.'/commerce.php';

require_once __DIR__.'/frontend-sync.php';

require_once __DIR__.'/job-application.php';

require_once __DIR__.'/portfolio-admin.php';

require_once __DIR__.'/availability.php';
