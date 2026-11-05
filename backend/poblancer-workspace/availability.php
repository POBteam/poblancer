<?php
defined('ABSPATH')||exit;
/** Deterministic capacity and enquiry queue. No AI, orders, fees or payment changes. */
final class POB_Availability {
 const META='_pob_availability';
 public static function boot(){
  add_action('rest_api_init',function(){register_rest_route('poblancer/v1','/availability',[
   ['methods'=>'GET','permission_callback'=>[POB_Messages::class,'permission'],'callback'=>[__CLASS__,'read']],
   ['methods'=>'POST','permission_callback'=>[POB_Messages::class,'permission'],'callback'=>[__CLASS__,'write']],
  ]);});
  add_action('wp-private-message-after-add-message',[__CLASS__,'incoming'],40,3);
  add_action('transition_post_status',function($new,$old,$post){if($new===$old||!in_array($post->post_type,['service_order','project_proposal'],true))return;$id=$post->post_type==='project_proposal'?(int)$post->post_author:(int)get_post_meta($post->ID,WP_FREEIO_SERVICE_ORDER_PREFIX.'service_author',true);if(!$id&&$post->post_type==='service_order')$id=(int)get_post_field('post_author',get_post_meta($post->ID,WP_FREEIO_SERVICE_ORDER_PREFIX.'service_id',true));if($id)delete_transient('pob_workload_'.$id);},40,3);
 }
 public static function settings($uid){$p=(array)get_user_meta($uid,self::META,true);return ['enabled'=>!empty($p['enabled']),'limit'=>max(1,min(20,(int)($p['limit']??3))),'message'=>$p['message']??'Thank you for your message. I am currently handling {count} active assignments and have reached my working capacity. You can join my enquiry waiting list, or browse other freelancers. Joining the list does not book or pay for a job.'];}
 public static function workload($uid,$fresh=false){
  $key='pob_workload_'.absint($uid);$cached=get_transient($key);if(!$fresh&&$cached!==false)return (int)$cached;global $wpdb;
  $count=(int)$wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM {$wpdb->posts} p WHERE p.post_status='hired' AND ((p.post_type='project_proposal' AND p.post_author=%d) OR (p.post_type='service_order' AND (EXISTS(SELECT 1 FROM {$wpdb->postmeta} m WHERE m.post_id=p.ID AND m.meta_key=%s AND CAST(m.meta_value AS UNSIGNED)=%d) OR EXISTS(SELECT 1 FROM {$wpdb->postmeta} m JOIN {$wpdb->posts} s ON s.ID=CAST(m.meta_value AS UNSIGNED) WHERE m.post_id=p.ID AND m.meta_key=%s AND s.post_author=%d)))))",$uid,WP_FREEIO_SERVICE_ORDER_PREFIX.'service_author',$uid,WP_FREEIO_SERVICE_ORDER_PREFIX.'service_id',$uid));
  if(get_option('pob_support_schema')){$cases=$wpdb->prefix.'pob_support_cases';$agreements=$wpdb->prefix.'pob_support_agreements';$count+=(int)$wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $agreements a JOIN $cases c ON c.id=a.case_id JOIN {$wpdb->posts} p ON p.ID=c.source_id WHERE a.assignee_id=%d AND a.state='active' AND p.post_status='hired'",$uid));}
  set_transient($key,$count,30);return $count;
 }
 public static function incoming($id,$recipient,$sender){
  if(!POB_Workspace::allowed()||!WP_Freeio_User::is_freelancer($recipient)||$recipient===$sender)return;$p=self::settings($recipient);if(!$p['enabled'])return;$count=self::workload($recipient);if($count<$p['limit']||get_post_meta($id,'_pob_availability_reply',true))return;
  $thread=get_post($id);if(!$thread||$thread->post_type!=='private_message'||$thread->post_parent)return;
  $text=str_replace(['{count}','{limit}'],[(string)$count,(string)$p['limit']],$p['message']);
  $args=apply_filters('wp-private-message-reply-message-data',['post_title'=>'RE: '.$thread->post_title,'post_type'=>'private_message','post_content'=>$text,'post_status'=>'publish','post_parent'=>$id,'post_author'=>(int)$recipient]);
  $args=array_merge($args,['post_type'=>'private_message','post_parent'=>(int)$id,'post_author'=>(int)$recipient,'post_content'=>sanitize_textarea_field($text),'post_status'=>'publish']);
  do_action('wp-private-message-before-reply-message');$reply=wp_insert_post($args,true);if(is_wp_error($reply)||!$reply)return;
  update_post_meta($id,'_pob_availability_reply',$reply);update_post_meta($id,'_pob_waitlist',['freelancer'=>(int)$recipient,'client'=>(int)$sender,'state'=>'offered','updated'=>time()]);delete_post_meta($id,'_read_'.$sender);do_action('wp-private-message-after-reply-message',$reply,$id,$recipient);
 }
 public static function read($r){
  if(!POB_Messages::permission())return new WP_Error('pob_auth','Please sign in.',['status'=>401]);$uid=(int)WP_Private_Message_Mixes::get_current_user_id();$id=absint($r['thread']);
  if($id){$thread=POB_Messages::thread($id);if(is_wp_error($thread))return $thread;$queue=get_post_meta($id,'_pob_waitlist',true);return ['queue'=>is_array($queue)?$queue:null,'user_id'=>$uid];}
  if(!WP_Freeio_User::is_freelancer($uid))return ['freelancer'=>false];
  $q=new WP_Query(['post_type'=>'private_message','post_status'=>'publish','post_parent'=>0,'posts_per_page'=>30,'orderby'=>'ID','order'=>'DESC','meta_query'=>[['key'=>'_recipient','value'=>$uid],['key'=>'_pob_waitlist','compare'=>'EXISTS']]]);$rows=[];
  foreach($q->posts as $p){$row=get_post_meta($p->ID,'_pob_waitlist',true);if(is_array($row)&&($row['state']??'')==='queued')$rows[]=['thread'=>$p->ID,'name'=>get_the_author_meta('display_name',(int)$row['client']),'updated'=>$row['updated'],'state'=>'queued'];}
  return ['freelancer'=>true,'settings'=>self::settings($uid),'active'=>self::workload($uid),'queue'=>$rows];
 }
 public static function write($r){
  if(!POB_Messages::permission())return new WP_Error('pob_auth','Please sign in.',['status'=>401]);$b=$r->get_json_params();$uid=(int)WP_Private_Message_Mixes::get_current_user_id();$action=$b['action']??'';
  if($action==='settings'){if(!WP_Freeio_User::is_freelancer($uid))return new WP_Error('pob_role','Freelancer account required.',['status'=>403]);$limit=filter_var($b['limit']??null,FILTER_VALIDATE_INT);$text=$b['message']??'';if(!$limit||$limit<1||$limit>20||!is_string($text)||strlen(trim($text))<30||strlen($text)>1000)return new WP_Error('pob_fields','Choose a capacity from 1 to 20 and a message of 30 to 1,000 bytes.',['status'=>422]);update_user_meta($uid,self::META,['enabled'=>!empty($b['enabled']),'limit'=>$limit,'message'=>sanitize_textarea_field($text)]);delete_transient('pob_workload_'.$uid);return ['ok'=>true,'message'=>'Availability settings saved.'];}
  $id=absint($b['thread']??0);$thread=POB_Messages::thread($id);if(is_wp_error($thread))return $thread;$row=get_post_meta($id,'_pob_waitlist',true);if(!is_array($row))return new WP_Error('pob_queue','No waiting-list invitation exists.',['status'=>422]);
  if($action==='join'){if($uid!==(int)$row['client']||!in_array($row['state'],['offered','queued'],true))return new WP_Error('pob_queue','This invitation is unavailable.',['status'=>403]);$row['state']='queued';}
  elseif($action==='leave'){if($uid!==(int)$row['client'])return new WP_Error('pob_queue','Only the enquiry owner can leave this list.',['status'=>403]);$row['state']='cancelled';}
  elseif($action==='contacted'){if($uid!==(int)$row['freelancer']||$row['state']!=='queued')return new WP_Error('pob_queue','Only this freelancer can update the queue.',['status'=>403]);$row['state']='contacted';}
  else return new WP_Error('pob_action','Unknown waiting-list action.',['status'=>422]);
  $row['updated']=time();update_post_meta($id,'_pob_waitlist',$row);return ['ok'=>true,'message'=>$action==='join'?'You are on the enquiry waiting list. No job has been booked or paid for.':'Waiting-list status updated.'];
 }
}
POB_Availability::boot();
