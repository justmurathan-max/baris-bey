
/* =================== HESAPLAR =================== */
const runsOf=c=>RUNS.filter(r=>r.mem.includes(c));
const attAll=(r,c)=>{const a=(ATT[r.id]||{})[c];return !!a&&r.days.every((_,i)=>a[i]===1);};
const coachOk=(r,c)=>!!(CCH[r.id]||{})[c];
const actDone=(r,c)=>{const A=ACT[r.id];if(!A)return null;const d=A.done[c]||[];return A.items.map((_,i)=>!!d[i]);};
const actAll=(r,c)=>{const d=actDone(r,c);return !!d&&d.length>0&&d.every(Boolean);};
const lateItems=(r,c)=>{const A=ACT[r.id];if(!A)return[];const d=A.done[c]||[];return A.items.map((it,i)=>({it,i})).filter(x=>!d[x.i]&&df(x.it.due)<0);};
const katOk=(r,c)=>r.st==='done'&&attAll(r,c)&&coachOk(r,c);
const basOk=(r,c)=>katOk(r,c)&&actAll(r,c);
const hasCert=(c,run,ty)=>CERT.some(x=>x.c===c&&x.run===run&&x.ty===ty);
const certsOf=c=>CERT.filter(x=>x.c===c);
const basTrainings=c=>new Set(RUNS.filter(r=>r.mem.includes(c)&&basOk(r,c)).map(r=>r.tr));
const mcProgress=c=>{const s=basTrainings(c);return[...MCSET].filter(id=>s.has(id)).length;};
const applied=c=>basTrainings(c).size>0;
const privAvg=c=>{const v=[];Object.keys(SC).forEach(k=>{if(k.split(':')[1]===c)SC[k].q.forEach(x=>{if(x)v.push(x);});});return v.length?avg(v):null;};
const realRuns=()=>RUNS.filter(r=>!r.tel);
const names=ids=>{const n=ids.map(c=>first(COM[c].n));return n.length<=3?n.join(', '):n.slice(0,2).join(', ')+' ve '+(n.length-2)+' kişi';};
function runStage(r){
  if(r.st==='plan')return{on:0,cur:-1};
  if(r.st==='live')return{on:1,cur:1};
  const mem=r.mem.filter(c=>!COM[c].left);
  if(!mem.every(c=>coachOk(r,c)))return{on:2,cur:2};
  if(!mem.every(c=>actAll(r,c)))return{on:3,cur:3};
  return{on:4,cur:-1};
}
function nextSession(){
  let b=null;
  RUNS.forEach(r=>{if(r.st==='done')return;r.days.forEach((d,i)=>{if(i<r.dd||df(d)<0)return;if(!b||d<b.d)b={r,i,d};});});
  return b;
}
function dayDesc(t,tpl,i,r){
  const F=flow(t);
  if(r&&r.tel)return 'Telafi: kaçırılan bölümler';
  if(tpl==='tek')return 'Bütün eğitim; koçluk aynı gün';
  if(tpl==='yarim')return 'Tekrar ya da telafi';
  const sp=daySplit(t,tpl)[i]||[];const ana=sp.filter(j=>F[j].k==='ana');
  const rg=ana.length?F[ana[0]].c+'–'+F[ana[ana.length-1]].c:'';
  return i===0?'Tanıtım, '+rg:rg+', koçluk ve aktiviteler';
}
function readyCerts(){
  const L=[];
  RUNS.filter(r=>r.st==='done').forEach(r=>r.mem.forEach(c=>{if(COM[c].left)return;
    if(katOk(r,c)&&!hasCert(c,r.id,'kat'))L.push({c,run:r.id,tr:r.tr,ty:'kat'});
    if(basOk(r,c)&&!hasCert(c,r.id,'bas'))L.push({c,run:r.id,tr:r.tr,ty:'bas'});}));
  active().forEach(c=>{if(MCSET.size&&mcProgress(c.id)>=MCSET.size&&!CERT.some(x=>x.c===c.id&&x.ty==='mc'))L.push({c:c.id,ty:'mc'});});
  return L;
}
function lateList(){const L=[];RUNS.forEach(r=>r.mem.forEach(c=>{if(COM[c].left)return;const x=lateItems(r,c);if(x.length)L.push({r,c,x});}));return L;}
function pendings(){
  const P=[];
  RUNS.filter(r=>r.st==='done'&&!r.tel).forEach(r=>{
    const who=r.mem.filter(c=>!COM[c].left&&attAll(r,c)&&!coachOk(r,c));
    if(who.length)P.push({ic:'check',cls:'wait',t:'Koçluk çalışması işaretlenmedi: '+names(who),s:TRM[r.tr].t+', '+GRM[r.g].n+'. Koçluk eğitimin bittiği gün yapılır.',a:[['Tamamlandı',()=>{who.forEach(c=>CCH[r.id][c]=1);toast('Koçluk işaretlendi. Katılım sertifikası hakkı doğdu.');rerender();}],['Görev takibi',()=>go('gorevler')]]});
  });
  const late=lateList();
  if(late.length){const by={};late.forEach(x=>{by[x.c]=(by[x.c]||0)+x.x.length;});const ids=Object.keys(by);
    P.push({ic:'alert',cls:'crit',t:ids.length+' danışmanın geciken aktivitesi var',s:ids.map(c=>first(COM[c].n)+' ('+by[c]+')').join(', '),a:[['Görev takibi',()=>{gtF='gec';go('gorevler');}]]});}
  RUNS.filter(r=>r.st!=='plan'&&!r.tel).forEach(r=>r.mem.forEach(c=>{const a=(ATT[r.id]||{})[c];if(!a||COM[c].left)return;a.forEach((v,i)=>{if(v===0&&!TELAFI[r.id+':'+c+':'+i])P.push({ic:'flag',cls:'wait',t:'Telafi gerekiyor: '+COM[c].n,s:TRM[r.tr].t+', '+(i+1)+'. gün kaçırıldı. Katılım sertifikası için telafi gerekir.',a:[['Telafi planla',()=>openPlan({tr:r.tr,tpl:'yarim',tel:{run:r.id,c,day:i}})]]});});}));
  const rc=readyCerts();
  if(rc.length){const by={};rc.forEach(x=>{const k=x.tr?TRM[x.tr].t:'Masterclass Akademi';by[k]=by[k]||{kat:0,bas:0,mc:0};by[k][x.ty]++;});
    P.push({ic:'award',cls:'gilt',t:rc.length+' sertifika basıma hazır',s:Object.entries(by).map(([k,v])=>k+': '+[v.kat?v.kat+' katılım':'',v.bas?v.bas+' başarı':'',v.mc?v.mc+' akademi':''].filter(Boolean).join(', ')).join('; '),a:[['Sertifikalar',()=>{srF='hazir';go('sertifikalar');}]]});}
  RUNS.filter(r=>r.st==='plan'&&!r.tel&&df(r.days[0])<=21).forEach(r=>{const miss=r.mem.filter(c=>!NEED[c+':'+r.tr]);
    if(miss.length)P.push({ic:'gauge',cls:'',t:'İhtiyaç değerlendirmesi eksik: '+names(miss),s:TRM[r.tr].t+' oturumu '+relL(r.days[0])+'. Eğitim öncesi değerlendirin.',a:[['Değerlendir',()=>openAssess({c:miss[0],tr:r.tr})]]});});
  return P;
}
const awaitingComment=()=>Object.keys(REP).filter(c=>REP[c].sh&&!REP[c].cm);
const renewSoon=()=>OFFS.filter(o=>o.end&&df(o.end)<=60);
function notifs(){
  if(S.role==='mentor'){
    const L=pendings().slice(0,6).map(p=>({ic:p.ic,cls:p.cls,t:p.t,s:p.s,on:p.a[0][1]}));
    Object.keys(REP).forEach(c=>{const r=REP[c];if(r.cm&&df(r.cm.d)>-45)L.push({ic:'msg',cls:'',t:PPL.broker.n+' rapora yorum yazdı: '+COM[c].n,s:ago(r.cm.d),on:()=>openReport(c)});});
    return L;
  }
  if(S.role==='broker'){
    const L=awaitingComment().map(c=>({ic:'doc',cls:'',t:'Rapor yorumunuzu bekliyor: '+COM[c].n,s:PPL.mentor.n+' paylaştı, '+ago(REP[c].sh),on:()=>openReport(c)}));
    const nx=nextSession();if(nx)L.push({ic:'cal',cls:'',t:relL(nx.d)+': '+TRM[nx.r.tr].t,s:GRM[nx.r.g].n+', 09:30',on:()=>go('takvim')});
    const dl=df(OFF.end);if(dl<=90)L.push({ic:'card',cls:'wait',t:'Üyeliğin bitmesine '+dl+' gün var',s:'Yenileme için akademi merkezi sizinle görüşecek.',on:()=>go('uyelik')});
    return L;
  }
  const L=renewSoon().map(o=>({ic:'card',cls:df(o.end)<=30?'crit':'wait',t:o.n+': '+df(o.end)+' gün kaldı',s:'Bitiş '+ddy(o.end),on:()=>go('uyelikler')}));
  OFFS.filter(o=>o.st==='davet').forEach(o=>L.push({ic:'mail',cls:'',t:'Davet bekleniyor: '+o.n,s:'Gönderildi '+ago(o.inv),on:()=>openOffice(o.id)}));
  const miss=TR.filter(t=>MAT[t.id].pdf.some(x=>!x)).length;
  const VS=TR.map(vidStat),vm=VS.reduce((x,v)=>x+v.miss.length,0),vp=VS.reduce((x,v)=>x+v.priv,0);
  if(vm||vp)L.push({ic:'video',cls:'',t:vm?vm+' bölümün videosu Vimeo’da yok':vp+' video gizlilik ayarı bekliyor',s:vm&&vp?vp+' video da Vimeo’da özel; ayar değişince oynar':(vm?'Eğitimler ve belgelerde listelendi':'Vimeo’da özel; ayar değişince sitede oynar'),on:()=>go('egitimler')});
  if(miss)L.push({ic:'doc',cls:'',t:miss+' eğitimde eksik belge var',s:'Koçluk ve aktivite PDF’leri bekleniyor',on:()=>go('egitimler')});
  return L;
}
function badge(k){
  if(S.role==='mentor'){
    if(k==='gorevler'){const n=new Set(lateList().map(x=>x.c));RUNS.filter(r=>r.st==='done').forEach(r=>r.mem.forEach(c=>{if(!COM[c].left&&attAll(r,c)&&!coachOk(r,c))n.add(c);}));return n.size;}
    if(k==='sertifikalar')return readyCerts().length;
  }
  if(S.role==='broker'&&k==='raporlar')return awaitingComment().length;
  if(S.role==='merkez'&&k==='uyelikler')return renewSoon().length;
  return 0;
}

/* =================== YÖNLENDİRME =================== */
const NAV={
  mentor:[['panel','Panel','home'],['egitimler','Eğitimler','book'],['takvim','Takvim','cal'],['danismanlar','Danışmanlar','users'],['ihtiyac','İhtiyaç analizi','gauge'],['gorevler','Görev takibi','check'],['sertifikalar','Sertifikalar','award'],['raporlar','Gelişim raporları','doc'],['ai','Barış AI','spark']],
  broker:[['ozet','Ofis özeti','home'],['takvim','Takvim','cal'],['danismanlar','Danışmanlar','users'],['ihtiyac','İhtiyaç analizi','gauge'],['raporlar','Gelişim raporları','doc'],['sertifikalar','Sertifikalar','award'],['uyelik','Üyelik','card']],
  merkez:[['genel','Genel bakış','home'],['ofisler','Ofisler','building'],['uyelikler','Üyelikler','card'],['egitimler','Eğitimler ve belgeler','book'],['sertifikalar','Sertifikalar','award'],['klasik','Klasik erişimler','key'],['guvenlik','Güvenlik','shield']]
};
const S={role:null,page:null,arg:null,asBroker:false};
const VIEWS={mentor:{},broker:{},merkez:{}};
const meUser=()=>S.role==='mentor'?(S.asBroker?PPL.broker:PPL.mentor):PPL[S.role]||PPL.mentor;
const roleLabel=()=>S.role==='mentor'?(S.asBroker?'Broker, mentor görevinde':'Mentor'):PPL[S.role].r;
const canComment=()=>S.role==='broker'||S.asBroker;
let CUR=window.__START!=null?String(window.__START):location.hash.replace(/^#\/?/,'');
function nav(x){
  x=String(x||'').replace(/^#\/?/,'');
  const same=x===CUR&&!!S.role&&!!x;CUR=x;
  try{if(location.hash.replace(/^#\/?/,'')!==x)history.pushState(null,'',x?'#'+x:location.pathname+location.search);}catch(e){}
  if(same){render(true);return;}
  route();
}
function go(page,arg){nav(S.role+'/'+page+(arg?'/'+encodeURIComponent(arg):''));}
function route(){
  const p=CUR.split('/');
  closeAllLayers();
  if(!NAV[p[0]]){showLogin();return;}
  if(p[0]!=='mentor')S.asBroker=false;
  S.role=p[0];S.page=VIEWS[p[0]][p[1]]?p[1]:NAV[p[0]][0][0];S.arg=p[2]?decodeURIComponent(p[2]):null;
  $('#login').hidden=true;$('#app').hidden=false;document.body.classList.remove('nav-on');
  document.title=(navLabel()||'Akademi')+' | Masterclass Akademi';
  render(true);
}
function navLabel(){const n=NAV[S.role].find(x=>x[0]===S.page);return n?n[1]:S.page==='egitim'&&TRM[S.arg]?TRM[S.arg].t:'';}
function render(top){
  const y=window.scrollY;
  let v;try{v=VIEWS[S.role][S.page](S.arg);}catch(e){console.error(e);v=h('div',{class:'empty'},h('b',null,'Bu sayfa açılamadı'),String(e.message||e));}
  $('#pg').replaceChildren(v);shell();
  if(top){window.scrollTo(0,0);$('#pg').focus({preventScroll:true});}else window.scrollTo(0,y);
}
const rerender=()=>render(false);
function shell(){
  const r=S.role,me=meUser();
  $('#sbHome').href='#'+r+'/'+NAV[r][0][0];
  const org=$('#org');org.replaceChildren();
  if(r==='merkez')org.append(h('b',null,'Akademi merkezi'),h('span',null,OFFS.filter(o=>o.st==='aktif').length+' aktif ofis'));
  else{
    org.append(h('b',null,OFF.n),h('span',null,r==='broker'?'Broker paneli':(S.asBroker?'Broker, mentor görevinde':'Mentor paneli')));
    if(r==='broker')org.append(btn('btn-ow btn-xs',[ic('swap'),'Mentor görevini üstlen'],()=>{S.asBroker=true;nav('mentor/panel');}));
    if(r==='mentor'&&S.asBroker)org.append(btn('btn-ow btn-xs',[ic('swap'),'Broker paneline dön'],()=>{S.asBroker=false;nav('broker/ozet');}));
  }
  $('#nav').replaceChildren(...NAV[r].map(([k,l,i])=>{const cur=S.page===k||(k==='egitimler'&&S.page==='egitim');const a=h('a',{href:'#'+r+'/'+k,'aria-current':cur?'page':null},ic(i),l);const n=badge(k);if(n)a.append(h('span',{class:'n','aria-label':n+' bekleyen'},String(n)));return a;}));
  $('#meBtn').replaceChildren(h('span',{class:'av k'},ini(me.n)),h('span',{class:'t'},h('b',null,me.n),h('span',null,roleLabel())),ic('down'));
  $('#crumb').replaceChildren(h('span',{class:'nw'},r==='merkez'?'Akademi merkezi':OFF.n));
  const tr=$('#tbR');tr.replaceChildren();
  if(r==='mentor')tr.append(btn('btn-o btn-s',[ic('spark'),'Barış AI'],()=>go('ai')));
  if(r==='merkez'&&S.page!=='ofisler')tr.append(btn('btn-k btn-s',[ic('plus'),'Yeni ofis aç'],()=>openNewOffice()));
  const nn=notifs().length;
  const bell=h('button',{class:'icb',type:'button','aria-label':'Bildirimler'+(nn?', '+nn+' yeni':''),'aria-haspopup':'menu',onclick:e=>openBell(e.currentTarget)},ic('bell'),nn?h('span',{class:'dot'},String(nn)):null);
  tr.append(bell);
}
function openBell(a){
  const L=notifs();
  popup(a,[h('div',{class:'pop-h'},'Bildirimler')].concat(L.length?L.map(n=>h('button',{type:'button',role:'menuitem',onclick:()=>{closePop();n.on();}},h('span',{class:'li-i '+(n.cls||'')},ic(n.ic)),h('span',{class:'t'},n.t,h('span',null,n.s)))):[h('div',{class:'pop-h',style:'padding:6px 10px 12px;font-weight:500'},'Yeni bildirim yok.')]),{right:true});
}
function openMe(a){
  const roles=[['mentor','Mentor',PPL.mentor.n],['broker','Broker',PPL.broker.n],['merkez','Merkez yöneticisi',PPL.merkez.n]];
  popup(a,[h('div',{class:'pop-h'},'Önizleme rolü')].concat(roles.map(([k,l,n])=>h('button',{type:'button',role:'menuitem','aria-current':String(S.role===k&&!(k==='mentor'&&S.asBroker)),onclick:()=>{closePop();S.asBroker=false;nav(k+'/'+NAV[k][0][0]);}},h('span',{class:'av s k'},ini(n)),h('span',{class:'t'},l,h('span',null,n)),S.role===k&&!(k==='mentor'&&S.asBroker)?ic('tick'):null)),[h('hr'),h('a',{href:'index.html',role:'menuitem'},ic('ext'),'Siteye dön'),h('button',{type:'button',role:'menuitem',onclick:()=>{closePop();nav('');}},ic('out'),'Çıkış yap')]),{dk:true,up:true});
}

/* =================== GİRİŞ =================== */
function showLogin(){
  $('#app').hidden=true;$('#login').hidden=false;document.title='Giriş | Masterclass Akademi';
  const ps=$('#lgPs');if(!ps.children.length)['pa','iu','dfi','cl','au'].forEach(id=>ps.append(poster(TRM[id])));
  const dm=$('#lgDemo');if(dm.children.length<2){
    [['mentor','Mentor',PPL.mentor.n+', '+OFF.n,'users'],['broker','Broker',PPL.broker.n+', aynı ofis','building'],['merkez','Merkez yöneticisi',PPL.merkez.n+', bütün ofisler','shield']].forEach(([k,l,s,i])=>dm.append(h('button',{class:'rb',type:'button',onclick:()=>{S.asBroker=false;nav(k+'/'+NAV[k][0][0]);}},h('span',{class:'ri'},ic(i)),h('span',{class:'t'},h('b',null,l+' olarak gir'),h('span',null,s)),ic('chev'))));
  }
}
$('#lgForm').addEventListener('submit',e=>{e.preventDefault();const m=$('#lgMail').value.toLocaleLowerCase('tr');const r=/broker/.test(m)?'broker':/merkez|akademi/.test(m)?'merkez':'mentor';S.asBroker=false;nav(r+'/'+NAV[r][0][0]);});

/* =================== KATMANLAR =================== */
let lastFocus=null,drOpen=false,mdOpen=false,sesOpen=false,popEl=null;
const lockBody=()=>document.body.classList.toggle('lock',drOpen||mdOpen||sesOpen);
function drawer({t,s,head,body,foot,w}){
  const dr=$('#dr');if(!drOpen)lastFocus=document.activeElement;
  dr.style.setProperty('--dw',(w||560)+'px');
  fill(dr,
    h('div',{class:'dr-h'},h('div',{class:'t'},head||null,h('h2',{id:'drT'},t),s?h('p',null,s):null),h('button',{class:'icb',type:'button','aria-label':'Kapat',onclick:closeDrawer},ic('x'))),
    h('div',{class:'dr-b'},body),
    foot&&foot.length?h('div',{class:'dr-f'},foot):null);
  const ov=$('#ov');ov.hidden=false;dr.hidden=false;drOpen=true;lockBody();
  requestAnimationFrame(()=>{ov.classList.add('on');dr.classList.add('on');});
  setTimeout(()=>{const f=dr.querySelector('[autofocus]')||dr.querySelector('.dr-h .icb');if(f)f.focus();},80);
}
function closeDrawer(){
  if(!drOpen)return;drOpen=false;const dr=$('#dr'),ov=$('#ov');
  dr.classList.remove('on');ov.classList.remove('on');
  setTimeout(()=>{if(!drOpen){dr.hidden=true;ov.hidden=true;dr.replaceChildren();}},340);
  lockBody();if(lastFocus&&document.contains(lastFocus))lastFocus.focus();
}
let mdFocus=null;
function modal({t,s,body,foot,w,cls}){
  const md=$('#md');if(!mdOpen)mdFocus=document.activeElement;
  md.replaceChildren(h('div',{class:'md-c'+(cls?' '+cls:''),style:'--mw:'+(w||980)+'px'},
    h('div',{class:'md-h'},h('div',{class:'t'},h('b',{id:'mdT'},t),s?h('span',null,s):null),h('button',{class:'icb',type:'button','aria-label':'Kapat',onclick:closeModal},ic('x'))),
    h('div',{class:'md-b'},body),
    foot&&foot.length?h('div',{class:'md-f'},foot):null));
  md.setAttribute('aria-labelledby','mdT');md.hidden=false;mdOpen=true;lockBody();
  requestAnimationFrame(()=>md.classList.add('on'));
  setTimeout(()=>{const f=md.querySelector('[autofocus]')||md.querySelector('.md-h .icb');if(f)f.focus();},80);
}
function closeModal(){
  if(!mdOpen)return;mdOpen=false;const md=$('#md');md.classList.remove('on');
  setTimeout(()=>{if(!mdOpen){md.hidden=true;md.replaceChildren();}},300);
  lockBody();if(mdFocus&&document.contains(mdFocus))mdFocus.focus();
}
$('#md').addEventListener('click',e=>{if(e.target===e.currentTarget)closeModal();});
$('#ov').addEventListener('click',closeDrawer);
function confirmBox(t,txt,ok,on,danger){
  modal({t,body:h('p',{style:'margin:0;font-size:15px;line-height:1.55'},txt),foot:[btn('btn-o btn-s','Vazgeç',closeModal),btn((danger?'btn-r':'btn-k')+' btn-s',ok,()=>{closeModal();on();})],w:480});
}
function popup(a,items,o={}){
  closePop();const p=h('div',{class:'pop'+(o.dk?' dk':''),role:'menu'},items);document.body.append(p);popEl=p;
  const r=a.getBoundingClientRect(),pw=p.offsetWidth,ph2=p.offsetHeight;
  let x=o.right?r.right-pw:r.left;x=Math.max(12,Math.min(x,innerWidth-pw-12));
  let y=o.up?r.top-ph2-8:r.bottom+8;if(y+ph2>innerHeight-12)y=Math.max(12,r.top-ph2-8);if(y<12)y=12;
  p.style.left=x+'px';p.style.top=y+'px';
  const f=p.querySelector('button,a');if(f)f.focus();
  setTimeout(()=>document.addEventListener('pointerdown',popOut,true),0);
}
function popOut(e){if(popEl&&!popEl.contains(e.target))closePop();}
function closePop(){if(popEl){popEl.remove();popEl=null;}document.removeEventListener('pointerdown',popOut,true);}
function closeAllLayers(){closePop();if(mdOpen){mdOpen=false;$('#md').classList.remove('on');$('#md').hidden=true;$('#md').replaceChildren();}if(drOpen){drOpen=false;$('#dr').classList.remove('on');$('#ov').classList.remove('on');$('#dr').hidden=true;$('#ov').hidden=true;}if(sesOpen)endSesQuiet();lockBody();}
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape')return;
  if(popEl){closePop();return;}
  if(mdOpen){closeModal();return;}
  if(drOpen){closeDrawer();return;}
  if(document.body.classList.contains('nav-on'))document.body.classList.remove('nav-on');
});
let tT=null;
function toast(msg){const t=$('#toast');t.replaceChildren(ic('tick'),h('span',null,msg));t.classList.add('on');clearTimeout(tT);tT=setTimeout(()=>t.classList.remove('on'),3400);}
const tip=$('#tip');
document.addEventListener('pointerover',e=>{const t=e.target.closest&&e.target.closest('[data-tip]');if(!t){tip.classList.remove('on');return;}tip.textContent=t.dataset.tip;tip.classList.add('on');posTip(e);});
document.addEventListener('pointermove',e=>{if(tip.classList.contains('on'))posTip(e);});
function posTip(e){const w=tip.offsetWidth,hh=tip.offsetHeight;let x=e.clientX+14,y=e.clientY-hh-12;if(x+w>innerWidth-8)x=e.clientX-w-14;if(y<8)y=e.clientY+18;tip.style.transform=`translate(${x}px,${y}px)`;}
function printNode(n){const pr=$('#pr');pr.replaceChildren(n);window.print();setTimeout(()=>pr.replaceChildren(),800);}
function copy(txt,msg){const done=()=>toast(msg||'Kopyalandı.');if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(done,()=>toast(txt));else toast(txt);}

/* =================== BİLEŞENLER =================== */
function poster(t,o={}){
  const p=h('span',{class:'pc'+(t.cut?' cut':'')+(o.sm?' sm':''),style:'--tn:'+t.tn+(t.pos?';--pos:'+t.pos:'')});
  p.append(h('img',{src:t.img,alt:'',loading:'lazy',decoding:'async'}));
  if(!o.sm)p.append(h('span',{class:'pc-top'},h('span',{class:'dm'},h('i'),t.no?'Eğitim '+pad2(t.no):'Klasik'),h('span',{class:'dm'},t.ch?t.ch.length+' bölüm':'Bonus')));
  const lt=h('span',{class:'lt'},h('span',{class:'k'},'BARIŞ KILIÇARSLAN'));
  t.lt.forEach(x=>{const s=h('span',{class:x[0]},x[1]);s.style.fontSize=x[2]+'cqi';if(x[0]==='w')s.style.marginTop='1.15em';lt.append(s);});
  p.append(h('span',{class:'pc-in'},lt));
  return p;
}
const gdot=g=>h('i',{class:'gd',style:'--gc:'+GRM[g].c,'aria-hidden':'true'});
const glab=g=>h('span',{class:'gl'},gdot(g),GRM[g].n);
const av=(c,cls)=>h('span',{class:'av'+(cls?' '+cls:''),style:c.g&&GRM[c.g]?'--gc:'+GRM[c.g].c:null,'aria-hidden':'true'},ini(c.n));
const chip=(cls,i,txt)=>h('span',{class:'chip'+(cls?' '+cls:'')},i?ic(i):null,txt);
const bar=(p,label)=>h('div',{class:'bar',role:'progressbar','aria-valuenow':String(Math.round(p)),'aria-valuemin':'0','aria-valuemax':'100','aria-label':label||null},h('i',{style:'width:'+Math.max(0,Math.min(100,p))+'%'}));
function seg(opts,val,on,label){return h('div',{class:'seg',role:'group','aria-label':label},opts.map(([k,l,c])=>h('button',{type:'button','aria-pressed':String(k===val),onclick:()=>on(k)},l,c!=null?h('span',{class:'c'},String(c)):null)));}
function rate(val,on,dis,label){
  const w=h('div',{class:'rate',role:'group','aria-label':label});
  for(let i=1;i<=5;i++)w.append(h('button',{type:'button','aria-pressed':String(val===i),'aria-label':label+': '+i,disabled:dis||null,onclick:()=>{[...w.children].forEach((b,j)=>b.setAttribute('aria-pressed',String(j+1===i)));on(i);}},String(i)));
  return w;
}
function tick(on,cb,label,o={}){
  const b=h('button',{class:'tk'+(o.cls?' '+o.cls:''),type:'button','aria-pressed':String(!!on),'aria-label':label,disabled:o.dis||null,'data-tip':o.tip||null,onclick:()=>{const v=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(v));cb(v,b);}},ic('tick'));
  return b;
}
function sel(id,opts,val,on){return h('select',{id:id||null,onchange:e=>on(e.target.value)},opts.map(([v,l])=>h('option',{value:v,selected:String(v)===String(val)||null},l)));}
const stg=(on,cur)=>h('div',{class:'stg','aria-hidden':'true'},[0,1,2,3].map(i=>h('i',{class:i<on?'on':(i===cur?'cur':null)})));
const STS=['Tanıtım','Eğitim','Koçluk','Uygulama'];
const stgL=(on,cur)=>h('div',{class:'stg-l'},STS.map((s,i)=>h('span',{class:i<on||i===cur?'on':null},s)));
function stage(on,cur){const w=h('div',null,stg(on,cur),stgL(on,cur));w.setAttribute('aria-label','Aşama: '+(on>=4?'tamamlandı':STS[cur>=0?cur:on]||STS[0]));return w;}
function pn(title,extra,body,o={}){
  return h('section',{class:'pn'+(o.cls?' '+o.cls:'')},title?h('div',{class:'pn-h'},h('h2',null,title,extra&&extra.nodeType&&extra.classList&&extra.classList.contains('c')?extra:null),extra&&!(extra.classList&&extra.classList.contains('c'))?extra:null,o.sub?h('p',null,o.sub):null):null,body);
}
function ph(t,p,acts){return h('div',{class:'ph'},h('div',null,h('h1',null,t),p?h('p',null,p):null),acts&&acts.length?h('div',{class:'ph-a'},acts):null);}
const backBtn=(l,on)=>h('button',{class:'back',type:'button',onclick:on},ic('left'),l);
const dateBadge=d=>h('span',{class:'db','aria-hidden':'true'},h('b',null,String(d.getDate())),h('span',null,AY[d.getMonth()].slice(0,3)));
const empty=(t,txt,act)=>h('div',{class:'empty'},h('b',null,t),txt?h('span',null,txt):null,act||null);
const tenure=d=>{const n=-df(d);return n>=365?Math.floor(n/365)+' yıldır ofiste':n>=60?Math.floor(n/30)+' aydır ofiste':(n<=0?'Bugün eklendi':n+' gündür ofiste');};
const ago=d=>{const n=-df(d);if(n<=0)return 'bugün';if(n===1)return 'dün';if(n<30)return n+' gün önce';return Math.round(n/30)+' ay önce';};
const dueLabel=n=>n===0?'oturum günü':n+' gün içinde';

/* ---------- Sertifika ---------- */
function qr(seed){
  const n=25,r=rng(hash(seed));let d='';
  const fz=(x,y)=>(x<8&&y<8)||(x>=n-8&&y<8)||(x<8&&y>=n-8);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){let on;
    if(fz(x,y)){const lx=x<8?x:x-(n-7),ly=y<8?y:y-(n-7);on=lx>=0&&lx<=6&&ly>=0&&ly<=6&&(lx===0||lx===6||ly===0||ly===6||(lx>=2&&lx<=4&&ly>=2&&ly<=4));}
    else if(x===6||y===6)on=(x+y)%2===0;else on=r()<.48;
    if(on)d+='M'+x+' '+y+'h1v1h-1z';}
  const s=document.createElementNS(NS,'svg');s.setAttribute('viewBox','-1 -1 27 27');s.setAttribute('aria-hidden','true');s.setAttribute('shape-rendering','crispEdges');
  const bg=document.createElementNS(NS,'rect');bg.setAttribute('x','-1');bg.setAttribute('y','-1');bg.setAttribute('width','27');bg.setAttribute('height','27');bg.setAttribute('fill','#fff');
  const p=document.createElementNS(NS,'path');p.setAttribute('d',d);p.setAttribute('fill','#111');s.append(bg,p);return s;
}
const VURL='bariskilicarslan.com/dogrula';
function certNode(x){
  const c=COM[x.c]||{n:x.name||'Ad Soyad'},ty=x.ty,t=x.tr?TRM[x.tr]:null;
  const body={kat:'adlı danışmanın aşağıdaki eğitimin oturumlarına katıldığını ve koçluk çalışmasını tamamladığını onaylar.',bas:'adlı danışmanın aşağıdaki eğitimin uygulamalarını yaptığını ve mentor onayıyla başarıyla tamamladığını onaylar.',mc:'adlı danışmanın Masterclass Akademi’nin ana eğitimlerini ve uygulamalarını tamamladığını onaylar.'}[ty];
  const el=h('div',{class:'cert '+ty,role:'img','aria-label':CT[ty]+': '+c.n+(t?', '+t.t:'')});
  put(el,[h('div',{class:'cf'}),ty!=='kat'?h('div',{class:'seal'},'BK'):null,h('div',{class:'cert-in'},
    h('div',{class:'cw cw-l'},'BARIŞ KILIÇARSLAN'),
    h('div',{class:'ck'},ty==='mc'?'Akademi Sertifikası':'Masterclass Akademi'),
    h('div',{class:'ct'},ty==='mc'?'Masterclass':CT[ty]),
    h('div',{class:'cb'},'Bu belge'),
    h('div',{class:'cn'},c.n),
    h('div',{class:'cb',style:'margin-top:1.6cqi;max-width:70%'},body),
    h('div',{class:'ctn'},t?t.t:MCSET.size+' ana eğitim ve uygulamaları'),
    h('div',{class:'cd'},(x.d?ddy(x.d):'Tarih')+', '+OFF.n),
    h('div',{class:'cs'},[['Barış Kılıçarslan','Eğitmen'],[PPL.mentor.n,'Mentor'],[PPL.broker.n,'Broker']].map(([n,r])=>h('div',{class:'sig'},h('i',null,n),h('span',null,r))))
  ),h('div',{class:'cv'},qr(x.no||'taslak'),h('div',null,'Sertifika no',h('b',null,x.no||'Üretilince verilir'),VURL))]);
  return el;
}
function openCert(x,sample){
  const url='https://'+VURL+'/'+(x.no||'');
  modal({t:CT[x.ty],s:sample?'Örnek görünüm':(COM[x.c]?COM[x.c].n:'')+(x.tr?', '+TRM[x.tr].t:''),body:h('div',{style:'max-width:1000px;margin:0 auto;box-shadow:0 30px 60px -36px rgba(0,0,0,.5)'},certNode(x)),w:1100,
    foot:[h('span',{class:'sp'},ic('shield'),'Barış Kılıçarslan imzası yalnız sistemin ürettiği numaralı sertifikalara basılır. Numara ve QR ile doğrulanır.'),
      x.no?btn('btn-o btn-s',[ic('copy'),'Doğrulama bağlantısı'],()=>copy(url,'Doğrulama bağlantısı kopyalandı.')):null,
      btn('btn-k btn-s',[ic('print'),'Yazdır'],()=>printNode(certNode(x)))]});
}
