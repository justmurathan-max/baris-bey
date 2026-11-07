
/* =================== MENTOR: PANEL =================== */
VIEWS.mentor.panel=()=>{
  const me=meUser(),hr=new Date().getHours();
  const hi=hr<12?'Günaydın':hr<18?'İyi günler':'İyi akşamlar';
  const root=h('div');
  root.append(ph(hi+', '+first(me.n),GUN[T0.getDay()]+', '+ddy(T0),[btn('btn-o btn-s',[ic('plus'),'Oturum planla'],()=>openPlan())]));
  const nx=nextSession();if(nx)root.append(heroCard(nx));
  const P=pendings();
  const left=h('div',{class:'st'},
    pn('Bekleyen işler',P.length?h('span',{class:'c'},String(P.length)):null,P.length?h('ul',{class:'ls'},P.map(pendRow)):empty('Bekleyen iş yok','Katılım, koçluk ve aktiviteler güncel.')),
    groupsPanel());
  const right=h('div',{class:'st'},prepPanel(),guidePanel(),aiPanel());
  root.append(h('div',{class:'g2'},left,right));
  return root;
};
function pendRow(p){
  return h('li',null,h('span',{class:'li-i '+(p.cls||'')},ic(p.ic)),h('div',{class:'t'},h('b',null,p.t),p.s?h('span',null,p.s):null),h('div',{class:'a'},p.a.map(([l,f],j)=>btn(j?'btn-g btn-xs':'btn-k btn-xs',l,f))));
}
function heroCard({r,i,d}){
  const t=TRM[r.tr],st=runStage(r),n=df(d);
  let note=null;
  if(r.dd>0){const prev=r.dd-1;const pr=r.mem.filter(c=>(ATT[r.id][c]||[])[prev]===1).length;const ab=r.mem.filter(c=>(ATT[r.id][c]||[])[prev]===0);
    note=(r.dd===1&&r.days.length>1?'1. gün ':'Son oturum ')+dd(r.days[prev])+': '+pr+'/'+r.mem.length+' katıldı.'+(ab.length?' '+names(ab)+' kaçırdı; telafi gerekiyor.':'');}
  return h('section',{class:'hero',style:'--bg:url('+t.img+')','aria-label':'Sıradaki oturum'},
    h('div',null,poster(t)),
    h('div',{class:'hero-i'},
      h('div',null,
        h('div',{class:'hero-k'},n===0?h('span',{class:'chip live'},h('i',{class:'live-d'}),'Bugün'):chip('dk','clock',rel(d)),'Sıradaki oturum'),
        h('h2',null,t.t),
        h('div',{class:'hero-m'},
          h('span',null,gdot(r.g),GRM[r.g].n+', '+r.mem.length+' danışman'),
          h('span',null,ic('cal'),relL(d)+', 09:30'),
          h('span',null,ic('video'),(r.days.length>1?(i+1)+'. gün: ':'')+dayDesc(t,r.tpl,i,r)))),
      h('div',{class:'hero-b'},
        h('div',null,stage(st.on,st.cur),note?h('p',{class:'hero-n'},note):null),
        h('div',{class:'hero-a'},btn('btn-w',[ic('play'),'Oturumu başlat'],()=>openSession(r.id,'ses')),btn('btn-ow',[ic('eye'),'Ön izle'],()=>openSession(null,'prev',r.tr))))));
}
function groupsPanel(){
  return pn('Gruplar',null,h('div',null,GR.map(g=>{
    const mem=inG(g.id),rs=realRuns().filter(r=>r.g===g.id);
    const cur=rs.find(r=>r.st==='live')||rs.filter(r=>r.st==='done').sort((a,b)=>lastDay(b)-lastDay(a))[0];
    const nxt=rs.filter(r=>r.st==='plan').sort((a,b)=>a.days[0]-b.days[0])[0];
    const st=cur?runStage(cur):null;
    return h('div',{class:'grp'},
      h('div',{class:'grp-h'},h('span',{class:'gl'},gdot(g.id),h('b',null,g.n),h('span',{class:'sm mu'},mem.length+' danışman')),h('div',{class:'avs'},mem.slice(0,5).map(c=>av(c,'s')))),
      cur?h('div',{class:'grp-s'},(cur.st==='live'?'Devam ediyor: ':'Son eğitim: ')+TRM[cur.tr].t):h('div',{class:'grp-s'},'Henüz eğitim almadı.'),
      cur?stage(st.on,st.cur):null,
      h('div',{class:'grp-s'},nxt?'Sıradaki: '+TRM[nxt.tr].s+', '+relL(nxt.days[0]):'Planlanmış oturum yok.'));
  })));
}
function prepPanel(){
  const ups=realRuns().filter(r=>r.st!=='done').sort((a,b)=>(a.days[a.dd]||a.days[0])-(b.days[b.dd]||b.days[0]));
  const ids=[...new Set(ups.map(r=>r.tr))];
  return pn('Hazırlığınız',null,h('div',null,h('p',{class:'sm mu',style:'margin:-4px 0 12px'},'Oturumdan önce eğitimin tamamını kendiniz izleyin.'),
    ids.length?h('ul',{class:'ls'},ids.map(id=>{const t=TRM[id],p=prevPct(id),r=ups.find(x=>x.tr===id);
      return h('li',null,h('div',{class:'thumb'},poster(t,{sm:1})),h('div',{class:'t'},h('b',null,t.t),h('span',null,GRM[r.g].n+', '+relL(r.days[r.dd]||r.days[0])),h('div',{style:'display:flex;gap:10px;align-items:center;margin-top:5px'},h('div',{style:'flex:1'},bar(p,'Ön izleme')),h('span',{class:'sm num'},'%'+p))),
        p<100?btn('btn-g btn-xs','Devam et',()=>openSession(null,'prev',id)):chip('ok','tick','Hazır'));})):empty('Planlı oturum yok','Takvimden yeni bir oturum planlayın.')));
}
function guidePanel(){
  return pn('Mentor rehberi',chip('ln',null,'Yakında'),h('div',{class:'st-s'},
    h('p',{class:'sm mu',style:'margin:0'},'Barış Kılıçarslan’ın akademiyi nasıl yürüteceğinizi anlattığı kısa video. Eklendiğinde burada açılır.'),
    h('ul',{class:'ls'},[['eye','Oturumdan önce eğitimi izleyin'],['check','Koçluğu eğitimin bittiği gün yapın'],['award','Aktiviteleri işaretleyerek onaylayın']].map(([i,txt])=>h('li',null,h('span',{class:'li-i'},ic(i)),h('div',{class:'t'},h('span',{style:'color:var(--tx);font-size:14px'},txt)))))));
}
function aiPanel(){
  return h('section',{class:'pn dk'},h('div',{class:'pn-h'},h('h2',null,ic('spark'),'Barış AI ile grup provası')),
    h('p',{class:'sm',style:'margin:0 0 16px;color:var(--mud)'},'Oturum sonunda grupla bir müşteri senaryosu çalışın. Barış AI müşteriyi oynar, grup cevap verir, sonunda puan ve öneri gelir.'),
    btn('btn-w btn-s','Provayı aç',()=>go('ai')));
}

/* =================== MENTOR: EĞİTİMLER =================== */
let egF='all';
function trStates(id){const s=new Set();RUNS.filter(r=>r.tr===id&&!r.tel).forEach(r=>s.add(r.st));if(!s.size)s.add('none');return s;}
function trLine(id){
  const rs=realRuns().filter(r=>r.tr===id);
  const live=rs.find(r=>r.st==='live');if(live)return[gdot(live.g),GRM[live.g].n+': devam ediyor'];
  const plan=rs.filter(r=>r.st==='plan').sort((a,b)=>a.days[0]-b.days[0])[0];if(plan)return[gdot(plan.g),GRM[plan.g].n+': '+relL(plan.days[0])];
  const done=rs.filter(r=>r.st==='done');if(done.length)return[gdot(done[0].g),done.map(r=>GRM[r.g].n).join(', ')+' tamamladı'];
  return[null,'Ofiste henüz uygulanmadı'];
}
VIEWS.mentor.egitimler=()=>{
  const root=h('div');
  root.append(ph('Eğitimler','Aboneliğinizdeki on eğitim. Aralarında zorunlu sıra yok; her eğitimin bölümleri sırayla ilerler.'));
  const cnt=k=>TR.filter(t=>trStates(t.id).has(k)).length;
  root.append(h('div',{class:'bar-row'},seg([['all','Tümü',TR.length],['live','Devam eden',cnt('live')],['plan','Planlanan',cnt('plan')],['done','Tamamlanan',cnt('done')],['none','Uygulanmadı',cnt('none')]],egF,k=>{egF=k;rerender();},'Eğitim filtresi')));
  const L=TR.filter(t=>egF==='all'||trStates(t.id).has(egF));
  root.append(L.length?h('div',{class:'tg'},L.map(trCard)):empty('Bu filtrede eğitim yok'));
  root.append(h('div',{style:'margin-top:52px'},
    h('div',{class:'ph',style:'margin-bottom:20px'},h('div',null,h('h2',{class:'h3'},'Klasik Eğitimler'),h('p',null,'Satışın Şifreleri ve Gayrimenkulün Usta Satışçıları akademide iki bonus eğitim olarak açık.'))),
    h('div',{class:'tg'},CLS.map(c=>h('button',{class:'tc',type:'button',onclick:()=>openClassic(c)},poster(c),h('span',{class:'tc-t'},c.t),h('span',{class:'tc-s'},'Bonus eğitim'))))));
  return root;
};
function trCard(t){
  const [dot,txt]=trLine(t.id),p=prevPct(t.id);
  return h('button',{class:'tc',type:'button',onclick:()=>go('egitim',t.id)},poster(t),h('span',{class:'tc-t'},t.t),h('span',{class:'tc-s'},dot,txt),
    p>0&&p<100?h('span',{class:'tc-p'},bar(p,'Ön izleme'),'%'+p+' izlendi'):p===100?h('span',{class:'tc-s',style:'color:var(--okT)'},ic('tick'),'Ön izlemeniz tamam'):null);
}
function openClassic(c){
  drawer({t:c.t,s:'Klasik Eğitimler, akademide bonus',body:[h('div',{style:'width:180px'},poster(c)),
    h('p',{style:'margin:0;line-height:1.55'},c.d+'. Akademi üyeleri grup oturumunda izleyebilir; ayrı satışı mağazada sürer.'),
    h('div',{class:'lockn'},ic('key'),'2017’den beri sınırsız erişimle alanların hakları ayrıca korunur; bu haklar yeni eğitimleri kapsamaz.')],
    foot:[h('a',{class:'btn btn-o btn-s',href:'index.html#magaza'},'Mağazada gör'),btn('btn-k btn-s',[ic('cal'),'Oturum planla'],()=>{closeDrawer();toast('Klasik eğitimler videolar taşınınca takvime eklenebilir.');})]});
}

/* ---------- Eğitim ayrıntısı ---------- */
const DOCN=[['not','Eğitim Notları','Eğitimin başında dağıtılır'],['koc','Koçluk ve İçselleştirme Soruları','Ana videolar bitince, aynı gün'],['akt','Gelişim ve Kazanç Aktiviteleri','Koçluktan sonra verilir']];
VIEWS.mentor.egitim=id=>{
  const t=TRM[id];if(!t)return VIEWS.mentor.egitimler();
  const p=prevPct(id),root=h('div');
  root.append(backBtn('Eğitimler',()=>go('egitimler')));
  root.append(h('div',{class:'td'},h('div',null,poster(t)),h('div',null,
    chip('ln',null,'Eğitim '+pad2(t.no)),
    h('h1',{style:'margin-top:14px'},t.t),
    h('p',{class:'td-r'},t.r),
    h('div',{class:'meta'},chip(null,'video',anaCount(t)+' ana bölüm'),chip(null,'clock','Yaklaşık '+fmtH(totalDur(t))),chip(null,'cal','Tek gün ya da iki yarım gün'),p===100?chip('ok','tick','Ön izlemeniz tamam'):chip('wait','eye','Ön izleme %'+p)),
    h('div',{class:'ph-a'},btn('btn-k',[ic('cal'),'Oturum planla'],()=>openPlan({tr:id})),btn('btn-o',[ic('eye'),p>0&&p<100?'Ön izlemeye devam':'Ön izle'],()=>openSession(null,'prev',id)),btn('btn-o',[ic('gauge'),'İhtiyaç değerlendirmesi'],()=>openAssess({tr:id}))))));
  root.append(flow4(t));
  root.append(h('div',{class:'g2'},pn('Bölümler',h('span',{class:'c'},flow(t).length+' video'),chapterList(t),{sub:'Mentor ön izlemede bölümler arasında serbestçe gezinir. Grup oturumunda video bitmeden sonraki bölüm açılmaz.'}),
    h('div',{class:'st'},pn('Belgeler',null,docsList(t)),pn('Ofisinizde',null,runsList(t)))));
  return root;
};
function flow4(t){
  const A=[['Tanıtım ve motivasyon','Eğitimin başında; hedeflenen sonucu ve kazancı anlatır.','Eğitim Notları'],
    ['Ana eğitim',anaCount(t)+' bölüm, sırayla. Video bitmeden sonraki bölüm açılmaz.',null],
    ['Koçluk ve içselleştirme','Ana videolar bitince, eğitimin tamamlandığı gün.','Koçluk ve İçselleştirme Soruları'],
    ['Uygulama ve kazanç','Rol çalışması, tarihli müşteri çalışmaları, fiyat analizleri, hedefler. Siz onaylarsınız.','Gelişim ve Kazanç Aktiviteleri']];
  return h('div',{class:'flow4'},A.map(([b,p,d],i)=>h('div',null,h('span',{class:'n'},h('i',null,String(i+1)),'Aşama'),h('b',null,b),h('p',null,p),d?h('span',{class:'doc-c'},ic('doc'),d):null)));
}
function chapterList(t){
  const F=flow(t),ul=h('ul',{class:'chl'});let last=null;
  F.forEach((s,i)=>{if(s.k!==last){ul.append(h('li',{class:'sh'},STN[s.k]));last=s.k;}
    const w=PREV[t.id].has(i);
    ul.append(h('li',null,h('span',{class:'cd'},s.c||''),h('span',null,s.a),h('span',{class:'sm mu num',style:'display:flex;gap:8px;align-items:center;justify-content:flex-end'},fmtT(dur(t,i)),w?h('span',{class:'ok',title:'İzlendi'},ic('tick')):h('span',{style:'width:18px'}))));});
  return ul;
}
function docsList(t){
  return h('div',{class:'docs'},DOCN.map(([k,n,s],i)=>{const ok=docOk(t.id,i);
    return h('div',{class:'doc','data-lock':String(!ok)},h('span',{class:'pdf'},'PDF'),h('div',{class:'t'},h('b',null,n),h('span',null,ok?s:'Hazırlanıyor; eklenince burada açılır'),
        k==='akt'?h('button',{class:'lnk',type:'button',style:'margin-top:4px;font-size:13px;justify-self:start',onclick:()=>openActEdit(t.id)},ic('edit'),OFFACT[t.id]?'Ofisinizin sürümünü düzenleyin':'Ofisinize uyarlayın'):null),
      ok?btn('btn-w btn-xs','Aç',()=>openDoc(t.id,k)):null);}));
}
function runsList(t){
  const rs=RUNS.filter(r=>r.tr===t.id).sort((a,b)=>a.days[0]-b.days[0]);
  if(!rs.length)return empty('Henüz uygulanmadı','Bir grupla takvime koyduğunuzda burada görünür.',btn('btn-k btn-xs','Oturum planla',()=>openPlan({tr:t.id})));
  return h('ul',{class:'ls'},rs.map(r=>{const st=r.st==='done'?chip('ok','tick','Tamamlandı'):r.st==='live'?chip('wait','clock','Devam ediyor'):chip('ln',null,'Planlandı');
    return h('li',null,dateBadge(r.days[0]),h('div',{class:'t'},h('b',null,r.tel?'Telafi: '+names(r.mem):GRM[r.g].n),h('span',null,TPL[r.tpl].n+(r.days.length>1?', '+r.days.map(dd).join(' ve '):''))),st);}));
}
function openDoc(id,k){
  // Gerçek girişte yüklenen PDF açılır; aktivite belgesi ofisin listesinden üretilir (varsa PDF'i de sunulur).
  if(realAny()&&k!=='akt'){pdfAc(id,k);return;}
  const t=TRM[id],n=DOCN.find(x=>x[0]===k)[1];
  const paper=h('div',{class:'paper doc-p'},h('div',{class:'doc-cv'},h('div',null,poster(t,{sm:1})),h('div',null,h('div',{class:'p-wm'},h('span',null,'BARIŞ KILIÇARSLAN ·'),' ',h('span',null,'MASTERCLASS AKADEMİ')),h('h2',null,n),h('p',null,t.t))));
  if(k==='not'){paper.append(h('div',null,h('span',{class:'ex'},'Örnek düzen')),h('p',{class:'sm mu',style:'margin:0'},'Her bölümde aklınızda kalanı ve sahada deneyeceğinizi yazın.'));flow(t).filter(s=>s.k==='ana').forEach(s=>paper.append(h('div',{class:'nl'},h('b',null,stepName(s)),h('i'),h('i'))));}
  if(k==='koc'){paper.append(h('div',null,h('span',{class:'ex'},'Örnek düzen')),h('p',{class:'sm mu',style:'margin:0'},'Ana videolar bitince, eğitimin tamamlandığı gün mentorla çalışılır.'));['Bu eğitimden sahada hemen uygulayacağın üç şey ne?','Hangi bölüm seni en çok zorladı, neden?','Bu hafta hangi müşteriyle, hangi cümleyle başlayacaksın?','Bir ay sonra hangi sonucu görmek istiyorsun?'].forEach(q=>paper.append(h('div',{class:'nl'},h('b',null,q),h('i'),h('i'),h('i'))));}
  if(k==='akt'){paper.append(h('p',{class:'sm mu',style:'margin:0'},OFFACT[id]?'Ofisinizin sürümü.':'Örnek aktiviteler. Ofisinize uyarlayabilirsiniz.'));actTpl(id).forEach(([ty,tx,nn],i)=>paper.append(h('div',{class:'nl'},h('b',null,(i+1)+'. '+tx),h('span',{class:'sm mu'},ty+', '+dueLabel(nn)),h('i'))));paper.append(h('div',{class:'q'},'Mentor onayı ve tarih',h('small',null,'Mentor işaretleyince Başarı Sertifikası hakkı doğar.')));}
  modal({t:n,s:t.t,body:paper,w:900,foot:[h('span',{class:'sp'},ic('doc'),'Oturumda gruba dağıtılır. Kâğıda basmak için yazdırın.'),k==='akt'&&realAny()&&DOCS[id]&&DOCS[id].akt?btn('btn-o btn-s',[ic('doc'),'Barış Kılıçarslan’ın PDF’i'],()=>pdfAc(id,'akt')):null,k==='akt'?btn('btn-o btn-s',[ic('edit'),'Uyarla'],()=>{closeModal();openActEdit(id);}):null,btn('btn-k btn-s',[ic('print'),'Yazdır'],()=>printNode(paper.cloneNode(true)))]});
}
function openActEdit(id){
  const t=TRM[id];let L=actTpl(id).map(x=>x.slice());
  const list=h('div',{class:'st-s'});
  const draw=()=>{list.replaceChildren(...L.map((it,i)=>h('div',{class:'pn',style:'padding:14px;border-radius:16px;display:grid;gap:10px'},
    h('div',{class:'fld'},h('label',{for:'ae'+i},(i+1)+'. aktivite'),h('textarea',{id:'ae'+i,rows:'2',maxlength:'160',oninput:e=>{L[i][1]=e.target.value;}},it[1])),
    h('div',{class:'fr'},h('div',{class:'fld'},h('label',{for:'at'+i},'Tür'),sel('at'+i,ACTTY.map(x=>[x,x]),it[0],v=>{L[i][0]=v;})),h('div',{class:'fld'},h('label',{for:'ad'+i},'Süre'),sel('ad'+i,[[0,'Oturum günü'],[3,'3 gün'],[7,'7 gün'],[14,'14 gün'],[21,'21 gün'],[30,'30 gün']],it[2],v=>{L[i][2]=+v;}))),
    L.length>1?h('div',null,h('button',{class:'lnk mu',type:'button',onclick:()=>{L.splice(i,1);draw();}},'Bu aktiviteyi kaldır')):null)));};
  draw();
  drawer({t:'Gelişim ve Kazanç Aktiviteleri',s:t.t+'. Örnekleri ofisinize uyarlayın; değişiklik yalnız sizin ofisinizde geçerli olur.',w:600,
    body:[list,h('div',null,btn('btn-g btn-s',[ic('plus'),'Aktivite ekle'],()=>{if(L.length<6){L.push(['Hedef','',7]);draw();}}))],
    foot:[h('button',{class:'lnk mu sp',type:'button',onclick:()=>{L=ACTS[id].map(x=>x.slice());draw();}},'Örneğe dön'),btn('btn-k','Kaydet',()=>{const c=L.filter(x=>x[1].trim()).map(x=>[x[0],x[1].trim(),x[2]]).sort((a,b)=>a[2]-b[2]);if(!c.length)return;OFFACT[id]=c;closeDrawer();toast('Aktiviteler ofisiniz için kaydedildi.');rerender();})]});
}

/* =================== TAKVİM =================== */
let calY=T0.getFullYear(),calM=T0.getMonth();
VIEWS.mentor.takvim=()=>vTakvim(false);
VIEWS.broker.takvim=()=>vTakvim(true);
function sessionsOn(d){const o=[];RUNS.forEach(r=>r.days.forEach((x,i)=>{if(sameDay(x,d))o.push({r,i});}));return o;}
function vTakvim(ro){
  const root=h('div');
  root.append(ph('Takvim',ro?'Ofisinizin oturumları. Planlamayı mentor yapar; gerekirse mentor görevini üstlenebilirsiniz.':'Eğitimi bir grupla takvime koyun: tek gün ya da iki yarım gün.',ro?[]:[btn('btn-k btn-s',[ic('plus'),'Oturum planla'],()=>openPlan())]));
  const f1=new Date(calY,calM,1),off=(f1.getDay()+6)%7,start=plus(f1,-off),dim=new Date(calY,calM+1,0).getDate(),rows=Math.ceil((off+dim)/7);
  const cal=h('div',{class:'cal'});
  for(let i=0;i<rows*7;i++){const d=plus(start,i);
    const cell=h('div',{class:(d.getMonth()!==calM?'o ':'')+(sameDay(d,T0)?'tod':'')},h('span',{class:'dn'},String(d.getDate())));
    sessionsOn(d).forEach(({r,i:k})=>cell.append(h('button',{class:'ev'+(df(d)<0?' past':''),type:'button',style:'--gc:'+GRM[r.g].c,onclick:()=>openSes(r.id,k)},(r.tel?'Telafi: ':'')+TRM[r.tr].s+(r.days.length>1?' '+(k+1)+'/'+r.days.length:''),h('small',null,r.tel?names(r.mem):GRM[r.g].n),h('span',{class:'sr'},', '+dd(d)))));
    cal.append(cell);}
  const mv=n=>{calM+=n;if(calM<0){calM=11;calY--;}if(calM>11){calM=0;calY++;}rerender();};
  const left=h('section',{class:'pn'},
    h('div',{class:'cal-h'},h('h2',null,AY[calM]+' '+calY),btn('btn-g btn-s','Bugün',()=>{calY=T0.getFullYear();calM=T0.getMonth();rerender();}),h('button',{class:'icb',type:'button','aria-label':'Önceki ay',onclick:()=>mv(-1)},ic('left')),h('button',{class:'icb',type:'button','aria-label':'Sonraki ay',onclick:()=>mv(1)},ic('chev'))),
    h('div',{class:'cal-w','aria-hidden':'true'},GK.map(x=>h('span',null,x))),cal,
    h('div',{class:'lgd',style:'margin-top:14px'},GR.map(g=>h('span',{style:'--sc:'+g.c},h('i'),g.n))));
  root.append(h('div',{class:'g2'},left,h('div',{class:'st'},pn('Yaklaşan oturumlar',null,upcomingList()),pn('Oturum şablonları',null,h('div',{class:'tpl'},Object.values(TPL).map(v=>h('div',null,h('b',null,v.n),h('span',{class:'sm mu'},v.d),h('ol',null,v.ol.map(x=>h('li',null,x))))))))));
  return root;
}
function upcomingList(){
  const L=[];RUNS.forEach(r=>r.days.forEach((d,i)=>{if(i>=r.dd&&df(d)>=0)L.push({r,i,d});}));L.sort((a,b)=>a.d-b.d);
  if(!L.length)return empty('Yaklaşan oturum yok');
  return h('ul',{class:'ls'},L.slice(0,6).map(({r,i,d})=>h('li',null,dateBadge(d),h('div',{class:'t'},h('b',null,(r.tel?'Telafi: ':'')+TRM[r.tr].t),h('span',{class:'gl'},gdot(r.g),(r.tel?names(r.mem):GRM[r.g].n)+(r.days.length>1?', '+(i+1)+'. gün':'')+', '+rel(d)+' 09:30')),h('button',{class:'icb',type:'button','aria-label':'Ayrıntı',onclick:()=>openSes(r.id,i)},ic('chev')))));
}
function openSes(id,i){
  const r=RM(id),t=TRM[r.tr],d=r.days[i],ro=S.role==='broker',past=i<r.dd,next=i===r.dd&&r.st!=='done';
  let nd=iso(d);
  const att=past?h('div',{class:'atl',style:'display:grid;gap:6px'},r.mem.map(c=>{const v=(ATT[r.id][c]||[])[i];return h('div',{class:'who',style:'justify-content:space-between'},h('span',{class:'who'},av(COM[c],'s'),h('span',null,COM[c].n)),v===1?chip('ok','tick','Katıldı'):chip('crit','x','Katılmadı'));})):h('div',{class:'avs'},r.mem.map(c=>av(COM[c],'s')));
  const body=[
    h('div',{style:'display:grid;grid-template-columns:92px minmax(0,1fr);gap:18px;align-items:center'},poster(t,{sm:1}),h('dl',{class:'kv',style:'grid-template-columns:90px minmax(0,1fr)'},h('dt',null,'Grup'),h('dd',null,r.tel?'Telafi':glab(r.g)),h('dt',null,'Tarih'),h('dd',null,relL(d)+', 09:30'),h('dt',null,'Şablon'),h('dd',null,TPL[r.tpl].n),h('dt',null,'İçerik'),h('dd',null,dayDesc(t,r.tpl,i,r)))),
    h('div',{class:'sec'},h('div',{class:'sec-t'},h('h3',null,'Katılım'),past?null:h('span',{class:'sm mu'},r.mem.length+' danışman')),att,past?null:h('p',{class:'sec-n',style:'margin:0'},'Katılım oturumda tek dokunuşla işaretlenir.')),
    !ro&&!past?h('div',{class:'fld'},h('label',{for:'sesD'},'Tarihi değiştir'),h('input',{id:'sesD',type:'date',value:nd,onchange:e=>{nd=e.target.value;}})):null
  ];
  const foot=[];
  if(!ro&&!past)foot.push(btn('btn-o btn-s','Tarihi kaydet',()=>{if(!nd)return;r.days[i]=fromIso(nd);closeDrawer();toast('Oturum '+dd(r.days[i])+' tarihine taşındı.');rerender();}));
  if(!ro&&next)foot.push(btn('btn-k btn-s',[ic('play'),'Oturumu başlat'],()=>{closeDrawer();openSession(r.id,'ses');}));
  drawer({t:t.t,s:(r.days.length>1?(i+1)+'. gün, ':'')+ddy(d),head:h('div',null,past?chip('ok','tick','Tamamlandı'):next&&r.st==='live'?chip('wait','clock','Sıradaki gün'):chip('ln',null,'Planlandı')),body,foot});
}
function openPlan(pre={}){
  const tel=pre.tel;
  let tr=pre.tr||(tel?RM(tel.run).tr:'iu'),g=pre.g||(tel?COM[tel.c].g:(GRM.b?'b':(GR[1]||GR[0]||{}).id)),tpl=pre.tpl||'iki',d1=iso(wd(7)),d2=iso(nwd(fromIso(d1)));
  const body=h('div',{class:'st'});
  const draw=()=>{const p=prevPct(tr);fill(body,
    tel?h('div',{class:'q'},'Telafi: '+COM[tel.c].n+', '+TRM[tr].t+' '+(tel.day+1)+'. gün bölümleri.',h('small',null,'Danışman telafiyi sizinle ya da başka bir grubun oturumunda izler.')):null,
    tel?null:h('div',{class:'fld'},h('label',{for:'plTr'},'Eğitim'),sel('plTr',TR.map(x=>[x.id,x.t]),tr,v=>{tr=v;draw();})),
    p<100?h('div',{class:'lockn'},ic('eye'),'Bu eğitimin %'+p+' kadarını izlediniz. Oturumdan önce tamamını izleyin.'):h('div',{class:'lockn',style:'color:var(--okT)'},ic('tick'),'Bu eğitimi tamamen izlediniz.'),
    tel?null:h('div',{class:'fld'},h('label',{for:'plG'},'Grup'),sel('plG',GR.map(x=>[x.id,x.n+' ('+inG(x.id).length+' danışman)']),g,v=>{g=v;})),
    tel?null:h('div',{class:'fld'},h('span',{class:'lab'},'Oturum şablonu'),h('div',{class:'opt',role:'radiogroup','aria-label':'Oturum şablonu'},['iki','tek','yarim'].map(k=>h('label',{class:'oc'},h('input',{type:'radio',name:'pltpl',value:k,checked:k===tpl||null,onchange:()=>{tpl=k;draw();}}),h('span',{class:'t'},h('b',null,TPL[k].n+(k==='iki'?' (önerilen)':'')),h('span',null,TPL[k].d)))))),
    h('div',{class:'fr'},h('div',{class:'fld'},h('label',{for:'plD1'},tpl==='iki'?'1. gün':'Tarih'),h('input',{id:'plD1',type:'date',value:d1,onchange:e=>{d1=e.target.value;if(d1){d2=iso(nwd(fromIso(d1)));const x=$('#plD2');if(x)x.value=d2;}}})),tpl==='iki'?h('div',{class:'fld'},h('label',{for:'plD2'},'2. gün'),h('input',{id:'plD2',type:'date',value:d2,onchange:e=>{d2=e.target.value;}})):null),
    h('div',{class:'lockn'},ic('clock'),'Saat 09:30. Koçluk, eğitimin bittiği gün yapılır.'));};
  draw();
  drawer({t:tel?'Telafi planla':'Oturum planla',s:tel?null:'Eğitimler arasında zorunlu sıra yok; ihtiyaca göre seçin.',body,foot:[btn('btn-o','Vazgeç',closeDrawer),btn('btn-k','Takvime ekle',()=>{
    if(!d1||(tpl==='iki'&&!d2))return;
    const days=[fromIso(d1)];if(tpl==='iki')days.push(fromIso(d2));
    const r={id:realO()?uuid():'r'+(RUNNO++),tr,g:tel?COM[tel.c].g:g,days,tpl:tel?'yarim':tpl,st:'plan',dd:0,mem:tel?[tel.c]:inG(g).map(c=>c.id),tel:!!tel,telDay:tel?tel.day:null};
    if(!r.mem.length){toast('Bu grupta aktif danışman yok.');return;}
    RUNS.push(r);if(tel)TELAFI[tel.run+':'+tel.c+':'+tel.day]=r.id;
    calY=days[0].getFullYear();calM=days[0].getMonth();
    closeDrawer();toast((tel?'Telafi':TRM[tr].s+' oturumu')+' '+dd(days[0])+' tarihine eklendi.');
    if(S.page==='takvim')rerender();else go('takvim');})]});
}

/* =================== DANIŞMANLAR =================== */
let dnF='all';
VIEWS.mentor.danismanlar=()=>vDanismanlar(false);
VIEWS.broker.danismanlar=()=>vDanismanlar(true);
function vDanismanlar(ro){
  const root=h('div');
  root.append(ph('Danışmanlar',ro?'Ofisinizin danışmanları ve gelişimleri. Danışmanlara ayrı hesap açılmaz.':'Danışmanlara hesap açılmaz. Adlarını ekleyip gruplara ayırırsınız; ayrılanların geçmişi saklanır.'));
  if(!ro)root.append(addRow());
  const cnt=k=>k==='all'?active().length:k==='left'?CO.filter(c=>c.left).length:inG(k).length;
  root.append(h('div',{class:'bar-row'},seg([['all','Tümü'],...GR.map(g=>[g.id,g.n]),['left','Ayrılanlar']].map(([k,l])=>[k,l,cnt(k)]),dnF,k=>{dnF=k;rerender();},'Grup')));
  const list=dnF==='all'?active():dnF==='left'?CO.filter(c=>c.left):inG(dnF);
  const tb=h('tbody');
  list.forEach(c=>{
    const rs=runsOf(c.id).filter(r=>r.st!=='plan');
    const late=rs.reduce((a,r)=>a+lateItems(r,c.id).length,0);
    const open=rs.reduce((a,r)=>{const d=actDone(r,c.id);return a+(d?d.filter(x=>!x).length:0);},0);
    const pa=privAvg(c.id),cs=certsOf(c.id).length;
    tb.append(h('tr',{class:'cl',tabindex:'0',onclick:()=>openCons(c.id),onkeydown:e=>{if(e.key==='Enter')openCons(c.id);}},
      h('td',null,h('div',{class:'who'},av(c),h('div',{class:'t'},h('b',null,c.n),h('span',null,c.left?'Ayrıldı, '+dd(c.left):tenure(c.since))))),
      h('td',{'data-l':'Grup'},glab(c.g)),
      h('td',{'data-l':'Eğitimler'},h('span',{class:'dots','aria-hidden':'true'},rs.map(r=>h('i',{class:basOk(r,c.id)?'gilt':katOk(r,c.id)?'on':null,'data-tip':TRM[r.tr].t+': '+(basOk(r,c.id)?'uygulamalar tamam':katOk(r,c.id)?'katılım ve koçluk tamam':r.st==='live'?'devam ediyor':'eksik var')}))),' ',h('span',{class:'sm'},(n=>n?n+' tamam':(rs.some(r=>r.st==='live')?'Sürüyor':'Henüz yok'))(rs.filter(r=>katOk(r,c.id)).length))),
      h('td',{'data-l':'Aktivite'},late?chip('crit','alert',late+' gecikti'):open?chip('wait','clock',open+' açık'):h('span',{class:'mu'},'—')),
      h('td',{'data-l':'Sertifika'},cs?h('span',{class:'gl',style:'color:var(--gilt2)'},ic('award'),String(cs)):h('span',{class:'mu'},'—')),
      h('td',{'data-l':'Özel puan',class:'num'},pa?trn(pa)+' / 5':h('span',{class:'mu'},'—')),
      h('td',{class:'r hm'},ic('chev'))));
  });
  root.append(h('section',{class:'pn'},list.length?h('div',{class:'tw'},h('table',{class:'tbl rsp'},h('thead',null,h('tr',null,['Danışman','Grup','Eğitimler','Aktivite','Sertifika',h('span',{class:'gl',title:'Sadece mentor ve broker görür'},ic('lock'),'Özel puan'),''].map(x=>h('th',null,x)))),tb)):empty('Bu grupta danışman yok')));
  return root;
}
function addRow(){
  let g=GRM.y?'y':(GR[GR.length-1]||{}).id;
  const inp=h('input',{class:'inp',type:'text',placeholder:'Ad soyad',maxlength:'60','aria-label':'Yeni danışmanın adı soyadı',autocomplete:'off'});
  const s=sel(null,GR.map(x=>[x.id,x.n]),g,v=>{g=v;});s.className='inp';s.style.cssText='width:auto;min-width:170px';s.setAttribute('aria-label','Grup');
  return h('form',{class:'pn',style:'display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:12px 12px 12px 16px;margin-bottom:18px',onsubmit:e=>{e.preventDefault();
      const n=inp.value.trim().replace(/\s+/g,' ');if(n.length<3||!/\s/.test(n)){inp.classList.add('shake');inp.focus();setTimeout(()=>inp.classList.remove('shake'),400);toast('Ad ve soyadı birlikte yazın.');return;}
      if(!GRM[g]){toast('Önce bir grup seçin.');return;}const id=nid('c');const c={id,n,g,since:new Date(T0),left:null};CO.push(c);COM[id]=c;BIZ[id]=[0,0,0,0];dnF=g;toast(n+', '+GRM[g].n+' grubuna eklendi.');rerender();}},
    h('span',{class:'li-i'},ic('plus')),h('div',{style:'flex:1;min-width:200px'},inp),s,h('button',{class:'btn btn-k btn-s',type:'submit'},'Danışman ekle'));
}
function actChip(r,c){
  if(!ACT[r.id])return r.st==='live'?null:chip('ln',null,'Aktiviteler');
  const d=actDone(r,c),L=lateItems(r,c);
  if(d.every(Boolean))return chip('ok','tick','Aktiviteler');
  if(L.length)return chip('crit','alert','Aktivite gecikti');
  return chip('wait','clock','Aktiviteler '+d.filter(Boolean).length+'/'+d.length);
}
function journeyRow(r,c){
  const cs=CERT.filter(x=>x.c===c&&x.run===r.id);
  return h('li',{style:'align-items:flex-start'},h('div',{class:'thumb'},poster(TRM[r.tr],{sm:1})),h('div',{class:'t'},h('b',null,TRM[r.tr].t),h('span',null,r.st==='live'?'Devam ediyor':dd(lastDay(r))+(r.tel?', telafi':'')),
    h('div',{style:'display:flex;gap:6px;flex-wrap:wrap;margin-top:7px'},
      attAll(r,c)?chip('ok','tick','Katılım'):r.st==='live'?chip('ln',null,'Katılım sürüyor'):chip('crit','alert','Katılım eksik'),
      r.st==='done'?(coachOk(r,c)?chip('ok','tick','Koçluk'):chip('wait','clock','Koçluk')):null,
      actChip(r,c),cs.map(x=>chip('gilt','award',x.ty==='kat'?'Katılım sert.':'Başarı sert.')))));
}
function openCons(id){
  const c=COM[id],ro=S.role==='broker';
  const rs=runsOf(id).filter(r=>r.st!=='plan').sort((a,b)=>lastDay(b)-lastDay(a));
  const body=h('div',{class:'st',style:'gap:30px'},
    h('div',{class:'sec'},h('div',{class:'sec-t'},h('h3',null,'Eğitim yolculuğu')),rs.length?h('ul',{class:'ls'},rs.map(r=>journeyRow(r,id))):h('p',{class:'sec-n',style:'margin:0'},'Henüz bir eğitime katılmadı.')),
    privSection(id,rs,ro),bizSection(id,ro),needSection(id,ro));
  const head=h('div',{style:'display:flex;align-items:center;gap:12px;margin-bottom:4px'},av(c,'l'),c.left?chip('ln',null,'Ayrıldı, '+dd(c.left)):glab(c.g));
  const foot=[];
  if(!ro&&!c.left){
    const gs=sel('cnsG',GR.map(x=>[x.id,x.n]),c.g,v=>{c.g=v;toast(c.n+', '+GRM[v].n+' grubuna taşındı.');rerender();});gs.className='inp';gs.style.cssText='width:auto;height:36px;font-size:13.5px';gs.setAttribute('aria-label','Grubu değiştir');
    foot.push(h('button',{class:'lnk mu sp',type:'button',onclick:()=>confirmBox('Ayrıldı olarak işaretlensin mi?',c.n+' aktif listeden çıkar. Katılım, sertifika ve rapor geçmişi saklanır.','Ayrıldı olarak işaretle',()=>{c.left=new Date(T0);closeDrawer();toast(c.n+' aktif listeden çıkarıldı; geçmişi saklanıyor.');rerender();},true)},'Ayrıldı olarak işaretle'),gs);
  }
  if(!ro&&c.left)foot.push(h('button',{class:'lnk mu sp',type:'button',onclick:()=>{c.left=null;closeDrawer();toast(c.n+' yeniden aktif.');rerender();}},'Yeniden aktif yap'));
  foot.push(btn('btn-k btn-s',[ic('doc'),'Gelişim raporu'],()=>openReport(id)));
  drawer({t:c.n,s:c.left?'Geçmiş kayıtlar saklanıyor.':tenure(c.since)+'. '+GRM[c.g].d+'.',head,body,foot,w:600});
}
function privSection(id,rs,ro){
  const done=rs.filter(r=>r.st==='done');
  const box=h('div',{class:'sec'});
  let cur=done[0]&&done[0].id;
  const draw=()=>{
    box.replaceChildren(h('div',{class:'sec-t'},h('h3',null,'Özel değerlendirme'),chip('lock','lock','Sadece mentor ve broker görür')));
    if(!done.length){box.append(h('p',{class:'sec-n',style:'margin:0'},'Eğitim tamamlanınca 1-5 arası puanlanır.'));return;}
    if(done.length>1)box.append(seg(done.map(r=>[r.id,TRM[r.tr].s]),cur,k=>{cur=k;draw();},'Eğitim'));
    const key=cur+':'+id,sc=SC[key]||(SC[key]={q:[0,0,0,0],n:''});
    const saved=h('span',{class:'sm',style:'color:var(--okT);opacity:0;transition:opacity .2s','aria-live':'polite'},'Kaydedildi');
    const ping=()=>{saved.style.opacity='1';clearTimeout(saved._t);saved._t=setTimeout(()=>saved.style.opacity='0',1400);};
    box.append(h('div',null,CRIT.map((k,i)=>h('div',{class:'crit-row'},h('span',null,k),rate(sc.q[i],v=>{sc.q[i]=v;ping();},ro,k)))),
      h('div',{class:'fld'},h('label',{for:'pvN'},'Tek cümle not'),h('input',{id:'pvN',type:'text',maxlength:'140',placeholder:ro?'Not yok':'İsteğe bağlı',value:sc.n,disabled:ro||null,oninput:e=>{sc.n=e.target.value;ping();}})),
      h('div',{style:'display:flex;justify-content:space-between;gap:12px;align-items:center'},h('p',{class:'sec-n',style:'margin:0'},'Eğitimdeki tutumu anlatır; sahadaki satış başarısından ayrıdır.'),saved));
  };
  draw();return box;
}
function bizSection(id,ro){
  const v=BIZ[id]||(BIZ[id]=[0,0,0,0]);
  return h('div',{class:'sec'},h('div',{class:'sec-t'},h('h3',null,'İş sonuçları'),h('span',{class:'sm mu'},'İsteğe bağlı, bu ay')),
    h('div',{class:'g4 ctr-g'},BZN.map((n,i)=>{const val=h('b',{'aria-live':'polite'},String(v[i]));
      const ch=d=>{v[i]=Math.max(0,v[i]+d);val.textContent=String(v[i]);};
      return h('div',{class:'ctr'},h('span',{class:'t'},n),ro?null:h('button',{type:'button','aria-label':n+' azalt',onclick:()=>ch(-1)},ic('minus')),val,ro?null:h('button',{type:'button','aria-label':n+' artır',onclick:()=>ch(1)},ic('plus')));})),
    h('p',{class:'sec-n',style:'margin:0'},'Girmek zorunlu değil. Girilirse rapora ve karşılaştırmaya eklenir.'));
}
function needSection(id,ro){
  const L=TR.filter(t=>NEED[id+':'+t.id]);
  return h('div',{class:'sec'},h('div',{class:'sec-t'},h('h3',null,'İhtiyaç değerlendirmeleri'),ro?null:btn('btn-g btn-xs',[ic('plus'),'Değerlendir'],()=>openAssess({c:id}))),
    L.length?h('ul',{class:'ls'},L.map(t=>{const n=NEED[id+':'+t.id],a=needPct(n.pre),b=n.post?needPct(n.post):null;
      return h('li',null,h('div',{class:'t'},h('b',null,t.t),h('span',null,b!=null?'Öncesi %'+a+', sonrası %'+b+' ('+(b<=a?'−':'+')+Math.abs(a-b)+' puan)':'Eğitim öncesi %'+a+', '+lvl(a).toLocaleLowerCase('tr')+' ihtiyaç')),
        ro?null:h('button',{class:'icb',type:'button','aria-label':t.t+' değerlendirmesini aç',onclick:()=>openAssess({c:id,tr:t.id})},ic('chev')));})):h('p',{class:'sec-n',style:'margin:0'},'Henüz değerlendirme yok.'));
}
