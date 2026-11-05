<?php
/** Plugin Name: POBlancer Local Signed Read Batches
 * Opt-in transport for audited native reads. Support GETs retain alert/transient side effects; no business commands.
 */
defined('ABSPATH') || exit;
if(!defined('WP_ENVIRONMENT_TYPE')||WP_ENVIRONMENT_TYPE!=='local'||ABSPATH!=='/Users/adebayoomotosho-pob/Local Sites/poblancer/app/public/')return;
function pob_read_batch_routes(){return ['listings','page-views','messages','addons','collection','account-tool','management','contract','workspace','support'];}
function pob_read_batch_path($value){
 if(!is_string($value)||strlen($value)>4096||str_contains($value,'#')||str_contains($value,'\\'))return false;
 $parts=wp_parse_url($value);if(!$parts||isset($parts['scheme'])||isset($parts['host']))return false;
 $prefix='/poblancer/v1/';$path=$parts['path']??'';
 return str_starts_with($path,$prefix)&&in_array(substr($path,strlen($prefix)),pob_read_batch_routes(),true);
}
function pob_read_batch_envelope(){
 static $checked=false,$valid=false;if($checked)return $valid;$checked=true;
 if(($_SERVER['REQUEST_METHOD']??'')!=='POST'||rtrim((string)parse_url($_SERVER['REQUEST_URI']??'',PHP_URL_PATH),'/')!=='/wp-json/poblancer/v1/read-batch')return false;
 $timestamp=$_SERVER['HTTP_X_POB_BATCH_TIME']??'';$signature=$_SERVER['HTTP_X_POB_BATCH_SIGNATURE']??'';
 if(!ctype_digit($timestamp)||abs(time()-(int)$timestamp)>30||!preg_match('/^[a-f0-9]{64}$/D',$signature))return false;
 $file='/Users/adebayoomotosho-pob/Documents/Codex/2026-10-12/connect-my-site-at-https-pob/work/poblancer-next/backups/read-batch-key.json';
 $key=json_decode((string)@file_get_contents($file),true)['key']??'';if(strlen($key)<32)return false;
 $stream=fopen('php://input','rb');$raw=stream_get_contents($stream,1048577);fclose($stream);if(strlen($raw)>1048576)return false;
 if(!hash_equals(hash_hmac('sha256',$timestamp.'.'.$raw,$key),$signature))return false;
 $body=json_decode($raw,true);if(!is_array($body)||!isset($body['requests'])||!is_array($body['requests'])||count($body['requests'])<1||count($body['requests'])>20)return false;
 $seen=[];foreach($body['requests'] as $entry){
  if((isset($entry['method'])&&$entry['method']!=='GET')||!is_array($entry)||!is_string($entry['id']??null)||!preg_match('/^[a-zA-Z0-9-]{1,80}$/D',$entry['id'])||isset($seen[$entry['id']])||!pob_read_batch_path($entry['path']??null))return false;
  if(!is_string($entry['cookie']??null)||strlen($entry['cookie'])>8192||!is_string($entry['nonce']??null)||strlen($entry['nonce'])>128)return false;
  $seen[$entry['id']]=true;
 }
 return $valid=$body;
}
add_action('rest_api_init',function(){register_rest_route('poblancer/v1','/read-batch',[
 'methods'=>'POST','permission_callback'=>fn()=>pob_read_batch_envelope()!==false,
 'callback'=>function(){
  $envelope=pob_read_batch_envelope();$results=[];global $wpdb;$started=microtime(true);$queries=$wpdb->num_queries;
  $oldUser=get_current_user_id();$oldCookies=$_COOKIE;$oldRequest=$_REQUEST;$oldGet=$_GET;$oldPost=$_POST;
  $oldNonce=$_SERVER['HTTP_X_WP_NONCE']??null;$oldAuth=$GLOBALS['wp_rest_auth_cookie']??null;
  try{foreach($envelope['requests'] as $entry){
   try{
    wp_set_current_user(0);$_COOKIE=[];$_REQUEST=[];$_GET=[];$_POST=[];$GLOBALS['wp_rest_auth_cookie']=false;
    foreach(explode(';',$entry['cookie']) as $pair){$bits=explode('=',trim($pair),2);if(count($bits)===2&&$bits[0]===LOGGED_IN_COOKIE)$_COOKIE[LOGGED_IN_COOKIE]=urldecode($bits[1]);}
    $uid=wp_validate_auth_cookie($_COOKIE[LOGGED_IN_COOKIE]??'','logged_in');
    if(!$uid){$results[]=['id'=>$entry['id'],'status'=>401,'body'=>['message'=>'Please sign in again.']];continue;}
    wp_set_current_user($uid);$_SERVER['HTTP_X_WP_NONCE']=$entry['nonce'];$GLOBALS['wp_rest_auth_cookie']=true;
    // Native WordPress nonce and registered REST authentication filters still run.
    $auth=apply_filters('rest_authentication_errors',null);
    if(is_wp_error($auth)){$response=rest_convert_error_to_response($auth);}
    elseif(!is_user_logged_in()){$response=new WP_REST_Response(['message'=>'Please sign in again.'],401);}
    else{
     $parts=wp_parse_url($entry['path']);parse_str($parts['query']??'',$params);
     $request=new WP_REST_Request('GET',$parts['path']);$request->set_query_params($params);$request->set_header('X-WP-Nonce',$entry['nonce']);
     $response=rest_do_request($request);
    }
    $results[]=['id'=>$entry['id'],'status'=>$response->get_status(),'body'=>$response->get_data()];
   }catch(Throwable $error){$results[]=['id'=>$entry['id'],'status'=>500,'body'=>['message'=>'WordPress could not complete this read.']];}
  }}finally{
   $_COOKIE=$oldCookies;$_REQUEST=$oldRequest;$_GET=$oldGet;$_POST=$oldPost;wp_set_current_user($oldUser);$GLOBALS['wp_rest_auth_cookie']=$oldAuth;
   if($oldNonce===null)unset($_SERVER['HTTP_X_WP_NONCE']);else $_SERVER['HTTP_X_WP_NONCE']=$oldNonce;
  }
  $timing=['bootstrap_ms'=>round(max(0,$started-(float)($_SERVER['REQUEST_TIME_FLOAT']??$started))*1000,3),'handler_ms'=>round((microtime(true)-$started)*1000,3),'query_count'=>$wpdb->num_queries-$queries,'peak_mb'=>memory_get_peak_usage(true)/1048576];
  $response=new WP_REST_Response(['results'=>$results,'timing'=>$timing]);$response->header('Cache-Control','private, no-store, max-age=0');$response->header('Vary','Cookie');return $response;
 }
]);});
