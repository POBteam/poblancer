const project={'business':54,'design-creative':64,'development-it':70,'digital-marketing':75,lifestyle:106,'music-audio':114,'programming-tech':121,trending:140,'video-animation':144,'writing-translation':148};
const job={developers:69,business:57,'digital-marketing':72,'graphics-design':91,lifestyle:107,'music-audio':113,'writing-translation':147};
const service={business:167,'design-creative':65,'development-it':71,'digital-marketing':76,lifestyle:104,'music-audio':111,'video-animation':143};
const pages=new Set(['/','/about-v2/','/services/','/projects/','/jobs/','/employers/','/freelancers/','/become-seller/','/contact/','/faq/','/terms/','/privacy-policy/','/refund_returns-2/','/login/','/register/']);
export function publicReactLink(value,origin='http://poblancer.local',context=''){
 try{const u=new URL(value,origin);if(![new URL(origin).hostname,'pob.com.ng','www.pob.com.ng','princesageonlinebranding.com','www.princesageonlinebranding.com'].includes(u.hostname))return value;
 const downloads={'/wp-content/uploads/2026/05/Partnership-Agreement-POB-Freelancers.pdf':'/downloads/Partnership-Agreement-POB-Freelancers.pdf','/wp-content/uploads/2026/05/Partnership-Agreement-POB-External-Freelancer.pdf':'/downloads/Partnership-Agreement-POB-External-Freelancer.pdf'};if(downloads[u.pathname])return downloads[u.pathname];
 if(['/projects-2/','/projects-2','/project-list/','/project-list'].includes(u.pathname))return '/projects'+u.search;
 const aliases={'/projects-2/':'/projects','/jobs-2/':'/jobs','/service-layout-1/':'/services','/submission-service/':'/workspace#service-editor','/submission-project/':'/workspace#project-editor','/submission-job/':'/workspace#job-editor'};const alias=aliases[u.pathname.endsWith('/')?u.pathname:u.pathname+'/'];if(alias)return alias+u.search;
 const term=u.pathname.match(/^\/(service-category|project-category|job-category|employer-category|freelancer-category|project-duration|project-level|project-language|job-type|location)\/([a-z0-9-]+)\/?$/);if(term){const [,taxonomy,slug]=term;const types={'service-category':['services','filter-category'],'project-category':['projects','filter-category'],'job-category':['jobs','filter-category'],'employer-category':['employers','filter-category'],'freelancer-category':['freelancers','filter-category'],'project-duration':['projects','filter-project_duration'],'project-level':['projects','filter-project_level'],'project-language':['projects','filter-project_language[]'],'job-type':['jobs','filter-type']};const dest=types[taxonomy]||(taxonomy==='location'&&context?[context,'filter-location[]']:null);if(dest){const known=({'service-category':service,'project-category':project,'job-category':job})[taxonomy]?.[slug];return '/'+dest[0]+'?'+dest[1]+'='+encodeURIComponent(known||slug);}}
 const path=u.pathname.endsWith('/')?u.pathname:u.pathname+'/';
 const category=path.match(/^\/(project|job|service)-category\/([a-z0-9-]+)\/$/);if(category){const [,kind,slug]=category;const id=({project,job,service})[kind]?.[slug];if(id)return '/'+({project:'projects',job:'jobs',service:'services'})[kind]+'?filter-category='+id;}
 if(/^\/(job|project|service|employer|freelancer)\/[a-z0-9-]+\/$/.test(path))return path+u.search+u.hash;
 if(pages.has(path))return path+u.search+u.hash;
 return value;
 }catch{return value;}
}
