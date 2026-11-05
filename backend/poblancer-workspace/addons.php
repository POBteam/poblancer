<?php
defined('ABSPATH') || exit;
final class POB_Addons {
    public static function boot(){add_action('rest_api_init',function(){register_rest_route('poblancer/v1','/addons',[
        ['methods'=>'GET','callback'=>[__CLASS__,'read'],'permission_callback'=>[__CLASS__,'permission']],
        ['methods'=>'POST','callback'=>[__CLASS__,'save'],'permission_callback'=>[__CLASS__,'permission']],
    ]);});}
    public static function permission(){return POB_Workspace::allowed()&&is_user_logged_in()&&WP_Freeio_User::is_freelancer();}
    public static function read($r){
        if(!self::permission())return new WP_Error('pob_role','A freelancer account is required.',['status'=>403]);
        $page=max(1,absint($r['page']));$q=new WP_Query(['post_type'=>'service_addon','post_status'=>'publish','author'=>get_current_user_id(),'posts_per_page'=>20,'paged'=>$page,'s'=>sanitize_text_field($r['search']??'')]);
        $rows=[];foreach($q->posts as $p)$rows[]=['id'=>$p->ID,'title'=>$p->post_title,'description'=>$p->post_content,'price'=>get_post_meta($p->ID,WP_FREEIO_SERVICE_ADDON_PREFIX.'price',true)];
        $out=new WP_REST_Response(['rows'=>$rows,'page'=>$page,'pages'=>(int)$q->max_num_pages,'total'=>(int)$q->found_posts,'currency'=>get_woocommerce_currency()]);$out->header('Cache-Control','private, no-store');return $out;
    }
    public static function save($r){
        if(!self::permission())return new WP_Error('pob_role','A freelancer account is required.',['status'=>403]);
        $p=$r->get_json_params();$id=absint($p['id']??0);$post=$id?get_post($id):null;
        if($id&&(!$post||$post->post_type!=='service_addon'||(int)$post->post_author!==get_current_user_id()||$post->post_status!=='publish'))return new WP_Error('pob_owner','Addon unavailable.',['status'=>403]);
        if(($p['action']??'')==='trash'){
            if(!$id)return new WP_Error('pob_id','Select an addon.',['status'=>422]);
            // Keep deletion recoverable in WordPress Trash, even if the installation disables Trash.
            if(!defined('EMPTY_TRASH_DAYS')||EMPTY_TRASH_DAYS<=0)return new WP_Error('pob_trash','Recoverable removal is unavailable. Ask an administrator to review this addon.',['status'=>409]);
            return wp_trash_post($id)?['ok'=>true]:new WP_Error('pob_save','Unable to remove addon.',['status'=>500]);
        }
        $title=sanitize_text_field($p['title']??'');$description=sanitize_textarea_field($p['description']??'');$price=$p['price']??'';
        if(!$title||strlen($title)>200||strlen($description)>10000||!is_numeric($price)||(float)$price<=0||!is_finite((float)$price)||(float)$price>100000000)return new WP_Error('pob_fields','Enter a title and a valid positive price.',['status'=>422]);
        do_action('wp-freeio-before-save-service-addon');
        $data=['post_title'=>$title,'post_content'=>$description,'post_author'=>get_current_user_id(),'post_type'=>'service_addon','post_status'=>'publish'];if($id)$data['ID']=$id;
        $saved=$id?wp_update_post($data,true):wp_insert_post($data,true);if(is_wp_error($saved))return $saved;
        update_post_meta($saved,WP_FREEIO_SERVICE_ADDON_PREFIX.'price',wc_format_decimal($price,2));return ['ok'=>true,'id'=>$saved];
    }
}
POB_Addons::boot();
