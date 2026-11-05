<?php
defined('ABSPATH')||exit;
final class POB_Job_Application {
 public static function boot(){add_action('rest_api_init',function(){register_rest_route('poblancer/v1','/job-application',[
 ['methods'=>'GET','permission_callback'=>[POB_Public_Actions::class,'permission'],'callback'=>[__CLASS__,'read']],
 ['methods'=>'POST','permission_callback'=>[POB_Public_Actions::class,'permission'],'callback'=>[__CLASS__,'write']],
 ]);});}
 public static function target($id){$p=POB_Public_Actions::target($id);if(is_wp_error($p)||$p->post_type!=='job_listing')return new WP_Error('pob_job','Job unavailable.',['status'=>404]);$deadline=WP_Freeio_Job_Listing::get_post_meta($p->ID,'application_deadline_date');if(WP_Freeio_Job_Listing::get_post_meta($p->ID,'filled')||($deadline&&strtotime($deadline)<strtotime(current_time('Y-m-d'))))return new WP_Error('pob_closed','This job is no longer accepting applications.',['status'=>422]);return $p;}
 public static function read($r){
  if(!POB_Public_Actions::permission())return new WP_Error('pob_auth','Please sign in.',['status'=>401]);$p=self::target($r['id']);if(is_wp_error($p))return $p;$uid=WP_Freeio_User::get_user_id();$profile=WP_Freeio_User::get_freelancer_by_user_id($uid);$attachments=(array)WP_Freeio_Freelancer::get_post_meta($profile,'cv_attachment');$cvs=[];foreach($attachments as $id=>$url)$cvs[]=['id'=>(int)$id,'name'=>basename(wp_parse_url($url,PHP_URL_PATH))];$u=wp_get_current_user();$type=WP_Freeio_Job_Listing::get_post_meta($p->ID,'apply_type');$external=WP_Freeio_Job_Listing::get_post_meta($p->ID,'apply_url');return ['title'=>$p->post_title,'type'=>$type?:'internal','external'=>preg_match('#^https?://#i',$external??'')?$external:null,'captcha'=>WP_Freeio_Recaptcha::is_recaptcha_enabled(),'cvs'=>$cvs,'name'=>$u->display_name,'email'=>$u->user_email,'terms'=>(bool)wp_freeio_get_option('terms_conditions_page_id')];
 }
 public static function write($r){
  if(!POB_Addons::permission())return new WP_Error('pob_role','Use a freelancer account to apply.',['status'=>403]);$p=self::target($r['id']);if(is_wp_error($p))return $p;if((int)$p->post_author===(int)WP_Freeio_User::get_user_id())return new WP_Error('pob_owner','You cannot apply to your own job.',['status'=>403]);
  if(wp_freeio_get_option('terms_conditions_page_id')&&$r['terms_and_conditions']!=='on')return new WP_Error('pob_terms','Accept the terms before submitting.',['status'=>422]);$message=$r['message'];if(!is_string($message)||!trim($message)||strlen($message)>10000)return new WP_Error('pob_message','Enter your application message.',['status'=>422]);
  $profile=WP_Freeio_User::get_freelancer_by_user_id(WP_Freeio_User::get_user_id());$cvs=(array)WP_Freeio_Freelancer::get_post_meta($profile,'cv_attachment');$cv=absint($r['apply_cv_id']);if($cv&&!array_key_exists($cv,$cvs))return new WP_Error('pob_cv','Choose a CV from your own profile.',['status'=>403]);
  $files=$r->get_file_params();if(!empty($files['cv_file']['name'])&&(int)$files['cv_file']['size']>10*1024*1024)return new WP_Error('pob_size','Choose a CV smaller than 10 MB.',['status'=>422]);$_FILES=isset($files['cv_file'])?['cv_file'=>$files['cv_file']]:[];
  $type=WP_Freeio_Job_Listing::get_post_meta($p->ID,'apply_type');if($type==='external')return new WP_Error('pob_external','This employer accepts applications through its external application link.',['status'=>422]);
  $_POST=['job_id'=>$p->ID,'message'=>sanitize_textarea_field($message),'apply_cv_id'=>$cv,'terms_and_conditions'=>'on','g-recaptcha-response'=>sanitize_text_field($r['captcha']??'')];
  if($type==='with_email'){$_POST['fullname']=sanitize_text_field($r['fullname']);$_POST['email']=sanitize_email($r['email']);$_POST['phone']=sanitize_text_field($r['phone']);WP_Freeio_Freelancer::process_apply_email();}
  $_POST['nonce']=wp_create_nonce('wp-freeio-apply-internal-nonce');WP_Freeio_Freelancer::process_apply_internal();
 }
}
POB_Job_Application::boot();
