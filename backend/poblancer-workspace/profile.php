<?php
defined('ABSPATH') || exit;
final class POB_Profile {
    public static function permission(){return POB_Workspace::allowed()&&is_user_logged_in()&&(WP_Freeio_User::is_freelancer()||WP_Freeio_User::is_employer());}
    public static function boot(){add_action('rest_api_init',function(){register_rest_route('poblancer/v1','/profile',[
        ['methods'=>'GET','callback'=>[__CLASS__,'read'],'permission_callback'=>[__CLASS__,'permission']],['methods'=>'POST','callback'=>[__CLASS__,'save'],'permission_callback'=>[__CLASS__,'permission']],
    ]);});}
    private static function context(){
        if(!self::permission())return new WP_Error('pob_profile','Marketplace account required.',['status'=>403]);
        $owner=WP_Freeio_User::get_user_id();$employer=WP_Freeio_User::is_employer();$role=$employer?'employer':'freelancer';$prefix='_'.$role.'_';
        $id=$employer?WP_Freeio_User::get_employer_by_user_id($owner):WP_Freeio_User::get_freelancer_by_user_id($owner);
        if(!$id)return new WP_Error('pob_profile','Profile unavailable.',['status'=>404]);
        $class=$employer?'WP_Freeio_Post_Type_Employer':'WP_Freeio_Post_Type_Freelancer';$boxes=$class::fields_front([]);if(!$employer)$boxes=$class::fields_resume_front($boxes);
        $fields=[];$cmbs=[];foreach($boxes as $box){$cmbs[$box['id']]=cmb2_get_metabox($box,$id);foreach($box['fields'] as $f)$fields[$f['id']]=$f;}
        $revision=hash('sha256',serialize(get_post_meta($id)).get_post_field('post_modified_gmt',$id));
        return compact('id','owner','prefix','role','fields','cmbs','revision');
    }
    public static function read($r){
        $c=self::context();if(is_wp_error($c))return $c;
        $data=['kind'=>'profile','id'=>$c['id'],'role'=>$c['role'],'revision'=>$c['revision'],'fields'=>POB_Service_Editor::fields(array_values($c['fields']),$c['id']),'packages'=>[],'products'=>[],'package_required'=>false,'status'=>'profile','profile_url'=>get_permalink($c['id'])];
        $out=new WP_REST_Response($data);$out->header('Cache-Control','private, no-store');return $out;
    }
    public static function save($r){
        $c=self::context();if(is_wp_error($c))return $c;
        global $wpdb;$lock='pob_profile_'.$c['id'];if((int)$wpdb->get_var($wpdb->prepare('SELECT GET_LOCK(%s, 5)',$lock))!==1)return new WP_Error('pob_busy','This profile is being updated. Please retry.',['status'=>409]);
        try{clean_post_cache($c['id']);return self::save_current($r);}finally{$wpdb->get_var($wpdb->prepare('SELECT RELEASE_LOCK(%s)',$lock));}
    }
    private static function save_current($r){
        $c=self::context();if(is_wp_error($c))return $c;$p=$r->get_json_params();
        if(absint($p['id']??0)!==(int)$c['id'])return new WP_Error('pob_owner','This profile belongs to another account.',['status'=>403]);
        if(($p['revision']??'')!==$c['revision'])return new WP_Error('pob_stale','Your profile changed. Reload before saving.',['status'=>409]);
        $values=$p['fields']??[];if(!is_array($values))return new WP_Error('pob_fields','Invalid profile fields.',['status'=>422]);$posted=[];
        foreach($c['fields'] as $key=>$f){
            if($f['type']==='title')continue;$value=$values[$key]??'';
            if(!empty($f['attributes']['required'])&&($value===''||$value===[]))return new WP_Error('pob_required','Complete '.wp_strip_all_tags($f['name']??$key).'.',['status'=>422]);
            if(str_contains($f['type'],'taxonomy_location'))$value=POB_Service_Editor::location_ids($value);
            if($f['type']==='wp_freeio_file'){
                $ids=array_filter(array_map('absint',(array)$value));$existing=[];foreach((array)get_post_meta($c['id'],$key,true) as $k=>$file)$existing[]=is_numeric($k)&&!is_numeric($file)?(int)$k:(is_numeric($file)?(int)$file:attachment_url_to_postid($file));
                if(count($ids)>max(1,(int)($f['file_limit']??10))||empty($f['file_multiple'])&&count($ids)>1)return new WP_Error('pob_media','Too many files.',['status'=>422]);
                foreach($ids as $attachment){if(get_post_type($attachment)!=='attachment'||(int)get_post_field('post_author',$attachment)!==get_current_user_id()&&!in_array($attachment,$existing,true))return new WP_Error('pob_media','Upload a file owned by this account.',['status'=>403]);if(!empty($f['allow_mime_types'])&&!in_array(get_post_mime_type($attachment),$f['allow_mime_types'],true))return new WP_Error('pob_media','This file type is not allowed.',['status'=>422]);}
                $posted['current_'.$key]=!empty($f['file_multiple'])?array_values($ids):($ids?reset($ids):'');
            }
            $posted[$key]=$value;if($f['type']==='wp_freeio_profile_url')$posted['profile_url_slug']=sanitize_title($value);
        }
        $email=$posted[$c['prefix'].'email']??'';if(!is_string($email)||!is_email($email)||email_exists($email)&&email_exists($email)!==$c['owner'])return new WP_Error('pob_email','Enter an available valid email address.',['status'=>422]);
        $posted['object_id']=$c['id'];$posted[$c['prefix'].'post_type']=$c['role'];$posted['submit-cmb-profile']='1';
        if($c['role']==='freelancer')$posted['submit-cmb-resume']='1';foreach($c['cmbs'] as $cmb)$posted[$cmb->nonce()]=wp_create_nonce($cmb->nonce());
        $old=$_POST;$old_files=$_FILES;$_POST=wp_slash($posted);$_FILES[$c['prefix'].'featured_image']=['name'=>'','error'=>UPLOAD_ERR_NO_FILE];$before=count($_SESSION['messages']??[]);
        $filter=function($override,$v,$id,$args)use($posted){$key='current_'.$args['id'];if(!array_key_exists($key,$posted))return $override;$value=$posted[$key];if(!is_array($value))return $value?wp_get_attachment_url($value):'';$out=[];foreach($value as $attachment)$out[$attachment]=wp_get_attachment_url($attachment);return $out;};
        add_filter('cmb2_sanitize_wp_freeio_file',$filter,999,4);
        try{
            WP_Freeio_User::process_change_profile();if($c['role']==='freelancer')WP_Freeio_User::process_change_resume();
            foreach(array_slice($_SESSION['messages']??[],$before) as $message)if(($message[0]??'')==='danger')return new WP_Error('pob_save',wp_strip_all_tags($message[1]),['status'=>422]);
            $featured=$posted['current_'.$c['prefix'].'featured_image']??null;if($featured!==null){if($featured)set_post_thumbnail($c['id'],is_array($featured)?reset($featured):$featured);else delete_post_thumbnail($c['id']);}
            $updated=self::context();return ['ok'=>true,'id'=>$c['id'],'status'=>'profile','revision'=>$updated['revision'],'message'=>'Profile has been successfully updated.'];
        }finally{remove_filter('cmb2_sanitize_wp_freeio_file',$filter,999);$_POST=$old;$_FILES=$old_files;}
    }
}
POB_Profile::boot();
