<?php
defined('ABSPATH')||exit;
final class POB_Commerce {
 public static function boot(){add_action('rest_api_init',function(){register_rest_route('poblancer/v1','/commerce',[
 ['methods'=>'GET','permission_callback'=>[POB_Public_Actions::class,'permission'],'callback'=>[__CLASS__,'read']],
 ['methods'=>'POST','permission_callback'=>[POB_Public_Actions::class,'permission'],'callback'=>[__CLASS__,'write']],
 ]);});}
 private static function init_cart(){if(!WC()->cart)wc_load_cart();WC()->session->set_customer_session_cookie(true);WC()->cart->calculate_totals();}
 public static function read($r){
  if(!POB_Public_Actions::permission())return new WP_Error('pob_auth','Please sign in.',['status'=>401]);
  if($r['order']){$o=wc_get_order(absint($r['order']));if(!$o||(int)$o->get_customer_id()!==get_current_user_id())return new WP_Error('pob_order','Order unavailable.',['status'=>403]);$g=WC()->payment_gateways()->payment_gateways()[$o->get_payment_method()]??null;ob_start();if($g&&$o->get_payment_method()==='bacs')$g->thankyou_page($o->get_id());$instructions=wp_kses_post(ob_get_clean());return ['order'=>$o->get_order_number(),'status'=>$o->get_status(),'total'=>wp_strip_all_tags($o->get_formatted_order_total()),'instructions'=>$instructions];}
  if($r['service']){$p=POB_Public_Actions::target($r['service']);if(is_wp_error($p)||$p->post_type!=='service')return new WP_Error('pob_service','Service unavailable.',['status'=>404]);$meta=WP_Freeio_Service_Meta::get_instance($p->ID);$packages=$meta->get_post_meta('price_type')==='package'?(array)$meta->get_post_meta('price_packages'):[];$addons=(array)$meta->get_post_meta('addons');$rows=[];foreach($addons as $a){$a=get_post(absint($a));if($a&&$a->post_type==='service_addon'&&$a->post_status==='publish'&&(int)$a->post_author===(int)$p->post_author)$rows[]=['id'=>$a->ID,'title'=>$a->post_title,'price'=>get_post_meta($a->ID,WP_FREEIO_SERVICE_ADDON_PREFIX.'price',true)];}return ['id'=>$p->ID,'title'=>$p->post_title,'packages'=>array_keys($packages),'addons'=>$rows];}
  self::init_cart();if(WC()->cart->is_empty())return new WP_Error('pob_cart','Your cart is empty. Choose a service first.',['status'=>422]);if(WC()->cart->needs_shipping())return new WP_Error('pob_shipping','This checkout currently supports digital marketplace orders only.',['status'=>422]);
  $country=sanitize_text_field($r['country']??WC()->customer->get_billing_country()?:WC()->countries->get_base_country());if(!array_key_exists($country,WC()->countries->get_allowed_countries()))return new WP_Error('pob_country','Select an available billing country.',['status'=>422]);$billing=array_replace(WC()->checkout()->get_checkout_fields('billing'),WC()->countries->get_address_fields($country,'billing_'));$fields=[];foreach($billing as $key=>$f){$value=$key==='billing_country'?$country:WC()->checkout()->get_value($key);$options=$f['options']??[];if(($f['type']??'')==='country')$options=WC()->countries->get_allowed_countries();if(($f['type']??'')==='state')$options=WC()->countries->get_states($country)?:[];$fields[]=['name'=>$key,'label'=>wp_strip_all_tags($f['label']??$key),'type'=>$f['type']??'text','required'=>!empty($f['required']),'value'=>$value,'options'=>$options];}
  $gateways=[];foreach(WC()->payment_gateways()->get_available_payment_gateways() as $g)if($g->id==='bacs')$gateways[]=['id'=>$g->id,'title'=>wp_strip_all_tags($g->get_title()),'description'=>wp_strip_all_tags($g->get_description())];
  $items=[];foreach(WC()->cart->get_cart() as $item)$items[]=['title'=>$item['data']->get_name(),'quantity'=>$item['quantity'],'total'=>wp_strip_all_tags(wc_price($item['line_total']))];return ['fields'=>$fields,'items'=>$items,'total'=>wp_strip_all_tags(WC()->cart->get_total()),'gateways'=>$gateways,'terms'=>wc_terms_and_conditions_checkbox_enabled(),'nonce'=>wp_create_nonce('woocommerce-process_checkout')];
 }
 public static function write($r){
  if(!POB_Public_Actions::permission())return new WP_Error('pob_auth','Please sign in.',['status'=>401]);$b=$r->get_json_params();self::init_cart();
  if(($b['action']??'')==='hire'){
   $p=POB_Public_Actions::target($b['service']??0);if(is_wp_error($p)||$p->post_type!=='service')return new WP_Error('pob_service','Service unavailable.',['status'=>404]);if(!WP_Freeio_User::is_employer()||(int)$p->post_author===(int)WP_Freeio_User::get_user_id())return new WP_Error('pob_role','Use an employer account to purchase another freelancer’s service.',['status'=>403]);if(empty($b['confirmed']))return new WP_Error('pob_confirm','Confirm your service selection.',['status'=>422]);if(!WC()->cart->is_empty()&&empty($b['replace_cart']))return new WP_Error('pob_cart','Your cart contains items. Confirm replacement before continuing.',['status'=>409]);
   $meta=WP_Freeio_Service_Meta::get_instance($p->ID);$package=(string)($b['package']??'0');$packages=(array)$meta->get_post_meta('price_packages');if($meta->get_post_meta('price_type')==='package'&&!array_key_exists($package,$packages))return new WP_Error('pob_package','Select an available package.',['status'=>422]);
   $addons=array_map('absint',(array)($b['addons']??[]));$allowed=array_map('absint',(array)$meta->get_post_meta('addons'));foreach($addons as $id)if(!in_array($id,$allowed,true))return new WP_Error('pob_addon','Select a service addon from this listing.',['status'=>422]);
   $_POST=['service_id'=>$p->ID,'service_package'=>$package,'service_addons'=>$addons];WP_Freeio_Service::process_hire_service();
  }
  if(($b['action']??'')==='review'){
   if(WC()->cart->is_empty()||WC()->cart->needs_shipping())return new WP_Error('pob_cart','Select a digital marketplace service first.',['status'=>422]);$fields=[];foreach(WC()->checkout()->get_checkout_fields('billing') as $key=>$field)$fields[$key]=sanitize_text_field($b[$key]??'');$fields['payment_method']='bacs';
   $_POST=['post_data'=>http_build_query($fields),'payment_method'=>'bacs','security'=>wp_create_nonce('update-order-review')];foreach(['country','state','postcode','city','address_1','address_2'] as $key)$_POST[$key==='address_1'?'address':$key]=$fields['billing_'.$key]??'';$_REQUEST['security']=$_POST['security'];WC_AJAX::update_order_review();
  }
  if(($b['action']??'')==='checkout'){
   if(WC()->cart->is_empty()||WC()->cart->needs_shipping())return new WP_Error('pob_cart','Select a digital marketplace service first.',['status'=>422]);$available=WC()->payment_gateways()->get_available_payment_gateways();if(($b['payment_method']??'')!=='bacs'||!isset($available['bacs']))return new WP_Error('pob_gateway','The selected payment method is unavailable.',['status'=>422]);
   if(!wp_verify_nonce($b['checkout_nonce']??'','woocommerce-process_checkout'))return new WP_Error('pob_nonce','Refresh checkout before submitting.',['status'=>403]);
   $_POST=['payment_method'=>'bacs','woocommerce-process-checkout-nonce'=>$b['checkout_nonce'],'terms'=>empty($b['terms'])?'':'1','terms-field'=>'1'];foreach(WC()->checkout()->get_checkout_fields('billing') as $key=>$field)$_POST[$key]=sanitize_text_field($b[$key]??'');$_POST['order_comments']=sanitize_textarea_field($b['order_comments']??'');
   WC_AJAX::checkout();
  }
  return new WP_Error('pob_action','Unknown checkout action.',['status'=>422]);
 }
}
POB_Commerce::boot();
