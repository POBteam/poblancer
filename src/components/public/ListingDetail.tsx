import JobApplication from './JobApplication';
import PublicAction from './PublicAction';
import ProjectProposal from './ProjectProposal';
import PublicVideoPortfolio from './PublicVideoPortfolio';
import type {extractDetail} from '../../lib/public-detail.mjs';
import {youtubeEmbedUrl} from '../../lib/public-video.mjs';
import DetailContent from './DetailContent';
import {DetailGallery,DetailPackages,DetailShare} from './DetailInteractive';
type Data=ReturnType<typeof extractDetail>;
export default function ListingDetail({data:d}:{data:Data}){const plural=d.kind==='job'?'Jobs':d.kind==='service'?'Services':'Projects',archive='/'+plural.toLowerCase(),video=youtubeEmbedUrl(d.video);return <>
 <div className="detail-top"><nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href={archive}>{plural}</a> / <span>{d.title}</span></nav><div className="detail-top-actions"><DetailShare/><PublicAction id={d.id} action="save" className="detail-text-action">Save</PublicAction><PublicAction id={d.id} action="report" className="detail-text-action">Report</PublicAction></div></div>
 <section className={'detail-heading detail-heading-'+d.kind}><div className="detail-heading-inner">{d.logo!=='#'&&<img className="detail-job-logo" src={d.logo} width="100" height="100" alt=""/>}<div><h1>{d.title}</h1>{d.employer&&<DetailContent context={plural.toLowerCase()} node={d.employer}/>}<DetailContent context={plural.toLowerCase()} node={d.header}/>{d.kind==='job'&&<div className="detail-job-meta"><p>{d.salary}</p>{d.singleFields.map((field,i)=><DetailContent key={i} node={field}/>)}</div>}</div>{d.kind==='job'&&<div className="detail-apply-status"><JobApplication id={d.id} status={d.applyStatus}/></div>}</div></section>
 <div className={'detail-layout detail-layout-'+d.kind}><div className="detail-body">
 <section className="detail-overview">{d.kind==='job'&&<h2>Job Overview</h2>}<DetailContent context={plural.toLowerCase()} node={d.overview}/></section>
 {d.gallery.length>0&&<DetailGallery images={d.gallery} title={d.title}/>}
 <section className="detail-description"><h2>{d.kind==='job'?'Job Description':d.kind==='project'?'Project Description':'Service Description'}</h2><DetailContent context={plural.toLowerCase()} node={d.description}/></section>
 {d.kind==='project'&&<><section className="detail-section"><h2>Attachments</h2><DetailContent context={plural.toLowerCase()} node={d.attachments}/></section><section className="detail-section"><h2>Skills Required</h2><DetailContent context={plural.toLowerCase()} node={d.skills}/></section></>}
 {video&&<section className="detail-section"><h2>Video</h2><iframe className="detail-video" src={video.replace('autoplay=1','autoplay=0')} referrerPolicy="strict-origin-when-cross-origin" title={d.title+' video'} allow="encrypted-media; picture-in-picture" allowFullScreen loading="lazy"/></section>}
 {d.kind==='service'&&<PublicVideoPortfolio id={d.id}/>}
 {d.faq.length>0&&<section className="detail-section detail-faq"><h2>Frequently Asked Questions</h2>{d.faq.map((f,i)=><details key={i}><summary>{f.question}</summary><p>{f.answer}</p></details>)}</section>}
 {d.sellerStats&&<section className="detail-section detail-overview"><DetailContent context={plural.toLowerCase()} node={d.sellerStats}/></section>}
 {d.reviews&&<section className="detail-section detail-reviews"><DetailContent context={plural.toLowerCase()} node={d.reviews}/><PublicAction id={d.id} action="review">Write a review</PublicAction></section>}
 {d.proposals&&<ProjectProposal id={d.id}/>}
 {d.related&&<section className="detail-section detail-related"><DetailContent context={plural.toLowerCase()} node={d.related}/></section>}
 </div>{d.kind!=='job'&&<aside className="detail-sidebar">{d.packages.length>0?<DetailPackages packages={d.packages} id={d.id}/>:d.price&&<section className="detail-price"><DetailContent context={plural.toLowerCase()} node={d.price}/>{d.proposals&&<a className="detail-primary" href="#project-proposal-form-wrapper">Submit a Proposal</a>}</section>}<section className="detail-author"><DetailContent context={plural.toLowerCase()} node={d.author}/><DetailContent context={plural.toLowerCase()} node={d.sellerOverview}/><PublicAction id={d.id} action="message">Contact Me</PublicAction></section></aside>}</div>
 </>;}
