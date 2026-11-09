
/* =================== OTURUM MODU =================== */
let SS=null,sesTimer=null;
const VSPEED=4;
function openSession(runId,mode,trid){
  closeDrawer();closeModal();
  const r=runId?RM(runId):null,t=TRM[r?r.tr:trid],F=flow(t);
  let range;
  if(mode==='prev'||!r)range=F.map((_,i)=>i);
  else if(r.tel)range=daySplit(t,'iki')[r.telDay||0];
  else range=daySplit(t,r.tpl)[r.dd]||F.map((_,i)=>i);
  vmStop();
  SS={r,t,F,mode,range,idx:range[0],done:new Set(),prog:0,playing:false,free:mode==='prev',att:{},cch:{},docs:{not:0,koc:0,akt:0},justDone:false,dirty:false,vfail:0};
  if(mode==='prev'){PREV[t.id].forEach(i=>SS.done.add(i));const nx=F.findIndex((_,i)=>!PREV[t.id].has(i));SS.idx=nx<0?0:nx;SS.prog=SS.done.has(SS.idx)?1:0;}
  else{
    if(!r.tel)for(let k=0;k<r.dd;k++)(daySplit(t,r.tpl)[k]||[]).forEach(i=>SS.done.add(i));
    r.mem.forEach(c=>{if(!COM[c].left)SS.att[c]=1;});
    if(r.dd>0)SS.docs.not=1;
  }
  const el=$('#ses');el.hidden=false;sesOpen=true;lockBody();
  requestAnimationFrame(()=>el.classList.add('on'));
  SS.scrollCur=true;drawSes();
  setTimeout(()=>{const f=el.querySelector('.vid-p')||el.querySelector('.ses-h .icb');if(f)f.focus();},120);
}
const inK=k=>SS.F.map((s,i)=>s.k===k?i:-1).filter(i=>i>=0);
const vidVar=i=>vidOk(SS.t,SS.F[i]);
// Videosu olmayan bölüm geçişi kilitlemez ama izlendi sayılmaz.
const allIn=k=>inK(k).every(i=>SS.done.has(i)||!vidVar(i));
function canGo(j){
  if(SS.mode==='prev'||SS.free)return SS.mode==='prev'||SS.range.includes(j);
  const pos=SS.range.indexOf(j);if(pos<0)return false;
  return SS.range.slice(0,pos).every(i=>SS.done.has(i)||!vidVar(i));
}
function navIdx(dir){
  if(SS.mode==='prev'){const j=SS.idx+dir;return j>=0&&j<SS.F.length?j:-1;}
  const pos=SS.range.indexOf(SS.idx),j=pos+dir;return pos>=0&&j>=0&&j<SS.range.length?SS.range[j]:-1;
}
function drawSes(){
  const{r,t,F,mode}=SS,st=F[SS.idx],el=$('#ses'),d=dur(t,SS.idx),done=SS.done.has(SS.idx);
  const ids=Object.keys(SS.att),pres=ids.filter(c=>SS.att[c]).length;
  const nx=navIdx(1),pv=navIdx(-1);
  const head=h('div',{class:'ses-h'},
    h('button',{class:'icb',type:'button','aria-label':mode==='prev'?'Ön izlemeyi kapat':'Oturumdan çık',onclick:exitSes},ic('x')),
    h('div',{class:'t'},h('b',null,t.t),h('span',null,mode==='prev'?'Mentor ön izlemesi. Bölümler arasında serbestçe gezinebilirsiniz.':(r.tel?'Telafi: '+names(r.mem):GRM[r.g].n+(r.days.length>1?', '+(r.dd+1)+'. gün':''))+'. '+dayDesc(t,r.tpl,r.dd,r))),
    mode==='prev'?chip('dk','eye','Ön izleme'):h('span',{class:'chip live'},h('i',{class:'live-d'}),'Canlı oturum'),
    mode==='ses'?chip('dk','users','Katılım '+pres+'/'+ids.length):null,
    mode==='ses'?btn('btn-w btn-s','Oturumu bitir',finishSes):btn('btn-w btn-s','Kapat',exitSes));
  const v=stVim(t,st),vm=!!(v&&v[2]),seq=mode==='ses'&&!SS.free;
  const dn=SS.justDone?h('div',{class:'vid-dn'},h('div',null,h('b',null,nx>=0?'Bölüm tamamlandı':(mode==='prev'?'Eğitimin sonuna geldiniz':'Bugünün bölümleri tamamlandı')),
      h('div',{style:'display:flex;gap:8px;flex-wrap:wrap;justify-content:center'},nx>=0?btn('btn-w',['Sonraki bölüm',ic('chev')],()=>goStep(nx)):(mode==='ses'?btn('btn-w','Oturumu bitir',finishSes):btn('btn-w','Kapat',exitSes)),btn('btn-ow',[ic('refresh'),'Tekrar izle'],replay)))):null;
  let vid=null,cap=null;
  if(vm){
    SS.ui={bar:null,time:null};
    cap=h('div',{class:'vid-cap'},h('div',{class:'t'},h('div',{class:'vid-k'},STN[st.k],st.c?h('span',null,st.c):null,done?h('span',{class:'ok-t'},ic('tick'),'İzlendi'):null),h('h2',null,st.a)),
      seq?chip('dk','clock','Video bitmeden sonraki bölüm açılmaz'):null,
      SS.vfail?h('p',{class:'vid-er sm',role:'status'},SS.vfail===2?'Bu video şu an oynatılamıyor; Vimeo’daki gizlilik ayarına bakın.':'Video oynatıcısı yüklenemedi. Bağlantıyı kontrol edin'+(mode==='ses'?' ya da serbest geçişi açın.':'.')):null);
  }else{
    // Videosu olmayan bölüm: oynatılacak bir şey yok; geçilebilir, izlendi sayılmaz.
    SS.ui={bar:null,time:null};clearInterval(sesTimer);SS.playing=false;
    const neden=st.c?(v?'Bu video Vimeo’da özel; gizlilik ayarı bekleniyor':'Bu bölümün videosu Vimeo’da henüz yok'):'Bu bölümün videosu henüz eklenmedi';
    vid=h('div',{class:'vid',style:'--pos:'+(t.pos||'50% 25%')},h('img',{src:t.img,alt:''}),
      h('div',{class:'vid-yok',role:'status'},h('b',null,neden),h('span',null,mode==='ses'?'Bu bölümü geçebilirsiniz; izlendi sayılmaz.':'Video eklenince burada oynar.'),
        nx>=0?btn('btn-w btn-s',[mode==='ses'?'Bölümü geç':'Sonraki bölüm',ic('chev')],()=>goStep(nx)):null),
      h('div',{class:'vid-tl'},h('div',{class:'vid-k'},STN[st.k],st.c?h('span',null,st.c):null,h('span',{class:'vst'},'Video yok')),h('h2',null,st.a)));
  }
  const ctl=h('div',{class:'ses-ctl'},
    btn('btn-ow btn-s',[ic('left'),'Önceki'],()=>goStep(pv),{disabled:pv<0||null}),
    btn('btn-w btn-s',['Sonraki bölüm',ic('chev')],()=>goStep(nx),{disabled:nx<0||(mode==='ses'&&!SS.free&&!done&&vm)||null}),
    mode==='ses'?h('button',{class:'sw sp',type:'button','aria-pressed':String(SS.free),onclick:()=>{SS.free=!SS.free;drawSes();}},h('i'),'Serbest geçiş, tekrar uygulamada'):h('span',{class:'sp sm',style:'color:var(--mud)'},(SS.idx+1)+' / '+F.length+' video, %'+prevPct(t.id)+' izlendi'));
  const mainK=[cap,ctl,mode==='ses'?stageCard(st):null,docsRow()].filter(Boolean),sideK=[mode==='ses'?attBlock():null,flowBlock(),aiBlock()].filter(Boolean);
  const keep=vm&&VM.ifr&&VM.idx===SS.idx&&VM.id===v[0]&&el.contains(VM.ifr);
  if(keep){
    /* Oynayan Vimeo videosu yerinden sökülmesin: iframe yerinde kalır, çevresi yenilenir. */
    const vEl=VM.ifr.parentElement,m2=el.querySelector('.ses-m'),s2=el.querySelector('.ses-s'),ys=s2.scrollTop;
    el.querySelector('.ses-h').replaceWith(head);
    fill(vEl.querySelector('.vid-ov'),dn);
    while(vEl.nextSibling)vEl.nextSibling.remove();
    m2.append(...mainK);s2.replaceChildren(...sideK);s2.scrollTop=ys;
  }else{
    if(vm){vid=vmNode(st,v[0],v[3]);if(dn)vid.querySelector('.vid-ov').append(dn);}else vmStop();
    const y0=el.scrollTop,ym=(el.querySelector('.ses-m')||{}).scrollTop||0,ys=(el.querySelector('.ses-s')||{}).scrollTop||0;
    el.replaceChildren(head,h('div',{class:'ses-b'},h('div',{class:'ses-m'},vid,...mainK),h('div',{class:'ses-s'},...sideK)));
    el.scrollTop=y0;const m2=el.querySelector('.ses-m'),s2=el.querySelector('.ses-s');if(m2)m2.scrollTop=ym;if(s2)s2.scrollTop=ys;
  }
  const s2=el.querySelector('.ses-s');
  if(SS.scrollCur){SS.scrollCur=false;const c=el.querySelector('.fl [aria-current=true]');if(c&&s2&&getComputedStyle(s2).overflowY==='auto'){const r1b=c.getBoundingClientRect(),r2b=s2.getBoundingClientRect();if(r1b.top<r2b.top+60||r1b.bottom>r2b.bottom-20)s2.scrollTop+=r1b.top-r2b.top-r2b.height/2;}}
}
function focusSel(s){const b=$('#ses '+s);if(b)b.focus();}
function togglePlay(){
  if(!vidVar(SS.idx))return;
  if(SS.playing){SS.playing=false;clearInterval(sesTimer);}
  else{if(SS.prog>=1)SS.prog=0;SS.justDone=false;SS.playing=true;clearInterval(sesTimer);sesTimer=setInterval(tickVid,100);}
  drawSes();focusSel('.vid-p');
}
function tickVid(){
  if(!SS){clearInterval(sesTimer);return;}
  SS.prog=Math.min(1,SS.prog+.1/VSPEED);const d=dur(SS.t,SS.idx);
  SS.ui.bar.style.width=(SS.prog*100)+'%';SS.ui.time.textContent=fmtT(SS.prog*d)+' / '+fmtT(d);
  if(SS.prog>=1){clearInterval(sesTimer);SS.playing=false;SS.done.add(SS.idx);SS.dirty=true;if(SS.mode==='prev')PREV[SS.t.id].add(SS.idx);SS.justDone=true;drawSes();focusSel('.vid-dn .btn');}
}
function goStep(j){
  if(j<0||j>=SS.F.length)return;
  if(!canGo(j)){const e=$('#ses .fl [data-i="'+j+'"]');if(e){e.classList.add('shake');setTimeout(()=>e.classList.remove('shake'),400);}toast(SS.range.includes(j)?'Bu bölüm, önceki video bitince açılır.':'Bu bölüm bugünün oturumunda yok.');return;}
  clearInterval(sesTimer);SS.playing=false;SS.idx=j;SS.prog=SS.done.has(j)?1:0;SS.justDone=false;SS.vfail=0;SS.scrollCur=true;drawSes();focusSel(vidVar(j)?'.vid-p':'.vid-yok .btn');
}
function replay(){
  SS.justDone=false;
  if(VM.ifr&&VM.idx===SS.idx){drawSes();vmPost('setCurrentTime',0);vmPost('play');}
  else if(vidVar(SS.idx)){SS.prog=0;togglePlay();}
  else drawSes();
}
/* ---------- Vimeo oynatıcısı (postMessage) ----------
   Ana eğitim videoları Barış Kılıçarslan'ın Vimeo hesabından gömülür. Video bitince
   oynatıcı "ended" bildirir; sıralı oturumda sonraki bölüm ancak o zaman açılır. */
const VMO='https://player.vimeo.com';
const VM={ifr:null,idx:-1,id:0,ready:false,tmr:0};
function vmPost(m,v){const w=VM.ifr&&VM.ifr.contentWindow;if(!w)return;try{w.postMessage(v==null?{method:m}:{method:m,value:v},VMO);}catch(e){}}
function vmNode(st,id,hk){
  vmStop();
  const ifr=h('iframe',{src:VMO+'/video/'+id+'?'+(hk?'h='+hk+'&':'')+'dnt=1&title=0&byline=0&portrait=0&pip=0&autopause=0&playsinline=1&api=1',allow:'autoplay; fullscreen; picture-in-picture',allowfullscreen:true,title:stepName(st)});
  ifr.addEventListener('load',()=>{if(VM.ifr===ifr&&!VM.ready)vmPost('ping');});
  Object.assign(VM,{ifr,idx:SS.idx,id,ready:false});
  VM.tmr=setTimeout(()=>{if(SS&&VM.ifr===ifr&&!VM.ready){SS.vfail=1;drawSes();}},15000);
  return h('div',{class:'vid vm'},ifr,h('div',{class:'vid-ov'}));
}
function vmStop(){if(VM.ifr)vmPost('pause');clearTimeout(VM.tmr);Object.assign(VM,{ifr:null,idx:-1,id:0,ready:false});}
function vmEnded(){
  SS.prog=1;SS.playing=false;
  if(!SS.done.has(SS.idx)){SS.done.add(SS.idx);SS.dirty=true;}
  if(SS.mode==='prev')PREV[SS.t.id].add(SS.idx);
  SS.justDone=true;drawSes();focusSel('.vid-dn .btn');
}
window.addEventListener('message',e=>{
  if(!VM.ifr||e.source!==VM.ifr.contentWindow||!/^https:\/\/(player\.)?vimeo\.com$/.test(e.origin))return;
  let d=e.data;if(typeof d==='string'){try{d=JSON.parse(d);}catch(_){return;}}
  if(!d||typeof d!=='object'||!SS||VM.idx!==SS.idx)return;
  if(d.event==='ready'||d.method==='ping'){
    if(!VM.ready){VM.ready=true;clearTimeout(VM.tmr);vmPost('addEventListener','ended');vmPost('addEventListener','timeupdate');if(SS.vfail){SS.vfail=0;drawSes();}}
  }else if(d.event==='error'){if(d.data&&d.data.method==='ready'){clearTimeout(VM.tmr);SS.vfail=2;drawSes();}}
  else if(d.event==='timeupdate'){if(d.data&&typeof d.data.percent==='number')SS.prog=Math.max(SS.prog<1?0:1,d.data.percent);}
  else if(d.event==='ended')vmEnded();
});
function stageCard(st){
  const{t}=SS,box=h('div',{class:'stc'});
  if(st.k==='tan'||st.k==='ana'){
    const ana=inK('ana'),n=ana.filter(i=>SS.done.has(i)).length;
    put(box,[h('div',{class:'stc-h'},h('div',{class:'t'},h('b',null,st.k==='tan'?'Tanıtım ve motivasyon':'Ana eğitim: '+n+' / '+ana.length+' bölüm'),h('span',null,SS.docs.not?'Eğitim Notları dağıtıldı. Koçluk soruları ana videolar bitince açılır.':'Eğitimin başında Eğitim Notları’nı dağıtın.')),
      SS.docs.not?chip('ok','tick','Notlar dağıtıldı'):btn('btn-w btn-s','Notlar dağıtıldı',()=>{SS.docs.not=1;SS.dirty=true;drawSes();})),
      h('div',{class:'bar'},h('i',{style:'width:'+pct(n,ana.length)+'%'}))]);
  }else if(st.k==='koc'){
    const ids=Object.keys(SS.att).filter(c=>SS.att[c]),m=ids.filter(c=>SS.cch[c]).length;
    put(box,[h('div',{class:'stc-h'},h('div',{class:'t'},h('b',null,'Koçluk ve içselleştirme'),h('span',null,'Eğitimin bittiği gün çalışın. Soruları tamamlayanları işaretleyin.')),
      SS.docs.koc?chip('ok','tick','Sorular dağıtıldı'):btn('btn-w btn-s','Sorular dağıtıldı',()=>{SS.docs.koc=1;SS.dirty=true;drawSes();})),
      h('div',{class:'cch'},ids.map(c=>h('button',{type:'button','aria-pressed':String(!!SS.cch[c]),onclick:()=>{SS.cch[c]=!SS.cch[c];SS.dirty=true;drawSes();}},h('span',{class:'tk'},ic('tick')),first(COM[c].n)))),
      h('div',{style:'display:flex;justify-content:space-between;gap:10px;align-items:center'},h('span',{class:'sm',style:'color:var(--mud)'},m+' / '+ids.length+' danışman tamamladı'),h('button',{class:'lnk',type:'button',style:'color:#fff',onclick:()=>{ids.forEach(c=>SS.cch[c]=true);SS.dirty=true;drawSes();}},'Hepsini işaretle'))]);
  }else{
    const L=actTpl(t.id);
    put(box,[h('div',{class:'stc-h'},h('div',{class:'t'},h('b',null,'Gelişim ve Kazanç Aktiviteleri'),h('span',null,'Koçluktan sonra verilir. Tarihler bugünden sayılır; tamamlananları sonra işaretlersiniz.')),
      SS.docs.akt?chip('ok','tick','Aktiviteler dağıtıldı'):btn('btn-w btn-s','Aktiviteleri dağıt',()=>{SS.docs.akt=1;SS.dirty=true;drawSes();})),
      h('ol',{class:'act-l'},L.map(([ty,tx,n],i)=>h('li',null,h('span',{class:'n'},String(i+1)),h('span',null,tx),h('span',{class:'ty'},ty+', '+(n?dd(D(n)):'bugün'))))),
      SS.docs.akt?h('div',null,btn('btn-w btn-s','Oturumu bitir',finishSes)):null]);
  }
  return box;
}
function docsRow(){
  const{t,mode}=SS,anaOk=allIn('ana'),kocOk=allIn('koc');
  const card=(i,k,n,state,act)=>h('div',{class:state==='on'?'on':null},h('div',null,h('b',null,n),h('span',{style:'display:block;margin-top:4px'},state==='lock'?(k==='koc'?'Ana videolar bitince açılır':'Koçluktan sonra açılır'):state==='on'?'Dağıtıldı':'Dağıtıma hazır')),
    h('div',{style:'display:flex;gap:6px;flex-wrap:wrap'},docOk(t.id,i)?btn('btn-ow btn-xs','Aç',()=>openDoc(t.id,k),{disabled:(state==='lock'&&mode==='ses')||null}):h('span',{class:'sm',style:'color:var(--mud)'},'Belge hazırlanıyor'),act||null));
  if(mode==='prev')return h('div',{class:'sdoc'},DOCN.map(([k,n],i)=>card(i,k,n,'ready',null)));
  return h('div',{class:'sdoc'},
    card(0,'not','Eğitim Notları',SS.docs.not?'on':'ready',null),
    card(1,'koc','Koçluk ve İçselleştirme Soruları',SS.docs.koc?'on':anaOk?'ready':'lock',null),
    card(2,'akt','Gelişim ve Kazanç Aktiviteleri',SS.docs.akt?'on':kocOk?'ready':'lock',null));
}
function attBlock(){
  const ids=Object.keys(SS.att);
  return h('div',null,h('h3',null,'Katılım',h('span',null,ids.filter(c=>SS.att[c]).length+' / '+ids.length)),
    h('div',{class:'atl'},ids.map(c=>h('button',{type:'button','aria-pressed':String(!!SS.att[c]),onclick:()=>{SS.att[c]=!SS.att[c];SS.dirty=true;if(!SS.att[c])delete SS.cch[c];drawSes();}},h('span',{class:'av'},ini(COM[c].n)),h('span',{class:'t'},COM[c].n),h('span',{class:'s'},SS.att[c]?'Burada':'Yok')))));
}
function flowBlock(){
  const{F,mode,range}=SS,ul=h('ul',{class:'fl'});let last=null;
  F.forEach((s,i)=>{
    if(s.k!==last){ul.append(h('li',{class:'sh'},STN[s.k]));last=s.k;}
    const inR=mode==='prev'||range.includes(i),dn=SS.done.has(i),cur=i===SS.idx,lk=!canGo(i);
    ul.append(h('li',null,h('button',{type:'button','data-i':String(i),class:(dn?'dn ':'')+(lk?'lk ':'')+(!inR?'y1':''),'aria-current':cur?'true':null,onclick:()=>goStep(i)},
      h('span',{class:'fs'},dn?ic('tick'):lk?ic('lock'):null),h('span',null,s.c?h('span',{class:'cn'},s.c):null,s.a),h('span',{class:'tm'},!vidVar(i)?'video yok':!inR&&dn?'1. gün':fmtT(dur(SS.t,i))),dn||lk?h('span',{class:'sr'},dn?', izlendi':', kilitli'):null)));
  });
  return h('div',null,h('h3',null,'Akış',h('span',null,mode==='prev'?'%'+prevPct(SS.t.id):range.filter(i=>SS.done.has(i)).length+' / '+range.length)),ul);
}
function aiBlock(){
  const k=Object.keys(SCN).find(x=>SCN[x].tr===SS.t.id)||'komisyon';
  return h('div',{class:'stc'},h('div',{class:'stc-h'},h('div',{class:'t'},h('b',null,'Barış AI ile grup provası'),h('span',null,SCN[k].ad+'. Barış AI müşteriyi oynar, grup cevap verir.'))),h('div',null,btn('btn-ow btn-s',[ic('spark'),'Provayı aç'],()=>openProvaModal(k))));
}
function exitSes(){
  if(SS&&SS.mode==='ses'&&SS.dirty){confirmBox('Oturumdan çıkılsın mı?','İşaretlemeler kaydedilmez. Kaydetmek için Oturumu bitir’i kullanın.','Kaydetmeden çık',endSesQuiet,true);return;}
  endSesQuiet();
}
function endSesQuiet(){
  clearInterval(sesTimer);vmStop();const el=$('#ses'),prev=SS&&SS.mode==='prev';
  el.classList.remove('on');sesOpen=false;lockBody();SS=null;
  setTimeout(()=>{if(!sesOpen){el.hidden=true;el.replaceChildren();}},260);
  if(prev&&S.role)rerender();
}
function finishSes(){
  const{r,t}=SS,ids=Object.keys(SS.att),pres=ids.filter(c=>SS.att[c]),last=r.tel||r.dd+1>=r.days.length;
  const yok=SS.range.filter(i=>!vidVar(i)).length;
  const L=[['Katılım',pres.length+' / '+ids.length+' danışman'],['Bugünün bölümleri',SS.range.filter(i=>SS.done.has(i)).length+' / '+SS.range.length+' izlendi'+(yok?'; '+yok+' bölümün videosu henüz yok':'')]];
  if(last&&!r.tel)L.push(['Koçluk',pres.filter(c=>SS.cch[c]).length+' danışman işaretlendi'],['Aktiviteler',SS.docs.akt?'Dağıtıldı':'Dağıtılmadı; sonra görev takibinden dağıtabilirsiniz']);
  modal({t:'Oturumu bitir',s:t.t+(r.days.length>1&&!r.tel?', '+(r.dd+1)+'. gün':''),w:540,cls:'md-kisa',
    body:h('dl',{class:'kv'},L.flatMap(([a,b])=>[h('dt',null,a),h('dd',null,b)])),
    foot:[btn('btn-o btn-s','Oturuma dön',closeModal),btn('btn-k btn-s','Kaydet ve bitir',()=>{closeModal();commitSes();})]});
}
function commitSes(){
  const{r}=SS,day=r.tel?0:r.dd,ids=Object.keys(SS.att);
  r.days[day]=new Date(T0);
  ATT[r.id]=ATT[r.id]||{};
  ids.forEach(c=>{const a=ATT[r.id][c]||(ATT[r.id][c]=r.days.map(()=>null));a[day]=SS.att[c]?1:0;});
  const last=r.tel||day+1>=r.days.length;
  r.dd=day+1;r.st=last?'done':'live';
  if(last&&!r.tel){CCH[r.id]=CCH[r.id]||{};ids.forEach(c=>{if(SS.att[c]&&SS.cch[c])CCH[r.id][c]=1;});if(SS.docs.akt&&!ACT[r.id])ACT[r.id]=mkAct(r);}
  if(r.tel){const e=Object.entries(TELAFI).find(([,v])=>v===r.id);if(e){const[rid,c,dy]=e[0].split(':');if(SS.att[c]&&ATT[rid]&&ATT[rid][c])ATT[rid][c][+dy]=1;}}
  const nk=last&&!r.tel?r.mem.filter(c=>katOk(r,c)).length:0;
  endSesQuiet();
  toast(last?(nk?'Oturum kaydedildi. '+nk+' danışmanın Katılım Sertifikası hakkı doğdu.':'Oturum kaydedildi.'):'Oturum kaydedildi. '+(r.dd+1)+'. gün: '+relL(r.days[r.dd])+'.');
  if(S.page==='panel')rerender();else go('panel');
}
