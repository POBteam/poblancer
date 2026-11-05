<?php
defined('ABSPATH') || exit;
final class POB_Video_Portfolio {
    const META='_pob_video_portfolio';
    public static function boot(){add_action('rest_api_init',function(){register_rest_route('poblancer/v1','/video-portfolio',[
        ['methods'=>'GET','callback'=>[__CLASS__,'read'],'permission_callback'=>'__return_true'],
        ['methods'=>'POST','callback'=>[__CLASS__,'save'],'permission_callback'=>[POB_Addons::class,'permission']],
    ]);});}
    private static function owns($id){return POB_Addons::permission()&&(int)get_post_field('post_author',$id)===(int)WP_Freeio_User::get_user_id();}
    private static function valid_post($id){return in_array(get_post_type($id),['service','freelancer'],true)&&get_post_status($id)!=='trash';}
    private static function rows($id){$rows=get_post_meta($id,self::META,true);return is_array($rows)?array_slice(array_values($rows),0,12):[];}
    private static function revision($rows){return hash('sha256',wp_json_encode($rows));}
    public static function read($r){$id=absint($r['id']);$edit=$r['context']==='edit';
        if(!self::valid_post($id)||($edit?!self::owns($id):get_post_status($id)!=='publish'))return new WP_Error('pob_portfolio','Video portfolio unavailable.',['status'=>$edit?403:404]);
        $rows=self::rows($id);$items=$rows;if(!$edit)foreach($items as &$item)if($item['provider']!=='upload')unset($item['url']);
        $out=new WP_REST_Response(['id'=>$id,'items'=>$items,'revision'=>$edit?self::revision($rows):null]);$out->header('Cache-Control',$edit?'private, no-store':'public, max-age=60');return $out;
    }
    public static function normalize($rows,$owner){
        if(!is_array($rows)||count($rows)>12)return new WP_Error('pob_videos','Add up to 12 portfolio videos.',['status'=>422]);$out=[];$seen=[];
        foreach($rows as $row){if(!is_array($row))return new WP_Error('pob_video','Invalid video.',['status'=>422]);
            $title=sanitize_text_field($row['title']??'');if(mb_strlen($title)>100)return new WP_Error('pob_title','Video titles can have up to 100 characters.',['status'=>422]);
            $aspect=$row['aspect']??'16:9';if(!in_array($aspect,['16:9','9:16'],true))return new WP_Error('pob_aspect','Choose landscape or portrait.',['status'=>422]);
            $attachment=absint($row['attachment_id']??0);$video_id='';$provider='';$url='';
            if($attachment){if(get_post_type($attachment)!=='attachment'||(int)get_post_field('post_author',$attachment)!==(int)$owner||!in_array(get_post_mime_type($attachment),['video/mp4','video/webm'],true))return new WP_Error('pob_media','Choose an MP4 or WebM uploaded by this account.',['status'=>403]);$provider='upload';$video_id=(string)$attachment;$url=wp_get_attachment_url($attachment);}
            else{$input=$row['url']??'';if(!is_string($input)||strlen($input)>500)return new WP_Error('pob_url','Enter a valid video link.',['status'=>422]);$parts=wp_parse_url($input);$host=strtolower($parts['host']??'');$path=$parts['path']??'';
                if(($parts['scheme']??'')!=='https'||isset($parts['user'])||isset($parts['pass'])||isset($parts['port']))return new WP_Error('pob_url','Use a secure YouTube or Instagram video link.',['status'=>422]);
                if(in_array($host,['youtube.com','www.youtube.com','m.youtube.com','youtu.be','www.youtube-nocookie.com'],true)){
                    $provider='youtube';if($host==='youtu.be')$video_id=trim($path,'/');elseif(preg_match('~^/(shorts|embed)/([A-Za-z0-9_-]{11})/?$~',$path,$m))$video_id=$m[2];else{parse_str($parts['query']??'',$q);$video_id=is_string($q['v']??null)?$q['v']:'';}if(!preg_match('/^[A-Za-z0-9_-]{11}$/',$video_id))return new WP_Error('pob_url','Enter a complete YouTube video link.',['status'=>422]);$url='https://www.youtube.com/watch?v='.$video_id;
                }elseif(in_array($host,['instagram.com','www.instagram.com'],true)&&preg_match('~^/(p|reel|tv)/([A-Za-z0-9_-]{5,64})/?$~',$path,$m)){$provider='instagram';$video_id=$m[2];$url='https://www.instagram.com/'.$m[1].'/'.$video_id.'/';}
                else return new WP_Error('pob_url','Use a YouTube video or public Instagram post/reel link.',['status'=>422]);
            }
            $key=$provider.':'.$video_id;if(isset($seen[$key]))return new WP_Error('pob_duplicate','This video is already in the portfolio.',['status'=>422]);$seen[$key]=true;
            $out[]=['provider'=>$provider,'video_id'=>$video_id,'title'=>$title?:'Portfolio video '.(count($out)+1),'aspect'=>$aspect,'attachment_id'=>$attachment,'url'=>$url];
        }return $out;
    }
    public static function save($r){$p=$r->get_json_params();$id=absint($p['id']??0);if(!self::valid_post($id)||!self::owns($id))return new WP_Error('pob_owner','This portfolio belongs to another account.',['status'=>403]);
        $rows=self::normalize($p['items']??null,WP_Freeio_User::get_user_id());if(is_wp_error($rows))return $rows;
        global $wpdb;$lock='pob_video_portfolio_'.$id;if((int)$wpdb->get_var($wpdb->prepare('SELECT GET_LOCK(%s, 3)',$lock))!==1)return new WP_Error('pob_busy','This portfolio is being updated. Try again shortly.',['status'=>409]);
        try{wp_cache_delete($id,'post_meta');$before=self::rows($id);if(($p['revision']??'')!==self::revision($before))return new WP_Error('pob_stale','The portfolio changed. Reload it before saving.',['status'=>409]);
            if($rows!==$before){$ok=update_post_meta($id,self::META,$rows);if(!$ok)return new WP_Error('pob_save','Unable to save the portfolio.',['status'=>500]);}
            $response=new WP_REST_Response(['ok'=>true,'id'=>$id,'items'=>$rows,'revision'=>self::revision($rows),'message'=>'Video portfolio saved.']);$response->header('Cache-Control','private, no-store');return $response;
        }finally{$wpdb->get_var($wpdb->prepare('SELECT RELEASE_LOCK(%s)',$lock));}
    }
}
POB_Video_Portfolio::boot();
