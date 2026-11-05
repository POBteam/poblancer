<?php
defined('ABSPATH') || exit;
final class POB_Account {
    public static function boot() {
        add_action('rest_api_init', function () {
            register_rest_route('poblancer/v1', '/page-views', [
                'methods'=>'GET','callback'=>[__CLASS__,'views'],
                'permission_callback'=>function () { return POB_Workspace::allowed() && is_user_logged_in(); },
            ]);
            register_rest_route('poblancer/v1', '/listings', [
                'methods'=>'GET', 'callback'=>[__CLASS__,'listings'],
                'permission_callback'=>function () { return POB_Workspace::allowed() && is_user_logged_in(); },
            ]);
        });
    }
    public static function views($request) {
        if (!is_user_logged_in()) return new WP_Error('pob_auth','Please sign in.',['status'=>401]);
        $id=absint($request['id']);$post=get_post($id);$owner=WP_Freeio_User::get_user_id();
        if (!$post || !in_array($post->post_type,['service','project'],true) || (int)$post->post_author!==(int)$owner) return new WP_Error('pob_owner','Listing unavailable.',['status'=>403]);
        $days=absint($request['days']);if(!in_array($days,[7,15,30],true))$days=15;
        $stored=get_post_meta($id,'_views_by_date',true);$stored=is_array($stored)?$stored:[];$points=[];
        for($i=$days;$i>=0;$i--){$date=wp_date('Y-m-d',strtotime('-'.$i.' days',current_time('timestamp',true)));$points[]=['date'=>$date,'views'=>max(0,(int)($stored[$date]??0))];}
        $r=new WP_REST_Response(['points'=>$points]);$r->header('Cache-Control','private, no-store');return $r;
    }
    public static function listings($request) {
        if (!is_user_logged_in()) return new WP_Error('pob_auth','Please sign in.',['status'=>401]);
        $owner = WP_Freeio_User::get_user_id();
        $employer = WP_Freeio_User::is_employer();
        if (current_user_can('manage_options') && $request['view']==='employer') $employer = true;
        $type = $employer ? 'project' : 'service';
        if (!current_user_can('manage_options') && !WP_Freeio_User::is_freelancer() && !$employer) return new WP_Error('pob_role','Marketplace account required.',['status'=>403]);
        $page = max(1,absint($request['page']));
        $q = new WP_Query(['post_type'=>$type,'author'=>$owner,'post_status'=>['publish','pending','pending_approve','pending_payment','draft','preview','expired','hired','completed','cancelled'],
            'posts_per_page'=>20,'paged'=>$page,'s'=>sanitize_text_field($request['search'] ?? ''),'orderby'=>'date','order'=>'DESC']);
        $rows=[];
        foreach ($q->posts as $post) {
            $prefix = $type==='service' ? WP_FREEIO_SERVICE_PREFIX : WP_FREEIO_PROJECT_PREFIX;
            $status=get_post_status_object($post->post_status);
            $rows[]=['id'=>$post->ID,'title'=>get_the_title($post),'status'=>$status ? $status->label : $post->post_status,
                'price'=>get_post_meta($post->ID,$prefix.'price',true),'packages'=>$type==='service'?(array)get_post_meta($post->ID,$prefix.'price_packages',true):[],'state'=>$post->post_status,'featured'=>(bool)get_post_meta($post->ID,$prefix.'featured',true),'expires'=>get_post_meta($post->ID,$prefix.'expiry_date',true), 'url'=>get_permalink($post),'date'=>get_the_date('j M Y',$post)];
        }
        $response=new WP_REST_Response(['rows'=>$rows,'page'=>$page,'pages'=>(int)$q->max_num_pages,'total'=>(int)$q->found_posts,'type'=>$type,'currency'=>get_woocommerce_currency()]);
        $response->header('Cache-Control','private, no-store');
        return $response;
    }
    public static function registration() {
        $role = isset($_GET['role']) && $_GET['role']==='employer' ? 'employer' : 'freelancer';
        ?><div class="login-layout registration-layout"><aside class="login-story"><a href="<?php echo esc_url(home_url('/')); ?>"><img class="brand-image" src="<?php echo esc_url(content_url('/uploads/2022/10/1-1.png')); ?>" alt="POBlancer"></a><div class="registration-story-content"><?php if ($role === 'freelancer') : ?><figure class="registration-team"><img src="<?php echo esc_url(plugin_dir_url(__FILE__) . "assets/pob-academy-team-banner.png"); ?>" width="1536" height="512" alt="POB Academy team, Princesage Online Branding" decoding="async"><figcaption>POB Academy team</figcaption></figure><?php endif; ?><div><span class="eyebrow">POB Digital Experts</span><h1>Join POBlancer as a freelancer or employer.</h1><p>We welcome both growing talent and experienced professionals, while POB-branded freelancers are held to verified quality, ethics, and service standards.</p></div></div></aside>
        <main id="main" class="login-main registration"><section><span class="eyebrow">POBlancer</span><h2>Sign Up</h2><nav class="auth-tabs" aria-label="Account type"><a <?php if ($role==='freelancer') echo 'aria-current="page"'; ?> href="?role=freelancer">Freelancer</a><a <?php if ($role==='employer') echo 'aria-current="page"'; ?> href="?role=employer">Employer</a></nav>
        <?php if (is_user_logged_in()) : ?><p>You are already signed in.</p><a class="button primary" href="<?php echo esc_url(home_url('/pob-workspace/')); ?>">Open dashboard</a>
        <?php elseif (!get_option('users_can_register')) : ?><p>Registration is currently closed.</p>
        <?php elseif (WP_Freeio_Recaptcha::is_recaptcha_enabled()) : ?><p>Please complete registration using the existing verification form.</p><a class="button" href="<?php echo esc_url(home_url('/register/')); ?>">Continue to registration</a>
        <?php else : echo do_shortcode('[wp_freeio_register_'.$role.']'); endif; ?>
        <?php if(!is_user_logged_in())do_action('register_form_after'); ?>
        <div id="register-result" role="status" aria-live="polite"></div><p>Already have an account? <a href="<?php echo esc_url(home_url('/pob-login/')); ?>">Log In</a></p></section></main></div>
        <script id="register-config" type="application/json"><?php echo wp_json_encode(['endpoint'=>WP_Freeio_Ajax::get_endpoint('wp_freeio_ajax_registernew'),'dashboard'=>home_url('/pob-workspace/')],JSON_HEX_TAG|JSON_HEX_AMP); ?></script>
        <script type="module" src="<?php echo esc_url(plugin_dir_url(__FILE__).'assets/register.js?v='.POB_Workspace::VERSION); ?>"></script><?php
    }
}
POB_Account::boot();
