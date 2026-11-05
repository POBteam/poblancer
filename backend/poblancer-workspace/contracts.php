<?php
defined('ABSPATH')||exit;
final class POB_Contracts {
 public static function boot(){add_action('rest_api_init',function(){register_rest_route('poblancer/v1','/contract',[
  ['methods'=>'GET','callback'=>[__CLASS__,'read'],'permission_callback'=>[POB_Profile::class,'permission']],
  ['methods'=>'POST','callback'=>[__CLASS__,'write'],'permission_callback'=>[POB_Profile::class,'permission']],
 ]);});}
 private static function context($kind,$id){
  if(!POB_Profile::permission())return new WP_Error('pob_auth','Marketplace account required.',['status'=>403]);
  if(!in_array($kind,['service','project'],true))return new WP_Error('pob_kind','Unknown contract type.',['status'=>422]);
  $service=$kind==='service';$prefix=$service?WP_FREEIO_SERVICE_ORDER_PREFIX:WP_FREEIO_PROJECT_PROPOSAL_PREFIX;$post=get_post($id);
  if(!$post||$post->post_type!==($service?'service_order':'project_proposal')||!in_array($post->post_status,['publish','hired','completed','cancelled'],true))return new WP_Error('pob_contract','Contract unavailable.',['status'=>404]);
  $parent=absint(get_post_meta($id,$prefix.$kind.'_id',true));$listing=get_post($parent);
  if(!$listing||$listing->post_type!==$kind)return new WP_Error('pob_contract','Contract unavailable.',['status'=>404]);
  $freelancer=$service?(int)$listing->post_author:(int)$post->post_author;$employer=$service?(int)$post->post_author:(int)$listing->post_author;$owner=(int)WP_Freeio_User::get_user_id();
  if(!in_array($owner,[$freelancer,$employer],true))return new WP_Error('pob_owner','This contract belongs to another account.',['status'=>403]);
  return compact('post','parent','listing','prefix','freelancer','employer','owner','service','kind');
 }
 public static function read($r){
  $c=self::context(sanitize_key($r['kind']),absint($r['id']));if(is_wp_error($c))return $c;$id=$c['post']->ID;$messages=(array)get_post_meta($id,$c['prefix'].'messages',true);$page=max(1,absint($r['page']));$rows=[];
  foreach(array_slice(array_values($messages),($page-1)*30,30) as $message){if(!is_array($message))continue;$user=get_userdata(absint($message['user_id']??0));$files=[];foreach((array)($message['attachment_ids']??[]) as $attachment=>$url){$url=wp_get_attachment_url(absint($attachment));if($url)$files[]=['url'=>$url,'name'=>get_the_title($attachment)?:'Attachment'];}$rows[]=['name'=>$user?$user->display_name:'Former user','mine'=>(int)($message['user_id']??0)===$c['owner'],'html'=>wp_kses_post($message['message']??''),'date'=>wp_date('j M Y, H:i',(int)($message['time']??0),new DateTimeZone('UTC')),'files'=>$files];}
  $data=['id'=>$id,'kind'=>$c['kind'],'title'=>get_the_title($c['listing']),'description'=>wp_kses_post(wpautop($c['post']->post_content)),'status'=>$c['post']->post_status,'can_change_status'=>$c['owner']===$c['employer']&&$c['post']->post_status==='hired','messages'=>$rows,'page'=>$page,'pages'=>(int)ceil(count($messages)/30),'currency'=>get_woocommerce_currency()];
  if($c['service']){$data['package']=get_post_meta($id,$c['prefix'].'service_package_content',true);$order=wc_get_order(absint(get_post_meta($id,$c['prefix'].'order_id',true)));if($order){$data['currency']=$order->get_currency();foreach($order->get_items() as $item){$detail=$item->get_meta('cus_woo_product_data',true);if(is_array($detail)&&(int)($detail['service_id']??0)===$c['parent']&&is_numeric($detail['price']??null)){$data['amount']=$detail['price'];break;}}}$data['addons']=[];foreach((array)get_post_meta($id,$c['prefix'].'addons',true) as $addon)if(is_array($addon)&&!empty($addon['id']))$data['addons'][]=['title'=>get_the_title(absint($addon['id'])),'price'=>$addon['price']??0];}
  else{$data['amount']=get_post_meta($id,$c['prefix'].'amount',true);$data['hours']=get_post_meta($id,$c['prefix'].'estimeted_time',true);}
  $out=new WP_REST_Response($data);$out->header('Cache-Control','private, no-store');return $out;
 }
 public static function write($r){
  $p=$r->get_json_params();if(!is_array($p))$p=$r->get_body_params();$c=self::context(sanitize_key($p['kind']??''),absint($p['id']??0));if(is_wp_error($c))return $c;$id=$c['post']->ID;$action=$p['action']??'';
  if($action==='message'){
   if(!is_string($p['message']??null)||!trim(wp_strip_all_tags($p['message']))||strlen($p['message'])>30000)return new WP_Error('pob_message','Enter a message up to 30,000 characters.',['status'=>422]);
   foreach((array)($_FILES['attachments']['name']??[]) as $i=>$name){$check=wp_check_filetype_and_ext($_FILES['attachments']['tmp_name'][$i],$name);if(!$check['ext']||$_FILES['attachments']['error'][$i]!==UPLOAD_ERR_OK||$_FILES['attachments']['size'][$i]>wp_max_upload_size())return new WP_Error('pob_file','Attachment type or size is not allowed.',['status'=>422]);}
   $rate='pob_contract_message_'.$c['owner'];if(get_transient($rate))return new WP_Error('pob_rate','Please wait a few seconds before sending another message.',['status'=>429]);set_transient($rate,1,3);
   $_POST=$c['service']?['service_order_id'=>$id,'service_id'=>$c['parent'],'message'=>wp_slash(wp_kses_post($p['message']))]:['proposal_id'=>$id,'project_id'=>$c['parent'],'message'=>wp_slash(wp_kses_post($p['message']))];
   self::native_json();if($c['service'])WP_Freeio_Service::process_send_service_order_message();else WP_Freeio_Project::process_send_proposal_message();
  }elseif($action==='status'){
   if($c['owner']!==$c['employer'])return new WP_Error('pob_owner','Only this employer can change the contract status.',['status'=>403]);
   if(empty($p['confirmed'])||$c['post']->post_status!=='hired'||!in_array($p['status']??'',['completed','cancelled'],true))return new WP_Error('pob_status','Confirm an available status change.',['status'=>422]);
   global $wpdb;$lock='pob_contract_status_'.$id;if((int)$wpdb->get_var($wpdb->prepare('SELECT GET_LOCK(%s, 5)',$lock))!==1)return new WP_Error('pob_busy','Another status update is processing.',['status'=>409]);
   register_shutdown_function(function()use($wpdb,$lock){$wpdb->get_var($wpdb->prepare('SELECT RELEASE_LOCK(%s)',$lock));});clean_post_cache($id);
   if(get_post_status($id)!=='hired')return new WP_Error('pob_changed','The contract status has changed. Refresh before continuing.',['status'=>409]);
   $_POST=[$c['service']?'service_order_id':'proposal_id'=>$id,'status'=>$p['status']];self::native_json();if($c['service'])WP_Freeio_Service::process_change_service_order_status();else WP_Freeio_Project::process_change_proposal_status();
  }
  return new WP_Error('pob_action','Unknown contract action.',['status'=>422]);
 }
 private static function native_json(){nocache_headers();add_filter('doing_it_wrong_trigger_error',function($trigger,$name){return $name==='wp_send_json'?false:$trigger;},10,2);}
}
POB_Contracts::boot();
