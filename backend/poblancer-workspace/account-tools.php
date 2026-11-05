<?php
defined('ABSPATH') || exit;
final class POB_Account_Tools {
    public static function boot(){add_action('rest_api_init',function(){register_rest_route('poblancer/v1','/account-tool',[
        ['methods'=>'GET','callback'=>[__CLASS__,'read'],'permission_callback'=>[POB_Profile::class,'permission']],['methods'=>'POST','callback'=>[__CLASS__,'write'],'permission_callback'=>[POB_Profile::class,'permission']],
    ]);});}
    public static function read($r){
        if(!POB_Profile::permission())return new WP_Error('pob_auth','Marketplace account required.',['status'=>403]);
        $kind=sanitize_key($r['kind']);$owner=WP_Freeio_User::get_user_id();$data=['kind'=>$kind];
        if($kind==='verify'){
            $q=new WP_Query(['post_type'=>'verification','post_status'=>['publish','pending'],'author'=>$owner,'posts_per_page'=>1,'orderby'=>'date','order'=>'DESC']);$record=$q->posts[0]??null;
            $data['submitted']=$record&&get_post_meta($record->ID,WP_FREEIO_VERIFICATION_PREFIX.'status',true)!=='rejected';$data['rejected']=$record&&get_post_meta($record->ID,WP_FREEIO_VERIFICATION_PREFIX.'status',true)==='rejected';
        }elseif($kind==='payouts'){
            if(!WP_Freeio_User::is_freelancer())return new WP_Error('pob_role','A freelancer account is required.',['status'=>403]);
            $labels=WP_Freeio_Mixes::get_default_withdraw_payout_methods();$enabled=wp_freeio_get_option('withdraw_payout_methods',['paypal','bacs','payoneer']);$data['methods']=[];
            foreach($enabled as $method)if(isset($labels[$method]))$data['methods'][]=['id'=>$method,'label'=>$labels[$method]];
            $bank_labels=WP_Freeio_Mixes::get_default_bank_transfer_fields();$data['bank_fields']=[];
            foreach(wp_freeio_get_option('bank_transfer_fields',array_keys($bank_labels)) as $key)if(isset($bank_labels[$key]))$data['bank_fields'][]=['id'=>$key,'label'=>$bank_labels[$key],'value'=>get_user_meta($owner,$key,true)];
            $data['method']=get_user_meta($owner,'payout_method',true);$data['paypal_email']=get_user_meta($owner,'paypal_email',true);$data['payoneer_email']=get_user_meta($owner,'payoneer_email',true);
            $page=max(1,absint($r['page']));$q=new WP_Query(['post_type'=>'withdraw','post_status'=>['publish','pending','cancelled'],'author'=>$owner,'posts_per_page'=>20,'paged'=>$page]);$data['rows']=[];
            foreach($q->posts as $post)$data['rows'][]=['date'=>get_the_date('j M Y',$post),'amount'=>get_post_meta($post->ID,WP_FREEIO_WITHDRAW_PREFIX.'amount',true),'method'=>$labels[get_post_meta($post->ID,WP_FREEIO_WITHDRAW_PREFIX.'payout_method',true)]??get_post_meta($post->ID,WP_FREEIO_WITHDRAW_PREFIX.'payout_method',true),'status'=>get_post_status_object($post->post_status)->label];
            $data['currency']=get_woocommerce_currency();$data['pages']=(int)$q->max_num_pages;$data['page']=$page;
        }elseif(!in_array($kind,['change-password','delete-profile'],true))return new WP_Error('pob_tool','Unknown account page.',['status'=>404]);
        $out=new WP_REST_Response($data);$out->header('Cache-Control','private, no-store');$out->header('Vary','Cookie');return $out;
    }
    public static function write($r){
        if(!POB_Profile::permission())return new WP_Error('pob_auth','Marketplace account required.',['status'=>403]);
        nocache_headers();
        $p=$r->get_json_params();if(!is_array($p))$p=$r->get_body_params();$action=sanitize_key($p['action']??'');
        // Retain the installed handlers, while adding REST authentication and role checks in front of them.
        if(in_array($action,['change-password','delete-profile'],true)){
            $password=$p[$action==='delete-profile'?'password':'old_password']??'';
            $key='pob_sensitive_'.get_current_user_id();$attempts=(int)get_transient($key);if($attempts>=8)return new WP_Error('pob_rate','Please wait 15 minutes before trying again.',['status'=>429]);
            if(!is_string($password)||strlen($password)>4096||!wp_check_password($password,wp_get_current_user()->user_pass,get_current_user_id())){set_transient($key,$attempts+1,15*MINUTE_IN_SECONDS);return new WP_Error('pob_password','The current password is incorrect.',['status'=>422]);}delete_transient($key);
            if($action==='delete-profile'){
                if(empty($p['confirmed']))return new WP_Error('pob_confirm','Confirm permanent profile deletion.',['status'=>422]);
                require_once ABSPATH.'wp-admin/includes/user.php';$_POST=['password'=>$password,'nonce'=>wp_create_nonce('wp-freeio-delete-profile-nonce')];WP_Freeio_User::process_delete_profile();
            }else{
                if(!is_string($p['new_password']??null)||!is_string($p['retype_password']??null)||strlen($p['new_password'])>4096)return new WP_Error('pob_password','Enter valid password fields.',['status'=>422]);
                $_POST=['old_password'=>$password,'new_password'=>$p['new_password'],'retype_password'=>$p['retype_password']];WP_Freeio_User::process_change_password();
            }
        }
        if($action==='payouts')return self::payouts($p);
        if($action==='withdraw')return self::withdraw($p);
        if(in_array($action,['verify','revoke-verification'],true)){
            if($action==='revoke-verification'&&empty($p['confirmed']))return new WP_Error('pob_confirm','Confirm verification revocation.',['status'=>422]);
            if($action==='verify'){
                foreach(['name','contact_number','verification_number','address'] as $key)if(!is_string($p[$key]??null)||!trim($p[$key])||strlen($p[$key])>3000)return new WP_Error('pob_fields','Complete all verification fields.',['status'=>422]);
                if(empty($_FILES['document']['name'][0]))return new WP_Error('pob_document','Choose a verification document.',['status'=>422]);
                foreach($_FILES['document']['name'] as $i=>$name){$check=wp_check_filetype_and_ext($_FILES['document']['tmp_name'][$i],$name);if(!$check['ext']||$_FILES['document']['error'][$i]!==UPLOAD_ERR_OK||$_FILES['document']['size'][$i]>wp_max_upload_size())return new WP_Error('pob_document','The document type or size is not allowed.',['status'=>422]);}
            }
            $_POST=wp_slash(array_intersect_key($p,array_flip(['name','contact_number','verification_number','address'])));
            add_filter('doing_it_wrong_trigger_error',function($trigger,$name){return $name==='wp_send_json'?false:$trigger;},10,2);
            if($action==='verify')WP_Freeio_Post_Type_Verification::process_verification_identity();else WP_Freeio_Post_Type_Verification::process_revoke_verification_identity();
        }
        return new WP_Error('pob_action','Unknown account action.',['status'=>422]);
    }
    private static function payouts($p){
        if(!WP_Freeio_User::is_freelancer())return new WP_Error('pob_role','A freelancer account is required.',['status'=>403]);
        $owner=WP_Freeio_User::get_user_id();$method=sanitize_key($p['payout_method']??'');$enabled=wp_freeio_get_option('withdraw_payout_methods',['paypal','bacs','payoneer']);if(!in_array($method,$enabled,true)||!in_array($method,['paypal','bacs','payoneer'],true))return new WP_Error('pob_method','Select an available payout method.',['status'=>422]);
        $values=[];
        if($method==='bacs')foreach(wp_freeio_get_option('bank_transfer_fields',array_keys(WP_Freeio_Mixes::get_default_bank_transfer_fields())) as $key){$v=$p[$key]??'';if(!is_string($v)||!trim($v)||strlen($v)>250)return new WP_Error('pob_fields','Complete all bank transfer fields.',['status'=>422]);$values[$key]=sanitize_text_field($v);}
        else{$key=$method.'_email';if(!is_string($p[$key]??null)||!is_email($p[$key]))return new WP_Error('pob_fields','Enter a valid payout email.',['status'=>422]);$values[$key]=sanitize_email($p[$key]);}
        $old=$_POST;$_POST=array_merge($values,['payout_method'=>$method]);
        try{do_action('wp-freeio-process-save-withdraw-settings-before',$_POST);foreach($values as $k=>$v)update_user_meta($owner,$k,$v);update_user_meta($owner,'payout_method',$method);do_action('wp-freeio-after-save-withdraw-settings',null,null,null,null,$_POST);return ['ok'=>true,'message'=>'Saved payout method successfully.'];}finally{$_POST=$old;}
    }
    private static function withdraw($p){
        if(!WP_Freeio_User::is_freelancer())return new WP_Error('pob_role','A freelancer account is required.',['status'=>403]);
        if(empty($p['confirmed']))return new WP_Error('pob_confirm','Confirm the withdrawal request.',['status'=>422]);
        $amount=$p['amount']??'';$method=sanitize_key($p['payout_method']??'');$key=$p['request_key']??'';
        if(!is_numeric($amount)||(float)$amount<=0||!is_finite((float)$amount)||!is_string($key)||!preg_match('/^[a-zA-Z0-9-]{16,80}$/',$key)||!in_array($method,wp_freeio_get_option('withdraw_payout_methods',['paypal','bacs','payoneer']),true))return new WP_Error('pob_fields','Enter a valid withdrawal amount and payout method.',['status'=>422]);
        $amount=wc_format_decimal($amount,wc_get_price_decimals());$uid=WP_Freeio_User::get_user_id();$signature=hash('sha256',$amount.':'.$method);$token='pob_withdraw_'.hash('sha256',$uid.':'.$key);
        global $wpdb;$lock='pob_withdraw_'.$uid;if((int)$wpdb->get_var($wpdb->prepare('SELECT GET_LOCK(%s, 5)',$lock))!==1)return new WP_Error('pob_busy','Another withdrawal is processing. Please retry.',['status'=>409]);
        $existing=get_transient($token);
        if($existing){$wpdb->get_var($wpdb->prepare('SELECT RELEASE_LOCK(%s)',$lock));if(($existing['signature']??'')!==$signature)return new WP_Error('pob_request','This request key was already used for a different amount. Reload before starting another withdrawal.',['status'=>409]);return ['ok'=>true,'message'=>'Your withdrawal request has already been submitted.'];}
        // The native handler terminates the request. Release the lock on every exit path.
        register_shutdown_function(function()use($wpdb,$lock){$wpdb->get_var($wpdb->prepare('SELECT RELEASE_LOCK(%s)',$lock));});
        add_action('wp_after_insert_post',function($id,$post,$update)use($uid,$token,$signature){if(!$update&&$post->post_type==='withdraw'&&(int)$post->post_author===$uid)set_transient($token,['id'=>$id,'signature'=>$signature],DAY_IN_SECONDS);},0,3);
        $_POST=['amount'=>$amount,'payout_method'=>$method];add_filter('doing_it_wrong_trigger_error',function($trigger,$name){return $name==='wp_send_json'?false:$trigger;},10,2);WP_Freeio_Freelancer::process_save_withdraw();
    }
}
POB_Account_Tools::boot();
