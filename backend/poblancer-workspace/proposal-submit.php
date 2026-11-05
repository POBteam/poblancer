<?php
defined('ABSPATH') || exit;
final class POB_Proposal_Submit {
 public static function boot(){add_action('rest_api_init',function(){register_rest_route('poblancer/v1','/proposal-submit',[
  ['methods'=>'GET','callback'=>[__CLASS__,'read'],'permission_callback'=>[POB_Addons::class,'permission']],
  ['methods'=>'POST','callback'=>[__CLASS__,'submit'],'permission_callback'=>[POB_Addons::class,'permission']],
 ]);});}
 public static function project($id){
  $post=get_post(absint($id));
  if(!$post||$post->post_type!=='project'||$post->post_status!=='publish'||$post->post_password)return new WP_Error('pob_project','This project is not open for proposals.',['status'=>422]);
  if((int)$post->post_author===get_current_user_id())return new WP_Error('pob_owner','You cannot send a proposal to your own project.',['status'=>403]);
  return $post;
 }
 public static function read($r){
  if(!POB_Addons::permission())return new WP_Error('pob_role','Sign in with a freelancer account.',['status'=>403]);
  $post=self::project($r['id']);if(is_wp_error($post))return $post;
  $existing=get_posts(['post_type'=>'project_proposal','post_status'=>'any','author'=>get_current_user_id(),'posts_per_page'=>1,'fields'=>'ids','meta_key'=>WP_FREEIO_PROJECT_PROPOSAL_PREFIX.'project_id','meta_value'=>$post->ID]);
  $out=new WP_REST_Response(['id'=>$post->ID,'title'=>get_the_title($post),'type'=>get_post_meta($post->ID,WP_FREEIO_PROJECT_PREFIX.'project_type',true),'currency'=>get_woocommerce_currency(),'already_sent'=>!empty($existing)]);$out->header('Cache-Control','private, no-store');return $out;
 }
 public static function submit($r){
  if(!POB_Addons::permission())return new WP_Error('pob_role','Sign in with a freelancer account.',['status'=>403]);
  $p=$r->get_json_params();$post=self::project($p['id']??0);if(is_wp_error($post))return $post;
  $amount=$p['amount']??null;$hours=$p['hours']??null;$text=trim(sanitize_textarea_field($p['description']??''));
  if(!is_numeric($amount)||!is_finite((float)$amount)||(float)$amount<=0||!is_numeric($hours)||!is_finite((float)$hours)||(float)$hours<=0||!$text||strlen($text)>10000)return new WP_Error('pob_fields','Enter a positive amount, estimated hours and a cover letter of up to 10,000 bytes.',['status'=>422]);
  // Create only. Never accept a proposal ID or caller-supplied author, shares or status.
  // Freeio remains responsible for fees, storage, notifications and its original hooks.
  global $wpdb;$lock='pob_proposal_'.get_current_user_id().'_'.$post->ID;
  if((int)$wpdb->get_var($wpdb->prepare('SELECT GET_LOCK(%s, 3)',$lock))!==1)return new WP_Error('pob_busy','A proposal is already being processed. Check My Proposals before trying again.',['status'=>409]);
  register_shutdown_function(function()use($wpdb,$lock){$wpdb->get_var($wpdb->prepare('SELECT RELEASE_LOCK(%s)',$lock));});
  $_POST=['project_id'=>$post->ID,'proposed_amount'=>$amount,'estimeted_time'=>$hours,'description'=>$text];
  WP_Freeio_Project::process_project_proposal();
 }
}
POB_Proposal_Submit::boot();
