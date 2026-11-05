'use client';
import {useState} from 'react';
type Field={name:string;type:string;placeholder:string;maxLength:number;required:boolean};
export default function ContactForm({fields}:{fields:Field[]}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[errors,setErrors]=useState<Record<string,string>>({});
 return <form className="info-contact-form" onSubmit={async e=>{e.preventDefault();if(busy)return;const form=e.currentTarget;setBusy(true);setMessage('');setErrors({});try{const data=Object.fromEntries(new FormData(form));const r=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const result=await r.json();setMessage(result.message||'Unable to send your message. Please try again.');setErrors(result.errors||{});if(r.ok&&result.sent)form.reset();}catch{setMessage('Unable to send your message. Please try again.');}finally{setBusy(false);}}}>
 {fields.map(f=><label key={f.name} className={f.type==='textarea'?'contact-message':undefined}>{f.name==='form-control'?'Name':f.name==='your-email'?'Email':'Messages'}{f.type==='textarea'?<textarea name={f.name} placeholder={f.placeholder} required={f.required} maxLength={f.maxLength} rows={7} aria-invalid={!!errors[f.name]} aria-describedby={errors[f.name]?'error-'+f.name:undefined}/>:<input name={f.name} type={f.type} placeholder={f.placeholder} required={f.required} maxLength={f.maxLength} aria-invalid={!!errors[f.name]} aria-describedby={errors[f.name]?'error-'+f.name:undefined}/>} {errors[f.name]&&<span className="contact-error" id={'error-'+f.name}>{errors[f.name]}</span>}</label>)}
 <div className="contact-honeypot" aria-hidden="true"><label>Leave empty<input name="website" tabIndex={-1} autoComplete="off"/></label></div><button disabled={busy} type="submit">{busy?'Sending…':'Send Messages'} <span aria-hidden="true">↗</span></button>{message&&<p role="status" className="contact-status">{message}</p>}
 </form>;
}
