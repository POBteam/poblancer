<?php
// Temporary exact-local fixture probe. Never deploy this file.
defined('ABSPATH')||exit;
add_action('wp-freeio-process-save-verification-identity-before',static function(){
 if(wp_get_environment_type()!=='local'||home_url('/')!=='http://poblancer.local/')return;
 $user=wp_get_current_user();if(!str_starts_with($user->user_login,'pob_http_'))return;
 $folder=get_user_meta($user->ID,'_pob_test_verification_barrier',true);
 $root='/Users/adebayoomotosho-pob/Documents/Codex/2026-10-12/connect-my-site-at-https-pob/work/poblancer-next/test-results/';
 if(!is_string($folder)||!str_starts_with($folder,$root.'verification-barrier-')||!is_dir($folder))return;
 file_put_contents($folder.'/'.getmypid(), 'arrived');$until=microtime(true)+2;
 while(count(glob($folder.'/*'))<2&&microtime(true)<$until)usleep(10000);
},999);
