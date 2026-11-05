<?php
/** Temporary fixture-only native hook recorder. Never deploy. */
defined('ABSPATH')||exit;
if(wp_get_environment_type()!=='local'||ABSPATH!=='/Users/adebayoomotosho-pob/Local Sites/poblancer/app/public/')return;
function pob_fixture_record_hook($post_id){
 $post=get_post((int)$post_id);if(!$post)return;$user=get_userdata($post->post_author);if(!$user)return;
 $fixture=false;foreach(['pob_plan_test_','pob_http_','pob_message_fixture_','pob_edit_fixture_'] as $prefix)if(str_starts_with($user->user_login,$prefix))$fixture=true;
 if(!$fixture||apply_filters('pre_wp_mail',null,[])!==true)return;
 $file='/Users/adebayoomotosho-pob/Documents/Codex/2026-10-12/connect-my-site-at-https-pob/work/poblancer-next/test-results/native-hook-probe.jsonl';
 $kind=$post->post_type==='job_listing'?'job':$post->post_type;$marker=$_COOKIE[$kind.'_add_new_update']??'';
 $GLOBALS['pob_fixture_notice_post']=(int)$post_id;
 $old=umask(0077);$row=wp_json_encode(['hook'=>current_filter(),'post'=>(int)$post_id,'owner'=>(int)$user->ID,'marker_present'=>in_array($marker,['new','update'],true)])."\n";
 $saved=file_put_contents($file,$row,FILE_APPEND|LOCK_EX);umask($old);if($saved===false)error_log('POBlancer fixture hook recorder could not write evidence.');
}
foreach(['wp_freeio_service_submit_done','wp_freeio_job_submit_done','wp_freeio_project_submit_done','wp-private-message-after-reply-message','wp-freeio-process-edit-service-after-save','wp-freeio-process-edit-job-after-save','wp-freeio-process-edit-project-after-save'] as $hook)add_action($hook,'pob_fixture_record_hook',PHP_INT_MAX,1);
add_action('wpfiwpl_process_user_package_handler',function($package,$service){pob_fixture_record_hook($service);},PHP_INT_MAX,2);
add_filter('pre_wp_mail',function($pre,$atts){
 if($pre!==true||empty($atts['to'])||empty($GLOBALS['pob_fixture_notice_post']))return $pre;
 $post=get_post($GLOBALS['pob_fixture_notice_post']);$user=$post?get_userdata($post->post_author):null;
 if(!$user||(!str_starts_with($user->user_login,'pob_plan_test_')&&!str_starts_with($user->user_login,'pob_http_')&&!str_starts_with($user->user_login,'pob_edit_fixture_')))return $pre;
 $file='/Users/adebayoomotosho-pob/Documents/Codex/2026-10-12/connect-my-site-at-https-pob/work/poblancer-next/test-results/native-hook-probe.jsonl';
 $old=umask(0077);file_put_contents($file,wp_json_encode(['hook'=>'pre_wp_mail','post'=>(int)$post->ID,'owner'=>(int)$user->ID,'suppressed'=>true])."\n",FILE_APPEND|LOCK_EX);umask($old);return $pre;
},PHP_INT_MAX,2);

add_filter('wp_freeio_get_option',function($value,$key){
 if(!in_array($key,['user_edit_published_submission_service','user_edit_published_submission_project','user_edit_published_submission'],true)||!function_exists('wp_get_current_user'))return $value;
 $user=wp_get_current_user();if(!$user||!str_starts_with($user->user_login,'pob_edit_fixture_'))return $value;
 $policy=get_user_meta($user->ID,'pob_fixture_edit_policy',true);return in_array($policy,['yes','yes_moderated'],true)?$policy:$value;
},PHP_INT_MAX,2);
