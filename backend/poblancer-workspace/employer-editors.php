<?php
defined('ABSPATH') || exit;
final class POB_Employer_Editors {
    public static function permission(){return POB_Workspace::allowed()&&is_user_logged_in()&&WP_Freeio_User::is_employer();}
    public static function boot(){add_action('rest_api_init',function(){register_rest_route('poblancer/v1','/employer-editor',[
        ['methods'=>'GET','callback'=>[__CLASS__,'read'],'permission_callback'=>[__CLASS__,'permission']],['methods'=>'POST','callback'=>[__CLASS__,'save'],'permission_callback'=>[__CLASS__,'permission']],
    ]);});}
    private static function config($kind){
        if(!in_array($kind,['job','project'],true))return null;
        $job=$kind==='job';return ['kind'=>$kind,'type'=>$job?'job_listing':'project','prefix'=>$job?WP_FREEIO_JOB_LISTING_PREFIX:WP_FREEIO_PROJECT_PREFIX,'form_class'=>$job?'WP_Freeio_Job_Submit_Form':'WP_Freeio_Project_Submit_Form','edit_class'=>$job?'WP_Freeio_Job_Edit_Form':'WP_Freeio_Project_Edit_Form','paid'=>$job?'WP_Freeio_Wc_Paid_Listings_Submit_Form':'WP_Freeio_Wc_Paid_Listings_Project_Submit_Form','user_prop'=>$job?'listing_user_package':'project_user_package','product_prop'=>$job?'job_package':'project_package','valid'=>$job?'package_is_valid':'project_package_is_valid','id_method'=>$job?'get_job_id':'get_project_id','can_edit'=>$job?'is_employer_can_edit_job':'is_employer_can_edit_project'];
    }
    private static function context($kind,$id){
        if(!self::permission())return new WP_Error('pob_role','An employer account is required.',['status'=>403]);$cfg=self::config($kind);if(!$cfg)return new WP_Error('pob_type','Unknown listing type.',['status'=>422]);
        if($id){$p=get_post($id);$can=$cfg['can_edit'];if(!$p||$p->post_type!==$cfg['type']||(int)$p->post_author!==(int)WP_Freeio_User::get_user_id()||!WP_Freeio_User::$can($id))return new WP_Error('pob_owner','Listing unavailable.',['status'=>403]);}
        elseif(!WP_Freeio_User::is_employer_can_add_submission(get_current_user_id()))return new WP_Error('pob_submit','This account cannot submit a listing.',['status'=>403]);
        $_REQUEST[$kind.'_id']=$id;$class=$id&&!in_array(get_post_status($id),['draft','preview','expired'],true)?$cfg['edit_class']:$cfg['form_class'];$form=$class::get_instance();$get=$cfg['id_method'];if((int)$form->$get()!==$id)return new WP_Error('pob_context','Reload the editor before continuing.',['status'=>409]);
        $boxes=$form->fields_front([]);$box=$boxes[$cfg['prefix'].'front'];$cmb=cmb2_get_metabox($box,$id);return ['cfg'=>$cfg,'form'=>$form,'cmb'=>$cmb,'fields'=>$box['fields']];
    }
    private static function valid($cfg,$id){$p=get_post($id);$method=$cfg['valid'];return $p&&$p->post_type==='job_package'&&$p->post_status==='publish'&&get_post_meta($id,WP_FREEIO_WC_PAID_LISTINGS_PREFIX.'package_type',true)===$cfg['kind'].'_package'&&WP_Freeio_Wc_Paid_Listings_Mixes::$method(get_current_user_id(),$id);}
    private static function select($c,$package,$product){
        $cfg=$c['cfg'];$paid=$cfg['paid'];if(!class_exists($paid))return null;
        if($package&&!self::valid($cfg,$package))return new WP_Error('pob_package','Selected quota is unavailable.',['status'=>409]);
        if(!$package&&$product){$p=wc_get_product($product);if(!$p||!$p->is_type([$cfg['kind'].'_package',$cfg['kind'].'_package_subscription'])||!$p->is_purchasable())return new WP_Error('pob_package','Selected plan is unavailable.',['status'=>409]);}
        if(!$package&&!$product&&$paid::get_products())return new WP_Error('pob_package','Choose a plan or package quota.',['status'=>422]);
        $prop=$cfg['user_prop'];$paid::$$prop=$package?:null;$prop=$cfg['product_prop'];$paid::$$prop=$package?null:($product?:null);
        if($package||$product){$old=$_POST;$_POST=['security-'.$cfg['kind'].'-submit-package'=>wp_create_nonce('wp-freeio-'.$cfg['kind'].'-submit-package-nonce')];try{$paid::choose_package_handler();}finally{$_POST=$old;}if($c['form']->errors)return new WP_Error('pob_package',implode(' ',$c['form']->errors),['status'=>422]);}return null;
    }
    public static function read($r){
        $kind=sanitize_key($r['kind']);$id=absint($r['id']);$c=self::context($kind,$id);if(is_wp_error($c))return $c;$cfg=$c['cfg'];$packages=[];$products=[];$paid=$cfg['paid'];
        if(class_exists($paid)){
            foreach(WP_Freeio_Wc_Paid_Listings_Mixes::get_packages_by_user(get_current_user_id(),true,$kind.'_package') as $p){$prefix=WP_FREEIO_WC_PAID_LISTINGS_PREFIX;$packages[]=['id'=>$p->ID,'title'=>$p->post_title,'used'=>(int)get_post_meta($p->ID,$prefix.'package_count',true),'limit'=>get_post_meta($p->ID,$prefix.$kind.'_limit',true),'duration'=>get_post_meta($p->ID,$prefix.$kind.'_duration',true),'featured'=>get_post_meta($p->ID,$prefix.'feature_'.$kind.'s',true)==='on'];}
            foreach($paid::get_products() as $p){$product=wc_get_product($p->ID);if(!$product||!$product->is_purchasable())continue;$products[]=['id'=>$p->ID,'title'=>$p->post_title,'description'=>wp_kses_post(wpautop($product->get_description())),'excerpt'=>wp_kses_post(wpautop($product->get_short_description())),'price'=>$product->get_price()?wp_kses_post($product->get_price_html()):'Free','featured'=>$product->is_featured()];}
        }
        $out=new WP_REST_Response(['kind'=>$kind,'id'=>$id,'fields'=>POB_Service_Editor::fields($c['fields'],$id),'packages'=>$packages,'products'=>$products,'package_required'=>(!$id||in_array(get_post_status($id),['draft','expired'],true)||(get_post_status($id)==='preview'&&!get_post_meta($id,$cfg['prefix'].'user_package_id',true)&&!get_post_meta($id,$cfg['prefix'].'package_id',true)))&&(!empty($products)||!empty($packages)),'package'=>$id?absint(get_post_meta($id,$cfg['prefix'].'user_package_id',true)):0,'product'=>$id?absint(get_post_meta($id,$cfg['prefix'].'package_id',true)):0,'status'=>$id?get_post_status($id):'new']);$out->header('Cache-Control','private, no-store');return $out;
    }
    public static function save($r){
        $p=$r->get_json_params();$kind=sanitize_key($p['kind']??'');$id=absint($p['id']??0);$c=self::context($kind,$id);if(is_wp_error($c))return $c;$cfg=$c['cfg'];
        if(($p['action']??'')==='publish')return self::publish($c,$id,$p);
        if(($p['action']??'')!=='preview')return new WP_Error('pob_action','Unknown editor action.',['status'=>422]);
        if(!$id||in_array(get_post_status($id),['draft','preview','expired'],true)){$result=self::select($c,absint($p['package']??0),absint($p['product']??0));if(is_wp_error($result))return $result;}
        $values=$p['fields']??[];if(!is_array($values))return new WP_Error('pob_fields','Invalid fields.',['status'=>422]);$posted=[];
        foreach($c['fields'] as $f){$key=$f['id'];if($f['type']==='title')continue;$value=$values[$key]??'';if(!empty($f['attributes']['required'])&&($value===''||$value===[]))return new WP_Error('pob_required','Complete '.wp_strip_all_tags($f['name']??$key).'.',['status'=>422]);
            if($f['type']==='wp_freeio_file'){
                $ids=array_filter(array_map('absint',(array)$value));$existing=[];foreach((array)get_post_meta($id,$key,true) as $k=>$file)$existing[]=is_numeric($k)&&!is_numeric($file)?(int)$k:(is_numeric($file)?(int)$file:attachment_url_to_postid($file));
                if(count($ids)>max(1,(int)($f['file_limit']??10))||empty($f['file_multiple'])&&count($ids)>1)return new WP_Error('pob_media','Too many files.',['status'=>422]);
                foreach($ids as $attachment){if(get_post_type($attachment)!=='attachment'||(int)get_post_field('post_author',$attachment)!==get_current_user_id()&&!in_array($attachment,$existing,true))return new WP_Error('pob_media','Upload a file owned by this account.',['status'=>403]);if(!empty($f['allow_mime_types'])&&!in_array(get_post_mime_type($attachment),$f['allow_mime_types'],true))return new WP_Error('pob_media','File type is not allowed.',['status'=>422]);}
                $posted['current_'.$key]=!empty($f['file_multiple'])?array_values($ids):($ids?reset($ids):'');
            }
            $posted[$key]=str_contains($f['type'],'taxonomy_location')?POB_Service_Editor::location_ids($value):$value;
        }
        $posted[$cfg['prefix'].'post_type']=$cfg['type'];$posted['submit-cmb-'.$cfg['type']]='1';$posted[$c['cmb']->nonce()]=wp_create_nonce($c['cmb']->nonce());
        $old=$_POST;$_POST=wp_slash($posted);if($id)$_POST['object_id']=$id;$filter=function($override,$v,$object,$args)use($posted){$key='current_'.$args['id'];if(!array_key_exists($key,$posted))return $override;$value=$posted[$key];if(!is_array($value))return $value?wp_get_attachment_url($value):'';$out=[];foreach($value as $a)$out[$a]=wp_get_attachment_url($a);return $out;};add_filter('cmb2_sanitize_wp_freeio_file',$filter,999,4);
        try{$c['form']->submit_process();if($c['form']->errors)return new WP_Error('pob_validation',implode(' ',array_map('wp_strip_all_tags',$c['form']->errors)),['status'=>422]);$get=$cfg['id_method'];$saved=(int)$c['form']->$get();if(!$saved)return new WP_Error('pob_save','Unable to save listing.',['status'=>500]);if(!$id||in_array(get_post_status($saved),['preview','expired'],true)){delete_post_meta($saved,$cfg['prefix'].'user_package_id');delete_post_meta($saved,$cfg['prefix'].'package_id');do_action('wp-freeio-before-preview-'.$kind,get_post($saved));}return ['ok'=>true,'id'=>$saved,'status'=>get_post_status($saved),'message'=>'Saved successfully.'];}
        finally{$_POST=$old;remove_filter('cmb2_sanitize_wp_freeio_file',$filter,999);}
    }
    private static function publish($c,$id,$p){
        if(!$id)return new WP_Error('pob_preview','Save a preview first.',['status'=>422]);$cfg=$c['cfg'];$kind=$cfg['kind'];$paid=$cfg['paid'];$prefix=$cfg['prefix'];global $wpdb;$lock='pob_listing_'.$id;$quota_lock=null;
        if((int)$wpdb->get_var($wpdb->prepare('SELECT GET_LOCK(%s, 5)',$lock))!==1)return new WP_Error('pob_busy','Submission is processing.',['status'=>409]);$old=$_POST;$status_filter=null;$redirect=function($url){throw new POB_Service_Checkout_Redirect($url);};
        try{
            clean_post_cache($id);$status=get_post_status($id);
            if($status==='pending_payment'){if(!WC()->cart)wc_load_cart();foreach(WC()->cart->get_cart() as $item)if((int)($item[$kind.'_id']??0)===$id)return ['ok'=>true,'id'=>$id,'status'=>$status,'redirect'=>wc_get_checkout_url()];return new WP_Error('pob_payment','Review the existing payment for this listing.',['status'=>409]);}
            if(!in_array($status,['preview','expired'],true))return ['ok'=>true,'id'=>$id,'status'=>$status,'message'=>'This listing has already been submitted.'];
            $package=absint(get_post_meta($id,$prefix.'user_package_id',true));$product=absint(get_post_meta($id,$prefix.'package_id',true));
            if($package){$candidate='pob_quota_'.$package;if((int)$wpdb->get_var($wpdb->prepare('SELECT GET_LOCK(%s, 5)',$candidate))!==1)return new WP_Error('pob_busy','Quota is processing another listing.',['status'=>409]);$quota_lock=$candidate;clean_post_cache($package);}
            $selected=self::select($c,$package,$product);if(is_wp_error($selected))return $selected;
            if(!$package&&$product){if(!WC()->cart)wc_load_cart();if(!WC()->cart->is_empty()&&empty($p['replace_cart']))return new WP_Error('pob_cart','Confirm replacing the existing cart items before continuing to plan checkout.',['status'=>409,'confirm_cart'=>true]);}
            $form=$c['form'];if($package||$product){$status_filter=static function($state,$listing){return in_array($listing->post_status,['preview','expired'],true)?'pending_payment':$state;};add_filter('wp_freeio_submit_'.$kind.'_post_status',$status_filter,999,2);}$steps=array_keys($form->get_steps());$form->set_step(array_search('preview',$steps,true));$_POST=['security-'.$kind.'-submit-preview'=>wp_create_nonce('wp-freeio-'.$kind.'-submit-preview-nonce'),'continue-submit-'.$kind=>'1'];$form->preview_process();if($form->errors)return new WP_Error('pob_validation',implode(' ',$form->errors),['status'=>422]);
            add_filter('wp_redirect',$redirect,999);if(class_exists($paid)&&($package||$product))$paid::process_package_handler();$form->done_handler();return ['ok'=>true,'id'=>$id,'status'=>get_post_status($id),'message'=>'Listing submitted successfully.'];
        }catch(POB_Service_Checkout_Redirect $e){if(wp_parse_url($e->getMessage(),PHP_URL_HOST)!==wp_parse_url(home_url('/'),PHP_URL_HOST))return new WP_Error('pob_checkout','Unexpected checkout destination.',['status'=>500]);return ['ok'=>true,'id'=>$id,'status'=>get_post_status($id),'redirect'=>$e->getMessage()];}
        finally{$_POST=$old;if($status_filter)remove_filter('wp_freeio_submit_'.$kind.'_post_status',$status_filter,999);remove_filter('wp_redirect',$redirect,999);if($quota_lock)$wpdb->get_var($wpdb->prepare('SELECT RELEASE_LOCK(%s)',$quota_lock));$wpdb->get_var($wpdb->prepare('SELECT RELEASE_LOCK(%s)',$lock));}
    }
}
POB_Employer_Editors::boot();
