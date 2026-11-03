
/* =================== OFİS VERİSİ: SUPABASE =================== */
// Broker ve mentor girişinde ofisin kayıtları veritabanından gelir. Ekrandaki değişiklikler
// son kaydedilen hâlle karşılaştırılır; fark birkaç saniye içinde veritabanına yazılır.
// Örnek veriler gerçek ofise asla yazılmaz: senkron yalnız başarılı yüklemeden sonra açılır.
function realO(){return !!(SB&&ME&&ME.role!=='merkez'&&ME.officeId);}
function uuid(){
  if(window.crypto&&crypto.randomUUID)return crypto.randomUUID();
  const b=crypto.getRandomValues(new Uint8Array(16));b[6]=b[6]&15|64;b[8]=b[8]&63|128;
  const x=[...b].map(v=>v.toString(16).padStart(2,'0')).join('');
  return x.slice(0,8)+'-'+x.slice(8,12)+'-'+x.slice(12,16)+'-'+x.slice(16,20)+'-'+x.slice(20);
}
const nid=p=>realO()?uuid():p+Date.now().toString(36);
// Sertifika numarası: veritabanıyla aynı biçim (MA-YY-XXXXXX), tahmin edilemez.
function certNo(){
  const a='23456789ABCDEFGHJKLMNPQRSTUVWXYZ',b=crypto.getRandomValues(new Uint8Array(6));
  return 'MA-'+String(T0.getFullYear()).slice(2)+'-'+[...b].map(v=>a[v%32]).join('');
}
const DEF_GR=[['Grup A','Deneyimli danışmanlar','var(--c1)'],['Grup B','Gelişen danışmanlar','var(--c2)'],['Yeni Başlayanlar','İlk yılındaki danışmanlar','var(--c3)']];
const clearObj=o=>Object.keys(o).forEach(k=>delete o[k]);
const dOf=s=>s?fromIso(String(s).slice(0,10)):null;
const monthKey=()=>iso(new Date(T0.getFullYear(),T0.getMonth(),1));

// Örnek verileri boşaltır (gerçek ofis yüklenmeden önce).
function clearSample(){
  GR.splice(0);clearObj(GRM);CO.splice(0);clearObj(COM);RUNS.splice(0);
  [ATT,CCH,ACT,TELAFI,SC,NEED,BIZ,REP,OFFACT].forEach(clearObj);
  CERT.splice(0);Object.keys(PREV).forEach(k=>PREV[k]=new Set());
}

async function loadOffice(){
  const oid=ME.officeId;
  clearSample();
  const q=t=>SB.from(t).select('*').eq('office_id',oid);
  const R=await Promise.all([
    SB.from('offices').select('id,name,city,tier,membership_start,membership_end').eq('id',oid).maybeSingle(),
    SB.from('profiles').select('id,role,full_name,email').eq('office_id',oid),
    q('groups'),q('consultants'),q('runs'),q('run_members'),q('attendance'),q('makeups'),q('coaching'),
    q('run_activities'),q('activity_results'),q('private_scores'),q('needs_assessments'),
    SB.from('business_results').select('*').eq('office_id',oid).eq('period',monthKey()),
    q('reports'),q('certificates'),
    SB.from('mentor_previews').select('training_id,step_index').eq('user_id',ME.id),
    q('activity_templates')
  ]).catch(e=>[{error:e}]);
  if(R.length<18||R.some(r=>r.error)){ME.dataOk=false;return false;}
  const [o,pf,gr,co,ru,rm,at,mk,cc,ra,ar,ps,na,br,rp,ce,pv,tp]=R.map(r=>r.data);
  if(o)Object.assign(OFF,{id:o.id,n:o.name,city:o.city||'',tier:o.tier||'1–25',start:dOf(o.membership_start),end:dOf(o.membership_end)});
  const nm=p=>p?(p.full_name||p.email):'—',bk=pf.find(p=>p.role==='broker'),mt=pf.find(p=>p.role==='mentor');
  PPL.broker.n=nm(bk);PPL.mentor.n=mt?nm(mt):nm(bk);PPL.merkez.n='Akademi merkezi';
  gr.sort((a,b)=>a.sort-b.sort).forEach(g=>{const x={id:g.id,n:g.name,d:g.description||'',c:g.color||'var(--c1)'};GR.push(x);GRM[x.id]=x;});
  co.sort((a,b)=>String(a.created_at).localeCompare(String(b.created_at))).forEach(c=>{const x={id:c.id,n:c.full_name,g:c.group_id,since:dOf(c.joined_on)||new Date(c.created_at),left:dOf(c.left_on)};CO.push(x);COM[x.id]=x;});
  ru.filter(r=>r.status!=='iptal').sort((a,b)=>String(a.days[0]).localeCompare(String(b.days[0]))).forEach(r=>{
    const m=mk.find(x=>x.makeup_run_id===r.id);
    RUNS.push({id:r.id,tr:r.training_id,g:r.group_id,days:r.days.map(dOf),tpl:r.template,st:r.status,dd:r.days_done,
      mem:rm.filter(x=>x.run_id===r.id).map(x=>x.consultant_id),tel:!!r.makeup,telDay:m?m.day_index:null});
  });
  RUNS.forEach(r=>{if(r.st!=='plan'){ATT[r.id]={};CCH[r.id]={};}});
  at.forEach(a=>{const r=RM(a.run_id);if(!r)return;const o2=ATT[r.id]||(ATT[r.id]={});const v=o2[a.consultant_id]||(o2[a.consultant_id]=r.days.map(()=>null));v[a.day_index]=a.present?1:0;});
  mk.forEach(m=>{TELAFI[m.run_id+':'+m.consultant_id+':'+m.day_index]=m.makeup_run_id;});
  cc.forEach(c=>{const o2=CCH[c.run_id]||(CCH[c.run_id]={});o2[c.consultant_id]=c.done?1:0;});
  RUNS.forEach(r=>{
    const its=ra.filter(x=>x.run_id===r.id).sort((a,b)=>a.sort-b.sort);if(!its.length)return;
    const items=its.map(x=>{const due=dOf(x.due_on);return{id:x.id,ty:x.kind,t:x.body,due,n:due?Math.max(0,df(due)-df(lastDay(r))):0};});
    const done={};ar.forEach(x=>{const i=items.findIndex(it=>it.id===x.activity_id);if(i<0)return;const d=done[x.consultant_id]||(done[x.consultant_id]=items.map(()=>0));d[i]=x.done?1:0;});
    ACT[r.id]={items,done};
  });
  ps.forEach(s=>{SC[s.run_id+':'+s.consultant_id]={q:(s.scores||[]).slice(0,4),n:s.note||''};});
  na.forEach(n=>{NEED[n.consultant_id+':'+n.training_id]={pre:n.pre||null,post:n.post||null,d:dOf(n.pre_on)||dOf(n.post_on)||new Date(T0),pd:dOf(n.post_on)};});
  br.forEach(b=>{BIZ[b.consultant_id]=[b.client_meetings,b.price_analyses,b.new_listings,b.closed_deals];});
  rp.sort((a,b)=>String(a.shared_at).localeCompare(String(b.shared_at))).forEach(r=>{REP[r.consultant_id]={id:r.id,sh:r.shared_at?new Date(r.shared_at):null,cm:r.broker_comment?{t:r.broker_comment,d:r.commented_at?new Date(r.commented_at):new Date()}:null};});
  ce.forEach(c=>{CERT.push({no:c.no,c:c.consultant_id,run:c.run_id,tr:c.training_id,ty:c.kind,d:dOf(c.issued_on),hn:c.holder_name});});
  pv.forEach(p=>{(PREV[p.training_id]||(PREV[p.training_id]=new Set())).add(p.step_index);});
  tp.forEach(t=>{if(Array.isArray(t.items))OFFACT[t.training_id]=t.items;});
  ME.dataOk=true;
  SYNC.snap=serialize(dbState());
  // Yeni ofiste üç hazır grup (kayıt farkla yazılır)
  if(!GR.length){DEF_GR.forEach(([n,d,c])=>{const x={id:uuid(),n,d,c};GR.push(x);GRM[x.id]=x;});scheduleSync(50);}
  return true;
}

/* ---------- Bellekten veritabanı satırları ---------- */
const TABLES=[
  ['groups','id'],['consultants','id'],['runs','id'],['run_members','run_id,consultant_id'],
  ['makeups','run_id,consultant_id,day_index'],['attendance','run_id,consultant_id,day_index'],['coaching','run_id,consultant_id'],
  ['run_activities','id'],['activity_results','activity_id,consultant_id'],['private_scores','run_id,consultant_id'],
  ['needs_assessments','consultant_id,training_id'],['business_results','consultant_id,period'],['reports','id'],
  ['certificates','no'],['mentor_previews','user_id,training_id,step_index'],['activity_templates','office_id,training_id']
];
const SYNC={snap:null,base:new Set(),busy:false,again:false,timer:0,fail:0,warned:false};
function dbState(){
  const oid=ME.officeId,S={};TABLES.forEach(([t])=>S[t]=new Map());
  const put=(t,row)=>{const k=TABLES.find(x=>x[0]===t)[1].split(',').map(c=>row[c]).join('|');S[t].set(k,row);};
  GR.forEach((g,i)=>put('groups',{id:g.id,office_id:oid,name:g.n,description:g.d||null,color:g.c||null,sort:i}));
  CO.forEach(c=>put('consultants',{id:c.id,office_id:oid,group_id:c.g||null,full_name:c.n,joined_on:c.since?iso(c.since):null,left_on:c.left?iso(c.left):null}));
  RUNS.forEach(r=>{
    put('runs',{id:r.id,office_id:oid,training_id:r.tr,group_id:r.g||null,template:r.tpl,days:r.days.map(iso),status:r.st,days_done:r.dd||0,makeup:!!r.tel});
    (r.mem||[]).forEach(c=>put('run_members',{run_id:r.id,consultant_id:c,office_id:oid}));
    const a=ATT[r.id]||{};Object.keys(a).forEach(c=>(a[c]||[]).forEach((v,i)=>{if(v===0||v===1)put('attendance',{run_id:r.id,consultant_id:c,day_index:i,office_id:oid,present:v===1});}));
    const ch=CCH[r.id]||{};Object.keys(ch).forEach(c=>put('coaching',{run_id:r.id,consultant_id:c,office_id:oid,done:!!ch[c]}));
    const A=ACT[r.id];
    if(A){A.items.forEach((it,i)=>{if(!it.id)it.id=uuid();put('run_activities',{id:it.id,run_id:r.id,office_id:oid,sort:i,kind:it.ty,body:it.t,due_on:it.due?iso(it.due):null});});
      Object.keys(A.done||{}).forEach(c=>(A.done[c]||[]).forEach((v,i)=>{const it=A.items[i];if(it&&v)put('activity_results',{activity_id:it.id,consultant_id:c,office_id:oid,done:true});}));}
  });
  Object.keys(TELAFI).forEach(k=>{const[run,c,day]=k.split(':');put('makeups',{run_id:run,consultant_id:c,day_index:+day,makeup_run_id:TELAFI[k],office_id:oid});});
  Object.keys(SC).forEach(k=>{const[run,c]=k.split(':'),s=SC[k];if(!s||(!s.q.some(Boolean)&&!s.n))return;put('private_scores',{run_id:run,consultant_id:c,office_id:oid,scores:s.q.slice(0,4).map(v=>v||0),note:s.n||''});});
  Object.keys(NEED).forEach(k=>{const[c,tr]=k.split(':'),n=NEED[k];if(!n||(!n.pre&&!n.post))return;put('needs_assessments',{consultant_id:c,training_id:tr,office_id:oid,pre:n.pre||null,pre_on:n.pre&&n.d?iso(n.d):null,post:n.post||null,post_on:n.post&&n.pd?iso(n.pd):null});});
  const per=monthKey();
  Object.keys(BIZ).forEach(c=>{const v=BIZ[c];if(!v||(!v.some(Boolean)&&!SYNC.base.has('business_results|'+c+'|'+per)))return;put('business_results',{consultant_id:c,period:per,office_id:oid,client_meetings:v[0],price_analyses:v[1],new_listings:v[2],closed_deals:v[3]});});
  Object.keys(REP).forEach(c=>{const r=REP[c];if(!r||(!r.sh&&!r.cm))return;if(!r.id)r.id=uuid();put('reports',{id:r.id,consultant_id:c,office_id:oid,shared_at:new Date(r.sh||r.cm.d).toISOString(),broker_comment:r.cm?r.cm.t:null,commented_at:r.cm&&r.cm.d?new Date(r.cm.d).toISOString():null});});
  CERT.forEach(x=>{if(!x.no)return;if(!x.hn)x.hn=COM[x.c]?COM[x.c].n:'—';put('certificates',{no:x.no,office_id:oid,consultant_id:x.c||null,holder_name:x.hn,training_id:x.ty==='mc'?null:x.tr,run_id:x.run||null,kind:x.ty,issued_on:iso(x.d||T0)});});
  Object.keys(PREV).forEach(tr=>PREV[tr].forEach(i=>put('mentor_previews',{user_id:ME.id,training_id:tr,step_index:i})));
  Object.keys(OFFACT).forEach(tr=>put('activity_templates',{office_id:oid,training_id:tr,items:OFFACT[tr]}));
  return S;
}
function serialize(S){
  const o={};SYNC.base=new Set();
  Object.keys(S).forEach(t=>{o[t]=new Map();S[t].forEach((row,k)=>{o[t].set(k,JSON.stringify(row));SYNC.base.add(t+'|'+k);});});
  return o;
}

/* ---------- Farkı yaz ---------- */
function scheduleSync(ms){
  if(!realO()||!SYNC.snap)return;
  clearTimeout(SYNC.timer);SYNC.timer=setTimeout(syncNow,ms==null?700:ms);
}
async function syncNow(){
  if(!realO()||!SYNC.snap)return true;
  if(SYNC.busy){SYNC.again=true;return false;}
  SYNC.busy=true;let ok=true;
  try{
    const cur=dbState();
    for(const[t,pk]of TABLES){
      const old=SYNC.snap[t],rows=[],js=[];
      cur[t].forEach((row,k)=>{const j=JSON.stringify(row);if(old.get(k)!==j){if(t==='certificates'&&old.has(k))return;rows.push(row);js.push([k,j]);}});
      if(!rows.length)continue;
      const res=t==='certificates'?await SB.from(t).insert(rows):await SB.from(t).upsert(rows,{onConflict:pk});
      if(res.error){ok=false;console.warn('kayıt',t,res.error.message);continue;}
      js.forEach(([k,j])=>{old.set(k,j);SYNC.base.add(t+'|'+k);});
    }
    for(const[t,pk]of TABLES.slice().reverse()){
      if(t==='certificates')continue;
      const old=SYNC.snap[t],gone=[...old.keys()].filter(k=>!cur[t].has(k));
      for(const k of gone){
        const cols=pk.split(','),vals=k.split('|'),m={};cols.forEach((c,i)=>m[c]=vals[i]);
        const res=await SB.from(t).delete().match(m);
        if(res.error){ok=false;console.warn('silme',t,res.error.message);continue;}
        old.delete(k);SYNC.base.delete(t+'|'+k);
      }
    }
  }catch(e){ok=false;console.warn('kayıt',e);}
  SYNC.busy=false;
  if(ok){SYNC.fail=0;if(SYNC.warned){SYNC.warned=false;toast('Değişiklikler kaydedildi.');}}
  else{SYNC.fail++;if(!SYNC.warned){SYNC.warned=true;toast('Bazı değişiklikler kaydedilemedi; bağlantı gelince yeniden denenecek.',6000);}scheduleSync(Math.min(30000,2000*SYNC.fail));}
  if(SYNC.again){SYNC.again=false;scheduleSync(100);}
  return ok;
}
setInterval(()=>{if(realO()&&SYNC.snap&&!SYNC.busy)scheduleSync(0);},4000);
window.addEventListener('pagehide',()=>{if(realO()&&SYNC.snap)syncNow();});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&realO()&&SYNC.snap)syncNow();});
// Yalnız otomatik denemeler için: sayfa yüklenmeden önce window.__AK_TEST konursa iç durum görünür.
if(window.__AK_TEST)window.__AKD={GR,CO,RUNS,ATT,CCH,ACT,TELAFI,SC,NEED,BIZ,REP,CERT,PREV,OFFACT,OFF,PPL,SYNC,syncNow,scheduleSync,mkAct,RM,get ME(){return ME;}};
