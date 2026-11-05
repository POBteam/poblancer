<?php
/** Plugin Name: POBlancer Local API Read Bootstrap
 * Skip presentation-only startup for exact private data reads. Native writes keep all plugins.
 */
defined("ABSPATH") || exit;
if (!defined("WP_ENVIRONMENT_TYPE") || WP_ENVIRONMENT_TYPE!=="local" || ABSPATH!=="/Users/adebayoomotosho-pob/Local Sites/poblancer/app/public/") return;
add_action("muplugins_loaded",function(){
 if(defined("POB_API_READ_BOOTSTRAP_DISABLED")&&POB_API_READ_BOOTSTRAP_DISABLED)return;
 $method=$_SERVER["REQUEST_METHOD"]??"";$path=rtrim((string)parse_url($_SERVER["REQUEST_URI"]??"",PHP_URL_PATH),"/");
 $routes=["listings","page-views","messages","profile","editor-terms","addons","collection","account-tool","service-editor","employer-editor","management"];
 $prefix="/wp-json/poblancer/v1/";
 $read=$method==="GET"&&str_starts_with($path,$prefix)&&in_array(substr($path,strlen($prefix)),$routes,true);
 $batch=$method==="POST"&&$path==="/wp-json/poblancer/v1/read-batch"&&function_exists("pob_read_batch_envelope")&&pob_read_batch_envelope()!==false;
 if(!$read&&!$batch)return;
 add_filter("option_active_plugins",function($plugins){
 $presentation=[
  "elementor/elementor.php","elementor-pro/elementor-pro.php",
  "all-in-one-seo-pack/all_in_one_seo_pack.php","revslider/revslider.php",
  "wpforms-lite/wpforms.php","contact-form-7/wp-contact-form-7.php",
  "userfeedback-lite/userfeedback.php","google-analytics-for-wordpress/googleanalytics.php",
  "query-monitor/query-monitor.php","wp-smush-pro/wp-smush.php",
  "woocommerce-pdf-invoices-packing-slips/woocommerce-pdf-invoices-packingslips.php"
 ];
 return array_values(array_diff((array)$plugins,$presentation));
},100);
// The saved active_plugins option is never changed. Freeio, WooCommerce, CMB2,
// snippets, Automator, SMTP, notifications and marketplace dependencies remain loaded.

});
