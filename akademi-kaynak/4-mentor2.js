
/* =================== İHTİYAÇ ANALİZİ =================== */
let ihG='b';
VIEWS.mentor.ihtiyac=()=>vIhtiyac(false);
VIEWS.broker.ihtiyac=()=>vIhtiyac(true);
const latest=n=>n?needPct(n.post||n.pre):null;
function groupNeed(g,tr){const v=inG(g).map(c=>latest(NEED[c.id+':'+tr])).filter(x=>x!=null);return v.length?Math.round(avg(v)):null;}
function suggest(g){
  const taken=new Set(RUNS.filter(r=>r.g===g&&!r.tel).map(r=>r.tr));
  return TR.filter(t=>!taken.has(t.id)).map(t=>({t,p:groupNeed(g,t.id)})).filter(x=>x.p!=null).sort((a,b)=>b.p-a.p);
}
function vIhtiyac(ro){
  if(ihG!=='all'&&!GRM[ihG])ihG=(GR[1]||GR[0]||{id:'all'}).id;
  const root=h('div');
  root.append(ph('İhtiyaç analizi','Her eğitim için yaklaşık on kısa başlık. Siz puanlarsınız, sistem ihtiyacı gösterir, kararı siz verirsiniz.',ro?[]:[btn('btn-k btn-s',[ic('gauge'),'Değerlendirme yap'],()=>openAssess({g:ihG==='all'?null:ihG}))]));
  root.append(h('div',{class:'bar-row'},seg([...GR.map(g=>[g.id,g.n,inG(g.id).length]),['all','Tüm ofis']],ihG,k=>{ihG=k;rerender();},'Grup'),
    h('div',{class:'nm-l','aria-hidden':'true'},'İhtiyaç',['q1','q2','q3','q4','q5'].map(q=>h('i',{style:'background:var(--'+q+')'})),'düşükten yükseğe')));
  if(ihG!=='all')root.append(aiSuggest(ihG,ro));
  root.append(h('section',{class:'pn'},h('div',{class:'tw'},matrix(ihG,ro))));
  root.append(h('p',{class:'sm mu',style:'margin:12px 2px 0'},'Hücre, danışmanın o eğitimdeki ihtiyacını yüzde olarak gösterir: puan düştükçe ihtiyaç yükselir. Eğitimden sonra yapılan değerlendirme varsa o gösterilir.'+(ro?'':' Boş hücreye dokunarak değerlendirin.')));
  return root;
}
function aiSuggest(g,ro){
  const S2=suggest(g).slice(0,3);
  return h('section',{class:'ai-s'},h('span',{class:'li-i'},ic('spark')),
    h('div',null,h('b',null,'Barış AI önerisi: '+GRM[g].n+' için sıradaki eğitim'),
      S2.length?h('ol',null,S2.map(x=>h('li',null,x.t.t+', ihtiyaç %'+x.p))):h('p',null,'Öneri için önce bu grupla değerlendirme yapın.'),
      h('p',null,'Grubun henüz almadığı eğitimler, ihtiyaç puanına göre sıralanır. Karar sizin.')),
    !ro&&S2.length?btn('btn-w btn-s',[ic('cal'),'Takvime ekle'],()=>openPlan({tr:S2[0].t.id,g})):null);
}
function matrix(g,ro){
  const cols=g==='all'?GR.map(x=>({k:x.id,l:x.n,gc:x.c})):inG(g).map(c=>({k:c.id,l:first(c.n),c}));
  const tb=h('tbody');
  TR.forEach(t=>{
    const row=h('tr',null,h('td',{class:'tn'},h('b',null,t.s),h('span',{class:'sm mu',style:'display:block'},'Eğitim '+pad2(t.no))));
    cols.forEach(col=>{
      const p=g==='all'?groupNeed(col.k,t.id):latest(NEED[col.k+':'+t.id]);
      const n=g==='all'?null:NEED[col.k+':'+t.id];
      const tipT=g==='all'?col.l+', '+t.s+': '+(p==null?'değerlendirilmedi':'ortalama ihtiyaç %'+p):col.c.n+', '+t.s+': '+(p==null?'değerlendirilmedi':'ihtiyaç %'+p+' ('+lvl(p).toLocaleLowerCase('tr')+')'+(n&&n.post?', eğitim sonrası':', eğitim öncesi'));
      const td=h('td',{class:qcls(p),'data-tip':tipT});
      if(g!=='all'&&!ro)td.append(h('button',{type:'button','aria-label':tipT+'. Değerlendir',onclick:()=>openAssess({c:col.k,tr:t.id})},p==null?'+':String(p)));
      else td.append(p==null?'—':String(p));
      row.append(td);
    });
    const gp=g==='all'?(()=>{const v=GR.map(x=>groupNeed(x.id,t.id)).filter(x=>x!=null);return v.length?Math.round(avg(v)):null;})():groupNeed(g,t.id);
    row.append(h('td',{class:'gv'},gp==null?h('span',{class:'mu',style:'font-weight:500'},'—'):h('div',{class:'need'},bar(gp,'Grup ihtiyacı'),h('span',{class:'num'},String(gp)))));
    tb.append(row);
  });
  return h('table',{class:'nm'},h('caption',{class:'sr'},'Eğitim ve danışmana göre ihtiyaç yüzdeleri'),
    h('thead',null,h('tr',null,h('th',{scope:'col'},'Eğitim'),cols.map(c=>h('th',{scope:'col',title:c.c?c.c.n:c.l},c.gc?h('span',{class:'gl'},h('i',{class:'gd',style:'--gc:'+c.gc}),c.l):c.l)),h('th',{scope:'col'},g==='all'?'Ofis':'Grup'))),tb);
}
function openAssess(pre={}){
  let c=pre.c||((pre.g&&inG(pre.g)[0])||inG('y')[0]||active()[0]).id;
  let tr=pre.tr||(RUNS.find(r=>r.st==='plan'&&r.mem.includes(c))||{tr:'kb'}).tr;
  const doneRun=()=>RUNS.some(r=>r.tr===tr&&r.st==='done'&&r.mem.includes(c));
  let phase=doneRun()?'post':'pre',vals=[];
  const load=()=>{const n=NEED[c+':'+tr];const src=n?(phase==='post'?n.post:n.pre):null;vals=needItems(TRM[tr]).map((_,i)=>src?src[i]:0);};
  load();
  const res=h('div',{style:'padding:16px;border-radius:16px;background:var(--stone);display:grid;gap:10px'});
  const upd=()=>{const items=needItems(TRM[tr]),f=vals.filter(Boolean).length;res.replaceChildren();
    if(f<items.length){fill(res,h('b',{style:'font:600 14.5px/1.3 var(--fb)'},'İhtiyaç, bütün başlıklar puanlanınca hesaplanır'),h('span',{class:'sm mu'},f+' / '+items.length+' puanlandı'));return;}
    const p=needPct(vals),n=NEED[c+':'+tr];
    fill(res,h('div',{style:'display:flex;align-items:center;gap:12px;justify-content:space-between'},h('b',{style:'font:500 28px/1 var(--fd);letter-spacing:-.03em'},'%'+p),chip(p>=60?'crit':p>=35?'wait':'ok',null,lvl(p)+' ihtiyaç')),h('div',{class:'need'},bar(p,'İhtiyaç')),
      phase==='post'&&n&&n.pre?h('span',{class:'sm mu'},'Eğitim öncesi %'+needPct(n.pre)+' idi.'):null);};
  const body=h('div',{class:'st'});
  const draw=()=>{const items=needItems(TRM[tr]);
    body.replaceChildren(
      h('div',{class:'fr'},
        h('div',{class:'fld'},h('label',{for:'asC'},'Danışman'),h('select',{id:'asC',onchange:e=>{c=e.target.value;phase=doneRun()?'post':'pre';load();draw();}},GR.map(g=>h('optgroup',{label:g.n},inG(g.id).map(x=>h('option',{value:x.id,selected:x.id===c||null},x.n)))))),
        h('div',{class:'fld'},h('label',{for:'asT'},'Eğitim'),sel('asT',TR.map(x=>[x.id,x.t]),tr,v=>{tr=v;phase=doneRun()?'post':'pre';load();draw();}))),
      seg([['pre','Eğitim öncesi'],['post','Eğitim sonrası']],phase,k=>{phase=k;load();draw();},'Değerlendirme zamanı'),
      h('p',{class:'sec-n',style:'margin:0'},'Danışman bu başlıklarda sahada ne kadar güçlü? 1 çok zayıf, 5 çok güçlü.'),
      h('div',null,items.map(([code,a],i)=>h('div',{class:'crit-row'},h('span',null,h('span',{class:'sm mu',style:'display:block'},code),a),rate(vals[i],v=>{vals[i]=v;upd();},false,a)))),
      res);
    upd();};
  draw();
  drawer({t:'İhtiyaç değerlendirmesi',s:'Bir iki dakika sürer. Sonuç öneridir; eğitimi siz seçersiniz.',body,w:620,foot:[btn('btn-o','Vazgeç',closeDrawer),btn('btn-k','Kaydet',()=>{
    if(vals.some(v=>!v)){toast('Bütün başlıkları puanlayın.');return;}
    const k=c+':'+tr,n=NEED[k]||(NEED[k]={pre:null,post:null,d:new Date(T0)});
    if(phase==='pre'){n.pre=vals.slice();n.d=new Date(T0);}else{n.post=vals.slice();n.pd=new Date(T0);if(!n.pre)n.pre=vals.slice();}
    const p=needPct(vals);closeDrawer();toast(first(COM[c].n)+', '+TRM[tr].s+': ihtiyaç %'+p+' ('+lvl(p).toLocaleLowerCase('tr')+').');rerender();})]});
}

/* =================== GÖREV TAKİBİ =================== */
let gtF='bek';
function runPending(r){return r.mem.some(c=>!COM[c].left&&((r.st==='done'&&attAll(r,c)&&!coachOk(r,c))||(ACT[r.id]&&!actAll(r,c))||(ATT[r.id][c]||[]).some(v=>v===0)));}
function runLate(r){return r.mem.some(c=>!COM[c].left&&lateItems(r,c).length);}
VIEWS.mentor.gorevler=()=>{
  const root=h('div');
  root.append(ph('Görev takibi','Katılımı, koçluğu ve aktiviteleri işaretleyerek onaylayın. Her işaret bir dokunuş.'));
  const rs=realRuns().filter(r=>r.st!=='plan').sort((a,b)=>lastDay(b)-lastDay(a));
  const f={bek:rs.filter(runPending),gec:rs.filter(runLate),all:rs};
  root.append(h('div',{class:'bar-row'},seg([['bek','Bekleyenler',f.bek.length],['gec','Gecikenler',f.gec.length],['all','Tümü',rs.length]],gtF,k=>{gtF=k;rerender();},'Filtre'),
    h('div',{class:'lgd'},h('span',null,chip('gilt','award','Başarı hakkı')),h('span',null,chip('ok','tick','Katılım hakkı')))));
  const L=f[gtF];
  root.append(L.length?h('div',{class:'st'},L.map(taskCard)):empty(gtF==='gec'?'Geciken aktivite yok':'Bekleyen iş yok','Bütün işaretlemeler güncel.'));
  return root;
};
function statusCell(r,c){
  if(basOk(r,c))return chip('gilt','award','Başarı hakkı');
  if(katOk(r,c))return lateItems(r,c).length?chip('crit','alert','Aktivite gecikti'):chip('ok','tick','Katılım hakkı');
  if((ATT[r.id][c]||[]).some(v=>v===0))return chip('wait','flag','Telafi gerekiyor');
  if(r.st==='live')return chip('ln',null,'Eğitim sürüyor');
  return chip('wait','clock','Koçluk bekleniyor');
}
function taskCard(r){
  const t=TRM[r.tr],A=ACT[r.id],mem=r.mem.filter(c=>!COM[c].left),st=runStage(r);
  const thead=h('tr',null,h('th',null,'Danışman'),r.days.map((d,i)=>h('th',{class:'c'},r.days.length>1?(i+1)+'. gün':'Katılım')),h('th',{class:'c'},'Koçluk'),
    A?A.items.map((it,i)=>h('th',{class:'c','data-tip':it.t+' ('+it.ty+'), son gün '+dd(it.due)},'Akt. '+(i+1))):h('th',{class:'c'},'Aktiviteler'),h('th',null,'Durum'));
  const tb=h('tbody');
  mem.forEach(c=>{
    const stc=h('td',null,statusCell(r,c));
    const refresh=()=>{stc.replaceChildren(statusCell(r,c));shell();};
    const row=h('tr',null,h('td',null,h('div',{class:'who'},av(COM[c],'s'),h('b',null,COM[c].n))));
    r.days.forEach((_,i)=>{const a=ATT[r.id][c]||(ATT[r.id][c]=r.days.map(()=>null));
      row.append(h('td',{class:'c'},i<r.dd?tick(a[i]===1,v=>{a[i]=v?1:0;refresh();},COM[c].n+', '+(i+1)+'. gün katılım',{cls:'x',tip:a[i]===1?'Katıldı':'Katılmadı'}):h('span',{class:'mu'},'—')));});
    row.append(h('td',{class:'c'},r.st==='done'?tick(coachOk(r,c),v=>{CCH[r.id][c]=v?1:0;refresh();},COM[c].n+', koçluk'):h('span',{class:'mu'},'—')));
    if(A){const d=A.done[c]||(A.done[c]=A.items.map(()=>0));
      A.items.forEach((it,i)=>{const late=!d[i]&&df(it.due)<0;row.append(h('td',{class:'c'},tick(!!d[i],(v,b)=>{d[i]=v?1:0;b.classList.toggle('late',!v&&df(it.due)<0);refresh();},COM[c].n+', aktivite '+(i+1),{cls:late?'late':'',tip:late?'Gecikti, '+lateBy(it.due)+' gün':'Son gün '+dd(it.due)})));});}
    else row.append(h('td',{class:'c'},h('span',{class:'sm mu'},r.st==='live'?'Oturumda verilir':'—')));
    row.append(stc);tb.append(row);
  });
  return h('section',{class:'pn rk'},
    h('div',{class:'rk-h'},h('div',{class:'thumb'},poster(t,{sm:1})),h('div',{class:'t'},h('b',null,t.t),h('span',{class:'gl'},gdot(r.g),GRM[r.g].n+', '+r.days.map(dd).join(' ve '))),!A&&r.st==='done'?btn('btn-k btn-xs','Aktiviteleri dağıt',()=>{ACT[r.id]=mkAct(r);toast('Aktiviteler dağıtıldı; tarihler oturum gününden sayılır.');rerender();}):null,h('div',{style:'min-width:240px;flex:0 1 320px'},stage(st.on,st.cur))),
    h('div',{class:'tw'},h('table',{class:'tbl gm'},thead,tb)),
    A?h('ol',{class:'act-l'},A.items.map((it,i)=>h('li',null,h('span',{class:'n'},String(i+1)),h('span',null,it.t),h('span',{class:'ty'},it.ty+', '+dd(it.due))))):null);
}

/* =================== SERTİFİKALAR =================== */
let srF='hazir';
VIEWS.mentor.sertifikalar=()=>vSertifikalar(false);
VIEWS.broker.sertifikalar=()=>vSertifikalar(true);
function vSertifikalar(ro){
  const root=h('div');
  root.append(ph('Sertifikalar','Video izlemek tek başına yetmez. Katılımı, koçluğu ve aktiviteleri siz onaylarsınız; sertifika hakkı kendiliğinden doğar.'));
  const sam={c:'ayse',tr:'iu',d:new Date(T0)};
  root.append(h('div',{class:'ct3'},[['kat','Videolara katılım ve koçluk soruları tamamlanınca.'],['bas','Uygulamalar yapılıp siz onaylayınca. Daha prestijli.'],['mc','Belirlenen bütün ana eğitimler ve uygulamaları bitince. Gri metalik yaldız ve kabartma baskıya uygun.']].map(([ty,txt])=>
    h('button',{class:'ctc',type:'button',onclick:()=>openCert(Object.assign({ty},sam,ty==='mc'?{tr:null}:{}),true)},(n=>{n.setAttribute('aria-hidden','true');return n;})(certNode(Object.assign({ty},sam,ty==='mc'?{tr:null}:{}))),h('b',null,CT[ty]),h('span',null,txt,h('span',{class:'sr'},' Örneği aç.'))))));
  const rc=readyCerts(),iss=CERT.slice().sort((a,b)=>b.d-a.d);
  root.append(h('div',{class:'bar-row'},seg([['hazir','Basıma hazır',rc.length],['verilen','Verilenler',iss.length],['yol','Masterclass yolu']],srF,k=>{srF=k;rerender();},'Görünüm')));
  if(srF==='hazir'){
    const by={};rc.forEach(x=>{const k=(x.run||'mc')+':'+x.ty;(by[k]=by[k]||[]).push(x);});
    const keys=Object.keys(by);
    root.append(keys.length?h('section',{class:'pn'},h('ul',{class:'ls'},keys.map(k=>{const L=by[k],x=L[0],t=x.tr?TRM[x.tr]:null;
      return h('li',null,h('span',{class:'li-i gilt'},ic('award')),h('div',{class:'t'},h('b',null,(t?t.t+', ':'')+CT[x.ty]),h('span',null,names(L.map(y=>y.c))+(t?', '+GRM[RM(x.run).g].n:''))),
        h('div',{class:'a'},btn('btn-g btn-xs','Önizle',()=>openCert(Object.assign({d:new Date(T0)},x),false)),ro?null:btn('btn-k btn-xs',L.length>1?'Hepsini üret ('+L.length+')':'Üret',()=>{L.forEach(y=>CERT.push(Object.assign({no:newNo(),d:new Date(T0)},y)));toast(L.length+' sertifika üretildi ve numaralandı.');srF='verilen';rerender();})));}))):empty('Basıma hazır sertifika yok','Koçluk ve aktiviteleri işaretledikçe burada görünür.'));
  }
  if(srF==='verilen'){
    const rows=iss.map(x=>h('tr',{class:'cl',tabindex:'0',onclick:()=>openCert(x),onkeydown:e=>{if(e.key==='Enter')openCert(x);}},
      h('td',{class:'num'},h('b',null,x.no)),h('td',{'data-l':'Danışman'},COM[x.c].n),h('td',{'data-l':'Eğitim'},x.tr?TRM[x.tr].s:'Bütün akademi'),
      h('td',{'data-l':'Tür'},chip(x.ty==='kat'?'ln':'gilt','award',CT[x.ty].replace(' Sertifikası',''))),h('td',{'data-l':'Tarih'},dnum(x.d)),h('td',{class:'r hm'},ic('chev'))));
    const table=h('div',{class:'tw'},h('table',{class:'tbl rsp'},h('thead',null,h('tr',null,['Sertifika no','Danışman','Eğitim','Tür','Tarih',''].map(x=>h('th',null,x)))),h('tbody',null,rows)));
    root.append(h('section',{class:'pn'},iss.length?table:empty('Henüz sertifika verilmedi')));
  }
  if(srF==='yol'){
    const L=active().map(c=>({c,n:mcProgress(c.id)})).sort((a,b)=>b.n-a.n||a.c.n.localeCompare(b.c.n,'tr'));
    root.append(h('section',{class:'pn'},h('div',{class:'pn-h'},h('h2',null,'Masterclass Akademi Sertifikası yolu'),h('p',null,'Kapsamdaki '+MCSET.size+' ana eğitimin uygulamalarını tamamlayan, büyük sertifikayı alır. Kapsamı akademi merkezi belirler.')),
      h('ul',{class:'ls'},L.map(({c,n})=>h('li',null,av(c),h('div',{class:'t'},h('b',null,c.n),h('div',{style:'display:flex;gap:10px;align-items:center;margin-top:4px'},h('div',{style:'flex:1;max-width:420px'},bar(pct(n,MCSET.size),'Masterclass ilerlemesi')),h('span',{class:'sm num'},n+' / '+MCSET.size))),glab(c.g))))));
  }
  root.append(h('div',{class:'lockn',style:'margin-top:18px'},ic('shield'),'Barış Kılıçarslan imzası yalnız sistemin ürettiği numaralı sertifikalara basılır. Boş şablon indirilemez; her sertifika numara ve QR ile doğrulanır.'));
  return root;
}

/* =================== GELİŞİM RAPORLARI =================== */
VIEWS.mentor.raporlar=()=>vRaporlar(false);
VIEWS.broker.raporlar=()=>vRaporlar(true);
function repState(c){const r=REP[c];if(!r||!r.sh)return chip('ln',null,'Paylaşılmadı');if(!r.cm)return chip('wait','clock','Broker yorumu bekleniyor');return chip('ok','msg','Broker yorumladı');}
function vRaporlar(ro){
  const root=h('div');
  root.append(ph('Gelişim raporları',ro?'Mentorun paylaştığı raporlar. Yorumunuz rapora eklenir; danışmanlar görmez.':'İşaretlediklerinizden kendiliğinden hazırlanır. Brokerla paylaşın, yorumunu alın.'));
  let L=active().filter(c=>runsOf(c.id).some(r=>r.st!=='plan'));
  if(ro)L=L.filter(c=>REP[c.id]&&REP[c.id].sh).sort((a,b)=>(REP[a.id].cm?1:0)-(REP[b.id].cm?1:0));
  const list=h('section',{class:'pn'},h('div',{class:'pn-h'},h('h2',null,ro?'Paylaşılan raporlar':'Danışman raporları',h('span',{class:'c'},String(L.length)))),
    L.length?h('ul',{class:'ls'},L.map(c=>h('li',null,av(c),h('div',{class:'t'},h('b',null,c.n),h('span',null,GRM[c.g].n+', '+(n=>n?n+' eğitim tamamlandı':'tamamlanan eğitim yok')(runsOf(c.id).filter(r=>katOk(r,c.id)).length))),
      h('div',{class:'a'},h('span',{class:'hm-s'},repState(c.id)),btn(ro&&REP[c.id]&&!REP[c.id].cm?'btn-k btn-xs':'btn-g btn-xs','Raporu aç',()=>openReport(c.id)))))):empty('Paylaşılan rapor yok','Mentor paylaştığında burada görünür.'));
  root.append(h('div',{class:'g2'},list,pn('Uygulayanlar ve uygulamayanlar',null,compareChart(),{sub:'Bu ay, danışman başına ortalama. Aktivitelerini tamamlayanlar diğerleriyle karşılaştırılır; fark tek başına eğitimin etkisini kanıtlamaz.'})));
  return root;
}
function compareChart(){
  const A=active().filter(c=>applied(c.id)),N=active().filter(c=>!applied(c.id));
  const m=(L,i)=>L.length?avg(L.map(c=>(BIZ[c.id]||[0,0,0,0])[i])):0;
  let tbl=false;const box=h('div',{class:'vz'});
  const draw=()=>{box.replaceChildren(
    h('div',{class:'lgd'},h('span',{style:'--sc:var(--c1)'},h('i'),'Uygulayanlar ('+A.length+')'),h('span',{style:'--sc:var(--c2)'},h('i'),'Uygulamayanlar ('+N.length+')')),
    tbl?h('table',{class:'tbl'},h('thead',null,h('tr',null,h('th',null,'Bu ay ortalama'),h('th',{class:'r'},'Uygulayanlar'),h('th',{class:'r'},'Uygulamayanlar'))),h('tbody',null,BZN.map((n,i)=>h('tr',null,h('td',null,n),h('td',{class:'r num'},trn(m(A,i))),h('td',{class:'r num'},trn(m(N,i)))))))
      :h('div',{class:'hb'},BZN.map((n,i)=>{const a=m(A,i),b=m(N,i),mx=Math.max(a,b,.1);
        return [i?h('div',{class:'hb-sep'}):null,h('div',{class:'hb-r'},h('span',null,n),h('div',{class:'hb-b'},
          h('div',{'data-tip':n+': uygulayanlar ortalama '+trn(a)},h('i',{style:'--sc:var(--c1);width:'+(a/mx*80)+'%'}),h('b',null,trn(a))),
          h('div',{'data-tip':n+': uygulamayanlar ortalama '+trn(b)},h('i',{style:'--sc:var(--c2);width:'+(b/mx*80)+'%'}),h('b',null,trn(b)))))];})),
    h('div',null,h('button',{class:'lnk mu',type:'button',onclick:()=>{tbl=!tbl;draw();}},tbl?'Grafik olarak göster':'Tablo olarak göster')));};
  draw();return box;
}
function reportNode(cid,live){
  const c=COM[cid],rs=runsOf(cid).filter(r=>r.st!=='plan'),rep=REP[cid]||(REP[cid]={sh:null,cm:null});
  const pa=privAvg(cid),done=rs.filter(r=>katOk(r,cid)).length,open=rs.reduce((a,r)=>{const d=actDone(r,cid);return a+(d?d.filter(x=>!x).length:0);},0);
  const P=h('div',{class:'paper'});
  P.append(h('div',{class:'p-hd'},h('div',null,h('div',{class:'p-wm'},h('span',null,'BARIŞ KILIÇARSLAN ·'),' ',h('span',null,'MASTERCLASS AKADEMİ')),h('h2',{class:'p-t'},'Danışman gelişim raporu'),h('p',{class:'p-s'},c.n+', '+GRM[c.g].n+', '+OFF.n)),
    h('div',{style:'display:grid;gap:8px;justify-items:end'},chip('lock','lock','Özel: mentor ve broker'),h('span',{class:'sm mu'},'Hazırlandı: '+ddy(T0)))),
    h('div',{class:'p-kv'},[[done,'Tamamlanan eğitim'],[certsOf(cid).length,'Sertifika'],[open,'Açık aktivite'],[pa?trn(pa):'—','Özel puan ortalaması']].map(([v,l])=>h('div',null,h('b',null,String(v)),h('span',null,l)))));
  P.append(h('section',null,h('h3',null,'Eğitimler'),rs.length?h('ul',{class:'ls'},rs.map(r=>journeyRow(r,cid))):h('p',{class:'mu'},'Henüz eğitime katılmadı.')));
  const sc=Object.keys(SC).filter(k=>k.split(':')[1]===cid&&SC[k].q.some(Boolean));
  P.append(h('section',null,h('h3',null,ic('lock'),'Mentor değerlendirmesi'),sc.length?h('div',null,CRIT.map((k,i)=>{const v=sc.map(x=>SC[x].q[i]).filter(Boolean);const a=v.length?avg(v):0;return h('div',{class:'sbar'},h('span',null,k),bar(a/5*100,k),h('b',{class:'num'},a?trn(a):'—'));}),
    sc.filter(k=>SC[k].n).map(k=>h('div',{class:'q'},'“'+SC[k].n+'”',h('small',null,TRM[RM(k.split(':')[0]).tr].t+', '+PPL.mentor.n))),
    h('p',{class:'sm mu',style:'margin:10px 0 0'},'1-5 arası puan. Eğitimdeki tutumu anlatır; sahadaki satış başarısından ayrıdır.')):h('p',{class:'mu'},'Henüz puanlanmadı.')));
  const nd=TR.filter(t=>NEED[cid+':'+t.id]);
  P.append(h('section',null,h('h3',null,'İhtiyaç değişimi'),nd.length?h('div',{class:'vz'},
    h('div',{class:'lgd'},h('span',{style:'--sc:var(--c1)'},h('i'),'Eğitim öncesi'),h('span',{style:'--sc:var(--c2)'},h('i'),'Eğitim sonrası')),
    h('div',{class:'hb'},nd.map(t=>{const n=NEED[cid+':'+t.id],a=needPct(n.pre),b=n.post?needPct(n.post):null;
      return h('div',{class:'hb-r'},h('span',null,t.s),h('div',{class:'hb-b'},h('div',{'data-tip':t.s+': eğitim öncesi ihtiyaç %'+a},h('i',{style:'--sc:var(--c1);width:'+(a*.8)+'%'}),h('b',null,'%'+a)),b!=null?h('div',{'data-tip':t.s+': eğitim sonrası ihtiyaç %'+b},h('i',{style:'--sc:var(--c2);width:'+(b*.8)+'%'}),h('b',null,'%'+b)):null));}))):h('p',{class:'mu'},'Değerlendirme yok.')));
  const bz=BIZ[cid]||[0,0,0,0];
  P.append(h('section',null,h('h3',null,'İş sonuçları, bu ay'),h('div',{class:'p-kv',style:'margin-top:0'},BZN.map((n,i)=>h('div',null,h('b',null,String(bz[i])),h('span',null,n)))),h('p',{class:'sm mu',style:'margin:10px 0 0'},'İsteğe bağlı girilir.')));
  const cm=h('section',null,h('h3',null,'Broker yorumu'));
  if(rep.cm)cm.append(h('div',{class:'q'},'“'+rep.cm.t+'”',h('small',null,PPL.broker.n+', '+ddy(rep.cm.d))));
  if(live&&canComment()&&(rep.sh||S.asBroker)){const ta=h('textarea',{id:'cmT',rows:'3',maxlength:'400',placeholder:'Kısa yorumunuz'},rep.cm?rep.cm.t:'');
    cm.append(h('div',{class:'fld',style:'margin-top:10px'},h('label',{for:'cmT'},rep.cm?'Yorumu güncelle':'Yorumunuz'),ta),h('div',{style:'margin-top:10px'},btn('btn-k btn-s','Yorumu kaydet',()=>{const v=ta.value.trim();if(!v){ta.focus();return;}rep.cm={t:v,d:new Date(T0)};if(!rep.sh)rep.sh=new Date(T0);closeModal();toast('Yorumunuz rapora eklendi.');rerender();})));}
  else if(!rep.cm)cm.append(h('p',{class:'mu',style:'margin:0'},rep.sh?'Broker henüz yorum yazmadı.':'Rapor brokerla paylaşılınca yorum eklenebilir.'));
  P.append(cm,h('p',{class:'p-note'},'Bu rapor yalnız ofis yönetimi içindir; danışmanlara ve diğer ofislere açılmaz. Puanlar sahadaki satış başarısından ayrıdır.'));
  return P;
}
function openReport(cid){
  const rep=REP[cid]||(REP[cid]={sh:null,cm:null});
  const foot=[h('span',{class:'sp'},ic('lock'),'Danışmanlara ve diğer ofislere açılmaz.'),btn('btn-o btn-s',[ic('print'),'Yazdır ya da PDF'],()=>printNode(reportNode(cid,false)))];
  if(S.role==='mentor'&&!S.asBroker)foot.push(rep.sh?chip('ok','tick','Brokerla paylaşıldı'):btn('btn-k btn-s',[ic('share'),'Brokerla paylaş'],()=>{rep.sh=new Date(T0);closeModal();toast('Rapor '+PPL.broker.n+' ile paylaşıldı.');rerender();}));
  modal({t:'Gelişim raporu',s:COM[cid].n,body:reportNode(cid,true),foot,w:920});
}

/* =================== BARIŞ AI =================== */
// Senaryoların burada yalnız başlığı, kişisi, örnek akışı ve kısa ipuçları durur.
// Müşteri dosyaları, ölçütler ve yöntem bilgisi sunucudadır (baris-ai fonksiyonu).
// ac: örnek akış; ip: örnek modda bakılan ipuçları [desen, yapıldıysa, yapılmadıysa]; ht: kaçınılacak hamle [desen, uyarı].
const SCN={
  tanisma:{kd:'Tanışma',ad:'“Ne iş yapıyorsunuz?” diye soran yeni tanışılan kişi',kisi:'Serkan Bey',kim:'yeni tanışılan kişi',tr:'mb',bol:'Kişisel Marka ve Müşteri Bulmada Ustalık, KP07 Yeni İnsanlarla Tanışmak',ornek:'Evini satmak isteyenlerin doğru fiyatı bulup evini değerinde ve kısa sürede satmasına yardım ediyorum.',
    ac:[['Memnun oldum. Peki siz ne iş yapıyorsunuz?'],['Diş hekimiyim, muayenehanem iki sokak ötede. On beş yıldır buradayım.','Ha, emlakçısınız yani. Herkes emlakçı oldu bu aralar.'],['Açıkçası annemin evi için önümüzdeki yıl bir şeyler düşünüyoruz ama daha erken.','Kartınızı alayım, lazım olursa ararım.'],['Olur, o özeti gönderin, bakarım. Numaramı vereyim.']],
    ip:[[/(siz (ne|nerede|hangi|kaç)|sizin|muayenehane)/,'Önce karşınızdakiyle ilgilendiniz.','Önce karşınızdakini konuşturun, sonra kendinizi tanıtın.'],[/(yardım(cı)? ol|yardım ed|sağlıyorum|çözüyorum|değerinde|kısa sürede)/,'İşinizi çözdüğünüz sorun ve kazandırdığınız sonuçla anlattınız.','İşinizi unvanla değil, çözdüğünüz sorun ve kazandırdığınız sonuçla anlatın.']],
    ht:[/(satılık.{0,20}var mı|kartım|kart vere|kartımı)/,'Tanışır tanışmaz iş istemeyin, kart uzatmayın.']},
  rapor:{kd:'Rapor görüşmesi',ad:'Bir aydır satılmayan evin sahibi',kisi:'Gülay Hanım',kim:'ev sahibi',tr:'dd',bol:'Dolu Danışman Olmada Ustalık, D04 Raporlama ve İletişim Planı',ornek:'Haklısınız, sizi daha düzenli bilgilendirmeliydim. Bir ayda yapılanları ve alıcıların yorumlarını olduğu gibi paylaşayım.',
    ac:[['Bir ay oldu, ev hâlâ satılmadı. Arayan soran da yok gibi. Siz ne yapıyorsunuz Allah aşkına?'],['Gezenler ne demiş peki? Bana kimse bir şey söylemiyor ki.','Komşum da emlakçın çalışmıyor dedi. Haksız mı?'],['Hepsi fiyat mı demiş? Ben de düşünmüyor değilim aslında...','Yani suç bende mi şimdi?'],['Peki. Bundan sonra her cuma yazılı bilgi istiyorum. Fiyatı da hafta sonu konuşalım.']],
    ip:[[/(haklısınız|özür|bilgilendirmeli|aksat)/,'Sitemi kabul ettiniz, savunmaya geçmediniz.','Önce sitemi kabul edin; savunmaya geçmeyin.'],[/(alıcı|gezen|gösterim|arama|arayan|teklif)/,'Yapılanları ve alıcı yorumlarını aktardınız.','Yapılanları ve alıcı yorumlarını yorum katmadan, olduğu gibi aktarın.']],
    ht:[/(demiştim|söylemiştim|baştan söyle)/,'“Size söylemiştim” demeyin; seçenekleri sunup kararı ev sahibine bırakın.']},
  fsbo:{kd:'İlk telefon',ad:'Sahibinden satan ev sahibiyle ilk telefon',kisi:'Halil Bey',kim:'ev sahibi',tr:'fsbo',bol:'Sahibinden Satılıklarda Ustalık, FSBO 03-01 FSBO’larla Telefon Görüşmesi',ornek:'En doğal hakkınız, umarım kısa sürede satarsınız. Ne kadar süre içinde satamazsanız destek almayı düşünürsünüz?',
    ac:[['Buyurun... Emlakçıysanız baştan söyleyeyim, emlakçıyla çalışmıyorum. Alıcınız varsa getirin.'],['Altı haftadır ilanda. Arayan çok ama yarısı emlakçı, kalanı da yok pahasına istiyor.','Hepiniz aynı şeyi söylüyorsunuz. Sonra ilanımı izinsiz paylaşıyorsunuz.'],['Kızıma ev alacağım, üç ay içinde satmam lazım. Analiz dediğiniz bana ne kazandıracak?','Komisyonunuz ne kadar, önce onu söyleyin.'],['Peki. Perşembe akşamı gelin, bir dinleyeyim. Beğenmezsem kusura bakmayın.']],
    ip:[[/(doğal hakkınız|umarım|anlıyorum|haklısınız)/,'Kendi satma isteğini kızmadan kabul ettiniz.','“En doğal hakkınız” diye başlayın; kendi satmak isteyene kızılmaz.'],[/(analiz|pazarlama plan|bilgi|çözüm|dosya)/,'Bir şey istemeden önce değer sundunuz.','Bir şey istemeden önce ne kazandıracağınızı söyleyin.']],
    ht:[/(hazır alıcı|alıcım (var|hazır))/,'“Hazır alıcım var” demeyin; güveni baştan bitirir.']},
  tekyetki:{kd:'Tek yetki',ad:'Evi üç emlakçıya veren ev sahibi',kisi:'Murat Bey',kim:'ev sahibi',tr:'pa',bol:'Portföy Almada Ustalık, PA10 Sözleşmeyi Alma Yöntemleri',ornek:'Elinizde ikisi yetkisiz, biri sözleşmeli üç ev olsa bütçenizi ve ciddi alıcınızı önce hangisine ayırırdınız?',
    ac:[['Evimi üç ofise verdim zaten. Ne kadar çok emlakçı, o kadar çok alıcı. Neden size tek yetki vereyim?'],['Üç haftadır ilanda. Arayan çok ama ciddi kimse gelmedi açıkçası.','Herkes böyle söylüyor. Ben riske girmek istemem.'],['Bir ay içinde sonuç görmezsem ne olacak?','Diğer ofisler de çalışıyor, sizin farkınız ne?'],['Tamam, sözleşmeye bir bakalım.']],
    ip:[[/(yerim(e|de)|danışman ol|üç (ev|portföy)|hangisine|sahiplen)/,'Ev sahibini danışmanın yerine koydunuz.','Ev sahibini danışmanın yerine koyun: yetkisiz iki ev ve sözleşmeli bir evden hangisine emek verilir?']],
    ht:[/(hazır alıcı|alıcım (var|hazır)|garanti ed)/,'“Hazır alıcım var” demeyin, satış garantisi vermeyin.']},
  ilkgorusme:{kd:'İlk görüşme',ad:'İlk görüşmede “Sizce kaç eder?” diyen ev sahibi',kisi:'Hakan Bey',kim:'ev sahibi',tr:'pa',bol:'Portföy Almada Ustalık, PA04 Birinci Görüşme İtirazları',ornek:'Benim fikrimden çok piyasanın fikri önemli. Analizi hazırlayayım, perşembe birlikte bakalım mı?',
    ac:[['Hoş geldiniz. Uzatmayalım: evi gezdiniz, sizce kaç eder? Komisyonunuz ne kadar?'],['Dört ay içinde taşınmam gerekiyor, tayinim çıktı. O yüzden işi uzatmak istemiyorum.','İki emlakçı gelir gelmez rakam söyledi. Siz neden söylemiyorsunuz?'],['Analizde tam olarak neye bakacaksınız? Satılan evlerin fiyatını nereden bileceksiniz?','Peki komisyonu şimdiden bileyim, ona göre düşünürüm.'],['Olur. Perşembe akşamı gelin, birlikte bakalım.']],
    ip:[[/(piyasa|analiz|emsal|satılan|satılmış)/,'Rakam vermek yerine analizi önerdiniz.','Rakam söylemeyin; piyasanın fikri için analiz önerin.'],[/(ne zamandır|ne kadar sürede|planınız|tanımak|tanıyayım)/,'Ev sahibini tanıyan sorular sordunuz.','Önce tanıyın: ne zamandır satışta, ne kadar sürede satılsın istiyor?']],
    ht:[/\d[\d.,]*\s*(milyon|bin\b|tl\b|lira)/,'İlk görüşmede analiz göstermeden rakam söylemeyin.']},
  komisyon:{kd:'Komisyon',ad:'Komisyonu düşür diyen ev sahibi',kisi:'Ayten Hanım',kim:'ev sahibi',tr:'iu',bol:'İtirazlarda Ustalık, İU 06 Hizmet Bedeli İçin Güçlü Diyalog Yöntemleri',ornek:'Aynı bedeli alsaydım neden öbür ofisi değil de beni tercih ederdiniz?',
    ac:[['Bakın, açık konuşayım. Karşı sokaktaki ofis daha düşük komisyonla satarım dedi. Siz neden daha fazlasını istiyorsunuz?'],['Bayramdan önce satılsın istiyorum, oğlumun düğünü var. Fiyat da konuştuğumuz rakamın altına düşmesin.','Güzel konuşuyorsunuz ama diğer ofis de aynı şeyleri söyledi. Farkınız ne?'],['Haftalık rapor dediğiniz ne olacak, bir örnek gösterebilir misiniz?','Yine de biraz indirim yaparsanız size veririm.'],['Peki. Ne zaman başlıyoruz, ne imzalıyoruz?']],
    ip:[[/(neden beni|neden bana|tercih ed|koruyam|korur|yarısından|peşin|risk)/,'Bedelinizi bir açıklamayla savundunuz.','Bedeli bir açıklamayla savunun: farkı ev sahibine söyletin ya da hizmeti bedelin karşısına yazın.']]},
  ustune:{kd:'Üstüne ekle',ad:'“Cebime şu girsin, üstüne ekle” diyen ev sahibi',kisi:'Cemal Bey',kim:'ev sahibi',tr:'iu',bol:'İtirazlarda Ustalık, İU 06 Hizmet Bedeli İçin Güçlü Diyalog Yöntemleri',ornek:'Ben bu şekilde çalışmıyorum; nedenini sizin rakamınız üzerinden beş dakikada göstereyim mi?',
    ac:[['Ben komisyona karışmam. Cebime istediğim rakam girsin, üstüne ne koyarsanız sizin olsun.'],['İstediğim rakamın altında teklif gelirse mi? Getirirsiniz, bakarız... Niye sordunuz?','Öbür emlakçı kabul etti ama. Siz niye zorlaştırıyorsunuz?'],['Yani teklifi bana söylemeyebilirler mi diyorsunuz? Onu hiç düşünmemiştim.','Bana ne alıcıdan, ben paramı alayım yeter.'],['Anladım. Peki sizin usulünüz nasıl, ne imzalıyoruz?']],
    ip:[[/(çalışmıyorum|kabul etm|doğru bulm|bu şekilde)/,'Teklifi açıkça kabul etmediniz.','Teklifi kabul etmeyin; nedenini ev sahibinin rakamı üzerinden gösterin.'],[/(teklif|altında|iletil|iletme|doğru söyle|yanlış söyle)/,'Bu düzenin ev sahibine zararını somut gösterdiniz.','İstenen rakamın altında teklif gelirse ne olacağını somut anlatın.']],
    ht:[/(üstüne (ekleriz|eklerim|koyarız|koyarım)|ekleyelim|öyle yapalım)/,'Bu teklifi kabul etmeyin; teklifler ev sahibine doğru aktarılmaz hale gelir.']},
  dusunelim:{kd:'Bir düşünelim',ad:'“Bir düşünelim” diyen ev sahibi',kisi:'Selma Hanım',kim:'ev sahibi',tr:'iu',bol:'İtirazlarda Ustalık, İU 08 “Düşünmek İstiyoruz” İtirazı',ornek:'Çok doğal. Üzerinde düşünmek istediğiniz belirli bir konu var mı?',
    ac:[['Çok güzel anlattınız, teşekkür ederiz. Biz bir düşünelim, sizi ararız.'],['Açıkçası sözleşmenin süresi beni biraz düşündürdü. Üç ay bağlı kalmak...','Yok, her şey güzeldi. Biz konuşup size döneriz.'],['Eşimle bu akşam konuşuruz. Cuma günü haber versem olur mu?','Bilmiyorum, bir süre geçsin bakalım.'],['Tamam, cuma öğleden sonra görüşelim.']],
    ip:[[/(belirli|belli bir|hangi konu|düşündüren)/,'Düşünmek istedikleri konuyu sordunuz.','Üzerinde düşünmek istedikleri belirli bir konu olup olmadığını sorun.'],[/(ne kadar (süre|vakit|zaman)|ne zamana kadar|hangi gün)/,'Karar için süreyi sordunuz.','Karar için ne kadar süreye ihtiyaçları olduğunu sorun ve tarih alın.']],
    ht:[/(bugün (imzala|karar)|hemen karar|kaçır)/,'Baskı kurmayın; düşünmek en doğal haklarıdır.']},
  kararsiz:{kd:'Eşimle konuşayım',ad:'“Eşimle konuşayım” diyen alıcı',kisi:'Kerem Bey',kim:'alıcı',tr:'au',bol:'Alıcılarda Ustalık, AU 08 Teklif Sürecinde Ustalık',ornek:'Çok doğal. Eşinize anlatırken sizi en çok düşündüren ne olur?',
    ac:[['Ev güzel, beğendim ama eşimle konuşup size dönerim.'],['Açıkçası fiyat biraz zorluyor, eşim de oradan soracak.','Anlıyorum ama acele etmek istemiyoruz.'],['Yarın akşam eşimle birlikte bir kez daha bakabilir miyiz?','Biz yine de bir düşünelim.'],['Tamam, yarın görüşelim.']],
    ip:[[/(düşündüren|takıldığınız|en çok|asıl)/,'Asıl kaygıyı sordunuz.','Asıl kaygıyı sorun: en çok düşündüren ne?'],[/(eşiniz|birlikte)/,'Eşi sürece kattınız.','Eşi sürece katın: birlikte bir gösterim önerin.']],
    ht:[/(kaçır|başka alıcı|pişman)/,'Korkutarak ilerlemeyin; kararı kolaylaştırın.']},
  alicitel:{kd:'İlandan arayan',ad:'İlandan arayan alıcı',kisi:'Elif Hanım',kim:'alıcı',tr:'au',bol:'Alıcılarda Ustalık, AU 04 Alıcı Telefon Görüşmesinde Ustalık',ornek:'Üç oda bir salon, asansörlü. Siz kaç odalı ve hangi çevrede arıyorsunuz?',
    ac:[['Merhaba, internette üç artı bir daire ilanınızı gördüm. Fiyatı ne, son olur mu? Tam adresi de alabilir miyim?'],['Kızım eylülde okula başlıyor, o okula yakın olsun istiyoruz. O yüzden bu sokaklara bakıyorum.','Ben önce adresi alayım, dışarıdan bir bakarım.'],['Kredimiz hazır. Kararı eşimle birlikte veriyoruz, o da görmek ister.','İki emlakçı beni haftalarca oyaladı, o yüzden kısa konuşuyorum.'],['Olur. Cumartesi öğleden önce eşimle birlikte gelebiliriz.']],
    ip:[[/(siz (kaç|hangi|ne)|sizin|arıyorsunuz|düşünüyorsunuz)/,'Bilgi verirken bilgi aldınız.','Her bilginin sonuna bir soru ekleyin: “Siz kaç odalı düşünüyorsunuz?”'],[/(ne zamandır|ne kadar sürede|hangi amaç|kredi|karar)/,'Alıcının durumunu öğrendiniz.','Alıcının neden aradığını ve kararı kimin vereceğini öğrenin.']],
    ht:[/(kaçırmayın|muhteşem|bulunmaz|fırsat)/,'Evi telefonda övmeyin; görüşmeyi kurun.']},
  fiyat:{kd:'Yüksek fiyat',ad:'Fiyatı yüksek isteyen ev sahibi',kisi:'Nermin Hanım',kim:'ev sahibi',tr:'dfi',bol:'Doğru Fiyatlı Portföy Almada Ustalık, DFI 07 Fiyat Sunumunda Ustalık',ornek:'Evinizin aynısı yok ama rakipleri var. Son satılan evlere birlikte bakalım, fiyata siz karar verin.',
    ac:[['Bu evde çocukluğum geçti. Bölgedeki diğer evlerle kıyaslanamaz, bu fiyatın altına inmem.'],['Yaz gelmeden satmak istiyorum, kızımın yanına taşınacağım.','Başka bir ofis bu fiyattan satabileceğini söyledi. Siz neden daha düşük diyorsunuz?'],['Emsalleri görelim. Ama ilk ay benim fiyatımla denesek?','Bence siz evin değerini anlamıyorsunuz.'],['Peki, birlikte bakalım. Ne zaman gelirsiniz?']],
    ip:[[/(emsal|satılan|satılmış|rakip|analiz|piyasa)/,'Fiyatı emsallere ve piyasaya dayandırdınız.','Fiyatı kendi fikrinizle değil, emsaller ve piyasayla konuşun.'],[/alıcı/,'Ev sahibine alıcının gözünden baktırdınız.','Evi emlakçıların değil, alıcıların alacağını hatırlatın.']],
    ht:[/(deneyelim|sizin fiyatınızla|istediğiniz fiyat(tan|la))/,'Portföyü almak için yüksek fiyatı kabul etmeyin.']},
  masraf:{kd:'Masraf',ad:'“Masrafımız çok” diyen ev sahibi',kisi:'Orhan Bey',kim:'ev sahibi',tr:'dfi',bol:'Doğru Fiyatlı Portföy Almada Ustalık, DFI 09 “Masrafımız Çok” İtirazı',ornek:'Emeğinizi görüyorum. Alıcı bu yenilemeler için bize neden daha fazla versin, birlikte yazalım mı?',
    ac:[['Biz bu eve geçen yıl ciddi masraf yaptık; mutfak, banyo, zeminler baştan yenilendi. O parayı fiyata koymadan satmam.'],['Geçen yıl yaptırdık. O zaman satmak aklımızda yoktu, kendimiz oturacaktık.','Malzemenin en iyisini kullandım. Bunun bir karşılığı olmalı.'],['Alıcı olsam mı? Mutfağı kendi zevkime göre isterdim herhalde... Orası doğru.','Yan bloktaki daire eski haliyle sizin dediğiniz fiyata satıldı. Benimki ondan iyi.'],['Peki, listeyi birlikte çıkaralım. Hangi gün gelirsiniz?']],
    ip:[[/(ne zaman yap|bilseydiniz|bilseniz|alıcı ol|öder miydiniz)/,'Cevabı sorularla ev sahibine buldurdunuz.','Kestirip atmayın; “satacağınızı bilseydiniz yapar mıydınız?” gibi sorularla ilerleyin.'],[/(alıcı|emsal)/,'Ev sahibine alıcının gözünden baktırdınız.','Alıcının neden daha fazla ödeyeceğini birlikte yazmayı önerin.']],
    ht:[/(yansımaz|sayılmaz|önemi yok|fark etmez)/,'Masrafı küçümsemeyin; önce emeği kabul edin.']},
  pazarlik:{kd:'Son fark',ad:'Son farkta takılan alıcı',kisi:'Tolga Bey',kim:'alıcı',tr:'cl',bol:'İşlem Kapanışta Ustalık, CLOSING 09 Alternatif Kapanış Teknikleri',ornek:'Karar sizin. Bu farkla aslında ne alıyorsunuz, birlikte bakalım mı?',
    ac:[['Son teklifim bu. Ev sahibi inmiyorsa kısmet değilmiş; ben beş kuruş daha vermem.'],['Mesele para değil. Fazla ödemiş olmak istemiyorum, hepsi bu.','Benim için konu kapandı. Başka evlere bakarız.'],['Eşim bahçeyi çok sevdi, okul da yürüme mesafesinde. Dört aydır arıyoruz, yorulduk açıkçası.','Ev sahibi biraz daha insin, ben de düşüneyim.'],['Tamam. Bu akşam eşimle konuşayım, yarın sabah teklifi yazılı güncelleyelim.']],
    ip:[[/(ne alıyorsunuz|bahçe|okul|iyi ki|üzülür)/,'Farkı alıcının kendi söyledikleriyle anlamlandırdınız.','Farkı yeniden çerçeveleyin: “Bu farkla aslında ne alıyorsunuz?”'],[/(yıl|aylık|günlük|böl|paylaş)/,'Farkı küçültecek bir seçenek ürettiniz.','Seçenek üretin: farkı oturulacak süreye bölün ya da paylaşmayı önerin.']],
    ht:[/(kaçır|başka alıcı|pişman|komisyonumdan|bedelimden)/,'Korkutmayın; kendi bedelinizden vermek ilk çözüm değil, son kozdur.']}
};
// Eğitim sırasıyla senaryo grupları
const SCG=TR.map(t=>[t,Object.keys(SCN).filter(k=>SCN[k].tr===t.id)]).filter(x=>x[1].length);
const PV={sc:'komisyon',msgs:[],turn:0,busy:false,puan:false,score:null};
// Gerçek girişte Claude'a bağlı fonksiyon denenir; anahtar yoksa, sınır dolduysa ya da hata olursa örnek akış sürer.
let AI_OFF=false,AI_LIM=false,AI_BILGI=false;
const aiLive=()=>!!(SB&&ME)&&!AI_OFF&&!AI_LIM;
async function aiInvoke(body){
  if(!aiLive())return null;
  try{
    const{data,error}=await SB.functions.invoke('baris-ai',{body});
    if(error){
      const st=error.context&&error.context.status;
      if(st===503)AI_OFF=true;
      if(st===429&&!AI_LIM){AI_LIM=true;toast('Barış AI için bugünkü kullanım sınırına ulaşıldı. Örnek akışla sürüyor.',5200);}
      return null;
    }
    if(data&&data.bilgi)AI_BILGI=true;
    return data||null;
  }catch(e){return null;}
}
function aiCall(action){
  const sc=SCN[PV.sc];
  return aiInvoke({action,scenario:{k:PV.sc,tr:sc.tr,kim:sc.kim,ad:sc.ad,kisi:sc.kisi,egitim:TRM[sc.tr].t,bolum:sc.bol,ornek:sc.ornek},messages:PV.msgs.map(m=>({w:m.w,t:m.t}))});
}
function pvStart(k){PV.sc=k;PV.msgs=[{w:'ai',t:SCN[k].ac[0][0]}];PV.turn=1;PV.busy=false;PV.puan=false;PV.score=null;}
pvStart('komisyon');
// Örnek mod puanı: cevaplardaki işaretlere bakan kaba bir ölçü. Canlı modda puanı Barış AI verir.
function evalProva(){
  const sc=SCN[PV.sc],mine=PV.msgs.filter(m=>m.w==='me').map(m=>m.t),all=mine.join(' ').toLocaleLowerCase('tr'),words=all.split(/\s+/).filter(Boolean).length;
  const q=/\?/.test(all),val=/(sonuç|değer|plan|rapor|süre|hedef|strateji|pazarlama|emsal|analiz|takvim)/.test(all),step=/(yarın|bugün|pazartesi|salı|çarşamba|perşembe|cuma|saat|randevu|imza|sözleşme|görüşelim|gelelim|buluşalım|başlayalım|göndereyim|arayayım)/.test(all),emp=/(anlıyorum|çok doğal|haklısınız|yerinde|anlaşılır|çok normal|doğal hakkınız)/.test(all);
  const disc=/(indirim yap(arım|arız|abilirim|abiliriz|alım|ayım)|düşer(im|iz)|düşür(ürüm|ürüz|ebilirim|ebiliriz|elim|eyim)|yarı yarıya|iner(im|iz)|inebilir(im|iz))/.test(all);
  const ip=(sc.ip||[]).map(x=>[x[0].test(all),x[1],x[2]]),hit=ip.filter(x=>x[0]).length,ht=sc.ht&&sc.ht[0].test(all);
  let p=30+Math.min(words,120)/120*12+(q?10:0)+(val?10:0)+(step?12:0)+(emp?7:0)+hit*9-(disc?16:0)-(ht?18:0);
  if(words<12)p=Math.min(p,44);if(ht||disc)p=Math.min(p,48);p=Math.max(18,Math.min(94,Math.round(p)));
  const g=[],d=[];
  ip.forEach(x=>(x[0]?g:d).push(x[0]?x[1]:x[2]));
  if(q)g.push('Soru sorarak karşı tarafın asıl isteğini açtınız.');else d.push('Önce bir soru sorun: karşı tarafın hedefi ve kaygısı ne?');
  if(step)g.push('Bir sonraki adımı netleştirdiniz.');else d.push('Konuşmayı tarihli bir sonraki adımla bitirin.');
  if(emp)g.push('Kaygıyı kabul ettiniz.');
  if(val)g.push('Cevabı sonuca ve somut bir plana bağladınız.');else d.push('Cevabı somut bir plana ya da sonuca bağlayın.');
  if(disc)d.unshift('İndirimle başlamayın; önce değeri anlatın.');
  if(ht)d.unshift(sc.ht[1]);
  return{p,g:g.slice(0,2),d:d.slice(0,2)};
}
function chatBox(onEnd){
  const sc=SCN[PV.sc],who=sc.kisi+', '+sc.kim;
  const msgs=h('div',{class:'msgs','aria-live':'polite'});
  const inp=h('input',{class:'inp',type:'text',maxlength:'500',placeholder:'Grubun cevabını yazın','aria-label':'Grubun cevabı'});
  const endB=btn('btn-o btn-s','Bitir ve puanla',()=>{
    if(aiLive()){PV.busy=true;PV.puan=true;drawMsgs();updB();aiCall('score').then(r=>{PV.busy=false;PV.puan=false;PV.score=r&&typeof r.p==='number'?{p:r.p,g:(r.g||[]).slice(0,2),d:(r.d||[]).slice(0,2),ornek:r.ornek||'',bolum:r.bolum||'',canli:true}:evalProva();drawMsgs();updB();});return;}
    PV.score=evalProva();drawMsgs();updB();});
  const sendB=h('button',{class:'btn btn-k btn-s',type:'submit','aria-label':'Gönder'},ic('send'));
  const updB=()=>{const mine=PV.msgs.filter(m=>m.w==='me').length;endB.disabled=PV.busy||mine<2||!!PV.score;inp.disabled=PV.busy||!!PV.score;sendB.disabled=PV.busy||!!PV.score;};
  function drawMsgs(){msgs.replaceChildren();
    PV.msgs.forEach(m=>msgs.append(h('div',{class:'msg '+m.w},h('span',{class:'msg-l'},m.w==='ai'?who:'Grubun cevabı'),h('div',{class:'bub'},m.t))));
    if(PV.busy)msgs.append(h('div',{class:'msg ai'},h('span',{class:'msg-l'},PV.puan?'Barış AI değerlendiriyor':who),h('div',{class:'bub typing','aria-label':'Yazıyor'},h('i'),h('i'),h('i'))));
    if(PV.score){const s=PV.score;msgs.append(h('div',{class:'score'},h('div',{class:'score-t'},h('span',{class:'score-n'},String(s.p)),h('div',null,h('b',null,'Barış AI değerlendirmesi'),h('div',{class:'sm',style:'color:var(--mud)'},s.canli?'100 üzerinden, Barış Kılıçarslan’ın yöntemine göre':'100 üzerinden, örnek değerlendirme'))),
      s.g.length?h('div',null,h('h4',null,'Güçlü yanlar'),h('ul',null,s.g.map(x=>h('li',null,x)))):null,s.d.length?h('div',null,h('h4',null,'Geliştirilecekler'),h('ul',null,s.d.map(x=>h('li',null,x)))):null,
      h('div',{class:'q'},'“'+(s.ornek||sc.ornek)+'”',h('small',{style:'color:var(--mud)'},'Bir dahaki sefere denenebilecek cümle')),h('div',{class:'sm',style:'color:var(--mud)'},'İlgili bölüm: '+(s.bolum||sc.bol))));}
    msgs.scrollTop=msgs.scrollHeight;}
  const form=h('form',{class:'cmp',onsubmit:e=>{e.preventDefault();const v=inp.value.trim();if(!v||PV.busy||PV.score)return;inp.value='';PV.msgs.push({w:'me',t:v});PV.busy=true;drawMsgs();updB();
    const asked=/\?/.test(v),step=sc.ac[Math.min(PV.turn,sc.ac.length-1)];
    const fallback=()=>{PV.msgs.push({w:'ai',t:step.length>1?(asked?step[0]:step[1]):step[0]});PV.turn++;};
    const finish=()=>{PV.busy=false;drawMsgs();updB();if(!PV.score)inp.focus();};
    if(aiLive())aiCall('reply').then(r=>{if(r&&r.text){PV.msgs.push({w:'ai',t:r.text});PV.turn++;}else fallback();finish();});
    else setTimeout(()=>{fallback();finish();},900+Math.random()*500);}},inp,sendB);
  const head=h('div',{class:'chat-h'},h('span',{class:'li-i ink'},ic('spark')),h('div',{class:'t'},h('b',null,sc.ad),h('span',null,'Barış AI '+sc.kisi+(/Hanım$/.test(sc.kisi)?'’ı':'’i')+' oynar; grup cevabı birlikte kurar, mentor yazar.')),aiLive()?null:chip('ln',null,'Örnek mod'),btn('btn-g btn-xs',[ic('refresh'),'Yeni prova'],()=>{pvStart(PV.sc);onEnd();}));
  drawMsgs();updB();
  return h('section',{class:'pn chat'},head,msgs,h('div',{style:'display:flex;gap:8px;align-items:center;padding:0 14px'},h('span',{class:'sm mu',style:'flex:1;padding-top:10px'},'En az iki cevaptan sonra puanlayın.'),h('div',{style:'padding-top:10px'},endB)),form);
}

/* ---------- Barış'a sor ---------- */
// Örnek modda yalnız aşağıdaki hazır sorular cevaplanır; canlı modda cevabı Barış AI verir.
const SOR_HAZIR=[
  ['Ev sahibi “komisyonu düşür” diyor. Ne demeliyim?','Önce değeri, sonra bedeli konuşun. İtirazı sakin kabul edin, sonra farkı ev sahibine söyletin: “Aynı bedeli alsaydım neden öbür ofisi değil de beni tercih ederdiniz?” Saydığı farklar bedelinizin nedenidir; aynısını ona geri sunun.\nİndirimle başlarsanız yalnız bedelinizi değil, alıcıya karşı evin fiyatını koruyacağınıza duyulan güveni de düşürürsünüz. Sonunda kararı ona bırakın: “Nasıl biriyle çalışmak isterseniz karar sizin.”\nİlgili bölüm: İtirazlarda Ustalık, İU 06 Hizmet Bedeli İçin Güçlü Diyalog Yöntemleri'],
  ['Evi birkaç emlakçıya vermiş. Yetki belgesini nasıl isterim?','Ev sahibini beş dakikalığına sizin yerinize koyun: “Elinizde ikisi yetkisiz, biri sözleşmeli üç ev olsa bütçenizi, ciddi alıcınızı ve zamanınızı önce hangisine ayırırdınız?” Cevabı kendisi verir.\nArdından sözleşme süresince ne yapacağınızı ve ne sıklıkla bilgi vereceğinizi somut anlatın. Öbür ofisleri kötülemeyin, “hazır alıcım var” demeyin. “Yetki belgesinin benim kadar size de faydası var; karar sizin.”\nİlgili bölüm: İtirazlarda Ustalık, İU 09 Sözleşme İtirazlarında Ustalık'],
  ['Ev sahibi fiyatı çok yüksek istiyor. Nasıl konuşurum?','Kendi fikrinizi değil, piyasanın fikrini konuşun. Önce analizi nasıl yaptığınızı söyleyin: “Evinizin aynısı yok ama rakipleri var; evinize bakan alıcı bu evlere de bakacak.”\nSatışta olan, satılamayan ve satılmış evleri yorum katmadan gösterin; aralığı piyasanın gösterdiği aralık diye sunun. “Başkası daha yükseğe satarım dedi” derse: “Evinizi emlakçılar değil, bu bölgenin alıcıları alacak.” Portföyü almak için yüksek fiyatı kabul etmeyin.\nİlgili bölüm: Doğru Fiyatlı Portföy Almada Ustalık, DFI 07 Fiyat Sunumunda Ustalık'],
  ['Alıcı “eşimle konuşup döneceğim” dedi. Nasıl ilerlerim?','Doğal karşılayın, sonra asıl nedeni arayın: “Çok doğal. Eşinize anlatırken sizi en çok düşündüren ne olur?” Çoğu zaman altından fiyat ya da tek bir kaygı çıkar.\nEşi sürece katın ve tarihi netleştirin: “Yarın akşam birlikte bir kez daha görelim mi?” Korkutmayın, evi savunmayın; alıcının kendi söylediği artılara dönün. Teklif istemek baskı kurmak değil, karar almaya yönlendirmektir.\nİlgili bölüm: Alıcılarda Ustalık, AU 08 Teklif Sürecinde Ustalık'],
  ['Sahibinden satan biri “emlakçıyla çalışmam” diyor. Ne yapmalıyım?','Kızmayın; çoğu insan önce kendisi denemek ister. “En doğal hakkınız, umarım kısa sürede satarsınız” deyin ve bir şey istemeden önce değer sunun: güncel fiyat analizi, pazarlama planı.\nSonra sorun: “Ne kadar süre içinde satamazsanız destek almayı düşünürsünüz?” Telefonda fiyat, bedel ve sözleşme tartışmayın; “hazır alıcım var” demeyin. İzin alın ve söz verdiğiniz gün yeniden arayın.\nİlgili bölüm: Sahibinden Satılıklarda Ustalık, FSBO 05 Telefon Görüşmesinde İtirazlar']
];
const SOR_ILK='Merhaba. Sahada takıldığınız yeri yazın; Barış Kılıçarslan’ın yöntemine göre cevaplayayım. Aşağıdaki sorulardan biriyle de başlayabilirsiniz.';
const SOR={msgs:[{w:'ai',t:SOR_ILK}],busy:false};
function sorBub(t){
  return h('div',{class:'bub'},String(t).split(/\n+/).map(x=>x.trim()).filter(Boolean).map(x=>h('p',{class:/^ilgili bölüm/.test(x.toLocaleLowerCase('tr'))?'rel':null},x)));
}
function askBox(){
  const msgs=h('div',{class:'msgs','aria-live':'polite'});
  const inp=h('input',{class:'inp',type:'text',maxlength:'600',placeholder:'Sorunuzu yazın','aria-label':'Sorunuz'});
  const sendB=h('button',{class:'btn btn-k btn-s',type:'submit','aria-label':'Gönder'},ic('send'));
  const chips=h('div',{class:'sor-c'});
  const upd=()=>{inp.disabled=SOR.busy;sendB.disabled=SOR.busy;chips.querySelectorAll('button').forEach(b=>{b.disabled=SOR.busy;});chips.hidden=SOR.msgs.some(m=>m.w==='me');};
  function draw(){msgs.replaceChildren();
    SOR.msgs.forEach(m=>msgs.append(h('div',{class:'msg '+m.w},h('span',{class:'msg-l'},m.w==='ai'?(m.ex?'Barış AI, örnek cevap':'Barış AI'):'Siz'),m.w==='ai'?sorBub(m.t):h('div',{class:'bub'},m.t))));
    if(SOR.busy)msgs.append(h('div',{class:'msg ai'},h('span',{class:'msg-l'},'Barış AI'),h('div',{class:'bub typing','aria-label':'Yazıyor'},h('i'),h('i'),h('i'))));
    msgs.scrollTop=msgs.scrollHeight;}
  function ask(q){
    if(SOR.busy||!q)return;
    SOR.msgs.push({w:'me',t:q});SOR.busy=true;draw();upd();
    const done=m=>{SOR.msgs.push(m);SOR.busy=false;draw();upd();inp.focus();};
    const hazir=()=>{const f=SOR_HAZIR.find(x=>x[0]===q);return f?{w:'ai',t:f[1],ex:true}:{w:'ai',t:'Örnek modda yalnız hazır sorular cevaplanır. Barış AI bağlandığında kendi sorunuzu da yazabilirsiniz.',ex:true,bos:true};};
    if(!aiLive()){setTimeout(()=>done(hazir()),700);return;}
    // Sunucuya yalnız gerçek konuşma gider: karşılama ve örnek cevaplar gönderilmez.
    const hist=SOR.msgs.filter(m=>!m.ex&&m.t!==SOR_ILK).map(m=>({w:m.w,t:m.t})).slice(-12);
    aiInvoke({action:'ask',messages:hist}).then(r=>{
      if(r&&r.v>=2&&r.text)done({w:'ai',t:r.text});
      else if(!aiLive())done(hazir());
      else done({w:'ai',t:r?'Barış’a sor henüz açılmadı. Şimdilik grup provasını kullanabilirsiniz.':'Cevap alınamadı. Biraz sonra yeniden deneyin.',ex:true,bos:true});
    });
  }
  SOR_HAZIR.forEach(x=>chips.append(h('button',{type:'button',class:'sor-q',onclick:()=>ask(x[0])},x[0])));
  const form=h('form',{class:'cmp',onsubmit:e=>{e.preventDefault();const v=inp.value.trim();if(!v||SOR.busy)return;inp.value='';ask(v);}},inp,sendB);
  const head=h('div',{class:'chat-h'},h('span',{class:'li-i ink'},ic('msg')),h('div',{class:'t'},h('b',null,'Barış’a sor'),h('span',null,'Sahada takılınan yeri yazın; Barış AI yöntemle cevaplar ve ilgili bölümü gösterir.')),aiLive()?null:chip('ln',null,'Örnek mod'),btn('btn-g btn-xs',[ic('refresh'),'Yeni sohbet'],()=>{if(SOR.busy)return;SOR.msgs=[{w:'ai',t:SOR_ILK}];draw();upd();}));
  draw();upd();
  return h('section',{class:'pn chat'},head,msgs,chips,form);
}
// Senaryo seçimi: geniş ekranda eğitimlere göre gruplu liste, dar ekranda açılır liste.
function scPick(cur,on){
  const list=h('div',{class:'scl',role:'group','aria-label':'Senaryo'},SCG.map(([t,ks])=>[h('div',{class:'scg'},t.s)].concat(ks.map(k=>h('button',{class:'scb',type:'button','aria-pressed':String(cur===k),onclick:()=>on(k)},h('b',null,SCN[k].ad),h('span',null,SCN[k].kisi+', '+SCN[k].kim))))));
  const sl=h('div',{class:'fld scs'},h('label',{for:'scSel'},'Senaryo'),h('select',{id:'scSel',onchange:e=>on(e.target.value)},SCG.map(([t,ks])=>h('optgroup',{label:t.s},ks.map(k=>h('option',{value:k,selected:cur===k||null},SCN[k].ad))))));
  return[list,sl];
}
let aiTab='prova';
VIEWS.mentor.ai=()=>{
  const root=h('div');
  root.append(ph('Barış AI','Grupla müşteri provası yapın, sahada takılınan yeri sorun, ihtiyaç puanlarından eğitim önerisi alın.',[chip('ln',null,'İlk sürüm')]));
  root.append(h('div',{class:'bar-row'},seg([['prova','Grup provası'],['sor','Barış’a sor'],['oneri','Eğitim önerisi']],aiTab,k=>{aiTab=k;rerender();},'Barış AI')));
  if(aiTab==='prova'){
    const box=h('div',{class:'aig-c'});const redraw=()=>box.replaceChildren(chatBox(redraw));redraw();
    root.append(h('div',{class:'aig'},h('div',null,scPick(PV.sc,k=>{pvStart(k);rerender();})),box));
  }else if(aiTab==='sor')root.append(h('div',{class:'sor-w'},askBox()));
  else root.append(h('div',{class:'st'},GR.map(g=>aiSuggest(g.id,false))));
  root.append(h('p',{class:'sm mu',style:'margin-top:16px'},AI_BILGI?'Barış AI, Barış Kılıçarslan’ın kitaplarından ve Masterclass eğitimlerinden çıkarılan yöntem bilgisiyle çalışır. Cevaplar yapay zekâ üretimidir; hukuki ve mali konularda uzmanına danışın.':'Barış AI ilk sürümdür. Barış Kılıçarslan’ın kitapları, eğitimleri ve içerikleriyle ayrıca derinleştirilecek.'));
  return root;
};
// Oturumdan açılan prova: eğitimin birden çok senaryosu varsa üstte seçilir.
function openProvaModal(k){
  pvStart(k);
  const ks=Object.keys(SCN).filter(x=>SCN[x].tr===SCN[k].tr),box=h('div'),bar=h('div',{class:'bar-row'});
  const redraw=()=>{box.replaceChildren(chatBox(redraw));if(ks.length>1)bar.replaceChildren(seg(ks.map(x=>[x,SCN[x].kd]),PV.sc,x=>{pvStart(x);redraw();},'Senaryo'));};
  redraw();
  modal({t:'Barış AI ile grup provası',s:TRM[SCN[k].tr].t,body:h('div',null,ks.length>1?bar:null,box),w:820});
}
