<?php
defined('ABSPATH') || exit;
final class POB_Collections {
    public static function boot(){add_action('rest_api_init',function(){register_rest_route('poblancer/v1','/collection',[
        ['methods'=>'GET','callback'=>[__CLASS__,'read'],'permission_callback'=>[POB_Profile::class,'permission']],['methods'=>'POST','callback'=>[__CLASS__,'write'],'permission_callback'=>[POB_Profile::class,'permission']],
    ]);});}
    private static function profiles(){
        $id=WP_Freeio_User::get_freelancer_by_user_id(WP_Freeio_User::get_user_id());$ids=apply_filters('wp-freeio-translations-post-ids',$id);return array_values(array_unique(array_merge([0,$id],array_map('absint',(array)$ids))));
    }
    public static function read($r){
        if(!POB_Profile::permission())return new WP_Error('pob_auth','Marketplace account required.',['status'=>403]);
        $kind=sanitize_key($r['kind']);$owner=WP_Freeio_User::get_user_id();$page=max(1,absint($r['page']));$search=sanitize_text_field($r['search']??'');$order=($r['sort']??'')==='oldest'?'ASC':'DESC';$meta=[];$extra=[];
        $args=['post_status'=>'publish','author'=>$owner,'posts_per_page'=>20,'paged'=>$page,'orderby'=>'date','order'=>$order,'s'=>$search];
        if($kind==='favorites'){
            $entity=sanitize_key($r['entity']??'service');$types=['service'=>'service','project'=>'project','job'=>'job_listing','employer'=>'employer','freelancer'=>'freelancer'];if(!isset($types[$entity]))return new WP_Error('pob_type','Unknown saved type.',['status'=>422]);
            unset($args['author']);$args['post_type']=$types[$entity];$ids=array_filter(array_map('absint',(array)get_user_meta(get_current_user_id(),'_favorite_'.$entity,true)));$args['post__in']=$ids?:[0];$extra['entity']=$entity;
        }else{
            if(!WP_Freeio_User::is_freelancer())return new WP_Error('pob_role','A freelancer account is required.',['status'=>403]);
            if($kind==='proposals'){$args['post_type']='project_proposal';$args['post_status']=['publish','hired','completed','cancelled'];}
            elseif($kind==='applied'){$args['post_type']='job_applicant';unset($args['author'],$args['s']);$meta[]=['key'=>WP_FREEIO_APPLICANT_PREFIX.'freelancer_id','value'=>self::profiles(),'compare'=>'IN'];if($search)$meta[]=['key'=>WP_FREEIO_APPLICANT_PREFIX.'job_name','value'=>$search,'compare'=>'LIKE'];}
            elseif($kind==='alerts'){$args['post_type']='job_alert';}
            elseif($kind==='statements'){$args['post_type']='earning';$args['post_status']=['publish','pending'];$extra['balance']=WP_Freeio_Post_Type_Withdraw::get_freelancer_balance($owner);$extra['minimum']=wp_freeio_get_option('minimum_withdraw_amount',50);$all=WP_Freeio_Mixes::get_default_withdraw_payout_methods();$extra['methods']=[];foreach(wp_freeio_get_option('withdraw_payout_methods',['paypal','bacs','payoneer']) as $key)if(isset($all[$key]))$extra['methods'][]=['id'=>$key,'label'=>$all[$key]];$extra['method']=get_user_meta($owner,'payout_method',true);}
            else return new WP_Error('pob_collection','Unknown account list.',['status'=>404]);
        }
        if($meta)$args['meta_query']=$meta;$q=new WP_Query($args);$rows=[];
        foreach($q->posts as $post){$id=$post->ID;$status=get_post_status_object($post->post_status);$row=['id'=>$id,'title'=>get_the_title($post),'date'=>get_the_date('j M Y',$post),'status'=>$status?$status->label:$post->post_status];
            if($kind==='favorites')$row['url']=get_permalink($post);
            if($kind==='proposals'){$prefix=WP_FREEIO_PROJECT_PROPOSAL_PREFIX;$parent=absint(get_post_meta($id,$prefix.'project_id',true));$row['title']=get_the_title($parent);$row['url']=get_permalink($parent);$row['amount']=get_post_meta($id,$prefix.'amount',true);$row['edit_amount']=get_post_meta($id,$prefix.'default_proposed_amount',true)?:$row['amount'];$row['status']=$post->post_status==='publish'?'Pending':$row['status'];$row['hours']=get_post_meta($id,$prefix.'estimeted_time',true);$row['description']=$post->post_content;$row['editable']=$post->post_status==='publish'&&get_post_status($parent)==='publish';$row['hired']=$post->post_status==='hired';}
            if($kind==='applied'){$parent=absint(get_post_meta($id,WP_FREEIO_APPLICANT_PREFIX.'job_id',true));$row['title']=get_post_meta($id,WP_FREEIO_APPLICANT_PREFIX.'job_name',true)?:get_the_title($parent);$row['url']=get_permalink($parent);$row['status']=get_post_meta($id,WP_FREEIO_APPLICANT_PREFIX.'app_status',true)?:'Applied';}
            if($kind==='alerts'){$frequency=WP_Freeio_Job_Alert::get_email_frequency();$f=get_post_meta($id,WP_FREEIO_JOB_ALERT_PREFIX.'email_frequency',true);$row['frequency']=$frequency[$f]['label']??$f;$query=(array)get_post_meta($id,WP_FREEIO_JOB_ALERT_PREFIX.'alert_query',true);$row['criteria']=$query;$row['url']=add_query_arg($query,home_url('/jobs/'));}
            if($kind==='statements'){$row['amount']=get_post_meta($id,WP_FREEIO_EARNING_PREFIX.'freelancer_amount',true);$row['type']=get_post_meta($id,WP_FREEIO_EARNING_PREFIX.'project_type',true)==='service'?'Service':'Project';}
            $rows[]=$row;
        }
        $out=new WP_REST_Response(array_merge($extra,['kind'=>$kind,'rows'=>$rows,'page'=>$page,'pages'=>(int)$q->max_num_pages,'total'=>(int)$q->found_posts,'currency'=>get_woocommerce_currency()]));$out->header('Cache-Control','private, no-store');return $out;
    }
    public static function write($r){
        if(!POB_Profile::permission())return new WP_Error('pob_auth','Marketplace account required.',['status'=>403]);nocache_headers();
        $p=$r->get_json_params();$action=sanitize_key($p['action']??'');$id=absint($p['id']??0);$owner=WP_Freeio_User::get_user_id();
        if($action==='remove-favorite'){
            $entity=sanitize_key($p['entity']??'');if(!in_array($entity,['service','project','job','employer','freelancer'],true))return new WP_Error('pob_type','Unknown saved type.',['status'=>422]);
            $uid=get_current_user_id();$saved=(array)get_user_meta($uid,'_favorite_'.$entity,true);$next=array_values(array_filter($saved,fn($value)=>(int)$value!==$id));
            $old=$_POST;$_POST=[$entity.'_id'=>$id];try{do_action('wp-freeio-process-remove-'.$entity.'-favorite',$_POST);update_user_meta($uid,'_favorite_'.$entity,$next);return apply_filters('wp-freeio-remove-'.$entity.'-favorite-return',['ok'=>true,'status'=>true],$id);}finally{$_POST=$old;}
        }
        if(!WP_Freeio_User::is_freelancer())return new WP_Error('pob_role','A freelancer account is required.',['status'=>403]);
        $post=get_post($id);if(!$post||$post->post_status==='trash')return new WP_Error('pob_record','Record unavailable.',['status'=>404]);
        if(in_array($action,['edit-proposal','remove-proposal'],true)){
            if($post->post_type!=='project_proposal'||(int)$post->post_author!==$owner)return new WP_Error('pob_owner','Proposal unavailable.',['status'=>403]);
            $project=absint(get_post_meta($id,WP_FREEIO_PROJECT_PROPOSAL_PREFIX.'project_id',true));if($post->post_status!=='publish'||get_post_status($project)!=='publish')return new WP_Error('pob_status','An active contract cannot be changed from this proposal form.',['status'=>409]);
            if($action==='remove-proposal'){if(!defined('EMPTY_TRASH_DAYS')||EMPTY_TRASH_DAYS<=0)return new WP_Error('pob_trash','Recoverable removal is unavailable.',['status'=>409]);do_action('wp-freeio-before-process-remove-proposal');return wp_trash_post($id)?['ok'=>true]:new WP_Error('pob_save','Unable to remove proposal.',['status'=>500]);}
            $amount=$p['amount']??'';$hours=$p['hours']??'';$description=$p['description']??'';if(!is_numeric($amount)||(float)$amount<=0||!is_finite((float)$amount)||!is_numeric($hours)||(float)$hours<0||!is_string($description)||!trim($description)||strlen($description)>20000)return new WP_Error('pob_fields','Enter a valid proposal amount, time and description.',['status'=>422]);
            $_POST=['project_id'=>$project,'proposal_id'=>$id,'proposed_amount'=>wc_format_decimal($amount),'estimeted_time'=>absint($hours),'description'=>$description];self::native_json();WP_Freeio_Project::process_project_proposal();
        }
        if($action==='remove-applied'){
            if($post->post_type!=='job_applicant'||!in_array(absint(get_post_meta($id,WP_FREEIO_APPLICANT_PREFIX.'freelancer_id',true)),self::profiles(),true))return new WP_Error('pob_owner','Application unavailable.',['status'=>403]);
            $_POST=['applicant_id'=>$id,'nonce'=>wp_create_nonce('wp-freeio-remove-applied-nonce')];self::native_json();WP_Freeio_Freelancer::process_remove_applied();
        }
        if($action==='remove-alert'){
            if($post->post_type!=='job_alert'||(int)$post->post_author!==$owner)return new WP_Error('pob_owner','Job alert unavailable.',['status'=>403]);
            if(!defined('EMPTY_TRASH_DAYS')||EMPTY_TRASH_DAYS<=0)return new WP_Error('pob_trash','Recoverable removal is unavailable.',['status'=>409]);
            do_action('wp-freeio-before-remove-job-alert',$id);return wp_trash_post($id)?['ok'=>true]:new WP_Error('pob_save','Unable to remove alert.',['status'=>500]);
        }
        return new WP_Error('pob_action','Unknown action.',['status'=>422]);
    }
    private static function native_json(){add_filter('doing_it_wrong_trigger_error',function($trigger,$name){return $name==='wp_send_json'?false:$trigger;},10,2);}
}
POB_Collections::boot();
