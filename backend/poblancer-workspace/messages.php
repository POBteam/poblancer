<?php
defined('ABSPATH') || exit;
final class POB_Messages {
    public static function boot(){add_action('rest_api_init',function(){register_rest_route('poblancer/v1','/messages',[
        ['methods'=>'GET','callback'=>[__CLASS__,'read'],'permission_callback'=>[__CLASS__,'permission']],
        ['methods'=>'POST','callback'=>[__CLASS__,'write'],'permission_callback'=>[__CLASS__,'permission']],
    ]);});}
    public static function permission(){return POB_Workspace::allowed()&&is_user_logged_in()&&class_exists('WP_Private_Message_Message');}
    private static function uid(){return (int)WP_Private_Message_Mixes::get_current_user_id();}
    public static function thread($id){
        if(!self::permission())return new WP_Error('pob_auth','Please sign in.',['status'=>401]);
        $post=get_post($id);$uid=self::uid();
        if(!$post||$post->post_type!=='private_message'||$post->post_parent||$post->post_status!=='publish'||!in_array($uid,[(int)get_post_meta($id,'_sender',true),(int)get_post_meta($id,'_recipient',true)],true))return new WP_Error('pob_thread','Conversation unavailable.',['status'=>403]);
        return $post;
    }
    private static function item($post){return ['id'=>$post->ID,'author'=>(int)$post->post_author,'name'=>get_the_author_meta('display_name',$post->post_author),'body'=>wp_strip_all_tags($post->post_content),'date'=>get_post_time('c',true,$post)];}
    public static function read($r){
        if(!self::permission())return new WP_Error('pob_auth','Please sign in.',['status'=>401]);
        $uid=self::uid();$page=max(1,absint($r['page']));$id=absint($r['id']);
        if($id){
            $post=self::thread($id);if(is_wp_error($post))return $post;
            $q=WP_Private_Message_Message::get_list_reply_messages(['parent'=>$id,'post_per_page'=>30,'paged'=>$page,'order'=>'ASC','orderby'=>'date']);
            $messages=array_map([__CLASS__,'item'],$q->posts);if($page===1)array_unshift($messages,self::item($post));
            $peer=(int)get_post_meta($id,'_sender',true)===$uid?(int)get_post_meta($id,'_recipient',true):(int)get_post_meta($id,'_sender',true);
            $queue=get_post_meta($id,'_pob_waitlist',true);
            $data=['id'=>$id,'subject'=>$post->post_title,'peer'=>get_the_author_meta('display_name',$peer),'messages'=>$messages,'page'=>$page,'pages'=>(int)$q->max_num_pages,'user_id'=>$uid,'availability'=>['queue'=>is_array($queue)?$queue:null,'user_id'=>$uid]];
        }else{
            $meta=[];$filter=sanitize_key($r['filter']??'all');
            if($filter==='read')$meta[]=['key'=>'_read_'.$uid,'value'=>'yes'];
            if($filter==='unread')$meta[]=['relation'=>'OR',['key'=>'_read_'.$uid,'compare'=>'NOT EXISTS'],['key'=>'_read_'.$uid,'value'=>'']];
            $q=WP_Private_Message_Message::get_list_messages(['author'=>$uid,'post_per_page'=>20,'paged'=>$page,'search'=>sanitize_text_field($r['search']??''),'meta_query'=>$meta]);$rows=[];
            foreach($q->posts as $post){$sender=(int)get_post_meta($post->ID,'_sender',true);$peer=$sender===$uid?(int)get_post_meta($post->ID,'_recipient',true):$sender;$rows[]=['id'=>$post->ID,'name'=>get_the_author_meta('display_name',$peer),'subject'=>$post->post_title,'preview'=>wp_trim_words(wp_strip_all_tags($post->post_content),16),'unread'=>get_post_meta($post->ID,'_read_'.$uid,true)!=='yes','date'=>get_post_time('c',true,$post)];}
            $data=['rows'=>$rows,'page'=>$page,'pages'=>(int)$q->max_num_pages,'total'=>(int)$q->found_posts];
        }
        $out=new WP_REST_Response($data);$out->header('Cache-Control','private, no-store');$out->header('Vary','Cookie');return $out;
    }
    public static function write($r){
        if(!self::permission())return new WP_Error('pob_auth','Please sign in.',['status'=>401]);
        $p=$r->get_json_params();$id=absint($p['id']??0);$post=self::thread($id);if(is_wp_error($post))return $post;$uid=self::uid();$action=sanitize_key($p['action']??'');
        if($action==='seen'){update_post_meta($id,'_read_'.$uid,'yes');return ['ok'=>true];}
        if($action==='trash'){
            if(!defined('EMPTY_TRASH_DAYS')||EMPTY_TRASH_DAYS<=0)return new WP_Error('pob_trash','Recoverable removal is unavailable.',['status'=>409]);
            do_action('wp-private-message-before-delete-message');return wp_trash_post($id)?['ok'=>true]:new WP_Error('pob_save','Unable to remove conversation.',['status'=>500]);
        }
        if($action!=='reply')return new WP_Error('pob_action','Unknown message action.',['status'=>422]);
        $text=$p['message']??'';if(!is_string($text)||!trim($text)||strlen($text)>10000)return new WP_Error('pob_message','Enter a message of up to 10,000 characters.',['status'=>422]);
        $key=sanitize_text_field($p['request_key']??'');if(!preg_match('/^[a-zA-Z0-9-]{16,80}$/',$key))return new WP_Error('pob_request','Reload the composer before sending.',['status'=>422]);
        global $wpdb;$lock='pob_message_'.$uid;
        if((int)$wpdb->get_var($wpdb->prepare('SELECT GET_LOCK(%s, 3)',$lock))!==1)return new WP_Error('pob_busy','Another message is sending. Please retry.',['status'=>409]);
        try{
            $token='pob_msg_'.hash('sha256',$uid.':'.$id.':'.$key);$existing=get_transient($token);if($existing)return ['ok'=>true,'id'=>(int)$existing];
            $last=(int)get_transient('pob_message_last_'.$uid);if(time()-$last<2)return new WP_Error('pob_rate','Please wait a moment before sending again.',['status'=>429]);
            $args=apply_filters('wp-private-message-reply-message-data',['post_title'=>'RE: '.$post->post_title,'post_type'=>'private_message','post_content'=>sanitize_text_field($text),'post_status'=>'publish','post_parent'=>$id,'post_author'=>$uid]);
            // Identity and conversation cannot be changed by a client or an optional formatting filter.
            $args['post_type']='private_message';$args['post_parent']=$id;$args['post_author']=$uid;
            do_action('wp-private-message-before-reply-message');$reply=wp_insert_post($args,true);if(is_wp_error($reply))return $reply;
            $sender=(int)get_post_meta($id,'_sender',true);$recipient=(int)get_post_meta($id,'_recipient',true);$peer=$sender===$uid?$recipient:$sender;
            delete_post_meta($id,'_read_'.$peer);update_post_meta($id,'_read_'.$uid,'yes');
            set_transient($token,$reply,DAY_IN_SECONDS);set_transient('pob_message_last_'.$uid,time(),10);
            do_action('wp-private-message-after-reply-message',$reply,$id,$uid);
            self::notify($post,$reply,$uid,$peer);
            return ['ok'=>true,'id'=>$reply];
        }finally{$wpdb->get_var($wpdb->prepare('SELECT RELEASE_LOCK(%s)',$lock));}
    }
    private static function notify($parent,$reply,$sender_id,$recipient_id){
        if(!wp_private_message_get_option('user_notice_add_new_message'))return;
        $sender=get_userdata($sender_id);$recipient=get_userdata($recipient_id);if(!$sender||!$recipient)return;
        $dashboard=get_permalink(wp_private_message_get_option('message_dashboard_page_id'));
        $values=['{{message_content}}'=>get_post_field('post_content',$reply),'{{website_name}}'=>get_bloginfo('name'),'{{website_url}}'=>home_url('/'),'{{message_subject}}'=>$parent->post_title,'{{user_name}}'=>$recipient->display_name,'{{message_dashboard}}'=>$dashboard,'{{message_detail_url}}'=>add_query_arg('id',$parent->ID,$dashboard)];
        $content=strtr((string)wp_private_message_get_option('user_notice_replied_message_content'),$values);
        $headers=sprintf("From: %s <%s>\r\nContent-type: text/html",sanitize_text_field($sender->display_name),sanitize_email($sender->user_email));
        WP_Private_Message_Mixes::wp_mail($recipient->user_email,wp_private_message_get_option('user_notice_replied_message_subject'),$content,$headers);
    }
}
POB_Messages::boot();
