<?php
defined('ABSPATH') || exit;
final class POB_Service_Editor {
    public static function boot(){add_action('rest_api_init',function(){register_rest_route('poblancer/v1','/editor-terms',['methods'=>'GET','callback'=>[__CLASS__,'terms'],'permission_callback'=>[POB_Profile::class,'permission']]);register_rest_route('poblancer/v1','/service-editor',[
        ['methods'=>'GET','callback'=>[__CLASS__,'read'],'permission_callback'=>[POB_Addons::class,'permission']],
        ['methods'=>'POST','callback'=>[__CLASS__,'save'],'permission_callback'=>[POB_Addons::class,'permission']],
    ]);});}
    // Flat picker options must be SQL-limited; hierarchical queries load the full tree first.
    public static function terms($r){
        $taxonomy=sanitize_key($r['taxonomy']);$allowed=[];foreach(['service','project','job_listing','freelancer','employer'] as $type)$allowed=array_merge($allowed,get_object_taxonomies($type));if(!in_array($taxonomy,$allowed,true))return new WP_Error('pob_taxonomy','Unknown selection.',['status'=>422]);
        $terms=get_terms(['taxonomy'=>$taxonomy,'hide_empty'=>false,'hierarchical'=>false,'number'=>60,'search'=>sanitize_text_field($r['search']??''),'update_term_meta_cache'=>false]);
        if(is_wp_error($terms))return $terms;
        return array_map(fn($t)=>['value'=>(string)$t->term_id,'label'=>$t->name],$terms);
    }
    private static function context($id){
        if(!POB_Addons::permission())return new WP_Error('pob_role','A freelancer account is required.',['status'=>403]);
        if($id){$p=get_post($id);if(!$p||$p->post_type!=='service'||(int)$p->post_author!==(int)WP_Freeio_User::get_user_id()||!WP_Freeio_User::is_freelancer_can_edit_service($id))return new WP_Error('pob_owner','Service unavailable.',['status'=>403]);}
        elseif(!WP_Freeio_User::is_freelancer_can_add_submission(get_current_user_id()))return new WP_Error('pob_submit','This account cannot submit a service.',['status'=>403]);
        $_REQUEST['service_id']=$id;
        // Existing listings use Freeio's edit policy/hooks; previews and relists use submission.
        $class=$id&&!in_array(get_post_status($id),['draft','preview','expired'],true)?'WP_Freeio_Service_Edit_Form':'WP_Freeio_Service_Submit_Form';
        $form=$class::get_instance();
        if($form->get_service_id()!==$id)return new WP_Error('pob_context','Reload the service editor before continuing.',['status'=>409]);
        $boxes=$form->fields_front([]);
        $box=$boxes[WP_FREEIO_SERVICE_PREFIX.'front'];
        $cmb=cmb2_get_metabox($box,$id);
        if(!$cmb)return new WP_Error('pob_schema','The service field definitions could not be loaded.',['status'=>503]);
        return ['form'=>$form,'fields'=>$box['fields'],'cmb'=>$cmb];
    }
    private static function valid_quota($id){
        $p=get_post($id);return $p&&$p->post_type==='job_package'&&$p->post_status==='publish'&&get_post_meta($id,WP_FREEIO_WC_PAID_LISTINGS_PREFIX.'package_type',true)==='service_package'&&WP_Freeio_Wc_Paid_Listings_Mixes::service_package_is_valid(get_current_user_id(),$id);
    }
    public static function fields($fields,$id=0,$nested=false){
        $out=[];foreach($fields as $f){
            $key=$f['id'];$type=$f['type'];$v=$id&&metadata_exists('post',$id,$key)?get_post_meta($id,$key,true):($f['default']??'');
            if(preg_match('/^_(service|job|project|freelancer|employer)_title$/',$key))$v=$id?get_the_title($id):'';
            if(preg_match('/^_(service|job|project|freelancer|employer)_description$/',$key))$v=$id?get_post_field('post_content',$id):'';
            if($type==='wp_freeio_profile_url')$v=get_post_field('post_name',$id);
            $x=['id'=>$key,'name'=>wp_strip_all_tags($f['name']??$key),'type'=>$type,'required'=>!empty($f['attributes']['required']),'value'=>$v,'attributes'=>array_intersect_key($f['attributes']??[],array_flip(['min','max','step','type','maxlength']))];
            $taxonomy=$f['taxonomy']??(str_contains($type,'taxonomy_location')?'location':'');
            if($taxonomy){$terms=get_terms(['taxonomy'=>$taxonomy,'hide_empty'=>false,'hierarchical'=>false,'number'=>60,'update_term_meta_cache'=>false]);$x['taxonomy']=$taxonomy;$x['options']=[];if(!is_wp_error($terms))foreach($terms as $term)$x['options'][]=['value'=>(string)$term->term_id,'label'=>html_entity_decode($term->name,ENT_QUOTES,'UTF-8')];$x['multiple']=str_contains($type,'multi');$x['value']=$id?wp_get_object_terms($id,$taxonomy,['fields'=>'ids']):[];if($id)foreach(wp_get_object_terms($id,$taxonomy,['update_term_meta_cache'=>false]) as $term)if(!in_array((string)$term->term_id,array_column($x['options'],'value'),true))$x['options'][]=['value'=>(string)$term->term_id,'label'=>html_entity_decode($term->name,ENT_QUOTES,'UTF-8')];}
            elseif($type==='wpjb_addons'){
                $args=['post_type'=>'service_addon','post_status'=>'publish','author'=>get_current_user_id(),'numberposts'=>20];
                $choices=get_posts($args);$selected=array_values(array_filter(array_map('absint',(array)$v)));
                // Keep every saved owned selection even when it is outside the first page.
                if($selected)$choices=array_merge($choices,get_posts(array_merge($args,['post__in'=>$selected,'numberposts'=>count($selected)])));
                $x['options']=[];$seen=[];foreach($choices as $p)if(!isset($seen[$p->ID])){$seen[$p->ID]=true;$x['options'][]=['value'=>(string)$p->ID,'label'=>$p->post_title];}
                $x['multiple']=true;$x['lookup']='addons';
            }
            elseif(in_array($type,['select','pw_select','pw_multiselect','radio','multicheck'],true)){$x['multiple']=in_array($type,['multicheck','pw_multiselect'],true);$x['options']=[];foreach(($f['options']??[]) as $k=>$label)if(is_scalar($label))$x['options'][]=['value'=>(string)$k,'label'=>wp_strip_all_tags($label)];}
            if($taxonomy&&!$x['multiple']&&$id&&!empty($x['value'])){
                // A single location input stores its ancestor path; display the most specific term.
                $selected='';$depth=-1;
                foreach((array)$x['value'] as $term_id){$level=count(get_ancestors((int)$term_id,$taxonomy,'taxonomy'));if($level>$depth){$selected=(string)$term_id;$depth=$level;}}
                $x['selected_value']=$selected;
            }
            if($type==='group')$x['fields']=self::fields($f['fields']??[],0,true);
            if($type==='wp_freeio_file'){
                $x['multiple']=!empty($f['file_multiple']);$x['accept']=implode(',',array_map(fn($e)=>'.'.$e,$f['mime_types']??[]));$x['files']=[];
                foreach((array)$v as $k=>$value){$attachment=is_numeric($k)&&!is_numeric($value)?(int)$k:(is_numeric($value)?(int)$value:attachment_url_to_postid($value));if($attachment)$x['files'][]=['id'=>$attachment,'url'=>wp_get_attachment_url($attachment),'name'=>get_the_title($attachment)];}
            }
            $out[]=$x;
        }return $out;
    }
    public static function read($r){
        $id=absint($r['id']);$c=self::context($id);if(is_wp_error($c))return $c;$packages=[];$products=[];
        if(class_exists('WP_Freeio_Wc_Paid_Listings_Mixes')){
            foreach(WP_Freeio_Wc_Paid_Listings_Mixes::get_packages_by_user(get_current_user_id(),true,'service_package') as $p){$prefix=WP_FREEIO_WC_PAID_LISTINGS_PREFIX;$packages[]=['id'=>$p->ID,'title'=>$p->post_title,'used'=>(int)get_post_meta($p->ID,$prefix.'package_count',true),'limit'=>get_post_meta($p->ID,$prefix.'service_limit',true),'duration'=>get_post_meta($p->ID,$prefix.'service_duration',true),'featured'=>get_post_meta($p->ID,$prefix.'feature_services',true)==='on'];}
            foreach(WP_Freeio_Wc_Paid_Listings_Service_Submit_Form::get_products() as $p){$product=wc_get_product($p->ID);if(!$product||!$product->is_purchasable())continue;$products[]=['id'=>$p->ID,'title'=>$p->post_title,'description'=>wp_kses_post(wpautop($product->get_description())),'excerpt'=>wp_kses_post(wpautop($product->get_short_description())),'price'=>$product->get_price()?wp_kses_post($product->get_price_html()):'Free','featured'=>$product->is_featured()];}
        }
        $out=new WP_REST_Response(['id'=>$id,'fields'=>self::fields($c['fields'],$id),'packages'=>$packages,'products'=>$products,'package_required'=>(!$id||in_array(get_post_status($id),['draft','expired'],true)||(get_post_status($id)==='preview'&&!get_post_meta($id,'_service_user_package_id',true)&&!get_post_meta($id,'_service_package_id',true)))&&(!empty($products)||!empty($packages)),'package'=>$id?absint(get_post_meta($id,'_service_user_package_id',true)):0,'product'=>$id?absint(get_post_meta($id,'_service_package_id',true)):0,'status'=>$id?get_post_status($id):'new']);$out->header('Cache-Control','private, no-store');return $out;
    }
    public static function save($r){
        $p=$r->get_json_params();$id=absint($p['id']??0);$c=self::context($id);if(is_wp_error($c))return $c;
        if(($p['action']??'')==='publish')return self::publish($id,$c,$p);
        if(($p['action']??'')!=='preview')return new WP_Error('pob_action','Save a preview before submitting.',['status'=>422]);
        $fields=is_array($p['fields']??null)?$p['fields']:[];$posted=[];
        foreach($c['fields'] as $f){
            $key=$f['id'];if($f['type']==='title')continue;
            $value=$fields[$key]??'';
            if(!empty($f['attributes']['required'])&&($value===''||$value===[]))return new WP_Error('pob_required','Complete '.wp_strip_all_tags($f['name']??$key).'.',['status'=>422]);
            if($f['type']==='wp_freeio_file'){
                $ids=array_map('absint',(array)$value);$existing=[];
                foreach((array)get_post_meta($id,$key,true) as $k=>$file){$existing[]=is_numeric($k)&&!is_numeric($file)?(int)$k:(is_numeric($file)?(int)$file:attachment_url_to_postid($file));}
                if(count($ids)>max(1,(int)($f['file_limit']??10)))return new WP_Error('pob_media','Too many files for '.wp_strip_all_tags($f['name']).'.',['status'=>422]);
                foreach($ids as $attachment){if(str_contains(strtolower($key),'gallery')&&!in_array(get_post_mime_type($attachment),['image/jpeg','image/png','image/webp'],true))return new WP_Error('pob_image','Gallery images must be JPEG, JPG, PNG or WebP.',['status'=>422]);$media=get_post($attachment);if(!$media||$media->post_type!=='attachment'||((int)$media->post_author!==get_current_user_id()&&!in_array($attachment,$existing,true)))return new WP_Error('pob_media','Upload a file owned by this account.',['status'=>403]);
                    if(!empty($f['allow_mime_types'])&&!in_array(get_post_mime_type($attachment),$f['allow_mime_types'],true))return new WP_Error('pob_media','This file type is not allowed for '.wp_strip_all_tags($f['name']).'.',['status'=>422]);
                }
                if(empty($f['file_multiple'])&&count($ids)>1)return new WP_Error('pob_media','Choose one file for '.wp_strip_all_tags($f['name']).'.',['status'=>422]);
                $posted['current_'.$key]=!empty($f['file_multiple'])?$ids:($ids[0]??'');
            }
            if($f['type']==='pw_map'){$lat=$value['latitude']??'';$lng=$value['longitude']??'';if(($lat!==''||$lng!=='')&&(!is_numeric($lat)||!is_numeric($lng)||abs((float)$lat)>90||abs((float)$lng)>180))return new WP_Error('pob_map','Enter both latitude (-90 to 90) and longitude (-180 to 180).',['status'=>422]);}
            $posted[$key]=$value;
            if(str_contains($f['type'],'taxonomy_location'))$posted[$key]=self::location_ids($value);
        }
        $package=absint($p['package']??0);$product_id=absint($p['product']??0);
        if((!$id||in_array(get_post_status($id),['draft','preview','expired'],true))&&class_exists('WP_Freeio_Wc_Paid_Listings_Service_Submit_Form')&&(WP_Freeio_Wc_Paid_Listings_Service_Submit_Form::get_products()||$package||$product_id)){
            if($package){if(!self::valid_quota($package))return new WP_Error('pob_package','Select an available package quota.',['status'=>422]);}
            elseif($product_id){$product=wc_get_product($product_id);if(!$product||!$product->is_type(['service_package','service_package_subscription'])||!$product->is_purchasable())return new WP_Error('pob_package','This package is unavailable.',['status'=>422]);}
            else return new WP_Error('pob_package','Choose a plan or an available package quota.',['status'=>422]);
            WP_Freeio_Wc_Paid_Listings_Service_Submit_Form::$service_user_package=$package?:null;
            WP_Freeio_Wc_Paid_Listings_Service_Submit_Form::$service_package=$product_id?:null;
            $old_post=$_POST;$_POST=['security-service-submit-package'=>wp_create_nonce('wp-freeio-service-submit-package-nonce')];
            try{WP_Freeio_Wc_Paid_Listings_Service_Submit_Form::choose_package_handler();}finally{$_POST=$old_post;}
            if($c['form']->errors)return new WP_Error('pob_package',implode(' ',$c['form']->errors),['status'=>422]);
        }
        $cmb=$c['cmb'];
        $old=$_POST;$_POST=wp_slash($posted);$_POST[$cmb->nonce()]=wp_create_nonce($cmb->nonce());$_POST['submit-cmb-service']='1';$_POST['_service_post_type']='service';if($id)$_POST['object_id']=$id;
        $file_filter=function($override,$value,$object_id,$args)use($posted){
            $key=$args['id'];if(!array_key_exists('current_'.$key,$posted))return $override;$ids=$posted['current_'.$key];
            if(!is_array($ids))return $ids?wp_get_attachment_url($ids):'';
            $out=[];foreach($ids as $attachment)$out[$attachment]=wp_get_attachment_url($attachment);return $out;
        };
        add_filter('cmb2_sanitize_wp_freeio_file',$file_filter,999,4);
        try{
            $c['form']->submit_process();
            if($c['form']->errors)return new WP_Error('pob_validation',implode(' ',array_map('wp_strip_all_tags',$c['form']->errors)),['status'=>422]);
            $saved=(int)$c['form']->get_service_id();if(!$saved)return new WP_Error('pob_save','The service could not be saved.',['status'=>500]);
            if(!$id||in_array(get_post_status($saved),['preview','expired'],true)){if($package||$product_id){delete_post_meta($saved,'_service_user_package_id');delete_post_meta($saved,'_service_package_id');}do_action('wp-freeio-before-preview-service',get_post($saved));}
            return ['ok'=>true,'id'=>$saved,'status'=>get_post_status($saved),'message'=>$id?'Service updated.':'Preview saved. Publication and package completion are still required.'];
        }finally{remove_filter('cmb2_sanitize_wp_freeio_file',$file_filter,999);$_POST=$old;}
    }
    public static function location_ids($value){
        $ids=array_filter(array_map('absint',(array)$value));$out=[];foreach($ids as $id){$t=get_term($id,'location');if(!$t||is_wp_error($t))continue;$out=array_merge($out,array_reverse(get_ancestors($id,'location','taxonomy')),[$id]);}return array_values(array_unique(array_map('absint',$out)));
    }
    private static function publish($id,$context,$p){
        if(!$id)return new WP_Error('pob_preview','Save the preview first.',['status'=>422]);
        global $wpdb;$lock='pob_service_submit_'.$id;
        if((int)$wpdb->get_var($wpdb->prepare('SELECT GET_LOCK(%s, 5)',$lock))!==1)return new WP_Error('pob_busy','Submission is already processing. Please retry.',['status'=>409]);
        $old=$_POST;$quota_lock=null;$redirect=function($url){throw new POB_Service_Checkout_Redirect($url);};
        try{
            clean_post_cache($id);$status=get_post_status($id);
            if($status==='pending_payment'){
                if(!WC()->cart)wc_load_cart();foreach(WC()->cart->get_cart() as $item)if((int)($item['service_id']??0)===$id)return ['ok'=>true,'id'=>$id,'status'=>$status,'redirect'=>wc_get_checkout_url()];
                return new WP_Error('pob_payment','This service is awaiting payment. Review its existing checkout or order before trying again.',['status'=>409]);
            }
            if(!in_array($status,['preview','expired'],true))return ['ok'=>true,'id'=>$id,'status'=>$status,'message'=>'This service has already been submitted.'];
            $package=absint(get_post_meta($id,'_service_user_package_id',true));$product_id=absint(get_post_meta($id,'_service_package_id',true));
            $paid=class_exists('WP_Freeio_Wc_Paid_Listings_Service_Submit_Form');
            if($paid){
                if($package){
                    $candidate='pob_service_quota_'.$package;if((int)$wpdb->get_var($wpdb->prepare('SELECT GET_LOCK(%s, 5)',$candidate))!==1)return new WP_Error('pob_busy','This quota is processing another service. Please retry.',['status'=>409]);$quota_lock=$candidate;
                    clean_post_cache($package);if(!self::valid_quota($package))return new WP_Error('pob_package','The selected quota is no longer available.',['status'=>409]);
                }
                if(!$package&&$product_id){
                    $product=wc_get_product($product_id);if(!$product||!$product->is_purchasable()||!$product->is_type(['service_package','service_package_subscription']))return new WP_Error('pob_package','The selected plan is unavailable.',['status'=>409]);
                    if(!WC()->cart)wc_load_cart();
                    if(!WC()->cart->is_empty()&&empty($p['replace_cart']))return new WP_Error('pob_cart','Your cart has other items. Confirm replacing those items before continuing to package checkout.',['status'=>409,'confirm_cart'=>true]);
                }elseif(!$package&&WP_Freeio_Wc_Paid_Listings_Service_Submit_Form::get_products())return new WP_Error('pob_package','This preview has no package selection.',['status'=>409]);
                WP_Freeio_Wc_Paid_Listings_Service_Submit_Form::$service_user_package=$package?:null;
                WP_Freeio_Wc_Paid_Listings_Service_Submit_Form::$service_package=$package?null:($product_id?:null);
            }
            $form=$context['form'];$steps=array_keys($form->get_steps());$form->set_step(array_search('preview',$steps,true));
            $_POST=['security-service-submit-preview'=>wp_create_nonce('wp-freeio-service-submit-preview-nonce'),'continue-submit-service'=>'1'];
            $form->preview_process();if($form->errors)return new WP_Error('pob_submit',implode(' ',$form->errors),['status'=>422]);
            add_filter('wp_redirect',$redirect,999);
            if($paid&&($package||$product_id))$form->process();else $form->done_handler();
            delete_transient('pobws_'.POB_Workspace::VERSION.'_'.get_current_user_id().'_'.WP_Freeio_User::get_user_id().'_freelancer');
            return ['ok'=>true,'id'=>$id,'status'=>get_post_status($id),'message'=>get_post_status($id)==='publish'?'Service published.':'Service submitted for review.'];
        }catch(POB_Service_Checkout_Redirect $e){
            $url=$e->getMessage();if(wp_parse_url($url,PHP_URL_HOST)!==wp_parse_url(home_url('/'),PHP_URL_HOST))return new WP_Error('pob_checkout','Unexpected checkout destination.',['status'=>500]);
            return ['ok'=>true,'id'=>$id,'status'=>get_post_status($id),'redirect'=>$url];
        }finally{remove_filter('wp_redirect',$redirect,999);$_POST=$old;if($quota_lock)$wpdb->get_var($wpdb->prepare('SELECT RELEASE_LOCK(%s)',$quota_lock));$wpdb->get_var($wpdb->prepare('SELECT RELEASE_LOCK(%s)',$lock));}
    }
}
class POB_Service_Checkout_Redirect extends RuntimeException {}
POB_Service_Editor::boot();
