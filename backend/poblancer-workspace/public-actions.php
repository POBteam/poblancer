<?php
defined('ABSPATH') || exit;
final class POB_Public_Actions {
 public static function boot(){add_action('rest_api_init',function(){register_rest_route('poblancer/v1','/public-action',[
  ['methods'=>'GET','callback'=>[__CLASS__,'read'],'permission_callback'=>[__CLASS__,'permission']],
  ['methods'=>'POST','callback'=>[__CLASS__,'write'],'permission_callback'=>[__CLASS__,'permission']],
 ]);});}
 public static function permission(){return POB_Workspace::allowed()&&is_user_logged_in();}
 public static function target($id){$p=get_post(absint($id));return $p&&in_array($p->post_type,['project','service','job_listing','employer','freelancer'],true)&&$p->post_status==='publish'&&!$p->post_password?$p:new WP_Error('pob_target','This listing is unavailable.',['status'=>404]);}
 public static function can_review($p){$class=['service'=>'WP_Freeio_Service','employer'=>'WP_Freeio_Employer','freelancer'=>'WP_Freeio_Freelancer'][$p->post_type]??null;return comments_open($p->ID)&&$class&&$class::check_restrict_review($p);}
 public static function read($r){
  if(!self::permission())return new WP_Error('pob_auth','Please sign in.',['status'=>401]);$p=self::target($r['id']);if(is_wp_error($p))return $p;$kind=$p->post_type==='job_listing'?'job':$p->post_type;
  $out=new WP_REST_Response(['id'=>$p->ID,'title'=>get_the_title($p),'saved'=>in_array($p->ID,array_map('absint',(array)get_user_meta(get_current_user_id(),'_favorite_'.$kind,true)),true),'can_message'=>(int)$p->post_author!==(int)WP_Freeio_User::get_user_id(),'can_review'=>self::can_review($p),'captcha'=>WP_Freeio_Recaptcha::is_recaptcha_enabled()]);$out->header('Cache-Control','private, no-store');return $out;
 }
 public static function write($r){
  if(!self::permission())return new WP_Error('pob_auth','Please sign in.',['status'=>401]);$b=$r->get_json_params();$p=self::target($b['id']??0);if(is_wp_error($p))return $p;$action=$b['action']??'';$kind=$p->post_type==='job_listing'?'job':$p->post_type;
  if($action==='save'){
   $saved=in_array($p->ID,array_map('absint',(array)get_user_meta(get_current_user_id(),'_favorite_'.$kind,true)),true);if($saved)return ['status'=>true,'msg'=>'Already saved.'];
   $_POST=[$kind.'_id'=>$p->ID,'nonce'=>wp_create_nonce('wp-freeio-add-'.$kind.'-favorite-nonce')];call_user_func([WP_Freeio_Favorite::class,'process_add_'.$kind.'_favorite']);
  }
  if(!in_array($action,['message','report','review'],true))return new WP_Error('pob_action','Unknown action.',['status'=>422]);
  $message=$b['message']??'';$subject=$b['subject']??'';
  if(!is_string($message)||!trim($message)||strlen($message)>10000)return new WP_Error('pob_message','Enter a message of up to 10,000 bytes.',['status'=>422]);
  if($action==='review'){
   if(!self::can_review($p))return new WP_Error('pob_review','Reviews are closed.',['status'=>403]);
   if((int)$p->post_author===(int)WP_Freeio_User::get_user_id())return new WP_Error('pob_review','You cannot review your own listing.',['status'=>403]);
   $rating=$b['rating']??0;if(!in_array((string)$rating,['1','2','3','4','5'],true))return new WP_Error('pob_rating','Choose a rating from 1 to 5.',['status'=>422]);
   $_POST=['rating'=>(int)$rating];$comment=wp_handle_comment_submission(wp_slash(['comment_post_ID'=>$p->ID,'comment'=>trim($message),'comment_parent'=>0]));if(is_wp_error($comment))return $comment;
   return ['status'=>true,'msg'=>$comment->comment_approved==='1'?'Your review has been added.':'Your review has been submitted for moderation.'];
  }
  if(!is_string($subject)||!trim($subject)||strlen($subject)>200)return new WP_Error('pob_subject','Enter a subject of up to 200 bytes.',['status'=>422]);
  if($action==='report'){
   $_POST=['post_id'=>$p->ID,'subject'=>trim($subject),'message'=>trim($message),'g-recaptcha-response'=>sanitize_text_field($b['captcha']??'')];WP_Freeio_Post_Type_Report::process_report();
  }
  if($action==='message'){
   $recipient=(int)$p->post_author;if(!$recipient||!get_userdata($recipient)||$recipient===(int)WP_Freeio_User::get_user_id())return new WP_Error('pob_recipient','Select another marketplace account.',['status'=>422]);
   global $wpdb;$lock='pob_new_message_'.get_current_user_id();if((int)$wpdb->get_var($wpdb->prepare('SELECT GET_LOCK(%s,3)',$lock))!==1)return new WP_Error('pob_busy','Another message is sending.',['status'=>409]);register_shutdown_function(function()use($wpdb,$lock){$wpdb->get_var($wpdb->prepare('SELECT RELEASE_LOCK(%s)',$lock));});
   $uid=(int)WP_Private_Message_Mixes::get_current_user_id();$last=get_posts(['post_type'=>'private_message','post_status'=>'publish','author'=>$uid,'posts_per_page'=>1,'orderby'=>'ID','order'=>'DESC']);if($last&&time()-get_post_time('U',true,$last[0])<10)return new WP_Error('pob_rate','Please wait before sending another message.',['status'=>429]);
   $_POST=['recipient'=>$recipient,'subject'=>trim($subject),'message'=>trim($message),'wp-private-message-send-message-nonce'=>wp_create_nonce('wp-private-message-send-message')];WP_Private_Message_Message::process_send_message();
  }
 }
}
POB_Public_Actions::boot();
