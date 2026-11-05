<?php
defined('ABSPATH') || exit;
final class POB_Support_Admin {
    public static function boot() {
        add_action('admin_menu',function(){if(POB_Workspace::allowed())add_menu_page('POBlancer Support','POBlancer Support','manage_options','pob-support',[__CLASS__,'page'],'dashicons-groups',57);});
        add_action('rest_api_init',function(){register_rest_route('poblancer/v1','/support/demo',['methods'=>'GET','callback'=>[__CLASS__,'demo'],'permission_callback'=>function(){return POB_Workspace::allowed()&&is_user_logged_in();}]);});
    }
    public static function page() {
        if(!current_user_can('manage_options'))return;
        $base=plugin_dir_url(__FILE__);
        echo '<div class="wrap"><h1>POBlancer Support</h1><p>Deadline exceptions, support agreements and activity saved by the workspace appear here. Existing Freeio orders and payouts remain separate.</p><p><a class="button" href="'.esc_url(home_url('/pob-workspace/#support')).'">Open workspace</a></p><div id="pob-support-admin"></div></div>';
        echo '<link rel="stylesheet" href="'.esc_url($base.'assets/workspace.css?v='.POB_Workspace::VERSION).'">';
        echo '<script type="application/json" id="pob-admin-config">'.wp_json_encode(['api'=>rest_url('poblancer/v1/support'),'nonce'=>wp_create_nonce('wp_rest')],JSON_HEX_TAG|JSON_HEX_AMP).'</script>';
        echo '<script type="module" src="'.esc_url($base.'assets/admin-support.js?v='.POB_Workspace::VERSION).'"></script>';
    }
    public static function demo($request) {
        $role=sanitize_key($request['role']??'primary');
        if($role==='admin'&&!current_user_can('manage_options'))return new WP_Error('pob_admin','Administrator access required.',['status'=>403]);
        $now=time();$start=$now-8*DAY_IN_SECONDS;$due=$start+10*DAY_IN_SECONDS;
        $uid=get_current_user_id();$primary=$role==='primary'?$uid:0;$supporter=$role==='supporter'?$uid:0;
        $case=['id'=>900001,'source_id'=>900001,'title'=>'DEMO: Product video and website launch','primary_user'=>$primary,'primary_name'=>'Demo primary freelancer','employer_user'=>0,'started_at'=>$start,'due_at'=>$due,'pool_cents'=>10000000,'currency'=>'NGN','state'=>'needs_support','progress_note'=>'The edit is ready for review. Caption timing and mobile browser checks need support. Handover discussed in the team community.','evidence'=>'','revision'=>1,'created_at'=>$start,'updated_at'=>$now,'source_status'=>'hired','source_current'=>true,'can_manage'=>$role==='primary'||$role==='admin',
            'signals'=>['checkpoint'=>$start+7*DAY_IN_SECONDS,'progress'=>80,'flags'=>['checkpoint_needs_review']],
            'agreements'=>[['id'=>900011,'case_id'=>900001,'offer_id'=>900021,'assignee_id'=>$supporter,'assignee_name'=>'Demo support freelancer','scope'=>'Check caption timing and test the landing page on mobile.','share_bps'=>2000,'amount_cents'=>2000000,'state'=>'active','evidence'=>'']],
            'audit'=>[['action'=>'support_confirmed','details'=>wp_json_encode(['note'=>'Both freelancers accepted the scope and 20% share.']),'created_at'=>$now-3600],['action'=>'checkpoint_reached','details'=>'{}','created_at'=>$start+7*DAY_IN_SECONDS],['action'=>'setup','details'=>'{}','created_at'=>$start]]];
        $offer=['id'=>900022,'case_id'=>900001,'author_id'=>$primary,'scope'=>'Review final captions and export a short vertical cut from the approved footage.','skills'=>'Video editing, captions','share_bps'=>1000,'version'=>1,'state'=>'open','created_at'=>$now-3600,'primary_name'=>'Demo primary freelancer','currency'=>'NGN','amount_cents'=>1000000,'due_at'=>$due,'case_revision'=>1,'mine'=>in_array($role,['primary','admin'],true),'interested'=>1,'declined'=>3,'countered'=>1,
            'responses'=>[['id'=>900031,'user_id'=>0,'name'=>'Demo available freelancer','version'=>1,'kind'=>'counter','reason'=>'','note'=>'I can complete both outputs for a 15% share.','share_bps'=>1500]]];
        if(!in_array($role,['primary','admin'],true))$offer['responses']=[];
        $data=['eligible'=>$role!=='employer','admin'=>$role==='admin','user_id'=>$uid,'cases'=>[$case],'offers'=>$role==='employer'?[]:[$offer],
            'alerts'=>[['id'=>900041,'case_id'=>900001,'message'=>'DEMO: Your 70% submission checkpoint has passed. Update progress or arrange support.','seen'=>0,'created_at'=>$now]],
            'exceptions'=>$role==='admin'?[['id'=>900001,'title'=>$case['title'],'flags'=>['checkpoint_needs_review','offer_price_review']]]:[],
            'sources'=>[],'whatsapp_html'=>'','clock'=>$now,'policy'=>POB_Support::policy(),'local'=>true,'demo'=>true,'demo_role'=>$role];
        $r=new WP_REST_Response($data);$r->header('Cache-Control','private, no-store');return $r;
    }
}
POB_Support_Admin::boot();
