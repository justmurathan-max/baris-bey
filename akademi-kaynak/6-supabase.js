
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
  if(!error||code==='otp_disabled'||code==='signup_disabled'||/signups? not allowed/i.test(msg)){
    lgMsg('Bu adres akademide kayıtlıysa giriş bağlantısı birkaç dakika içinde e-postanıza gelir. Gelmezse davet e-postasındaki adresi yazdığınızdan emin olun.','ok');
    const k=$('#lgKod');if(k)k.hidden=false;
  }
  else if(error.status===429||/rate limit|security purposes/i.test(msg))
    lgMsg('Kısa sürede çok fazla bağlantı istendi. Birkaç dakika sonra tekrar deneyin.','er');
  else lgMsg('Bağlantı gönderilemedi. Biraz sonra tekrar deneyin.','er');
}

// E-postadaki kodla giriş: bağlantı başka cihazda açılınca da bu cihazdan girilebilsin.
async function kodlaGir(){
  const kod=($('#lgCode').value||'').replace(/\s+/g,''),mail=($('#lgMail').value||'').trim();
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)){lgMsg('Önce e-posta adresinizi yazın.','er');$('#lgMail').focus();return;}
  if(!/^\d{6,10}$/.test(kod)){lgMsg('E-postadaki kodu rakamlarıyla yazın.','er');$('#lgCode').focus();return;}
  const b=$('#lgCodeBtn');b.disabled=true;b.textContent='Kontrol ediliyor…';
  let data=null,error=null;
  try{({data,error}=await SB.auth.verifyOtp({email:mail,token:kod,type:'email'}));}catch(e){error=e||{};}
  b.disabled=false;b.textContent='Kodla gir';
  if(error||!data||!data.session){
    const m=error&&error.message||'';
    lgMsg(error&&(error.status===429||/rate limit|security purposes/i.test(m))
      ?'Kısa sürede çok fazla deneme yapıldı. Birkaç dakika sonra tekrar deneyin.'
      :'Kod geçersiz ya da süresi dolmuş. Kodu kontrol edin ya da yeni bağlantı isteyin.','er');
    $('#lgCode').focus();return;
  }
  $('#lgCode').value='';$('#lgKod').hidden=true;lgMsg('');
  await girisTamam(data.session.user);
}
if($('#lgCodeBtn'))$('#lgCodeBtn').addEventListener('click',kodlaGir);

// Giriş tamamlanınca: hesap, bu cihazın oturumu, veriler ve açılış sayfası.
async function girisTamam(user){
  if(!await enterReal(user))return false;
  // Bu cihazın oturumu: başka cihazdan giriş yüzünden kapanmışsa burada durur.
  if(!await oturumYokla())return false;
  if(ME.role==='merkez')await loadMerkez();else await loadOffice().catch(()=>false);
  await Promise.all([loadMateryal(),loadAyar(),ME.role==='merkez'?Promise.all([loadTaslak(),loadOturumlar(),loadKlasik(),loadEkip()]):null]).catch(()=>{});
  oturumBaslat();
  const want=CUR.split('/')[0];nav(NAV[want]&&roleOk(want)?CUR:ROLE_HOME[ME.role]);
  return true;
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
  ME={id:user.id,role:p.role,name:p.full_name||user.email,email:user.email,office:off&&off.name||null,officeId:p.office_id||null,dataOk:false};
  return true;
}

async function signOutReal(){
  oturumDurdur();
  const sb=SB;
  // Yalnız bu cihazdan çıkılır; aynı hesabın öbür cihazı (sınır izin veriyorsa) açık kalır.
  try{if(sb&&ME)await sb.rpc('session_close');}catch(e){}
  ME=null;closeAllLayers();
  try{if(sb)await sb.auth.signOut({scope:'local'});}catch(e){}
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
  if(session&&session.user)await girisTamam(session.user);
  else if(authHash){showLogin();lgMsg(fail||'Giriş tamamlanamadı. Yeni bağlantı isteyin.','er');}
  else route();
  SB.auth.onAuthStateChange(ev=>{if(ev==='SIGNED_OUT'){oturumDurdur();if(ME){ME=null;closeAllLayers();nav('');}}});
}

/* =================== MERKEZ: GERÇEK OFİSLER =================== */
function realM(){return !!(SB&&ME&&ME.role==='merkez');}
const addYear=d=>{const x=new Date(d);x.setFullYear(x.getFullYear()+1);return x;};

// Ofisleri ve sayılarını veritabanından alıp merkez ekranlarının kullandığı listeye koyar.
async function loadMerkez(){
  if(!realM())return false;
  const [o,pr,inv,co,ce,ru,rq,cp]=await Promise.all([
    SB.from('offices').select('id,name,city,tier,status,membership_start,membership_end,invited_at,created_at').order('created_at'),
    SB.from('profiles').select('office_id,role,full_name,email').not('office_id','is',null),
    SB.from('invitations').select('office_id,email,role,full_name'),
    SB.from('consultants').select('office_id').is('left_on',null),
    SB.from('certificates').select('no,holder_name,office_id,training_id,kind,issued_on,revoked_at'),
    SB.from('runs').select('office_id,days').neq('status','iptal'),
    SB.from('site_requests').select('*').order('created_at',{ascending:false}).limit(300),
    SB.rpc('office_completion')
  ]).catch(e=>[{error:e}]);
  // Tamamlama oranı ayrı hesaplanır; alınamazsa ofisler yine gelir, oran "—" görünür.
  const komp={};if(cp&&!cp.error&&Array.isArray(cp.data))cp.data.forEach(x=>{if(x.finished>0)komp[x.office_id]=Math.round(100*x.completed/x.finished);});
  if(!rq||[o,pr,inv,co,ce,ru,rq].some(r=>r.error)){
    // Örnek ofisler gerçekmiş gibi görünmesin: liste boşalır, üstte uyarı çıkar.
    ME.dataOk=false;OFFS.splice(0);MCERT.splice(0);REQS.splice(0);
    toast('Ofis bilgileri alınamadı. Sayfayı yenileyin.',6000);return false;}
  const from=iso(plus(T0,-30)),to=iso(T0),cnt=(rows,id)=>rows.filter(r=>r.office_id===id&&!r.revoked_at).length,nm=x=>x?(x.full_name||x.email):null;
  const list=o.data.map(r=>{
    const staff=pr.data.filter(p=>p.office_id===r.id),invs=inv.data.filter(i=>i.office_id===r.id);
    const b=staff.find(p=>p.role==='broker')||invs.find(i=>i.role==='broker'),m=staff.find(p=>p.role==='mentor')||invs.find(i=>i.role==='mentor');
    const ses=ru.data.filter(x=>x.office_id===r.id).reduce((a,x)=>a+(x.days||[]).filter(d=>d>=from&&d<=to).length,0);
    return{id:r.id,n:r.name,city:r.city||'—',br:nm(b),mn:nm(m),tier:r.tier||'1–25',cons:cnt(co.data,r.id),
      start:r.membership_start?fromIso(r.membership_start):null,end:r.membership_end?fromIso(r.membership_end):null,
      ses,st:r.status==='aktif'?'aktif':r.status==='pasif'?'pasif':'davet',comp:komp[r.id]!=null?komp[r.id]:null,cert:cnt(ce.data,r.id),inv:new Date(r.invited_at||r.created_at)};
  });
  OFFS.splice(0,OFFS.length,...list);
  const onm=id=>{const x=o.data.find(r=>r.id===id);return x?x.name:'—';};
  MCERT.splice(0,MCERT.length,...ce.data.map(x=>({no:x.no,n:x.holder_name,o:onm(x.office_id),tr:x.training_id,ty:x.kind,d:fromIso(x.issued_on),rev:!!x.revoked_at})));
  REQS.splice(0,REQS.length,...rq.data.map(x=>{const m=x.meta||{};return{id:x.id,at:new Date(x.created_at),kind:x.kind,name:x.full_name,company:x.company,city:x.city,phone:x.phone,email:x.email,message:x.message,topic:m.topic,size:m.size,mode:m.mode,dil:m.dil,tur:m.tur,status:x.status};}));
  ME.dataOk=true;
  return true;
}

async function inviteCall(body){
  try{const{data,error}=await SB.functions.invoke('davet',{body});return error?{err:error}:(data||{results:[]});}
  catch(e){return{err:e};}
}
function inviteMsg(r,lead){
  const L=lead?lead+' ':'';
  if(r.err)return L+'Davet gönderilemedi; biraz sonra yeniden deneyin.';
  const R=r.results||[];
  if(!R.length)return L+'Gönderilecek bekleyen davet yok.';
  if(R.every(x=>x.ok))return L+(R.length>1?'Davet e-postaları gönderildi.':'Davet e-postası gönderildi.');
  const k=R.filter(x=>x.reason==='kayitli').map(x=>x.email);
  if(k.length)return L+k.join(', ')+' adresiyle zaten bir hesap var; davet gönderilmedi.';
  if(R.some(x=>x.reason==='gecersiz'))return L+'Geçersiz e-posta adresi var.';
  if(R.some(x=>x.reason==='limit'))return L+'E-posta gönderim sınırına takıldı; biraz sonra yeniden gönderin.';
  return L+'Davet kaydedildi ama e-posta gönderilemedi. Mail servisi bağlanınca "Daveti yeniden gönder"le tekrar deneyin.';
}

async function createOfficeReal(v){
  const s=v.start||iso(T0);
  const ins=await SB.from('offices').insert({name:v.n.trim(),city:v.city.trim()||null,tier:v.tier,status:'davet',
    membership_start:s,membership_end:iso(addYear(fromIso(s))),invited_at:new Date().toISOString()}).select('id').single();
  if(ins.error){toast('Ofis açılamadı. Bilgileri kontrol edip tekrar deneyin.',6000);return false;}
  const invites=[{email:v.br.trim(),role:'broker',full_name:v.brn.trim()}];
  if(!v.self&&v.mn.trim())invites.push({email:v.mn.trim(),role:'mentor',full_name:v.mnn.trim()});
  const r=await inviteCall({office_id:ins.data.id,invites});
  await loadMerkez();
  toast(inviteMsg(r,'Üyelik açıldı.'),r.results&&r.results.every(x=>x.ok)?4000:9000);
  return true;
}
async function resendReal(o){
  toast('Davet gönderiliyor…');
  const r=await inviteCall({office_id:o.id,resend:true});
  await loadMerkez();rerender();
  toast(inviteMsg(r,''),r.results&&r.results.length&&r.results.every(x=>x.ok)?4000:9000);
}
async function extendReal(o){
  const end=iso(addYear(o.end||T0));
  const{error}=await SB.from('offices').update({membership_end:end}).eq('id',o.id);
  if(error){toast('Üyelik uzatılamadı.');return;}
  await loadMerkez();rerender();
  toast(o.n+' üyeliği '+ddy(fromIso(end))+' tarihine uzatıldı.');
}
