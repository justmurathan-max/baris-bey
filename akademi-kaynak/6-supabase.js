
/* =================== GİRİŞ: SUPABASE =================== */
// Yayınlanabilir anahtar tarayıcıda durmak için yapılmıştır, gizli değildir; veriyi satır kuralları korur.
// Gizli anahtar (secret) asla buraya ya da depoya konmaz.
const SB_URL='https://xjbqesljonbbduldeesd.supabase.co';
const SB_KEY='sb_publishable_VaavFE-aieVC-vJJ7AA-Mg_k5RNSJNq';
const ROLE_HOME={merkez:'merkez/genel',broker:'broker/ozet',mentor:'mentor/panel'};
const ROLE_NAME={merkez:'Merkez yöneticisi',broker:'Broker',mentor:'Mentor'};
const roleOk=r=>!ME||r===ME.role||(ME.role==='broker'&&r==='mentor');

function lgMsg(t,k){const m=$('#lgMsg');if(!m)return;m.hidden=!t;m.className='lg-msg'+(k?' '+k:'');m.textContent=t||'';}
function lgBusy(b){const x=$('#lgBtn');if(!x)return;x.disabled=b;x.textContent=b?'Gönderiliyor…':'Giriş bağlantısı gönder';}

async function sendLink(mail){
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)){lgMsg('Geçerli bir e-posta adresi yazın.','er');$('#lgMail').focus();return;}
  lgBusy(true);lgMsg('');
  let error=null;
  try{({error}=await SB.auth.signInWithOtp({email:mail,options:{shouldCreateUser:false,emailRedirectTo:location.origin+location.pathname}}));}
  catch(e){error=e||{};}
  lgBusy(false);
  const code=error&&error.code||'',msg=error&&error.message||'';
  // Hesabı olmayan adres için de aynı cevap: kimin kayıtlı olduğu bu ekrandan anlaşılmasın.
  if(!error||code==='otp_disabled'||code==='signup_disabled'||/signups? not allowed/i.test(msg))
    lgMsg('Bu adres akademide kayıtlıysa giriş bağlantısı birkaç dakika içinde e-postanıza gelir. Gelmezse davet e-postasındaki adresi yazdığınızdan emin olun.','ok');
  else if(error.status===429||/rate limit|security purposes/i.test(msg))
    lgMsg('Kısa sürede çok fazla bağlantı istendi. Birkaç dakika sonra tekrar deneyin.','er');
  else lgMsg('Bağlantı gönderilemedi. Biraz sonra tekrar deneyin.','er');
}

async function enterReal(user){
  let p=null,off=null,err=null;
  try{
    const r=await SB.from('profiles').select('role,office_id,full_name,email,active').eq('id',user.id).maybeSingle();
    p=r.data;err=r.error;
    if(!err&&p&&p.office_id){const o=await SB.from('offices').select('name,status,membership_end').eq('id',p.office_id).maybeSingle();off=o.data;err=o.error;}
  }catch(e){err=e;}
  if(err){ME=null;showLogin();lgMsg('Hesap bilgileri alınamadı. Bağlantınızı kontrol edip sayfayı yenileyin.','er');return false;}
  const inactive=!p||!p.active;
  const closed=!inactive&&p.role!=='merkez'&&(!off||off.status==='pasif'||(off.membership_end&&new Date(off.membership_end+'T23:59:59')<new Date()));
  if(inactive||closed){
    try{await SB.auth.signOut();}catch(e){}
    ME=null;showLogin();
    lgMsg(inactive?'Bu hesap akademide etkin değil. Merkez yöneticisiyle görüşün.':'Ofisinizin akademi üyeliği etkin değil. Merkez yöneticisiyle görüşün.','er');
    return false;
  }
  ME={id:user.id,role:p.role,name:p.full_name||user.email,email:user.email,office:off&&off.name||null};
  return true;
}

async function signOutReal(){
  const sb=SB;ME=null;closeAllLayers();
  try{if(sb)await sb.auth.signOut();}catch(e){}
  nav('');lgMsg('Çıkış yaptınız.','ok');
}

async function boot(){
  if(!window.supabase||!window.supabase.createClient){route();return;}
  const hash=location.hash,authHash=/(^|[#&])(access_token|error|error_description)=/.test(hash);
  if(authHash){$('#app').hidden=true;$('#login').hidden=false;}
  try{SB=window.supabase.createClient(SB_URL,SB_KEY,{auth:{flowType:'implicit',detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}});}
  catch(e){SB=null;route();return;}
  let session=null;
  try{({data:{session}}=await SB.auth.getSession());}catch(e){}
  let fail='';
  if(authHash){
    const q=new URLSearchParams(hash.replace(/^#\/?/,''));
    if(q.get('error'))fail=/expired|invalid/i.test((q.get('error_code')||'')+' '+(q.get('error_description')||''))
      ?'Giriş bağlantısının süresi dolmuş ya da daha önce kullanılmış. Yeni bağlantı isteyin.'
      :'Giriş tamamlanamadı. Yeni bağlantı isteyin.';
    try{history.replaceState(null,'',location.pathname+location.search);}catch(e){}
    CUR='';
  }
  if(session&&session.user){
    if(await enterReal(session.user)){const want=CUR.split('/')[0];nav(NAV[want]&&roleOk(want)?CUR:ROLE_HOME[ME.role]);}
  }else if(authHash){showLogin();lgMsg(fail||'Giriş tamamlanamadı. Yeni bağlantı isteyin.','er');}
  else route();
  SB.auth.onAuthStateChange(ev=>{if(ev==='SIGNED_OUT'&&ME){ME=null;closeAllLayers();nav('');}});
}
