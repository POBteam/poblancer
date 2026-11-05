<?php
defined('ABSPATH')||exit;
final class POB_Frontend_Sync {
 private static $tags=[];
 public static function boot(){
  add_action('save_post',[__CLASS__,'post'],100,1);
  foreach(['added_post_meta','updated_post_meta','deleted_post_meta'] as $hook)add_action($hook,[__CLASS__,'meta'],100,4);
  add_action('set_object_terms',function($id){self::post($id);},100,1);
  add_action('comment_post',function($id){$c=get_comment($id);if($c)self::post($c->comment_post_ID);},100,1);
  add_action('transition_comment_status',function($new,$old,$c){self::post($c->comment_post_ID);},100,3);
  add_action('shutdown',[__CLASS__,'send'],100);
 }
 public static function meta($meta,$id,$key,$value){if($key==='_pob_video_portfolio'){self::$tags['public-video-portfolio-'.absint($id)]=true;return;}if(preg_match('/view|visit|last_seen/i',$key))return;if(preg_match('/^_(service|project|job|freelancer|employer)_|^_elementor_data$|^_thumbnail_id$|^_average_rating$/',$key))self::post($id);}
 public static function post($id){$p=get_post($id);if(!$p||!in_array($p->post_type,['page','service','project','job_listing','employer','freelancer'],true)||wp_is_post_revision($id))return;
  $tags=['public-home','public-about','public-services','public-projects','public-jobs','public-details','public-freelancers','public-freelancer-profiles','public-employers','public-employer-profiles'];if($p->post_type==='page')foreach(['become-seller','contact','terms','privacy-policy','refund_returns-2','faq'] as $slug)$tags[]='public-info-'.$slug;foreach($tags as $tag)self::$tags[$tag]=true;
 }
 public static function send(){if(!self::$tags)return;$origin=get_option('pob_frontend_origin','');$secret=get_option('pob_frontend_revalidate_secret','');if(!$origin||strlen($secret)<32)return;$parts=wp_parse_url($origin);if(empty($parts['host'])||!in_array($parts['scheme']??'',['http','https'],true))return;
  $body=wp_json_encode(['tags'=>array_keys(self::$tags)]);$time=(string)time();wp_remote_post(rtrim($origin,'/').'/api/revalidate',['timeout'=>2,'blocking'=>false,'redirection'=>0,'headers'=>['Content-Type'=>'application/json','X-POB-Timestamp'=>$time,'X-POB-Signature'=>hash_hmac('sha256',$time.'.'.$body,$secret)],'body'=>$body]);
 }
}
POB_Frontend_Sync::boot();
