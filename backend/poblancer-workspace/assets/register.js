const config=JSON.parse(document.querySelector('#register-config').textContent);
const form=document.querySelector('.registration form');
form?.addEventListener('submit',async event=>{
 event.preventDefault();
 if(!form.reportValidity())return;
 const result=document.querySelector('#register-result'), button=form.querySelector('[type=submit]');
 const password=form.querySelector('[name$="_password"]'), confirmation=form.querySelector('[name$="_confirmpassword"]');
 if(password&&confirmation&&password.value!==confirmation.value){result.textContent='The passwords do not match.';confirmation.focus();return;}
 button.disabled=true;result.textContent='Submitting your registration…';
 try{
  const response=await fetch(config.endpoint,{method:'POST',credentials:'same-origin',body:new FormData(form)});
  const data=await response.json();
  const text=new DOMParser().parseFromString(String(data.msg||'Unable to complete registration.'),'text/html').body.textContent;
  result.textContent=text;
  if(data.status){form.reset();if(data.redirect)location.assign(config.dashboard);else form.hidden=true;}
 }catch{result.textContent='Unable to confirm registration. Check your email or try logging in before submitting again.';}
 finally{button.disabled=false;}
});
