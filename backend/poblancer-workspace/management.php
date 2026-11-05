<?php
defined('ABSPATH')||exit;
final class POB_Management {
 public static function boot(){add_action('rest_api_init',function(){register_rest_route('poblancer/v1','/management',[
 ['methods'=>'GET','callback'=>[__CLASS__,'read'],'permission_callback'=>[POB_Profile::class,'permission']],
 ['methods'=>'POST','callback'=>[__CLASS__,'write'],'permission_callback'=>[POB_Profile::class,'permission']],
 ]);});}
 private static function source($id){
  $post=get_post($id);if(!$post||!in_array($post->post_type,['job_applicant','project_proposal','service_order'],true))return null;
  $type=$post->post_type;$kind=$type==='service_order'?'service':($type==='project_proposal'?'project':'job_listing');$prefix=$type==='service_order'?WP_FREEIO_SERVICE_ORDER_PREFIX:($type==='project_proposal'?WP_FREEIO_PROJECT_PROPOSAL_PREFIX:WP_FREEIO_APPLICANT_PREFIX);$parent=absint(get_post_meta($id,$prefix.($kind==='job_listing'?'job':$kind).'_id',true));$listing=get_post($parent);if(!$listing||$listing->post_type!==$kind)return null;
  $freelancer=$kind==='service'?(int)$listing->post_author:(int)$post->post_author;$employer=$kind==='service'?(int)$post->post_author:(int)$listing->post_author;$profile=WP_Freeio_User::get_freelancer_by_user_id($freelancer);
  return compact('post','listing','parent','freelancer','employer','profile','kind','prefix');
 }
 public static function read($r){
  if(!POB_Profile::permission())return new WP_Error('pob_role','Marketplace account required.',['status'=>403]);global $wpdb;$owner=(int)WP_Freeio_User::get_user_id();$employer=WP_Freeio_User::is_employer();$kind=sanitize_key($r['kind']);$page=max(1,absint($r['page']));$search=sanitize_text_field($r['search']??'');$parent=absint($r['parent']);$args=['posts_per_page'=>20,'paged'=>$page,'post_status'=>['publish','pending','draft','preview','expired','hired','completed','cancelled','pending_payment'],'orderby'=>'date','order'=>'DESC','s'=>$search];$where=null;
  if($kind==='jobs'){
   if(!$employer)return new WP_Error('pob_role','Employer account required.',['status'=>403]);$args['post_type']='job_listing';$args['author']=$owner;
  }elseif($kind==='meetings'){
   $args['post_type']='job_meeting';$args['post_status']='publish';unset($args['s']);
   // Scope from the original source record, which avoids ambiguity between old user IDs and profile IDs.
   $where=function($sql)use($wpdb,$owner){return $sql.$wpdb->prepare(" AND EXISTS (SELECT 1 FROM {$wpdb->postmeta} ms JOIN {$wpdb->posts} src ON src.ID=CAST(ms.meta_value AS UNSIGNED) JOIN {$wpdb->postmeta} rel ON rel.post_id=src.ID JOIN {$wpdb->posts} parent ON parent.ID=CAST(rel.meta_value AS UNSIGNED) WHERE ms.post_id={$wpdb->posts}.ID AND ms.meta_key=%s AND ((src.post_type='service_order' AND parent.post_type='service' AND rel.meta_key=%s AND (src.post_author=%d OR parent.post_author=%d)) OR (src.post_type='project_proposal' AND parent.post_type='project' AND rel.meta_key=%s AND (src.post_author=%d OR parent.post_author=%d)) OR (src.post_type='job_applicant' AND parent.post_type='job_listing' AND rel.meta_key=%s AND (src.post_author=%d OR parent.post_author=%d))))",WP_FREEIO_MEETING_PREFIX.'post_id',WP_FREEIO_SERVICE_ORDER_PREFIX.'service_id',$owner,$owner,WP_FREEIO_PROJECT_PROPOSAL_PREFIX.'project_id',$owner,$owner,WP_FREEIO_APPLICANT_PREFIX.'job_id',$owner,$owner);};
  }elseif(in_array($kind,['applicants','project-proposals','service-orders','bought-services'],true)){
   if(in_array($kind,['applicants','project-proposals','bought-services'],true)&&!$employer)return new WP_Error('pob_role','Employer account required.',['status'=>403]);
   $args['post_type']=$kind==='applicants'?'job_applicant':($kind==='project-proposals'?'project_proposal':'service_order');$prefix=$kind==='applicants'?WP_FREEIO_APPLICANT_PREFIX:($kind==='project-proposals'?WP_FREEIO_PROJECT_PROPOSAL_PREFIX:WP_FREEIO_SERVICE_ORDER_PREFIX);$parent_type=$kind==='applicants'?'job_listing':($kind==='project-proposals'?'project':'service');$meta=$prefix.($kind==='applicants'?'job':$parent_type).'_id';
   if($kind==='bought-services')$args['author']=$owner;
   else $where=function($sql)use($wpdb,$owner,$parent_type,$meta){return $sql.$wpdb->prepare(" AND EXISTS (SELECT 1 FROM {$wpdb->postmeta} rel JOIN {$wpdb->posts} parent ON parent.ID=CAST(rel.meta_value AS UNSIGNED) WHERE rel.post_id={$wpdb->posts}.ID AND rel.meta_key=%s AND parent.post_type=%s AND parent.post_author=%d)",$meta,$parent_type,$owner);};
   if($parent)$args['meta_query']=[['key'=>$meta,'value'=>$parent]];
  }else return new WP_Error('pob_page','Unknown dashboard page.',['status'=>404]);
  if($where)add_filter('posts_where',$where);try{$q=new WP_Query($args);}finally{if($where)remove_filter('posts_where',$where);}$rows=[];
  foreach($q->posts as $post){$id=$post->ID;$row=['id'=>$id,'title'=>get_the_title($post),'status'=>$post->post_status,'date'=>get_the_date('j M Y',$post)];
   if($kind==='jobs'){$row['filled']=(bool)get_post_meta($id,WP_FREEIO_JOB_LISTING_PREFIX.'filled',true);$row['url']=get_permalink($id);$row['expires']=get_post_meta($id,WP_FREEIO_JOB_LISTING_PREFIX.'expiry_date',true);}
   elseif($kind==='meetings'){
    $source=self::source(absint(get_post_meta($id,WP_FREEIO_MEETING_PREFIX.'post_id',true)));if(!$source||!in_array($owner,[$source['freelancer'],$source['employer']],true))continue;
    $row['title']=get_the_title($source['listing']);foreach(['date','time','time_duration','status','messages','zoom_meeting_url'] as $key)$row[$key]=get_post_meta($id,WP_FREEIO_MEETING_PREFIX.$key,true);$row['messages']=array_map(function($m){return ['type'=>sanitize_text_field($m['type']??''),'message'=>wp_strip_all_tags($m['message']??''),'date'=>isset($m['date'])?wp_date('j M Y, H:i',(int)$m['date'],new DateTimeZone('UTC')):''];},array_filter((array)$row['messages'],'is_array'));$row['can_remove']=(int)$post->post_author===$owner;$row['zoom_meeting_url']=esc_url_raw($row['zoom_meeting_url']);
   }else{
    $source=self::source($id);if(!$source)continue;$row['title']=get_the_title($source['listing']);$person=get_userdata($owner===$source['employer']?$source['freelancer']:$source['employer']);$row['person']=$person?$person->display_name:'Former user';$row['parent']=$source['parent'];$row['kind']=$source['kind'];$row['can_meet']=$owner===$source['employer'];
    if($kind==='applicants'){$row['status']=get_post_meta($id,WP_FREEIO_APPLICANT_PREFIX.'app_status',true)?:'Applied';$row['description']=wp_kses_post(wpautop($post->post_content));$row['profile_url']=get_permalink($source['profile']);$row['attachments']=[];$cv=wp_get_attachment_url(absint(get_post_meta($id,WP_FREEIO_APPLICANT_PREFIX.'cv_file_id',true)));if($cv)$row['attachments'][]=$cv;}
    else {$row['history']='#contract/'.$source['kind'].'/'.$id;if($source['kind']==='project'){$row['amount']=get_post_meta($id,WP_FREEIO_PROJECT_PROPOSAL_PREFIX.'amount',true);$row['hours']=get_post_meta($id,WP_FREEIO_PROJECT_PROPOSAL_PREFIX.'estimeted_time',true);$row['description']=wp_kses_post(wpautop($post->post_content));$row['can_hire']=$owner===$source['employer']&&$post->post_status==='publish'&&$source['listing']->post_status==='publish';}}
   }$rows[]=$row;
  }
  $out=new WP_REST_Response(['rows'=>$rows,'page'=>$page,'pages'=>(int)$q->max_num_pages,'total'=>(int)$q->found_posts,'kind'=>$kind,'employer'=>$employer,'timezone'=>wp_timezone_string(),'currency'=>get_woocommerce_currency()]);$out->header('Cache-Control','private, no-store');return $out;
 }
 public static function write($r){
  if(!POB_Profile::permission())return new WP_Error('pob_role','Marketplace account required.',['status'=>403]);$p=$r->get_json_params();$action=sanitize_key($p['action']??'');$id=absint($p['id']??0);$owner=(int)WP_Freeio_User::get_user_id();
  if($action==='switch-role'){if(empty($p['confirmed']))return new WP_Error('pob_confirm','Confirm the role switch.',['status'=>422]);WP_Freeio_User::switch_user_role();}
  if($action==='proposal-hire'){
   $source=self::source($id);if(!$source||$source['kind']!=='project'||$owner!==$source['employer']||!WP_Freeio_User::is_employer())return new WP_Error('pob_owner','Proposal unavailable.',['status'=>403]);
   if(empty($p['confirmed'])||$source['post']->post_status!=='publish'||$source['listing']->post_status!=='publish')return new WP_Error('pob_hire','Confirm an available proposal.',['status'=>422]);
   $product=wc_get_product(absint(wp_freeio_get_option('projects_woocommerce_product_id')));if(!$product||!$product->is_purchasable())return new WP_Error('pob_product','The project checkout product needs to be configured by the administrator.',['status'=>409]);
   if(!WC()->cart)wc_load_cart();if(!WC()->cart->is_empty()&&empty($p['replace_cart']))return new WP_Error('pob_cart','Confirm replacing the cart before continuing to project checkout.',['status'=>409]);
   $amount=get_post_meta($id,WP_FREEIO_PROJECT_PROPOSAL_PREFIX.'amount',true);if(!is_numeric($amount)||(float)$amount<=0)return new WP_Error('pob_price','The proposal price is invalid.',['status'=>422]);
   $options=function($who){return ['type'=>wp_freeio_get_option($who.'_project_commission_fee','none'),'fixed_amount'=>wp_freeio_get_option($who.'_project_commission_fixed_amount',10),'percentage'=>wp_freeio_get_option($who.'_project_commission_percentage',20),'comissions_tiers'=>wp_freeio_get_option($who.'_project_comissions_tiers')];};
   $_POST=['proposal_id'=>$id,'nonce'=>wp_create_nonce('wp-freeio-hire-proposal-nonce')];do_action('wp-freeio-before-process-hire-proposal');
   $fee=WP_Freeio_Mixes::process_commission_fee($amount,$options('freelancers'));$employer_fee=WP_Freeio_Mixes::employer_hiring_payment_setting($amount,$options('employers'));
   $cart_meta=['project_id'=>$source['parent'],'price'=>$amount,'proposal_id'=>$id,'processing_fee'=>$employer_fee['commission_amount']??0];
   WC()->cart->empty_cart();$added=WC()->cart->add_to_cart($product->get_id(),1,0,[],['product_id'=>$product->get_id(),'cart_data'=>$cart_meta,'price'=>WP_Freeio_Price::format_price($amount,'return'),'payment_type'=>'hiring','admin_shares'=>number_format($fee['admin_shares']??0,2,'.',''),'freelancer_shares'=>number_format($fee['freelancer_shares']??$amount,2,'.',''),'employer_id'=>$owner,'freelancer_id'=>$source['freelancer'],'current_project'=>$source['parent']]);
   if(!$added)return new WP_Error('pob_cart','The project could not be added to checkout.',['status'=>422]);return ['ok'=>true,'checkout_url'=>wc_get_checkout_url()];
  }
  if(in_array($action,['listing-remove','job-filled','job-not-filled'],true)){
   $post=get_post($id);$type=$post?$post->post_type:'';if(!$post||!in_array($type,['service','project','job_listing'],true)||(int)$post->post_author!==$owner)return new WP_Error('pob_owner','Listing unavailable.',['status'=>403]);
   if(empty($p['confirmed']))return new WP_Error('pob_confirm','Confirm this listing action.',['status'=>422]);
   $kind=$type==='job_listing'?'job':$type;$class=$type==='job_listing'?'WP_Freeio_Post_Type_Job_Listing':($type==='service'?'WP_Freeio_Post_Type_Service':'WP_Freeio_Post_Type_Project');
   if($action==='listing-remove'){
    if(!defined('EMPTY_TRASH_DAYS')||EMPTY_TRASH_DAYS<=0)return new WP_Error('pob_remove','Recoverable removal is unavailable.',['status'=>409]);
    $_POST=[$kind.'_id'=>$id,'nonce'=>wp_create_nonce('wp-freeio-delete-'.$kind.'-nonce')];$method='process_remove_'.$kind;$class::$method();
   }
   if($type!=='job_listing'||!WP_Freeio_User::is_employer())return new WP_Error('pob_role','Employer job required.',['status'=>403]);
   $filled=$action==='job-filled';$_POST=['job_id'=>$id,'nonce'=>wp_create_nonce($filled?'wp-freeio-mark-filled-nonce':'wp-freeio-mark-not-filled-nonce')];$method=$filled?'process_mark_filled_job':'process_mark_not_filled_job';$class::$method();
  }
  if(str_starts_with($action,'applicant-')){
   $source=self::source($id);if(!$source||$source['kind']!=='job_listing'||$owner!==$source['employer']||!WP_Freeio_User::is_employer())return new WP_Error('pob_owner','Application unavailable.',['status'=>403]);
   $map=['applicant-approve'=>['process_applicant_approve','approve'],'applicant-reject'=>['process_applicant_reject','reject'],'applicant-undo-approve'=>['process_undo_applicant_approve','undo-approve'],'applicant-undo-reject'=>['process_undo_applicant_reject','undo-reject']];if(!isset($map[$action])||empty($p['confirmed']))return new WP_Error('pob_confirm','Confirm an available application action.',['status'=>422]);[$method,$nonce]=$map[$action];$_POST=['applicant_id'=>$id,'nonce'=>wp_create_nonce('wp-freeio-'.$nonce.'-applied-nonce')];WP_Freeio_Applicant::$method();
  }
  if(str_starts_with($action,'meeting-')){
   $create=$action==='meeting-create';$meeting=$create?null:get_post($id);$source=self::source($create?absint($p['source']??0):absint(get_post_meta($id,WP_FREEIO_MEETING_PREFIX.'post_id',true)));
   if(!$source||!in_array($owner,[$source['employer'],$source['freelancer']],true)||(!$create&&(!$meeting||$meeting->post_type!=='job_meeting'||$meeting->post_status!=='publish')))return new WP_Error('pob_owner','Meeting unavailable.',['status'=>403]);
   if($create&&($owner!==$source['employer']||!WP_Freeio_User::is_employer()))return new WP_Error('pob_role','Only the employer can create this meeting.',['status'=>403]);
   $verb=substr($action,8);if(!in_array($verb,['create','reschedule','remove','cancel'],true))return new WP_Error('pob_action','Unknown meeting action.',['status'=>422]);
   if($verb==='remove'&&((int)$meeting->post_author!==$owner||!defined('EMPTY_TRASH_DAYS')||EMPTY_TRASH_DAYS<=0))return new WP_Error('pob_remove','Recoverable removal is unavailable for this account.',['status'=>403]);
   if($verb==='cancel'&&$owner!==$source['freelancer'])return new WP_Error('pob_owner','Only the invited freelancer can cancel this meeting.',['status'=>403]);
   if(empty($p['confirmed']))return new WP_Error('pob_confirm','Confirm this meeting action.',['status'=>422]);
   $_POST=['nonce'=>wp_create_nonce('wp-freeio-'.$verb.'-meeting-nonce'),'meeting_id'=>$id,'post_id'=>$source['post']->ID];
   if(in_array($verb,['create','reschedule'],true)){
    $date=$p['date']??'';$time=$p['time']??'';$duration=absint($p['time_duration']??0);$parsed=DateTimeImmutable::createFromFormat('!Y-m-d H:i',$date.' '.$time,wp_timezone());if(!$parsed||$parsed->format('Y-m-d H:i')!==$date.' '.$time||$duration<1||$duration>1440)return new WP_Error('pob_date','Enter a valid meeting date, time and duration.',['status'=>422]);
    $_POST+=['date'=>$date,'time'=>$time,'time_duration'=>$duration,'message'=>sanitize_textarea_field($p['message']??''),'zoom_meeting'=>!empty($p['zoom_meeting'])?'1':''];
   }
   // Native create records can contain a user ID while cancel expects a profile ID.
   // Resolve the participant from the linked application/order, without rewriting stored records.
   if(!$create)add_filter('get_post_metadata',function($value,$object,$key,$single)use($id,$source){return (int)$object===$id&&$key===WP_FREEIO_MEETING_PREFIX.'freelancer_id'?($single?$source['profile']:[$source['profile']]):$value;},10,4);
   $method='process_'.$verb.'_meeting';WP_Freeio_Meeting::$method();
  }
  return new WP_Error('pob_action','Unknown management action.',['status'=>422]);
 }
}
POB_Management::boot();
