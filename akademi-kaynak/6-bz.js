
/* =================== BROKER =================== */
const monthSessions=()=>RUNS.reduce((a,r)=>a+r.days.filter(d=>d.getMonth()===T0.getMonth()&&d.getFullYear()===T0.getFullYear()).length,0);
function membershipMini(){
  const tot=df(OFF.end)-df(OFF.start),used=-df(OFF.start),left=df(OFF.end);
  return h('div',{class:'st-s'},h('div',{style:'display:flex;justify-content:space-between;align-items:baseline;gap:10px'},h('b',{style:'font:500 30px/1 var(--fd);letter-spacing:-.04em'},left+' gün'),h('span',{class:'sm mu'},'Bitiş '+ddy(OFF.end))),
    bar(pct(used,tot),'Üyelik süresi'),h('span',{class:'sm mu'},'12 aylık üyelik, kademe '+OFF.tier+' danışman. '+active().length+' aktif danışman.'));
}
VIEWS.broker.ozet=()=>{
  const root=h('div'),ac=awaitingComment();
  root.append(ph('Ofis özeti','Takvim, danışmanlar, ihtiyaç değerlendirmeleri ve gelişim raporları. Yalnız sizin ofisiniz.'));
  const done=realRuns().filter(r=>r.st==='done').length;
  root.append(h('div',{class:'sum'},[[active().length,'Aktif danışman'],[monthSessions(),'Bu ay oturum günü'],[done,'Tamamlanan eğitim'],[CERT.length,'Verilen sertifika']].map(([v,l])=>h('div',null,h('b',null,String(v)),h('span',null,l)))));
  const left=h('div',{class:'st'},
    pn('Yorumunuzu bekleyen raporlar',ac.length?h('span',{class:'c'},String(ac.length)):null,ac.length?h('ul',{class:'ls'},ac.map(c=>h('li',null,av(COM[c]),h('div',{class:'t'},h('b',null,COM[c].n),h('span',null,PPL.mentor.n+' paylaştı, '+ago(REP[c].sh))),btn('btn-k btn-xs','Raporu aç',()=>openReport(c))))):empty('Bekleyen rapor yok','Mentor bir rapor paylaştığında burada görünür.')),
    groupsPanel());
  const right=h('div',{class:'st'},pn('Üyelik',btn('btn-g btn-xs','Ayrıntı',()=>go('uyelik')),membershipMini()),pn('Yaklaşan oturumlar',null,upcomingList()),
    pn('Mentor',null,h('div',{class:'st-s'},h('div',{class:'who'},h('span',{class:'av k'},ini(PPL.mentor.n)),h('div',{class:'t'},h('b',null,PPL.mentor.n),h('span',null,'Akademiyi ofiste yürütüyor'))),
      h('p',{class:'sm mu',style:'margin:0'},'Gerekirse mentor görevini siz de üstlenebilirsiniz; aynı panelden yönetirsiniz.'),h('div',null,btn('btn-o btn-s',[ic('swap'),'Mentor görevini üstlen'],()=>{S.asBroker=true;nav('mentor/panel');})))));
  root.append(h('div',{class:'g2'},left,right));
  return root;
};
VIEWS.broker.uyelik=()=>{
  const root=h('div');
  root.append(ph('Üyelik','Masterclass Akademi ofis üyeliği. Üyelikleri ve yenilemeleri akademi merkezi açar.'));
  const rem=[90,60,30].map(n=>({n,d:plus(OFF.end,-n)}));
  root.append(h('div',{class:'g2'},
    h('div',{class:'st'},pn('Masterclass Akademi, 12 ay',chip('ok','tick','Aktif'),h('div',{class:'st'},membershipMini(),
      h('dl',{class:'kv'},h('dt',null,'Kademe'),h('dd',null,OFF.tier+' danışman'),h('dt',null,'Aktif danışman'),h('dd',null,active().length+' / 25'),h('dt',null,'Başlangıç'),h('dd',null,ddy(OFF.start)),h('dt',null,'Bitiş'),h('dd',null,ddy(OFF.end))),
      h('p',{class:'sm mu',style:'margin:0'},'Yıl içinde danışman sayısı kademeyi aşarsa değişiklik yenilemede ele alınır. Yeni danışmanlar üyeliğe dahil olur; ayrılanların geçmişi saklanır.'))),
      pn('Üyelikte neler var',null,h('ul',{class:'ls'},[['book','Akademideki bütün eğitimler, aktif üyelikte tekrar tekrar grupla'],['doc','Her eğitimde üç belge'],['users','Mentor paneli, gelişim raporu ve üç sertifika'],['spark','Barış AI ile grup provası'],['key','Klasik Eğitimler, bonus olarak']].map(([i,txt])=>h('li',null,h('span',{class:'li-i'},ic(i)),h('div',{class:'t'},h('span',{style:'color:var(--tx);font-size:14.5px'},txt))))))),
    h('div',{class:'st'},pn('Yenileme',null,h('div',{class:'st-s'},h('ul',{class:'ls'},rem.map(x=>h('li',null,dateBadge(x.d),h('div',{class:'t'},h('b',null,x.n+' gün kala hatırlatma'),h('span',null,'E-posta: broker ve mentor')),df(x.d)<0?chip('ok','tick','Gönderildi'):chip('ln',null,'Planlandı')))),
      h('p',{class:'sm mu',style:'margin:0'},'İkinci yıl için yenileme avantajı, yenileme döneminde bildirilir.'),h('div',null,btn('btn-k btn-s','Yenileme görüşmesi iste',()=>toast('Talebiniz akademi merkezine iletildi.'))))),
      pn('Ek eğitimler',null,h('div',{class:'st-s'},h('p',{class:'sm mu',style:'margin:0'},'Gelişim ve Kazanç Mağazası’ndaki kısa eğitimler akademi üyelerine avantajlı fiyatla sunulur.'),h('div',null,h('a',{class:'btn btn-o btn-s',href:'index.html#magaza'},'Mağazaya git')))))));
  return root;
};

/* =================== MERKEZ =================== */
const actOffs=()=>OFFS.filter(o=>o.st==='aktif');
VIEWS.merkez.genel=()=>{
  const root=h('div'),A=actOffs();
  root.append(ph('Genel bakış','Bütün ofislerin üyelikleri, kullanımları ve gelişim özetleri. Ofislerin özel mentor puanları burada görünmez.'));
  root.append(h('div',{class:'sum'},[[A.length,'Aktif ofis'],[A.reduce((a,o)=>a+o.cons,0),'Aktif danışman'],[A.reduce((a,o)=>a+o.ses,0),'Son 30 gün oturum günü'],[A.reduce((a,o)=>a+o.cert,0),'Verilen sertifika']].map(([v,l])=>h('div',null,h('b',null,String(v)),h('span',null,l)))));
  const mx=Math.max(...A.map(o=>o.ses),1);
  const use=h('div',{class:'hb'},A.slice().sort((a,b)=>b.ses-a.ses).map((o,i)=>[i?h('div',{class:'hb-sep'}):null,h('div',{class:'hb-r'},h('span',null,o.n.replace('RE/MAX Örnek Ofis ','')),h('div',{class:'hb-b'},h('div',{'data-tip':o.n+': son 30 günde '+o.ses+' oturum günü'},h('i',{style:'--sc:#000;width:'+(o.ses/mx*80)+'%'}),h('b',null,String(o.ses)))))]));
  const miss=[['Eğitim Notları',0],['Koçluk ve İçselleştirme Soruları',1],['Gelişim ve Kazanç Aktiviteleri',2]].map(([n,i])=>[n,TR.filter(t=>!MAT[t.id].pdf[i]).length]);
  const ext=TR.filter(t=>!MAT[t.id].ext).length;
  const VS=TR.map(vidStat),vMiss=VS.reduce((x,v)=>x+v.miss.length,0),vPriv=VS.reduce((x,v)=>x+v.priv,0),vOk=!vMiss&&!vPriv;
  const vLi=h('li',null,h('span',{class:'li-i '+(vOk?'ok':'wait')},ic('video')),h('div',{class:'t'},h('b',null,'Ana eğitim videoları'),h('span',null,vOk?'Hepsi Vimeo’da':[vMiss?vMiss+' bölümün videosu Vimeo’da yok':'Hepsi Vimeo’da',vPriv?vPriv+' video özel, gizlilik ayarı bekleniyor':null].filter(Boolean).join('; '))));
  const left=h('div',{class:'st'},pn('Ofis kullanımı',null,use,{sub:'Son 30 günde yapılan oturum günü.'}),
    pn('Eksik belgeler ve videolar',btn('btn-g btn-xs','Eğitimler ve belgeler',()=>go('egitimler')),h('ul',{class:'ls'},vLi,miss.map(([n,k])=>h('li',null,h('span',{class:'li-i '+(k?'wait':'ok')},ic(k?'doc':'tick')),h('div',{class:'t'},h('b',null,n),h('span',null,k?k+' eğitimde bekleniyor':'Hepsi yüklü')))).concat([h('li',null,h('span',{class:'li-i '+(ext?'wait':'ok')},ic('video')),h('div',{class:'t'},h('b',null,'Tanıtım, koçluk ve uygulama videoları'),h('span',null,ext?ext+' eğitimde bekleniyor; ana videolar Vimeo’da':'Hepsi yüklü')))]))));
  const rs=OFFS.filter(o=>o.end&&df(o.end)<=90).sort((a,b)=>a.end-b.end),inv=OFFS.filter(o=>o.st==='davet');
  const right=h('div',{class:'st'},
    pn('Yaklaşan yenilemeler',null,rs.length?h('ul',{class:'ls'},rs.map(o=>h('li',null,h('div',{class:'t'},h('b',null,o.n),h('span',null,'Bitiş '+ddy(o.end))),chip(df(o.end)<=30?'crit':'wait','clock',df(o.end)+' gün')))):empty('90 gün içinde yenileme yok')),
    pn('Bekleyen davetler',null,inv.length?h('ul',{class:'ls'},inv.map(o=>h('li',null,h('span',{class:'li-i'},ic('mail')),h('div',{class:'t'},h('b',null,o.n),h('span',null,'Gönderildi '+ago(o.inv))),btn('btn-g btn-xs','Yeniden gönder',()=>{o.inv=new Date(T0);toast('Davet yeniden gönderildi.');rerender();})))):empty('Bekleyen davet yok')),
    pn('Sertifika doğrula',null,verifyBox()));
  root.append(h('div',{class:'g2'},left,right));
  return root;
};
function ofsDays(o){return o.end?df(o.end):null;}
VIEWS.merkez.ofisler=()=>{
  const root=h('div');
  root.append(ph('Ofisler','Yeni ofisin üyeliğini siz açarsınız; broker ve mentor davetle girer. Ofisler birbirinin verisini görmez.',[btn('btn-k btn-s',[ic('plus'),'Yeni ofis aç'],openNewOffice)]));
  const tb=h('tbody',null,OFFS.map(o=>h('tr',{class:'cl',tabindex:'0',onclick:()=>openOffice(o.id),onkeydown:e=>{if(e.key==='Enter')openOffice(o.id);}},
    h('td',null,h('div',{class:'who'},h('span',{class:'li-i'},ic('building')),h('div',{class:'t'},h('b',null,o.n),h('span',null,o.city)))),
    h('td',{'data-l':'Broker'},o.br||h('span',{class:'mu'},'Davet bekleniyor')),
    h('td',{'data-l':'Mentor'},o.mn||(o.br?h('span',{class:'mu'},'Broker üstleniyor'):h('span',{class:'mu'},'—'))),
    h('td',{'data-l':'Kademe'},o.tier),
    h('td',{'data-l':'Danışman',class:'num'},String(o.cons)),
    h('td',{'data-l':'Tamamlama'},o.st==='aktif'?h('div',{class:'prg',style:'min-width:120px'},bar(o.comp,'Tamamlama'),h('span',{class:'num sm'},'%'+o.comp)):h('span',{class:'mu'},'—')),
    h('td',{'data-l':'Durum'},o.st==='davet'?chip('wait','mail','Davet gönderildi'):ofsDays(o)<=60?chip('wait','clock',ofsDays(o)+' gün kaldı'):chip('ok','tick','Aktif')),
    h('td',{class:'r hm'},ic('chev')))));
  root.append(h('section',{class:'pn'},h('div',{class:'tw'},h('table',{class:'tbl rsp'},h('thead',null,h('tr',null,['Ofis','Broker','Mentor','Kademe','Danışman','Tamamlama','Durum',''].map(x=>h('th',null,x)))),tb))));
  return root;
};
function openOffice(id){
  const o=OFFS.find(x=>x.id===id);
  const body=[h('dl',{class:'kv'},h('dt',null,'Şehir'),h('dd',null,o.city),h('dt',null,'Broker'),h('dd',null,o.br||'Davet bekleniyor'),h('dt',null,'Mentor'),h('dd',null,o.mn||(o.br?'Broker üstleniyor':'—')),h('dt',null,'Kademe'),h('dd',null,o.tier+' danışman'),h('dt',null,'Üyelik'),h('dd',null,o.start?ddy(o.start)+' – '+ddy(o.end):'Davet kabul edilince başlar'))];
  if(o.st==='aktif')body.push(h('div',{class:'sec'},h('div',{class:'sec-t'},h('h3',null,'Kullanım ve gelişim özeti')),
    h('div',{class:'p-kv',style:'margin-top:0'},[[o.cons,'Aktif danışman'],[o.ses,'Son 30 gün oturum'],['%'+o.comp,'Eğitim tamamlama'],[o.cert,'Sertifika']].map(([v,l])=>h('div',null,h('b',null,String(v)),h('span',null,l)))),
    h('div',{class:'lockn'},ic('lock'),'Mentorun özel 1-5 puanları ve notları yalnız o ofisin mentoru ve brokerı içindir; merkezde görünmez.')));
  const foot=[];
  if(o.st==='davet')foot.push(btn('btn-k btn-s',[ic('mail'),'Daveti yeniden gönder'],()=>{o.inv=new Date(T0);closeDrawer();toast('Davet yeniden gönderildi.');rerender();}));
  else foot.push(btn('btn-o btn-s',[ic('refresh'),'Üyeliği bir yıl uzat'],()=>{o.end=plus(o.end,365);if(o.id==='kdk')OFF.end=o.end;closeDrawer();toast(o.n+' üyeliği '+ddy(o.end)+' tarihine uzatıldı.');rerender();}));
  drawer({t:o.n,s:o.st==='davet'?'Davet '+ago(o.inv)+' gönderildi.':'Aktif üyelik',body,foot});
}
function openNewOffice(){
  const v={n:'',city:'İstanbul',tier:'1–25',start:iso(T0),br:'',mn:'',self:false};
  const body=h('div',{class:'st'},
    h('div',{class:'fld'},h('label',{for:'noN'},'Ofis adı'),h('input',{id:'noN',type:'text',placeholder:'RE/MAX ...',autofocus:true,oninput:e=>{v.n=e.target.value;}})),
    h('div',{class:'fr'},h('div',{class:'fld'},h('label',{for:'noC'},'Şehir'),h('input',{id:'noC',type:'text',value:v.city,oninput:e=>{v.city=e.target.value;}})),h('div',{class:'fld'},h('label',{for:'noT'},'Kademe'),sel('noT',TIERS.map(x=>[x,x+' danışman']),v.tier,x=>{v.tier=x;}))),
    h('div',{class:'fld'},h('label',{for:'noS'},'Üyelik başlangıcı'),h('input',{id:'noS',type:'date',value:v.start,onchange:e=>{v.start=e.target.value;}}),h('span',{class:'hint'},'Satış görüşme, sözleşme ve ödemeyle yapılır; üyelik 12 ay sürer.')),
    h('div',{class:'fld'},h('label',{for:'noB'},'Broker e-postası'),h('input',{id:'noB',type:'email',placeholder:'broker@ofis.com',oninput:e=>{v.br=e.target.value;}})),
    h('div',{class:'fld'},h('label',{for:'noM'},'Mentor e-postası'),h('input',{id:'noM',type:'email',placeholder:'mentor@ofis.com',oninput:e=>{v.mn=e.target.value;}}),h('label',{class:'oc',style:'margin-top:4px'},h('input',{type:'checkbox',onchange:e=>{v.self=e.target.checked;$('#noM').disabled=v.self;}}),h('span',{class:'t'},h('b',null,'Mentor görevini broker üstlenecek'),h('span',null,'Broker iki rolü tek panelden yönetir.')))));
  drawer({t:'Yeni ofis aç',s:'Üyelik açılınca broker ve mentora davet e-postası gider.',body,foot:[btn('btn-o','Vazgeç',closeDrawer),btn('btn-k','Üyeliği aç ve davet gönder',()=>{
    if(v.n.trim().length<3){toast('Ofis adını yazın.');$('#noN').focus();return;}
    if(!/^\S+@\S+\.\S+$/.test(v.br)){toast('Broker e-postasını yazın.');$('#noB').focus();return;}
    const s=fromIso(v.start||iso(T0));
    OFFS.push({id:'o'+Date.now().toString(36),n:v.n.trim(),city:v.city.trim()||'—',br:null,mn:null,tier:v.tier,cons:0,start:s,end:plus(s,365),ses:0,st:'davet',comp:0,cert:0,inv:new Date(T0)});
    closeDrawer();toast('Üyelik açıldı; davetler gönderildi.');if(S.page==='ofisler')rerender();else go('ofisler');})]});
}
VIEWS.merkez.uyelikler=()=>{
  const root=h('div');
  root.append(ph('Üyelikler','12 aylık ofis üyelikleri. Bitişten 90, 60 ve 30 gün önce broker ve mentora hatırlatma gider.'));
  const L=OFFS.filter(o=>o.end).sort((a,b)=>a.end-b.end);
  root.append(h('section',{class:'pn'},h('div',{class:'tw'},h('table',{class:'tbl rsp'},h('thead',null,h('tr',null,['Ofis','Kademe','Başlangıç','Bitiş','Kalan','Hatırlatma',''].map(x=>h('th',null,x)))),
    h('tbody',null,L.map(o=>{const n=df(o.end),sent=[90,60,30].filter(x=>n<=x);
      return h('tr',null,h('td',null,h('b',null,o.n)),h('td',{'data-l':'Kademe'},o.tier),h('td',{'data-l':'Başlangıç'},dnum(o.start)),h('td',{'data-l':'Bitiş'},dnum(o.end)),
        h('td',{'data-l':'Kalan'},chip(n<=30?'crit':n<=60?'wait':'ln','clock',n+' gün')),
        h('td',{'data-l':'Hatırlatma',class:'sm'},sent.length?sent.map(x=>x+' gün').join(', ')+' gönderildi':'Henüz yok'),
        h('td',{class:'r'},btn(n<=60?'btn-k btn-xs':'btn-g btn-xs','Yenile',()=>confirmBox('Üyelik yenilensin mi?',o.n+' üyeliği bir yıl uzar. İkinci yıl avantajı ve kademe değişikliği yenileme görüşmesinde belirlenir.','Yenile',()=>{o.end=plus(o.end,365);if(o.id==='kdk')OFF.end=o.end;toast(o.n+' yenilendi.');rerender();}))));}))))));
  root.append(h('div',{class:'lockn',style:'margin-top:14px'},ic('card'),'Online ödeme şimdilik yok; satış görüşme, sözleşme ve ödemeyle yapılır. Altyapı ileride online satışa açılabilir.'));
  return root;
};
VIEWS.merkez.egitimler=()=>{
  const root=h('div');
  root.append(ph('Eğitimler ve belgeler','Eğitim sayısı sınırlı değil. Her eğitimde ana videolar Vimeo’da; tanıtım, koçluk ve uygulama videoları ile üç PDF ayrıca eklenir.',[btn('btn-k btn-s',[ic('plus'),'Yeni eğitim ekle'],openNewTraining)]));
  const dot=(ok,tipT)=>h('i',{class:ok?'on':null,'data-tip':tipT+(ok?': yüklü':': bekleniyor')});
  const tb=h('tbody',null,TR.map(t=>{const m=MAT[t.id];return h('tr',{class:'cl',tabindex:'0',onclick:()=>openTrAdmin(t.id),onkeydown:e=>{if(e.key==='Enter')openTrAdmin(t.id);}},
    h('td',null,h('div',{class:'who'},h('div',{class:'thumb',style:'width:36px'},poster(t,{sm:1})),h('div',{class:'t'},h('b',null,t.t),h('span',null,'Eğitim '+pad2(t.no)+', '+t.ch.length+' bölüm')))),
    h('td',{'data-l':'Ana videolar'},vidChip(t)),
    h('td',{'data-l':'Diğer videolar'},m.ext?chip('ok','tick','Yüklü'):chip('wait','clock','Bekleniyor')),
    h('td',{'data-l':'Belgeler'},h('span',{class:'dots'},m.pdf.map((x,i)=>dot(x,DOCN[i][1]))),' ',h('span',{class:'sm'},m.pdf.filter(Boolean).length+' / 3')),
    h('td',{'data-l':'Masterclass sertifikası'},MCSET.has(t.id)?chip('gilt','award','Dahil'):chip('ln',null,'Dahil değil')),
    h('td',{class:'r hm'},ic('chev')));}));
  NEWTR.forEach(n=>tb.append(h('tr',null,h('td',null,h('div',{class:'who'},h('span',{class:'li-i'},ic('book')),h('div',{class:'t'},h('b',null,n.t),h('span',null,n.ch+' bölüm, '+(n.inc?'aboneliğe dahil':'ayrı satılır'))))),h('td',{'data-l':'Ana videolar'},chip('wait','clock','Bekleniyor')),h('td',{'data-l':'Diğer videolar'},chip('wait','clock','Bekleniyor')),h('td',{'data-l':'Belgeler'},h('span',{class:'sm mu'},'0 / 3')),h('td',{'data-l':'Durum'},chip('ln',null,'Taslak')),h('td',{class:'hm'}))));
  root.append(h('section',{class:'pn'},h('div',{class:'tw'},h('table',{class:'tbl rsp'},h('thead',null,h('tr',null,['Eğitim','Ana videolar','Diğer videolar','Belgeler','Masterclass sertifikası',''].map(x=>h('th',null,x)))),tb))));
  root.append(h('div',{class:'g2',style:'margin-top:20px'},pn('Klasik Eğitimler',null,h('ul',{class:'ls'},CLS.map(c=>h('li',null,h('div',{class:'thumb'},poster(c,{sm:1})),h('div',{class:'t'},h('b',null,c.t),h('span',null,'Ayrı satış sürer; akademide bonus')),chip('ok','tick','Bonus'))))),
    pn('Masterclass Akademi Sertifikası kapsamı',null,h('div',{class:'st-s'},h('p',{class:'sm mu',style:'margin:0'},'Büyük sertifika, kapsamdaki eğitimlerin hepsinin uygulamaları tamamlanınca verilir. Yeni eğitim eklendikçe kapsamı siz belirlersiniz.'),
      h('div',{style:'display:flex;flex-wrap:wrap;gap:6px'},TR.map(t=>h('button',{class:'chip '+(MCSET.has(t.id)?'gilt':'ln'),type:'button','aria-pressed':String(MCSET.has(t.id)),style:'border:0;cursor:pointer',onclick:()=>{if(MCSET.has(t.id))MCSET.delete(t.id);else MCSET.add(t.id);rerender();}},MCSET.has(t.id)?ic('tick'):null,t.s)))))));
  return root;
};
function vidChip(t){
  const v=vidStat(t),lab=(n,w)=>[String(n),h('span',{class:'vx'},' video'),' '+w];
  const c=v.miss.length?chip('wait','clock',lab(v.miss.length,'eksik')):v.priv?chip('wait','lock',lab(v.priv,'özel')):chip('ok','tick','Vimeo’da');
  c.setAttribute('data-tip',vidText(v));return c;
}
const vidText=v=>'Vimeo’da '+v.have+' / '+v.n+' bölüm'+(v.miss.length?'. Eksik: '+v.miss.join(', '):'')+(v.priv?'. '+v.priv+' video özel; gizlilik ayarı değişince sitede oynar':'')+'.';
function openTrAdmin(id){
  const t=TRM[id],m=MAT[id];
  const row=(ok,n,s,on)=>h('li',null,h('span',{class:'li-i '+(ok?'ok':'wait')},ic(ok?'tick':'clock')),h('div',{class:'t'},h('b',null,n),h('span',null,s)),ok?chip('ok',null,'Yüklü'):btn('btn-k btn-xs','Yükle',on));
  const draw=()=>[h('div',{class:'sec'},h('div',{class:'sec-t'},h('h3',null,'Videolar')),h('ul',{class:'ls'},
      (()=>{const v=vidStat(t),ok=!v.miss.length&&!v.priv;return h('li',null,h('span',{class:'li-i '+(ok?'ok':'wait')},ic(ok?'tick':'clock')),h('div',{class:'t'},h('b',null,'Ana eğitim videoları'),h('span',null,vidText(v))),chip(ok?'ok':'wait',null,ok?'Hazır':(v.miss.length?'Eksik':'Ayar bekliyor')));})(),
      row(m.ext,'Tanıtım, koçluk ve uygulama videoları','Barış Kılıçarslan’dan gelecek',()=>{m.ext=1;toast('Videolar yüklendi.');openTrAdmin(id);rerender();}))),
    h('div',{class:'sec'},h('div',{class:'sec-t'},h('h3',null,'Üç belge')),h('ul',{class:'ls'},DOCN.map(([k,n,s],i)=>row(m.pdf[i],n,s,()=>{m.pdf[i]=1;toast(n+' yüklendi.');openTrAdmin(id);rerender();})))),
    h('div',{class:'sec'},h('div',{class:'sec-t'},h('h3',null,'İhtiyaç değerlendirmesi başlıkları'),h('span',{class:'sm mu'},needItems(t).length+' başlık')),h('ol',{class:'sm',style:'margin:0;padding-left:20px;line-height:1.7'},needItems(t).map(([c,a])=>h('li',null,a)))),
    h('div',{class:'sec'},h('div',{class:'sec-t'},h('h3',null,'Örnek aktiviteler')),h('ol',{class:'act-l'},ACTS[id].map(([ty,tx,n],i)=>h('li',null,h('span',{class:'n'},String(i+1)),h('span',null,tx),h('span',{class:'ty'},ty+', '+dueLabel(n))))),h('p',{class:'sec-n',style:'margin:0'},'Mentorlar bu örnekleri kendi ofislerine uyarlayabilir.'))];
  drawer({t:t.t,s:'Eğitim '+pad2(t.no)+'. Bölüm sırası outline’a göre korunur.',body:draw(),w:600});
}
function openNewTraining(){
  const v={t:'',r:'',ch:'',inc:true};
  drawer({t:'Yeni eğitim ekle',s:'Taslak olarak eklenir; videolar ve belgeler tamamlanınca yayına alınır.',body:h('div',{class:'st'},
    h('div',{class:'fld'},h('label',{for:'ntT'},'Eğitim adı'),h('input',{id:'ntT',type:'text',autofocus:true,oninput:e=>{v.t=e.target.value;}})),
    h('div',{class:'fld'},h('label',{for:'ntR'},'Hedeflenen sonuç'),h('input',{id:'ntR',type:'text',placeholder:'Tek cümle, sonucu anlatsın',oninput:e=>{v.r=e.target.value;}})),
    h('div',{class:'fld'},h('label',{for:'ntC'},'Bölümler'),h('textarea',{id:'ntC',rows:'6',placeholder:'Her satıra bir bölüm. Örnek: XX01 Giriş',oninput:e=>{v.ch=e.target.value;}})),
    h('div',{class:'fld'},h('span',{class:'lab'},'Erişim'),h('div',{class:'opt'},[[true,'Aboneliğe dahil','Bütün üye ofislerde açılır'],[false,'Ayrı satılır','Üyelere avantajlı fiyatla sunulabilir']].map(([k,b,s])=>h('label',{class:'oc'},h('input',{type:'radio',name:'ntInc',checked:k===v.inc||null,onchange:()=>{v.inc=k;}}),h('span',{class:'t'},h('b',null,b),h('span',null,s))))))),
    foot:[btn('btn-o','Vazgeç',closeDrawer),btn('btn-k','Taslak olarak ekle',()=>{if(v.t.trim().length<3){toast('Eğitim adını yazın.');return;}NEWTR.push({t:v.t.trim(),r:v.r.trim(),ch:v.ch.split('\n').filter(x=>x.trim()).length,inc:v.inc});closeDrawer();toast(v.t.trim()+' taslak olarak eklendi.');rerender();})]});
}
const OTHERCERT=[{no:'MA-26-00188',n:'Gökhan Arslan',o:'RE/MAX Örnek Ofis Çankaya',tr:'iu',ty:'bas',d:D(-64)},{no:'MA-26-00203',n:'Sevgi Kara',o:'RE/MAX Örnek Ofis Bornova',tr:'pa',ty:'kat',d:D(-51)},{no:'MA-26-00247',n:'Onur Çelik',o:'RE/MAX Örnek Ofis Muratpaşa',tr:'kb',ty:'kat',d:D(-22)}];
function findCert(no){
  no=no.trim().toLocaleUpperCase('tr');
  const x=CERT.find(c=>c.no===no);if(x)return{n:COM[x.c].n,o:OFF.n,tr:x.tr,ty:x.ty,d:x.d,no:x.no};
  return OTHERCERT.find(c=>c.no===no)||null;
}
function verifyBox(){
  const out=h('div');
  const inp=h('input',{class:'inp',type:'text',placeholder:'Örnek: '+(CERT[0]?CERT[0].no:'MA-26-00311'),'aria-label':'Sertifika numarası'});
  return h('div',{class:'st-s'},h('form',{style:'display:flex;gap:8px',onsubmit:e=>{e.preventDefault();const r=findCert(inp.value);out.replaceChildren(r?h('div',{class:'vr'},h('b',null,'Geçerli sertifika'),h('dl',{class:'kv'},h('dt',null,'Ad soyad'),h('dd',null,r.n),h('dt',null,'Tür'),h('dd',null,CT[r.ty]),h('dt',null,'Eğitim'),h('dd',null,r.tr?TRM[r.tr].t:'Masterclass Akademi'),h('dt',null,'Ofis'),h('dd',null,r.o),h('dt',null,'Tarih'),h('dd',null,ddy(r.d)))):h('div',{class:'vr no'},h('b',null,'Bu numarayla sertifika bulunamadı'),h('span',{class:'sm'},'Numarayı kontrol edin. Doğrulama sayfası herkese açıktır: '+VURL)));}},inp,h('button',{class:'btn btn-k btn-s',type:'submit'},'Doğrula')),out);
}
VIEWS.merkez.sertifikalar=()=>{
  const root=h('div');
  root.append(ph('Sertifikalar','Bütün ofislerin sertifikaları. Her sertifika numaralıdır; QR ya da numarayla herkes doğrulayabilir.'));
  const all=CERT.map(x=>({no:x.no,n:COM[x.c].n,o:OFF.n,tr:x.tr,ty:x.ty,d:x.d})).concat(OTHERCERT).sort((a,b)=>b.d-a.d);
  root.append(h('div',{class:'g2'},
    h('section',{class:'pn'},h('div',{class:'pn-h'},h('h2',null,'Sertifika kaydı',h('span',{class:'c'},String(all.length)))),h('div',{class:'tw'},h('table',{class:'tbl rsp'},h('thead',null,h('tr',null,['Numara','Ad soyad','Ofis','Tür','Tarih'].map(x=>h('th',null,x)))),
      h('tbody',null,all.map(x=>h('tr',null,h('td',{class:'num'},h('b',null,x.no)),h('td',{'data-l':'Ad'},x.n),h('td',{'data-l':'Ofis'},x.o.replace('RE/MAX Örnek Ofis ','')),h('td',{'data-l':'Tür'},chip(x.ty==='kat'?'ln':'gilt','award',CT[x.ty].replace(' Sertifikası',''))),h('td',{'data-l':'Tarih'},dnum(x.d)))))))),
    h('div',{class:'st'},pn('Doğrula',null,verifyBox()),pn('Güvenli üretim',null,h('ul',{class:'ls'},[['shield','Barış Kılıçarslan imzası yalnız sistemin ürettiği sertifikalara basılır'],['qr','Her sertifikada numara ve doğrulama QR’ı'],['lock','Boş şablon indirilemez; ofis yalnız hak kazananı yazdırır'],['award','Mentor ve broker imzası sertifikada yer alır']].map(([i,txt])=>h('li',null,h('span',{class:'li-i'},ic(i)),h('div',{class:'t'},h('span',{style:'color:var(--tx);font-size:14px'},txt)))))))));
  return root;
};
VIEWS.merkez.klasik=()=>{
  const root=h('div');
  root.append(ph('Klasik erişimler','2017’den beri sınırsız erişimle satılan Satışın Şifreleri ve Gayrimenkulün Usta Satışçıları kullanıcıları. Hakları aynen korunur.'));
  const n=LEGACY.filter(x=>x.d).length;
  root.append(h('div',{class:'g2'},
    pn('Taşıma adımları',h('span',{class:'c'},n+' / '+LEGACY.length),h('div',{class:'st-s'},h('ul',{class:'ls'},LEGACY.map((x,i)=>h('li',null,tick(x.d,v=>{x.d=v?1:0;rerender();},x.t,{dis:i>0&&!LEGACY[i-1].d||null}),h('div',{class:'t'},h('b',null,x.t),h('span',null,['Kullanıcılar, satın alma geçmişi ve erişim hakları','Önce birkaç test kullanıcısıyla','Eski sistem kapanmadan önce','Yeni erişimler doğrulandıktan sonra'][i]))))),
      h('div',{class:'lockn'},ic('key'),'Eski sınırsız haklar yalnız satın alınan ürünleri kapsar; yeni eğitimlere otomatik erişim vermez.'))),
    pn('Kullanıcılar',null,empty('Liste henüz aktarılmadı','Eski sitedeki kullanıcı listesi alınınca burada görünür; arama, erişim ve satın alma geçmişiyle.'))));
  return root;
};
VIEWS.merkez.guvenlik=()=>{
  const root=h('div');
  root.append(ph('Güvenlik','Video indirme, eş zamanlı kullanım ve ofis verisinin ayrımı.'));
  const tg=(k,b,s,lock)=>h('div',{class:'tg2'},h('div',{class:'t'},h('b',null,b),h('span',null,s)),h('button',{class:'sw lt-sw',type:'button','aria-pressed':String(!!SEC[k]),'aria-label':b,disabled:lock||null,onclick:()=>{SEC[k]=!SEC[k];rerender();}},h('i')));
  const cs=sel('secC',[[1,'1 cihaz'],[2,'2 cihaz']],SEC.conc,v=>{SEC.conc=+v;toast('Eş zamanlı oturum sınırı: '+v+' cihaz.');});
  cs.className='inp';cs.style.cssText='width:auto;height:38px';cs.setAttribute('aria-label','Eş zamanlı oturum sınırı');
  const rules=pn('Kurallar',null,h('div',null,
    tg('dl','Video indirme kapalı','Videolar Vimeo’dan yalnız akademi alan adında oynar; indirme bağlantısı yoktur.',true),
    tg('iso','Ofis verisi ayrı','Ofisler birbirinin danışmanlarını, raporlarını ve takvimini görmez.',true),
    tg('priv','Özel değerlendirme yalnız mentor ve broker','Merkez dahil başka kimse görmez.',true),
    h('div',{class:'tg2'},h('div',{class:'t'},h('b',null,'Aynı hesapla eş zamanlı oturum'),h('span',null,'Sınır aşılınca en eski oturum kapanır.')),cs)));
  const devs=h('ul',{class:'ls'},DEV.map((d,i)=>h('li',null,h('span',{class:'li-i'},ic('device')),h('div',{class:'t'},h('b',null,d.u+', '+d.r),h('span',null,d.o+', '+d.d+', '+d.w)),
    i?btn('btn-g btn-xs','Oturumu kapat',()=>{DEV.splice(i,1);toast('Oturum kapatıldı.');rerender();}):chip('ok',null,'Şu an'))));
  root.append(h('div',{class:'g2'},h('div',{class:'st'},rules),pn('Açık oturumlar',null,devs)));
  return root;
};
