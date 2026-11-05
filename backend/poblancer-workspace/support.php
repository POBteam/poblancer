<?php
defined('ABSPATH') || exit;

/** Support records are separate from Freeio contracts, earnings and registration hooks. */
final class POB_Support {
    const SCHEMA = '1';
    public static function policy() {
        $raw=(array)get_option('pob_support_policy',[]);
        return ['decline_threshold'=>min(20,max(2,(int)($raw['decline_threshold']??3))),
            'review_hours'=>min(24,max(1,(int)($raw['review_hours']??24)))];
    }
    private static function table($name) { global $wpdb; return $wpdb->prefix.'pob_support_'.$name; }
    public static function boot() {
        add_action('rest_api_init',[__CLASS__,'routes']);
        add_action('pob_support_check',[__CLASS__,'scheduled_check']);
    }
    public static function install() {
        if (get_option('pob_support_schema') === self::SCHEMA) return;
        global $wpdb;
        require_once ABSPATH.'wp-admin/includes/upgrade.php';
        $collate = $wpdb->get_charset_collate();
        $schemas = [
            'cases'=>"id bigint unsigned NOT NULL AUTO_INCREMENT, source_id bigint unsigned NOT NULL, primary_user bigint unsigned NOT NULL, employer_user bigint unsigned NOT NULL, started_at bigint unsigned NOT NULL, due_at bigint unsigned NOT NULL, pool_cents bigint unsigned NOT NULL, currency varchar(8) NOT NULL, state varchar(24) NOT NULL DEFAULT 'working', progress_note text NOT NULL, evidence text NOT NULL, revision int unsigned NOT NULL DEFAULT 1, created_at bigint unsigned NOT NULL, updated_at bigint unsigned NOT NULL, PRIMARY KEY  (id), UNIQUE KEY source_id (source_id), KEY primary_user (primary_user), KEY employer_user (employer_user)",
            'offers'=>"id bigint unsigned NOT NULL AUTO_INCREMENT, case_id bigint unsigned NOT NULL, author_id bigint unsigned NOT NULL, scope text NOT NULL, skills varchar(250) NOT NULL, share_bps int unsigned NOT NULL, version int unsigned NOT NULL DEFAULT 1, state varchar(24) NOT NULL DEFAULT 'open', created_at bigint unsigned NOT NULL, PRIMARY KEY  (id), KEY case_id (case_id), KEY state (state)",
            'responses'=>"id bigint unsigned NOT NULL AUTO_INCREMENT, offer_id bigint unsigned NOT NULL, user_id bigint unsigned NOT NULL, version int unsigned NOT NULL, kind varchar(24) NOT NULL, reason varchar(40) NOT NULL, note text NOT NULL, share_bps int unsigned NOT NULL, created_at bigint unsigned NOT NULL, PRIMARY KEY  (id), UNIQUE KEY response_version (offer_id,user_id,version)",
            'agreements'=>"id bigint unsigned NOT NULL AUTO_INCREMENT, case_id bigint unsigned NOT NULL, offer_id bigint unsigned NOT NULL, offer_version int unsigned NOT NULL, assignee_id bigint unsigned NOT NULL, scope text NOT NULL, share_bps int unsigned NOT NULL, amount_cents bigint unsigned NOT NULL, state varchar(32) NOT NULL, evidence text NOT NULL, PRIMARY KEY  (id), UNIQUE KEY offer_id (offer_id), KEY assignee_id (assignee_id), KEY case_id (case_id)",
            'alerts'=>"id bigint unsigned NOT NULL AUTO_INCREMENT, user_id bigint unsigned NOT NULL, case_id bigint unsigned NOT NULL, event_key varchar(150) NOT NULL, message text NOT NULL, seen tinyint unsigned NOT NULL DEFAULT 0, created_at bigint unsigned NOT NULL, PRIMARY KEY  (id), UNIQUE KEY user_event (user_id,event_key), KEY user_seen (user_id,seen)",
            'audit'=>"id bigint unsigned NOT NULL AUTO_INCREMENT, case_id bigint unsigned NOT NULL, actor_id bigint unsigned NOT NULL, action varchar(60) NOT NULL, revision int unsigned NOT NULL, details longtext NOT NULL, created_at bigint unsigned NOT NULL, PRIMARY KEY  (id), KEY case_id (case_id)",
        ];
        foreach ($schemas as $name=>$schema) dbDelta('CREATE TABLE '.self::table($name)." ($schema) ENGINE=InnoDB $collate;");
        update_option('pob_support_schema',self::SCHEMA,false);
    }
    public static function eligible($id = 0) {
        $id = $id ?: get_current_user_id();
        if (!$id || !class_exists('WP_Freeio_User') || !WP_Freeio_User::is_freelancer($id)) return false;
        $type = function_exists('pob_whatsapp_get_freelancer_type_by_user') ? pob_whatsapp_get_freelancer_type_by_user($id) : '';
        if (!$type) {
            $profile = WP_Freeio_User::get_freelancer_by_user_id($id);
            $type = explode(' - ',(string)get_post_meta($profile,WP_FREEIO_FREELANCER_PREFIX.'freelancer_type',true))[0];
        }
        return in_array(trim($type),['POB Internally Trained Freelancer','POB Experienced Freelancer'],true);
    }
    public static function routes() {
        $permission = function() { return POB_Workspace::allowed() && is_user_logged_in(); };
        register_rest_route('poblancer/v1','/support',['methods'=>'GET','callback'=>[__CLASS__,'read'],'permission_callback'=>$permission]);
        register_rest_route('poblancer/v1','/support/action',['methods'=>'POST','callback'=>[__CLASS__,'write'],'permission_callback'=>$permission]);
    }
    private static function fail($message,$status=422) { throw new RuntimeException($message,$status); }
    private static function text($value,$min=0,$max=3000) {
        if (!is_scalar($value)) self::fail('Enter text in this field.');
        $text = sanitize_textarea_field((string)$value);
        if (strlen($text)<$min || strlen($text)>$max) self::fail('Please provide enough detail and keep the text within the field limit.');
        return $text;
    }
    public static function source($id) {
        $post = get_post($id);
        if (!$post || !in_array($post->post_type,['service_order','project_proposal'],true)) return null;
        $service = $post->post_type === 'service_order';
        $prefix = $service ? WP_FREEIO_SERVICE_ORDER_PREFIX : WP_FREEIO_PROJECT_PROPOSAL_PREFIX;
        $parent = absint(get_post_meta($id,$prefix.($service?'service_id':'project_id'),true));
        $primary = $service ? absint(get_post_meta($id,$prefix.'service_author',true)) : (int)$post->post_author;
        if ($service && !$primary) $primary = (int)get_post_field('post_author',$parent);
        $employer = $service ? (int)$post->post_author : (int)get_post_field('post_author',$parent);
        $earning = absint(get_post_meta($id,$prefix.'earning_id',true));
        $net = $earning ? get_post_meta($earning,WP_FREEIO_EARNING_PREFIX.'freelancer_amount',true) : '';
        $order_id = absint(get_post_meta($id,$prefix.'order_id',true));
        $order = $order_id && function_exists('wc_get_order') ? wc_get_order($order_id) : false;
        // No fallback to the gross order price or today's commission settings.
        $currency = $order ? $order->get_currency() : '';
        return ['id'=>(int)$id,'title'=>get_the_title($post),'status'=>$post->post_status,'primary'=>$primary,'employer'=>$employer,
            'pool_cents'=>is_numeric($net) && (float)$net>=0 ? (int)round((float)$net*100) : null,
            'currency'=>$currency,'earning_id'=>$earning,'type'=>$post->post_type];
    }
    private static function alert($uid,$case,$key,$message) {
        if (!$uid) return;
        global $wpdb;
        $wpdb->query($wpdb->prepare('INSERT IGNORE INTO '.self::table('alerts').' (user_id,case_id,event_key,message,created_at) VALUES (%d,%d,%s,%s,%d)', $uid,$case,$key,$message,time()));
    }
    private static function admin_alert($case,$key,$message) {
        foreach (get_users(['role'=>'administrator','fields'=>'ID']) as $id) self::alert($id,$case,$key,$message);
    }
    private static function related($case,$uid) {
        if ((int)$case->primary_user===$uid || (int)$case->employer_user===$uid || user_can($uid,'manage_options')) return true;
        global $wpdb;
        return (bool)$wpdb->get_var($wpdb->prepare('SELECT id FROM '.self::table('agreements')." WHERE case_id=%d AND assignee_id=%d AND state NOT IN ('declined','cancelled')",$case->id,$uid));
    }
    public static function signals($case,$now=null) {
        global $wpdb;
        $now = $now ?? time(); $start=(int)$case->started_at; $due=(int)$case->due_at;
        $checkpoint = $start+(int)floor(($due-$start)*.7);
        $near = $start+(int)floor(($due-$start)*.6);
        $complete = in_array($case->state,['submitted','completed'],true);
        $has_support=(int)$wpdb->get_var($wpdb->prepare('SELECT COUNT(*) FROM '.self::table('agreements')." WHERE case_id=%d AND state IN ('active','submitted','accepted')",$case->id));
        $flags=[];
        if (!$complete && $now >= $near && $now < $checkpoint) $flags[]='checkpoint_approaching';
        if (!$complete && $now >= $checkpoint) $flags[]='checkpoint_reached';
        if (!$complete && $now >= $checkpoint && !$has_support) $flags[]='checkpoint_needs_review';
        if (!$complete && $now >= $due) $flags[]='deadline_reached';
        foreach ($wpdb->get_results($wpdb->prepare('SELECT * FROM '.self::table('offers')." WHERE case_id=%d AND state='open'",$case->id)) as $offer) {
            $policy=self::policy();
            $since=$now-$policy['review_hours']*HOUR_IN_SECONDS;
            $declines=(int)$wpdb->get_var($wpdb->prepare('SELECT COUNT(*) FROM '.self::table('responses')." WHERE offer_id=%d AND version=%d AND kind='decline' AND created_at>=%d",$offer->id,$offer->version,$since));
            $positive=(int)$wpdb->get_var($wpdb->prepare('SELECT COUNT(*) FROM '.self::table('responses')." WHERE offer_id=%d AND version=%d AND kind IN ('interest','counter') AND created_at>=%d",$offer->id,$offer->version,$since));
            $policy=self::policy();
            if ($declines>=$policy['decline_threshold'] && $declines>$positive) {
                $flags[]='offer_'.$offer->id.'_review_price';
                $window=min($policy['review_hours']*HOUR_IN_SECONDS,max(1,(int)floor(($due-(int)$offer->created_at)/2)));
                if ($now >= (int)$offer->created_at+$window) $flags[]='offer_'.$offer->id.'_escalated';
            }
        }
        if ($wpdb->get_var($wpdb->prepare('SELECT id FROM '.self::table('agreements')." WHERE case_id=%d AND state='disputed' LIMIT 1",$case->id))) $flags[]='dispute';
        return ['checkpoint'=>$checkpoint,'near'=>$near,'flags'=>array_values(array_unique($flags)),'progress'=>min(100,max(0,round(100*($now-$start)/max(1,$due-$start))))];
    }
    public static function scan($id=null,$now=null) {
        global $wpdb;
        if($id)$rows=$wpdb->get_results($wpdb->prepare('SELECT * FROM '.self::table('cases').' WHERE id=%d',$id));
        else {
            // Rotate bounded global scans so older active cases cannot starve newer assignments.
            $cursor=absint(get_transient('pob_support_scan_cursor'));
            $rows=$wpdb->get_results($wpdb->prepare('SELECT * FROM '.self::table('cases')." WHERE state<>'completed' AND id>%d ORDER BY id LIMIT 500",$cursor));
            if(!$rows&&$cursor)$rows=$wpdb->get_results('SELECT * FROM '.self::table('cases')." WHERE state<>'completed' ORDER BY id LIMIT 500");
            set_transient('pob_support_scan_cursor',count($rows)===500?(int)end($rows)->id:0,HOUR_IN_SECONDS);
        }
        $messages=['checkpoint_approaching'=>'Your 70% submission checkpoint is approaching. Update your progress or request support.',
            'checkpoint_reached'=>'Your 70% checkpoint has been reached. Submit work or confirm a support plan.',
            'checkpoint_needs_review'=>'No submission or accepted support plan is recorded at the 70% checkpoint.',
            'deadline_reached'=>'The client deadline has been reached. Update the delivery status.', 'dispute'=>'A support agreement needs dispute review.'];
        // Before the first time checkpoint, only open offers or disputes can signal.
        // Fetch those hints once instead of loading every quiet case's users/orders.
        $exceptions=[];
        if($rows){
            $ids=implode(',',array_map(fn($row)=>(int)$row->id,$rows));
            foreach($wpdb->get_col('SELECT DISTINCT case_id FROM '.self::table('offers')." WHERE case_id IN ($ids) AND state='open' UNION SELECT DISTINCT case_id FROM ".self::table('agreements')." WHERE case_id IN ($ids) AND state='disputed'") as $case_id)$exceptions[(int)$case_id]=true;
        }
        foreach ($rows as $case) {
            $scan_time=$now??time();
            $near=(int)$case->started_at+(int)floor(((int)$case->due_at-(int)$case->started_at)*.6);
            if($scan_time<$near&&!isset($exceptions[(int)$case->id]))continue;
            if (!self::eligible((int)$case->primary_user)) continue;
            $source=self::source($case->source_id);
            if (!$source || $source['status']!=='hired') continue;
            foreach (self::signals($case,$scan_time)['flags'] as $flag) {
                $message=$messages[$flag] ?? (str_ends_with($flag,'review_price') ? 'Freelancers are declining this offer. Review the payment or scope.' : 'Repeated declines need POB review before the remaining delivery window closes.');
                // Include schedule identity; rescheduled assignments can notify at their new checkpoint.
                $key=$case->id.':'.$case->started_at.':'.$case->due_at.':'.$flag;
                self::alert((int)$case->primary_user,(int)$case->id,$key,$message);
                if (in_array($flag,['checkpoint_needs_review','deadline_reached','dispute'],true) || str_ends_with($flag,'escalated') || str_ends_with($flag,'review_price')) self::admin_alert((int)$case->id,$key,$message);
            }
        }
    }
    public static function scheduled_check($id) { if (POB_Workspace::allowed()) self::scan($id); }
    public static function read() {
        if (!POB_Workspace::allowed() || !is_user_logged_in()) return new WP_Error('pob_auth','Please sign in.',['status'=>401]);
        if (!get_transient('pob_support_scan_recent')) {
            set_transient('pob_support_scan_recent',1,30);
            self::scan();
        }
        global $wpdb;
        $uid=get_current_user_id(); $admin=current_user_can('manage_options'); $eligible=self::eligible($uid);
        $cases=[]; $exceptions=[];
        // Apply the same ownership relationship before limiting the dashboard window.
        $where=$admin?'':$wpdb->prepare(' WHERE c.primary_user=%d OR c.employer_user=%d OR EXISTS (SELECT 1 FROM '.self::table('agreements')." a WHERE a.case_id=c.id AND a.assignee_id=%d AND a.state NOT IN ('declined','cancelled'))",$uid,$uid,$uid);
        $rows=$wpdb->get_results('SELECT c.* FROM '.self::table('cases').' c'.$where.' ORDER BY c.id DESC LIMIT 200');
        foreach ($rows as $case) {
            if (!self::related($case,$uid)) continue;
            $source=self::source($case->source_id); $signals=self::signals($case);
            $agreements=$wpdb->get_results($wpdb->prepare('SELECT * FROM '.self::table('agreements').' WHERE case_id=%d ORDER BY id',$case->id),ARRAY_A);
            foreach($agreements as &$a) $a['assignee_name']=get_the_author_meta('display_name',$a['assignee_id']); unset($a);
            $item=(array)$case;
            $item['title']=$source['title'] ?? 'Assignment unavailable'; $item['source_status']=$source['status'] ?? 'missing';
            $item['primary_name']=get_the_author_meta('display_name',$case->primary_user);
            $item['signals']=$signals; $item['agreements']=$agreements;
            $item['audit']=$wpdb->get_results($wpdb->prepare('SELECT action,details,created_at FROM '.self::table('audit').' WHERE case_id=%d ORDER BY id DESC LIMIT 12',$case->id),ARRAY_A);
            $item['can_manage']=$admin || (int)$case->primary_user===$uid;
            $item['source_current']= $source && $source['pool_cents']===(int)$case->pool_cents && $source['currency']===$case->currency;
            $cases[]=$item;
            if ($admin && array_filter($signals['flags'],fn($s)=>in_array($s,['checkpoint_needs_review','deadline_reached','dispute'],true)||str_ends_with($s,'escalated'))) $exceptions[]=['id'=>$case->id,'title'=>$item['title'],'flags'=>$signals['flags']];
        }
        $offers=[];
        if ($eligible || $admin) {
            foreach ($wpdb->get_results('SELECT * FROM '.self::table('offers')." WHERE state IN ('open','selected','agreed') ORDER BY id DESC LIMIT 100") as $offer) {
                $case=$wpdb->get_row($wpdb->prepare('SELECT * FROM '.self::table('cases').' WHERE id=%d',$offer->case_id));
                if (!$case || !self::eligible((int)$case->primary_user)) continue;
                $source=self::source($case->source_id);
                if (!$source || $source['status']!=='hired' || in_array($case->state,['submitted','completed'],true)) continue;
                $mine=$admin || (int)$case->primary_user===$uid;
                $item=(array)$offer;
                // Public board exposes the support scope only, not the client's contract or private progress.
                $item['primary_name']=get_the_author_meta('display_name',$case->primary_user);
                $item['currency']=$case->currency; $item['pool_cents']=(int)$case->pool_cents; $item['amount_cents']=(int)floor((int)$case->pool_cents*(int)$offer->share_bps/10000);
                $item['due_at']=$case->due_at; $item['case_revision']=$case->revision; $item['mine']=$mine;
                $responses=$wpdb->get_results($wpdb->prepare('SELECT * FROM '.self::table('responses').' WHERE offer_id=%d AND version=%d ORDER BY id',$offer->id,$offer->version),ARRAY_A);
                $item['interested']=count(array_filter($responses,fn($r)=>$r['kind']==='interest'));
                $item['declined']=count(array_filter($responses,fn($r)=>$r['kind']==='decline'));
                $item['countered']=count(array_filter($responses,fn($r)=>$r['kind']==='counter'));
                $item['invited_names']=[];if($mine){foreach($wpdb->get_col($wpdb->prepare('SELECT user_id FROM '.self::table('alerts').' WHERE event_key LIKE %s','invite:'.$offer->id.':'.$offer->version.':%')) as $invited_id)$item['invited_names'][]=get_the_author_meta('display_name',$invited_id);}
                $item['responses']=array_values(array_filter($responses,fn($r)=>$mine || (int)$r['user_id']===$uid));
                foreach($item['responses'] as &$response) $response['name']=get_the_author_meta('display_name',$response['user_id']); unset($response);
                $offers[]=$item;
            }
        }
        $sources=[];
        if ($admin || $eligible) {
            foreach(get_posts(['post_type'=>['service_order','project_proposal'],'post_status'=>'hired','posts_per_page'=>200]) as $post) {
                if ($wpdb->get_var($wpdb->prepare('SELECT id FROM '.self::table('cases').' WHERE source_id=%d',$post->ID))) continue;
                $source=self::source($post->ID);
                if ($source && self::eligible($source['primary']) && ($admin || (int)$source['primary']===$uid)) $sources[]=$source;
            }
        }
        $alerts=$wpdb->get_results($wpdb->prepare('SELECT id,case_id,message,seen,created_at FROM '.self::table('alerts').' WHERE user_id=%d ORDER BY id DESC LIMIT 30',$uid),ARRAY_A);
        $response=new WP_REST_Response(['eligible'=>$eligible,'admin'=>$admin,'user_id'=>$uid,'cases'=>$cases,'offers'=>$offers,'alerts'=>$alerts,'exceptions'=>$exceptions,'sources'=>$sources,
            'whatsapp_html'=>shortcode_exists('pob_whatsapp_group') ? wp_kses_post(do_shortcode('[pob_whatsapp_group]')) : '',
            'clock'=>time(),'policy'=>self::policy(),'local'=>wp_get_environment_type()==='local']);
        $response->header('Cache-Control','private, no-store, max-age=0'); $response->header('Vary','Cookie');
        return $response;
    }
    private static function audit($case,$action,$revision,$details=[]) {
        global $wpdb;
        $wpdb->insert(self::table('audit'),['case_id'=>$case,'actor_id'=>get_current_user_id(),'action'=>$action,'revision'=>$revision,'details'=>wp_json_encode($details),'created_at'=>time()]);
    }
    public static function write($request) {
        global $wpdb;
        if (!POB_Workspace::allowed() || !is_user_logged_in()) return new WP_Error('pob_auth','Please sign in.',['status'=>401]);
        $p=$request instanceof WP_REST_Request ? $request->get_json_params() : (array)$request;
        $uid=get_current_user_id(); $admin=current_user_can('manage_options'); $action=sanitize_key($p['action']??'');
        if ($action==='find_freelancers') {
            if (!self::eligible($uid) && !$admin) return new WP_Error('pob_role','POB team access required.',['status'=>403]);
            $query=$p['query']??'';
            if(!is_string($query)||strlen(trim($query))<2||strlen($query)>60)return new WP_Error('pob_search','Enter 2 to 60 characters.',['status'=>422]);
            $rows=[];
            foreach(get_users(['role'=>'wp_freeio_freelancer','search'=>'*'.esc_attr(trim($query)).'*','search_columns'=>['user_login','display_name'],'number'=>40,'orderby'=>'display_name']) as $user){
                if((int)$user->ID===$uid||!self::eligible((int)$user->ID))continue;
                $rows[]=['id'=>(int)$user->ID,'name'=>$user->display_name,'username'=>$user->user_login];
                if(count($rows)>=20)break;
            }
            return ['rows'=>$rows];
        }
        $wpdb->query('START TRANSACTION');
        try {
            if ($action==='policy') {
                if(!$admin) self::fail('Only POB can change review thresholds.',403);
                $threshold=absint($p['decline_threshold']??0);$hours=absint($p['review_hours']??0);
                if($threshold<2||$threshold>20||$hours<1||$hours>24) self::fail('Use 2–20 declines and 1–24 review hours.');
                update_option('pob_support_policy',['decline_threshold'=>$threshold,'review_hours'=>$hours],false);
                self::audit(0,'policy_update',1,['threshold'=>$threshold,'review_hours'=>$hours]);
                delete_transient('pob_support_scan_recent');
                $wpdb->query('COMMIT');return ['ok'=>true];
            }
            if ($action==='seen') {
                $wpdb->update(self::table('alerts'),['seen'=>1],['id'=>absint($p['alert_id']??0),'user_id'=>$uid]);
                $wpdb->query('COMMIT'); return ['ok'=>true];
            }
            if ($action==='setup') {
                if (!$admin && !self::eligible($uid)) self::fail('POB team access required.',403);
                $source=self::source(absint($p['source_id']??0));
                if(!$admin && (!$source || (int)$source['primary']!==$uid))self::fail('Choose your own active client order.',403);
                if (!$source || $source['status']!=='hired' || !self::eligible($source['primary'])) self::fail('Select an active assignment for an eligible POB freelancer.');
                if ($source['pool_cents']===null || $source['pool_cents']<=0 || !preg_match('/^[A-Z]{3}$/',$source['currency'])) self::fail('The stored freelancer earnings or order currency need verification. No price will be guessed.');
                $start=strtotime((string)($p['start']??'')); $due=strtotime((string)($p['due']??''));
                if (!$start || !$due || $due<=$start || $due<=time()) self::fail('Confirm valid start and future deadline dates, including timezone.');
                $ok=$wpdb->insert(self::table('cases'),['source_id'=>$source['id'],'primary_user'=>$source['primary'],'employer_user'=>$source['employer'],
                    'started_at'=>$start,'due_at'=>$due,'pool_cents'=>$source['pool_cents'],'currency'=>$source['currency'],'progress_note'=>'','evidence'=>'','created_at'=>time(),'updated_at'=>time()]);
                if (!$ok) self::fail('This assignment is already configured or could not be saved.',409);
                $id=(int)$wpdb->insert_id; self::audit($id,'setup',1,['source'=>$source['id']]);
                if(!empty($p['create_offer'])){
                    $support_due=strtotime((string)($p['support_due']??''));
                    if(!$support_due||$support_due<=time()||$support_due>$due)self::fail('Choose a support deadline before the client deadline and after now.');
                    $scope=self::text($p['scope']??'',25,2500);$note=self::text($p['client_note']??'',10,1000);$skills=self::text($p['skills']??'',2,250);$share=self::share($p['share']??'');$recipient=absint($p['freelancer_id']??0);
                    if($recipient&&($recipient===$uid||!self::eligible($recipient)))self::fail('Choose another eligible POB freelancer.');
                    $scope.="\nSupport delivery deadline (UTC): ".gmdate('Y-m-d H:i',$support_due)."\nClient communication: ".$note;
                    self::check_capacity((object)['id'=>$id,'pool_cents'=>$source['pool_cents'],'due_at'=>$due,'currency'=>$source['currency']],$share,$source);
                    if(!$wpdb->insert(self::table('offers'),['case_id'=>$id,'author_id'=>$uid,'scope'=>$scope,'skills'=>$skills,'share_bps'=>$share,'created_at'=>time()]))self::fail('Unable to save this offer.',500);
                    $offer_id=(int)$wpdb->insert_id;
                    if($recipient)self::alert($recipient,$id,'invite:'.$offer_id.':1:'.$recipient,get_the_author_meta('display_name',$uid).' invited you to review support offer #'.$offer_id.'. Review the scope, payment and deadline.');
                }

                self::alert($source['primary'],$id,'setup:'.$id,'Your assignment deadline and 70% checkpoint are ready.');
                $wpdb->query('COMMIT');
                foreach(['near'=>.6,'checkpoint'=>.7,'deadline'=>1] as $stage=>$fraction) { $at=$start+(int)floor(($due-$start)*$fraction); if($at>time() && !wp_next_scheduled('pob_support_check',[$id,$stage])) wp_schedule_single_event($at,'pob_support_check',[$id,$stage]); }
                return ['ok'=>true,'id'=>$id];
            }
            $case=$wpdb->get_row($wpdb->prepare('SELECT * FROM '.self::table('cases').' WHERE id=%d FOR UPDATE',absint($p['case_id']??0)));
            if (!$case) self::fail('Assignment not found.',404);
            if ((int)($p['revision']??0)!==(int)$case->revision) self::fail('This assignment changed. Refresh and review the current terms.',409);
            $primary=(int)$case->primary_user===$uid; $manage=$primary||$admin;
            $source=self::source($case->source_id);
            if (!$source || $source['status']!=='hired') self::fail('The original assignment is no longer active. POB must review it.',409);
            if (!self::eligible((int)$case->primary_user)) self::fail('This assignment is outside the eligible POB freelancer groups.',403);
            if (!in_array($action,['respond'],true) && !self::related($case,$uid)) self::fail('You cannot access this assignment.',403);
            $agreement=null; $offer=null;
            if (isset($p['offer_id'])) {
                $offer=$wpdb->get_row($wpdb->prepare('SELECT * FROM '.self::table('offers').' WHERE id=%d AND case_id=%d',absint($p['offer_id']),$case->id));
                if (!$offer) self::fail('Support offer not found.',404);
            }
            if (isset($p['agreement_id'])) {
                $agreement=$wpdb->get_row($wpdb->prepare('SELECT * FROM '.self::table('agreements').' WHERE id=%d AND case_id=%d',absint($p['agreement_id']),$case->id));
                if (!$agreement) self::fail('Agreement not found.',404);
            }
            if (in_array($case->state,['submitted','completed'],true) && !in_array($action,['accept_delivery','dispute','resolve'],true)) self::fail('This assignment is submitted or complete.',409);
            if ($action==='progress') {
                if (!$primary) self::fail('Only the primary freelancer can report progress.',403);
                $state=sanitize_key($p['state']??'');
                if (!in_array($state,['on_track','needs_support','submitted'],true)) self::fail('Select a progress status.');
                $note=self::text($p['note']??'',10); $evidence=esc_url_raw($p['evidence']??'', ['https','http']);
                if ($state==='submitted' && !$evidence) self::fail('Provide a delivery or evidence link.');
                if ($state==='submitted' && $wpdb->get_var($wpdb->prepare('SELECT id FROM '.self::table('agreements')." WHERE case_id=%d AND state NOT IN ('accepted','declined','cancelled') LIMIT 1",$case->id))) self::fail('Complete or resolve the existing support agreements before final submission.');
                $wpdb->update(self::table('cases'),['state'=>$state,'progress_note'=>$note,'evidence'=>$evidence],['id'=>$case->id]);
                if($state==='submitted') self::alert((int)$case->employer_user,$case->id,'submitted:'.$case->id.':'.$case->revision,'The primary freelancer submitted work for review.');
            } elseif (in_array($action,['offer','edit_offer'],true)) {
                if (!$primary || !self::eligible($uid)) self::fail('Only the eligible primary freelancer can propose terms.',403);
                if(time()>=(int)$case->due_at) self::fail('The deadline has passed. POB must review the delivery plan.');
                if($action==='edit_offer' && (!$offer || $offer->state!=='open')) self::fail('Only an open offer can be edited.');
                $scope=self::text($p['scope']??'',25);
                if(!empty($p['support_due'])){ $support_due=strtotime((string)$p['support_due']);if(!$support_due||$support_due<=time()||$support_due>(int)$case->due_at)self::fail('Choose a support deadline before the client deadline and after now.');$scope.="\nSupport delivery deadline (UTC): ".gmdate('Y-m-d H:i',$support_due)."\nClient communication: ".self::text($p['client_note']??'',10,1000);} $skills=self::text($p['skills']??'',2,250); $share=self::share($p['share']??'');
                if($source['pool_cents']!==(int)$case->pool_cents || $source['currency']!==$case->currency) self::fail('The original earnings changed. POB must review the agreement basis.',409);
                if($action==='offer') {
                    $recipient=absint($p['freelancer_id']??0);
                    if($recipient && ($recipient===$uid || !self::eligible($recipient)))self::fail('Choose another eligible POB freelancer.',422);
                    if(!$wpdb->insert(self::table('offers'),['case_id'=>$case->id,'author_id'=>$uid,'scope'=>$scope,'skills'=>$skills,'share_bps'=>$share,'created_at'=>time()]))self::fail('Unable to post the offer.',500);
                    $new_offer=(int)$wpdb->insert_id;
                    if($recipient) self::alert($recipient,$case->id,'invite:'.$new_offer.':1:'.$recipient,get_the_author_meta('display_name',$uid).' invited you to review support offer #'.$new_offer.'. Open Support offers to review the work, payment and deadline.');
                }
                else $wpdb->update(self::table('offers'),['scope'=>$scope,'skills'=>$skills,'share_bps'=>$share,'version'=>(int)$offer->version+1,'created_at'=>time()],['id'=>$offer->id]);
            } elseif ($action==='invite') {
                if(!$primary || !$offer || $offer->state!=='open' || time()>=(int)$case->due_at)self::fail('Only the primary freelancer can invite support to an active open offer.',403);
                $recipient=absint($p['freelancer_id']??0);
                if(!$recipient||$recipient===$uid||!self::eligible($recipient))self::fail('Choose another eligible POB freelancer.',422);
                $key='invite:'.$offer->id.':'.$offer->version.':'.$recipient;
                if(!$wpdb->get_var($wpdb->prepare('SELECT id FROM '.self::table('alerts').' WHERE user_id=%d AND event_key=%s',$recipient,$key))){
                    self::alert($recipient,$case->id,$key,get_the_author_meta('display_name',$uid).' invited you to review support offer #'.$offer->id.'. Open Support offers to review the work, payment and deadline.');
                    self::audit($case->id,'invite',$case->revision,['offer'=>$offer->id,'recipient'=>$recipient]);
                }
            } elseif ($action==='close_offer') {
                if(!$primary || !$offer || $offer->state!=='open') self::fail('Only the primary freelancer can close an open offer.',403);
                $wpdb->update(self::table('offers'),['state'=>'closed'],['id'=>$offer->id]);
            } elseif ($action==='respond') {
                if (!self::eligible($uid) || $primary || !$offer || $offer->state!=='open' || time()>=(int)$case->due_at) self::fail('This offer is not available to your account.',403);
                if ((int)($p['offer_version']??0)!==(int)$offer->version) self::fail('The offer changed. Read the latest scope and amount.',409);
                $kind=sanitize_key($p['kind']??''); $reason=sanitize_key($p['reason']??'');
                if(!in_array($kind,['interest','decline','counter'],true)) self::fail('Choose a response.');
                if($kind==='decline' && !in_array($reason,['low_payment','unclear_scope','insufficient_time','unavailable'],true)) self::fail('Choose a reason for declining.');
                $share=$kind==='counter'?self::share($p['share']??''):(int)$offer->share_bps;
                $wpdb->query($wpdb->prepare('INSERT INTO '.self::table('responses').' (offer_id,user_id,version,kind,reason,note,share_bps,created_at) VALUES (%d,%d,%d,%s,%s,%s,%d,%d) ON DUPLICATE KEY UPDATE kind=VALUES(kind),reason=VALUES(reason),note=VALUES(note),share_bps=VALUES(share_bps),created_at=VALUES(created_at)', $offer->id,$uid,$offer->version,$kind,$reason,self::text($p['note']??'',0,1000),$share,time()));
                self::alert((int)$case->primary_user,$case->id,'response:'.$offer->id.':'.$offer->version.':'.$uid.':'.$kind,'Your support offer received a response.');
            } elseif ($action==='select') {
                if(!$primary || !$offer || $offer->state!=='open') self::fail('Only the primary freelancer can select a response.',403);
                $response=$wpdb->get_row($wpdb->prepare('SELECT * FROM '.self::table('responses')." WHERE id=%d AND offer_id=%d AND version=%d AND kind IN ('interest','counter')",absint($p['response_id']??0),$offer->id,$offer->version));
                if(!$response || !self::eligible((int)$response->user_id)) self::fail('Select a current response from an eligible freelancer.');
                self::check_capacity($case,(int)$response->share_bps,$source);
                $wpdb->insert(self::table('agreements'),['case_id'=>$case->id,'offer_id'=>$offer->id,'offer_version'=>$offer->version,'assignee_id'=>$response->user_id,'scope'=>$offer->scope,'share_bps'=>$response->share_bps,'amount_cents'=>(int)floor((int)$case->pool_cents*(int)$response->share_bps/10000),'state'=>'awaiting_confirmation','evidence'=>'']);
                $wpdb->update(self::table('offers'),['state'=>'selected'],['id'=>$offer->id]);
                self::alert((int)$response->user_id,$case->id,'selected:'.$offer->id.':'.$offer->version,'You were selected for support. Read and confirm the final scope and earnings share.');
            } elseif ($action==='confirm') {
                if(!$agreement || (int)$agreement->assignee_id!==$uid || !self::eligible($uid) || $agreement->state!=='awaiting_confirmation') self::fail('Only the selected freelancer can confirm these terms.',403);
                if(time()>=(int)$case->due_at) self::fail('The deadline has passed. Request a revised plan.');
                if($source['pool_cents']!==(int)$case->pool_cents || $source['currency']!==$case->currency) self::fail('The original earnings changed. POB must review the basis.',409);
                if(empty($p['accepted'])) self::fail('Explicitly accept the scope, deadline and earnings share.');
                $wpdb->update(self::table('agreements'),['state'=>'active'],['id'=>$agreement->id]);
                $wpdb->update(self::table('offers'),['state'=>'agreed'],['id'=>$agreement->offer_id]);
                self::alert((int)$case->primary_user,$case->id,'confirmed:'.$agreement->id,'The selected freelancer accepted the support agreement.');
            } elseif ($action==='decline_selection') {
                if(!$agreement || (int)$agreement->assignee_id!==$uid || $agreement->state!=='awaiting_confirmation') self::fail('This selection cannot be declined by your account.',403);
                $wpdb->update(self::table('agreements'),['state'=>'declined'],['id'=>$agreement->id]);
                $wpdb->update(self::table('offers'),['state'=>'closed'],['id'=>$agreement->offer_id]);
                self::alert((int)$case->primary_user,$case->id,'selection_declined:'.$agreement->id,'The selected freelancer declined. Create a revised support offer.');
            } elseif ($action==='deliver') {
                if(!$agreement || (int)$agreement->assignee_id!==$uid || $agreement->state!=='active') self::fail('Only the assigned freelancer can submit this support work.',403);
                $evidence=esc_url_raw($p['evidence']??'', ['https','http']); if(!$evidence) self::fail('Provide a delivery link.');
                $wpdb->update(self::table('agreements'),['state'=>'submitted','evidence'=>$evidence],['id'=>$agreement->id]);
                self::alert((int)$case->primary_user,$case->id,'delivered:'.$agreement->id,'Support work was submitted for your review.');
            } elseif ($action==='accept_delivery') {
                if(!$primary || !$agreement || $agreement->state!=='submitted') self::fail('Only the primary freelancer can accept submitted support work.',403);
                $wpdb->update(self::table('agreements'),['state'=>'accepted'],['id'=>$agreement->id]);
                self::alert((int)$agreement->assignee_id,$case->id,'accepted:'.$agreement->id,'Your support delivery was accepted. The earnings share is recorded for settlement review.');
            } elseif ($action==='dispute') {
                if(!$agreement || (!$primary && (int)$agreement->assignee_id!==$uid)) self::fail('Only an agreement participant can raise this dispute.',403);
                if(!in_array($agreement->state,['active','submitted','accepted'],true)) self::fail('This agreement cannot be disputed.');
                $reason=self::text($p['note']??'',15);
                $wpdb->update(self::table('agreements'),['state'=>'disputed'],['id'=>$agreement->id]);
                self::audit($case->id,'dispute_note',$case->revision,['agreement'=>$agreement->id,'note'=>$reason]);
                self::admin_alert($case->id,'dispute:'.$agreement->id,'A support agreement was disputed. Review its scope and evidence.');
            } elseif ($action==='request_revision') {
                if(!$admin) self::fail('Only POB can request an administrative review.',403);
                $note=self::text($p['note']??'',15);
                self::alert((int)$case->primary_user,$case->id,'admin_review:'.$case->id.':'.$case->revision,$note);
            } elseif ($action==='resolve') {
                if(!$admin || !$agreement || $agreement->state!=='disputed') self::fail('Only POB can resolve an open dispute.',403);
                $state=sanitize_key($p['state']??''); if(!in_array($state,['active','submitted'],true)) self::fail('Return the agreement to active work or delivery review.');
                $note=self::text($p['note']??'',20);
                $wpdb->update(self::table('agreements'),['state'=>$state],['id'=>$agreement->id]);
                self::audit($case->id,'resolution_note',$case->revision,['note'=>$note,'agreement'=>$agreement->id]);
                self::alert((int)$agreement->assignee_id,$case->id,'resolved:'.$agreement->id.':'.$case->revision,'POB reviewed the dispute. Check the agreement status.');
                self::alert((int)$case->primary_user,$case->id,'resolved:'.$agreement->id.':'.$case->revision,'POB reviewed the dispute. Check the agreement status.');
            } else self::fail('Unknown action.');
            if($wpdb->last_error) self::fail('The change could not be saved. Please refresh and try again.',500);
            $revision=(int)$case->revision+1;
            $wpdb->update(self::table('cases'),['revision'=>$revision,'updated_at'=>time()],['id'=>$case->id]);
            self::audit($case->id,$action,$revision,['offer_id'=>$offer->id??null,'agreement_id'=>$agreement->id??null]);
            $wpdb->query('COMMIT'); self::scan($case->id);
            return ['ok'=>true,'revision'=>$revision];
        } catch(Throwable $error) {
            $wpdb->query('ROLLBACK');
            $code=in_array($error->getCode(),[403,404,409,422,500],true)?$error->getCode():500;
            return new WP_Error('pob_support',$code===500?'Unable to save this change. Please refresh and try again.':$error->getMessage(),['status'=>$code]);
        }
    }
    private static function share($raw) {
        if(!is_scalar($raw) || !is_numeric($raw)) self::fail('Enter a percentage.');
        $share=(int)round((float)$raw*100);
        if($share<=0 || $share>10000) self::fail('The share must be greater than 0% and no more than 100%.');
        return $share;
    }
    private static function check_capacity($case,$share,$source) {
        global $wpdb;
        if(time()>=(int)$case->due_at) self::fail('The deadline has passed. POB must review the plan.');
        if($source['pool_cents']!==(int)$case->pool_cents || $source['currency']!==$case->currency) self::fail('The stored earnings changed. POB must review the basis.',409);
        $reserved=(int)$wpdb->get_var($wpdb->prepare('SELECT COALESCE(SUM(share_bps),0) FROM '.self::table('agreements')." WHERE case_id=%d AND state NOT IN ('declined','cancelled')",$case->id));
        if($reserved+$share>10000) self::fail('These agreements would allocate more than 100% of the freelancer earnings.');
    }
}
