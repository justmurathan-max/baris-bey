
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
    pn('Bekleyen davetler',null,inv.length?h('ul',{class:'ls'},inv.map(o=>h('li',null,h('span',{class:'li-i'},ic('mail')),h('div',{class:'t'},h('b',null,o.n),h('span',null,'Gönderildi '+ago(o.inv))),btn('btn-g btn-xs','Yeniden gönder',()=>{if(realM()){resendReal(o);return;}o.inv=new Date(T0);toast('Davet yeniden gönderildi.');rerender();})))):empty('Bekleyen davet yok')),
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
  if(o.st==='davet')foot.push(btn('btn-k btn-s',[ic('mail'),'Daveti yeniden gönder'],()=>{if(realM()){closeDrawer();resendReal(o);return;}o.inv=new Date(T0);closeDrawer();toast('Davet yeniden gönderildi.');rerender();}));
  else foot.push(btn('btn-o btn-s',[ic('refresh'),'Üyeliği bir yıl uzat'],()=>{if(realM()){closeDrawer();extendReal(o);return;}o.end=plus(o.end,365);if(o.id==='kdk')OFF.end=o.end;closeDrawer();toast(o.n+' üyeliği '+ddy(o.end)+' tarihine uzatıldı.');rerender();}));
  drawer({t:o.n,s:o.st==='davet'?'Davet '+ago(o.inv)+' gönderildi.':'Aktif üyelik',body,foot});
}
function openNewOffice(){
  const v={n:'',city:'İstanbul',tier:'1–25',start:iso(T0),br:'',brn:'',mn:'',mnn:'',self:false};let busy=false;
  const body=h('div',{class:'st'},
    h('div',{class:'fld'},h('label',{for:'noN'},'Ofis adı'),h('input',{id:'noN',type:'text',placeholder:'RE/MAX ...',autofocus:true,oninput:e=>{v.n=e.target.value;}})),
    h('div',{class:'fr'},h('div',{class:'fld'},h('label',{for:'noC'},'Şehir'),h('input',{id:'noC',type:'text',value:v.city,oninput:e=>{v.city=e.target.value;}})),h('div',{class:'fld'},h('label',{for:'noT'},'Kademe'),sel('noT',TIERS.map(x=>[x,x+' danışman']),v.tier,x=>{v.tier=x;}))),
    h('div',{class:'fld'},h('label',{for:'noS'},'Üyelik başlangıcı'),h('input',{id:'noS',type:'date',value:v.start,onchange:e=>{v.start=e.target.value;}}),h('span',{class:'hint'},'Satış görüşme, sözleşme ve ödemeyle yapılır; üyelik 12 ay sürer.')),
    h('div',{class:'fr'},h('div',{class:'fld'},h('label',{for:'noBn'},'Broker adı soyadı'),h('input',{id:'noBn',type:'text',autocomplete:'off',oninput:e=>{v.brn=e.target.value;}})),h('div',{class:'fld'},h('label',{for:'noB'},'Broker e-postası'),h('input',{id:'noB',type:'email',placeholder:'broker@ofis.com',oninput:e=>{v.br=e.target.value;}}))),
    h('div',{class:'fr'},h('div',{class:'fld'},h('label',{for:'noMn'},'Mentor adı soyadı'),h('input',{id:'noMn',type:'text',autocomplete:'off',oninput:e=>{v.mnn=e.target.value;}})),h('div',{class:'fld'},h('label',{for:'noM'},'Mentor e-postası'),h('input',{id:'noM',type:'email',placeholder:'mentor@ofis.com',oninput:e=>{v.mn=e.target.value;}}))),
    h('div',{class:'fld'},h('label',{class:'oc',style:'margin-top:4px'},h('input',{type:'checkbox',onchange:e=>{v.self=e.target.checked;$('#noM').disabled=v.self;$('#noMn').disabled=v.self;}}),h('span',{class:'t'},h('b',null,'Mentor görevini broker üstlenecek'),h('span',null,'Broker iki rolü tek panelden yönetir.')))));
  drawer({t:'Yeni ofis aç',s:'Üyelik açılınca broker ve mentora davet e-postası gider.',body,foot:[btn('btn-o','Vazgeç',closeDrawer),btn('btn-k','Üyeliği aç ve davet gönder',()=>{
    if(v.n.trim().length<3){toast('Ofis adını yazın.');$('#noN').focus();return;}
    if(!/^\S+@\S+\.\S+$/.test(v.br)){toast('Broker e-postasını yazın.');$('#noB').focus();return;}
    if(!v.self&&v.mn.trim()&&!/^\S+@\S+\.\S+$/.test(v.mn.trim())){toast('Mentor e-postasını kontrol edin.');$('#noM').focus();return;}
    if(realM()){if(busy)return;busy=true;const b=$('#dr .dr-f .btn-k');if(b){b.disabled=true;b.textContent='Açılıyor…';}createOfficeReal(v).then(ok=>{busy=false;if(b){b.disabled=false;b.textContent='Üyeliği aç ve davet gönder';}if(ok){closeDrawer();if(S.page==='ofisler')rerender();else go('ofisler');}});return;}
    const s=fromIso(v.start||iso(T0));
    OFFS.push({id:'o'+Date.now().toString(36),n:v.n.trim(),city:v.city.trim()||'—',br:null,mn:null,tier:v.tier,cons:0,start:s,end:plus(s,365),ses:0,st:'davet',comp:0,cert:0,inv:new Date(T0)});
    closeDrawer();toast('Üyelik açıldı; davetler gönderildi.');if(S.page==='ofisler')rerender();else go('ofisler');})]});
}
const RQK={kurumsal:'Kurumsal teklif',ofis:'Ofis başvurusu',davetiye:'Davetiye',bulten:'Bülten',etkinlik:'Etkinlik',iletisim:'İletişim'};
let rqF='yeni';
VIEWS.merkez.basvurular=()=>{
  const root=h('div'),cnt=k=>REQS.filter(r=>r.status===k).length;
  root.append(ph('Başvurular','Siteden gelen kurumsal teklif, ofis başvurusu, davetiye ve bülten kayıtları. Dönüş yaptıklarınızı işlendi olarak işaretleyin.'));
  root.append(h('div',{class:'bar-row'},seg([['yeni','Yeni',cnt('yeni')],['islendi','İşlendi',cnt('islendi')],['hepsi','Hepsi',REQS.length]],rqF,k=>{rqF=k;rerender();},'Durum')));
  const L=REQS.filter(r=>rqF==='hepsi'||r.status===rqF);
  if(!L.length){root.append(h('section',{class:'pn'},empty(rqF==='yeni'?'Yeni başvuru yok':'Kayıt yok')));return root;}
  const tb=h('tbody',null,L.map(r=>h('tr',null,
    h('td',{'data-l':'Tarih'},dnum(r.at)),
    h('td',{'data-l':'Tür'},RQK[r.kind]||r.kind),
    h('td',null,h('div',{class:'t'},h('b',null,r.name||r.email||'—'),r.company?h('span',{class:'sm mu',style:'display:block'},r.company+(r.city?', '+r.city:'')):null)),
    h('td',{'data-l':'İletişim'},[r.phone,r.email].filter(Boolean).join(' · ')||'—'),
    h('td',{'data-l':'Ayrıntı',class:'sm'},[r.dil&&(({en:'İngilizce',es:'İspanyolca',de:'Almanca'})[r.dil]||r.dil)+' sayfadan',r.topic,r.size,r.mode,r.message].filter(Boolean).join(' · ')||'—'),
    h('td',{class:'r'},r.status==='yeni'?btn('btn-k btn-xs','İşlendi',()=>setReq(r,'islendi')):btn('btn-g btn-xs','Yeniye al',()=>setReq(r,'yeni'))))));
  root.append(h('section',{class:'pn'},h('div',{class:'tw'},h('table',{class:'tbl rsp'},h('thead',null,h('tr',null,['Tarih','Tür','Kişi','İletişim','Ayrıntı',''].map(x=>h('th',null,x)))),tb))));
  return root;
};
async function setReq(r,st){
  if(realM()){const{error}=await SB.from('site_requests').update({status:st}).eq('id',r.id);if(error){toast('Güncellenemedi; tekrar deneyin.');return;}}
  r.status=st;toast(st==='islendi'?'İşlendi olarak işaretlendi.':'Yeni olarak işaretlendi.');rerender();
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
        h('td',{class:'r'},btn(n<=60?'btn-k btn-xs':'btn-g btn-xs','Yenile',()=>confirmBox('Üyelik yenilensin mi?',o.n+' üyeliği bir yıl uzar. İkinci yıl avantajı ve kademe değişikliği yenileme görüşmesinde belirlenir.','Yenile',()=>{if(realM()){extendReal(o);return;}o.end=plus(o.end,365);if(o.id==='kdk')OFF.end=o.end;toast(o.n+' yenilendi.');rerender();}))));}))))));
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
    h('td',{'data-l':'Diğer videolar'},extChip(t)),
    h('td',{'data-l':'Belgeler'},h('span',{class:'dots'},m.pdf.map((x,i)=>dot(x,DOCN[i][1]))),' ',h('span',{class:'sm'},m.pdf.filter(Boolean).length+' / 3')),
    h('td',{'data-l':'Masterclass sertifikası'},MCSET.has(t.id)?chip('gilt','award','Dahil'):chip('ln',null,'Dahil değil')),
    h('td',{class:'r hm'},ic('chev')));}));
  NEWTR.forEach(n=>tb.append(h('tr',null,h('td',null,h('div',{class:'who'},h('span',{class:'li-i'},ic('book')),h('div',{class:'t'},h('b',null,n.t),h('span',null,n.ch+' bölüm, '+(n.inc?'aboneliğe dahil':'ayrı satılır'))))),h('td',{'data-l':'Ana videolar'},chip('wait','clock','Bekleniyor')),h('td',{'data-l':'Diğer videolar'},chip('wait','clock','Bekleniyor')),h('td',{'data-l':'Belgeler'},h('span',{class:'sm mu'},'0 / 3')),h('td',{'data-l':'Durum'},chip('ln',null,'Taslak')),h('td',{class:'r'},realM()&&n.id?btn('btn-g btn-xs','Sil',()=>confirmBox('Taslak silinsin mi?',n.t+' taslağı listeden kalkar.','Sil',()=>taslakSil(n.id),true),{'aria-label':n.t+' taslağını sil'}):null))));
  root.append(h('section',{class:'pn'},h('div',{class:'tw'},h('table',{class:'tbl rsp'},h('thead',null,h('tr',null,['Eğitim','Ana videolar','Diğer videolar','Belgeler','Masterclass sertifikası',''].map(x=>h('th',null,x)))),tb))));
  root.append(h('div',{class:'g2',style:'margin-top:20px'},pn('Klasik Eğitimler',null,h('ul',{class:'ls'},CLS.map(c=>h('li',null,h('div',{class:'thumb'},poster(c,{sm:1})),h('div',{class:'t'},h('b',null,c.t),h('span',null,'Ayrı satış sürer; akademide bonus')),chip('ok','tick','Bonus'))))),
    pn('Masterclass Akademi Sertifikası kapsamı',null,h('div',{class:'st-s'},h('p',{class:'sm mu',style:'margin:0'},'Büyük sertifika, kapsamdaki eğitimlerin hepsinin uygulamaları tamamlanınca verilir. Yeni eğitim eklendikçe kapsamı siz belirlersiniz.'),
      h('div',{style:'display:flex;flex-wrap:wrap;gap:6px'},TR.map(t=>h('button',{class:'chip '+(MCSET.has(t.id)?'gilt':'ln'),type:'button','aria-pressed':String(MCSET.has(t.id)),style:'border:0;cursor:pointer',onclick:async()=>{const on=!MCSET.has(t.id);if(realM()){if(!await kapsamDegistir(t.id,on))return;}else if(on)MCSET.add(t.id);else MCSET.delete(t.id);rerender();}},MCSET.has(t.id)?ic('tick'):null,t.s)))))));
  return root;
};
function extChip(t){
  if(!realM())return MAT[t.id].ext?chip('ok','tick','Yüklü'):chip('wait','clock','Bekleniyor');
  const n=EXTK.filter(k=>EXTV[t.id]&&EXTV[t.id][k]).length;
  return n===3?chip('ok','tick','Yüklü'):n?chip('wait','clock',n+' / 3'):chip('wait','clock','Bekleniyor');
}
function vidChip(t){
  const v=vidStat(t),lab=(n,w)=>[String(n),h('span',{class:'vx'},' video'),' '+w];
  const c=v.miss.length?chip('wait','clock',lab(v.miss.length,'eksik')):v.priv?chip('wait','lock',lab(v.priv,'özel')):chip('ok','tick','Vimeo’da');
  c.setAttribute('data-tip',vidText(v));return c;
}
const vidText=v=>'Vimeo’da '+v.have+' / '+v.n+' bölüm'+(v.miss.length?'. Eksik: '+v.miss.join(', '):'')+(v.priv?'. '+v.priv+' video özel; gizlilik ayarı değişince sitede oynar':'')+'.';
function openTrAdmin(id){
  const t=TRM[id],m=MAT[id],R=realM();
  const row=(ok,n,s,on)=>h('li',null,h('span',{class:'li-i '+(ok?'ok':'wait')},ic(ok?'tick':'clock')),h('div',{class:'t'},h('b',null,n),h('span',null,s)),ok?chip('ok',null,'Yüklü'):btn('btn-k btn-xs','Yükle',on));
  const extRow=()=>{
    if(!R)return row(m.ext,'Tanıtım, koçluk ve uygulama videoları','Barış Kılıçarslan’dan gelecek',()=>{m.ext=1;toast('Videolar yüklendi.');openTrAdmin(id);rerender();});
    const e=EXTV[id]||{},ekli=EXTK.filter(k=>e[k]),ok=ekli.length===3;
    return h('li',null,h('span',{class:'li-i '+(ok?'ok':'wait')},ic(ok?'tick':'clock')),
      h('div',{class:'t'},h('b',null,'Tanıtım, koçluk ve uygulama videoları'),h('span',null,ekli.length?ekli.length+' / 3 eklendi: '+ekli.map(k=>EXTN[k].replace(/ videosu$/,'').toLocaleLowerCase('tr')).join(', '):'Barış Kılıçarslan’dan gelecek; Vimeo bağlantısıyla eklenir')),
      btn('btn-k btn-xs',ekli.length?'Düzenle':'Ekle',()=>openEkVideo(id)));
  };
  const docRow=(k,n,s,i)=>{
    if(!R)return row(m.pdf[i],n,s,()=>{m.pdf[i]=1;toast(n+' yüklendi.');openTrAdmin(id);rerender();});
    const x=DOCS[id]&&DOCS[id][k];
    const yukle=b=>dosyaSec(async f=>{b.disabled=true;b.textContent='Yükleniyor…';const ok=await belgeYukle(id,k,f);if(drOpen)openTrAdmin(id);rerender();if(ok)toast(n+' yüklendi.');});
    if(!x)return h('li',null,h('span',{class:'li-i wait'},ic('clock')),h('div',{class:'t'},h('b',null,n),h('span',null,s+'. PDF, en fazla 20 MB.')),btn('btn-k btn-xs','Yükle',e=>yukle(e.currentTarget),{'aria-label':n+' yükle'}));
    return h('li',null,h('span',{class:'li-i ok'},ic('tick')),h('div',{class:'t'},h('b',null,n),h('span',null,(x.name||'PDF')+', '+boyut(x.size)+(x.at?', '+dnum(x.at):''))),
      h('div',{class:'doc-a'},btn('btn-o btn-xs','Aç',()=>pdfAc(id,k),{'aria-label':n+' aç'}),btn('btn-o btn-xs','Değiştir',e=>yukle(e.currentTarget),{'aria-label':n+' değiştir'}),
        btn('btn-g btn-xs','Kaldır',()=>confirmBox(n+' kaldırılsın mı?','Belge mentorların ekranından da kalkar.','Kaldır',async()=>{if(await belgeKaldir(id,k)){if(drOpen)openTrAdmin(id);rerender();toast(n+' kaldırıldı.');}},true),{'aria-label':n+' kaldır'})));
  };
  const draw=()=>[h('div',{class:'sec'},h('div',{class:'sec-t'},h('h3',null,'Videolar')),h('ul',{class:'ls'},
      (()=>{const v=vidStat(t),ok=!v.miss.length&&!v.priv;return h('li',null,h('span',{class:'li-i '+(ok?'ok':'wait')},ic(ok?'tick':'clock')),h('div',{class:'t'},h('b',null,'Ana eğitim videoları'),h('span',null,vidText(v))),chip(ok?'ok':'wait',null,ok?'Hazır':(v.miss.length?'Eksik':'Ayar bekliyor')));})(),
      extRow())),
    h('div',{class:'sec'},h('div',{class:'sec-t'},h('h3',null,'Üç belge')),h('ul',{class:'ls'},DOCN.map(([k,n,s],i)=>docRow(k,n,s,i)))),
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
    foot:[btn('btn-o','Vazgeç',closeDrawer),btn('btn-k','Taslak olarak ekle',async e=>{if(v.t.trim().length<3){toast('Eğitim adını yazın.');return;}
      if(realM()){const b=e.currentTarget;b.disabled=true;const ok=await taslakEkle(v);b.disabled=false;if(!ok){toast('Taslak eklenemedi; tekrar deneyin.',5000);return;}}
      else NEWTR.push({t:v.t.trim(),r:v.r.trim(),ch:v.ch.split('\n').filter(x=>x.trim()).length,inc:v.inc});
      closeDrawer();toast(v.t.trim()+' taslak olarak eklendi.');rerender();})]});
}
const OTHERCERT=[{no:'MA-26-00188',n:'Gökhan Arslan',o:'RE/MAX Örnek Ofis Çankaya',tr:'iu',ty:'bas',d:D(-64)},{no:'MA-26-00203',n:'Sevgi Kara',o:'RE/MAX Örnek Ofis Bornova',tr:'pa',ty:'kat',d:D(-51)},{no:'MA-26-00247',n:'Onur Çelik',o:'RE/MAX Örnek Ofis Muratpaşa',tr:'kb',ty:'kat',d:D(-22)}];
function findCert(no){
  no=no.trim().toLocaleUpperCase('tr');
  if(realM())return MCERT.find(c=>c.no===no)||null;
  const x=CERT.find(c=>c.no===no);if(x)return{n:COM[x.c]?COM[x.c].n:(x.hn||'—'),o:OFF.n,tr:x.tr,ty:x.ty,d:x.d,no:x.no};
  return OTHERCERT.find(c=>c.no===no)||null;
}
function verifyBox(){
  const out=h('div');
  const inp=h('input',{class:'inp',type:'text',placeholder:'Örnek: '+(CERT[0]?CERT[0].no:'MA-26-00311'),'aria-label':'Sertifika numarası'});
  return h('div',{class:'st-s'},h('form',{style:'display:flex;gap:8px',onsubmit:e=>{e.preventDefault();const r=findCert(inp.value);out.replaceChildren(r?h('div',{class:'vr'+(r.rev?' no':'')},h('b',null,r.rev?'Bu sertifika iptal edilmiş':'Geçerli sertifika'),h('dl',{class:'kv'},h('dt',null,'Ad soyad'),h('dd',null,r.n),h('dt',null,'Tür'),h('dd',null,CT[r.ty]),h('dt',null,'Eğitim'),h('dd',null,r.tr?TRM[r.tr].t:'Masterclass Akademi'),h('dt',null,'Ofis'),h('dd',null,r.o),h('dt',null,'Tarih'),h('dd',null,ddy(r.d)))):h('div',{class:'vr no'},h('b',null,'Bu numarayla sertifika bulunamadı'),h('span',{class:'sm'},'Numarayı kontrol edin. Doğrulama sayfası herkese açıktır: '+VURL)));}},inp,h('button',{class:'btn btn-k btn-s',type:'submit'},'Doğrula')),out);
}
VIEWS.merkez.sertifikalar=()=>{
  const root=h('div');
  root.append(ph('Sertifikalar','Bütün ofislerin sertifikaları. Her sertifika numaralıdır; QR ya da numarayla herkes doğrulayabilir.'));
  const all=(realM()?MCERT.slice():CERT.map(x=>({no:x.no,n:COM[x.c]?COM[x.c].n:(x.hn||'—'),o:OFF.n,tr:x.tr,ty:x.ty,d:x.d})).concat(OTHERCERT)).sort((a,b)=>b.d-a.d);
  root.append(h('div',{class:'g2'},
    h('section',{class:'pn'},h('div',{class:'pn-h'},h('h2',null,'Sertifika kaydı',h('span',{class:'c'},String(all.length)))),h('div',{class:'tw'},h('table',{class:'tbl rsp'},h('thead',null,h('tr',null,['Numara','Ad soyad','Ofis','Tür','Tarih'].map(x=>h('th',null,x)))),
      h('tbody',null,all.map(x=>h('tr',null,h('td',{class:'num'},h('b',null,x.no)),h('td',{'data-l':'Ad'},x.n),h('td',{'data-l':'Ofis'},x.o.replace('RE/MAX Örnek Ofis ','')),h('td',{'data-l':'Tür'},chip(x.ty==='kat'?'ln':'gilt','award',CT[x.ty].replace(' Sertifikası',''))),h('td',{'data-l':'Tarih'},dnum(x.d)))))))),
    h('div',{class:'st'},pn('Doğrula',null,verifyBox()),pn('Güvenli üretim',null,h('ul',{class:'ls'},[['shield','Barış Kılıçarslan imzası yalnız sistemin ürettiği sertifikalara basılır'],['qr','Her sertifikada numara ve doğrulama QR’ı'],['lock','Boş şablon indirilemez; ofis yalnız hak kazananı yazdırır'],['award','Mentor ve broker imzası sertifikada yer alır']].map(([i,txt])=>h('li',null,h('span',{class:'li-i'},ic(i)),h('div',{class:'t'},h('span',{style:'color:var(--tx);font-size:14px'},txt)))))))));
  return root;
};
VIEWS.merkez.klasik=()=>{
  const root=h('div'),R=realM();
  root.append(ph('Klasik erişimler','2017’den beri sınırsız erişimle satılan Satışın Şifreleri ve Gayrimenkulün Usta Satışçıları kullanıcıları. Hakları aynen korunur.',
    R?[btn('btn-o btn-s',[ic('doc'),'Listeyi içe aktar'],openKlasikIceAktar),btn('btn-k btn-s',[ic('plus'),'Kişi ekle'],()=>openKlasikKisi(null))]:null));
  const n=LEGACY.filter(x=>x.d).length;
  const adim=(x,i)=>tick(x.d,async v=>{const eski=x.d;x.d=v?1:0;
      if(R&&!await ayarYaz('legacy_steps',LEGACY.map(y=>!!y.d))){x.d=eski;toast('Kaydedilemedi; tekrar deneyin.',5000);}
      rerender();},x.t,{dis:i>0&&!LEGACY[i-1].d||null});
  const adimlar=pn('Taşıma adımları',h('span',{class:'c'},n+' / '+LEGACY.length),h('div',{class:'st-s'},h('ul',{class:'ls'},LEGACY.map((x,i)=>h('li',null,adim(x,i),h('div',{class:'t'},h('b',null,x.t),h('span',null,['Kullanıcılar, satın alma geçmişi ve erişim hakları','Önce birkaç test kullanıcısıyla','Eski sistem kapanmadan önce','Yeni erişimler doğrulandıktan sonra'][i]))))),
      h('div',{class:'lockn'},ic('key'),'Eski sınırsız haklar yalnız satın alınan ürünleri kapsar; yeni eğitimlere otomatik erişim vermez.')));
  if(!R){root.append(h('div',{class:'g2'},adimlar,pn('Kullanıcılar',null,empty('Liste henüz aktarılmadı','Eski sitedeki kullanıcı listesi alınınca burada görünür; arama, erişim ve satın alma geçmişiyle.'))));return root;}
  if(!KLS.busy&&Date.now()-KLS.at>60000){KLS.busy=true;loadKlasik().then(()=>{KLS.busy=false;if(S.page==='klasik')rerender();});}
  const L=KLS.list,acik=L.filter(x=>x.status==='acildi').length;
  let users;
  if(!L.length)users=pn('Kullanıcılar',null,empty(KLS.err?'Liste alınamadı':'Liste henüz aktarılmadı',KLS.err?'Bağlantınızı kontrol edip sayfayı yenileyin.':'Eski sitedeki kullanıcı listesini içe aktarın ya da kişileri tek tek ekleyin.',
    h('div',{style:'display:flex;gap:8px;flex-wrap:wrap;justify-content:center'},btn('btn-o btn-s','Listeyi içe aktar',openKlasikIceAktar),btn('btn-k btn-s','Kişi ekle',()=>openKlasikKisi(null)))));
  else{
    const tb=h('tbody'),not=h('p',{class:'sm mu',style:'margin:0',role:'status'});
    const sat=x=>h('tr',{class:'cl',tabindex:'0',onclick:()=>openKlasikKisi(x),onkeydown:e=>{if(e.key==='Enter')openKlasikKisi(x);}},
      h('td',null,h('b',null,x.full_name||'—')),
      h('td',{'data-l':'İletişim'},h('span',{class:'sm'},[x.email,x.phone].filter(Boolean).join(' · '))),
      h('td',{'data-l':'Ürünler'},x.products&&x.products.length?h('span',{class:'chips'},x.products.map(p=>chip('ln',null,p==='ss'?'Satışın Şifreleri':'GUS'))):h('span',{class:'sm mu'},'Belirtilmedi')),
      h('td',{'data-l':'Kaynak'},h('span',{class:'sm'},(KLK[x.source]||'')+(x.purchased_on?', '+dnum(fromIso(x.purchased_on)):''))),
      h('td',{'data-l':'Erişim'},x.status==='acildi'?chip('ok','tick','Açıldı'):chip('wait','clock','Bekliyor')));
    const ciz=()=>{const q=KLS.q.trim().toLocaleLowerCase('tr'),F=q?L.filter(x=>[x.full_name,x.email,x.phone].some(v=>v&&String(v).toLocaleLowerCase('tr').includes(q))):L;
      tb.replaceChildren(...F.slice(0,200).map(sat));
      not.textContent=F.length>200?'İlk 200 kişi gösteriliyor; aramayla daraltın.':q&&!F.length?'Aramaya uyan kişi yok.':'';not.hidden=!not.textContent;};
    ciz();
    const ara=h('input',{class:'inp',type:'search',placeholder:'Ad, e-posta ya da telefon',value:KLS.q,'aria-label':'Klasik erişimlerde ara',style:'max-width:320px',oninput:e=>{KLS.q=e.target.value;ciz();}});
    users=pn('Kullanıcılar',h('span',{class:'c'},String(L.length)),h('div',{class:'st-s'},
      h('div',{class:'kl-ara'},ara,h('span',{class:'sm mu'},acik+' kişinin erişimi açıldı')),
      h('div',{class:'tw'},h('table',{class:'tbl rsp'},h('thead',null,h('tr',null,['Ad soyad','İletişim','Ürünler','Kaynak','Erişim'].map(x=>h('th',null,x)))),tb)),not));
  }
  root.append(adimlar,h('div',{style:'margin-top:20px'},users));
  return root;
};
function openKlasikKisi(x){
  const v=x?{full_name:x.full_name||'',email:x.email||'',phone:x.phone||'',products:new Set(x.products||[]),purchased_on:x.purchased_on||'',note:x.note||'',status:x.status}
    :{full_name:'',email:'',phone:'',products:new Set(),purchased_on:'',note:'',status:'bekliyor'};
  const msg=h('p',{class:'sm',role:'status',style:'margin:0;color:var(--critT)',hidden:true});
  const fld=(id,l,el)=>h('div',{class:'fld'},h('label',{for:id},l),el);
  const inp=(id,k,a)=>h('input',Object.assign({class:'inp',id,value:v[k],oninput:e=>{v[k]=e.target.value;}},a||{}));
  const sw=h('button',{class:'sw lt-sw',type:'button','aria-pressed':String(v.status==='acildi'),'aria-label':'Erişimi açıldı',onclick:()=>{v.status=v.status==='acildi'?'bekliyor':'acildi';sw.setAttribute('aria-pressed',String(v.status==='acildi'));}},h('i'));
  const body=h('div',{class:'st'},
    fld('klAd','Ad soyad',inp('klAd','full_name',{type:'text',autofocus:true,maxlength:'200',autocomplete:'off'})),
    h('div',{class:'fr'},fld('klMail','E-posta',inp('klMail','email',{type:'email',maxlength:'320',autocomplete:'off',spellcheck:'false'})),fld('klTel','Telefon',inp('klTel','phone',{type:'tel',maxlength:'40',autocomplete:'off'}))),
    h('div',{class:'fld'},h('span',{class:'lab'},'Satın aldığı'),h('div',{class:'opt'},Object.keys(KLU).map(k=>h('label',{class:'oc'},h('input',{type:'checkbox',checked:v.products.has(k)||null,onchange:e=>{if(e.target.checked)v.products.add(k);else v.products.delete(k);}}),h('span',{class:'t'},h('b',null,KLU[k])))))),
    fld('klTar','Satın alma tarihi',inp('klTar','purchased_on',{type:'date'})),
    fld('klNot','Not',h('textarea',{class:'inp',id:'klNot',rows:'3',maxlength:'1000',oninput:e=>{v.note=e.target.value;}},v.note)),
    x?h('div',{class:'tg2'},h('div',{class:'t'},h('b',null,'Erişimi açıldı'),h('span',null,'Kişiye yeni erişim bilgisi verildiyse işaretleyin.')),sw):null,
    msg);
  const kaydet=async b=>{
    const mail=v.email.trim().toLowerCase(),tel=v.phone.trim();
    const hata=t=>{msg.textContent=t;msg.hidden=false;b.disabled=false;};
    if(!mail&&!tel)return hata('E-posta ya da telefon yazın.');
    if(mail&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail))return hata('Geçerli bir e-posta adresi yazın.');
    b.disabled=true;
    const row={full_name:v.full_name.trim(),email:mail||null,phone:tel||null,products:[...v.products].sort(),purchased_on:v.purchased_on||null,note:v.note.trim()||null};
    const r=x?await SB.from('legacy_access').update(Object.assign(row,{status:v.status})).eq('id',x.id).then(q=>q,e=>({error:e}))
      :await SB.from('legacy_access').insert(Object.assign(row,{source:'elle'})).then(q=>q,e=>({error:e}));
    if(r.error)return hata(r.error.code==='23505'?'Bu e-posta listede başka bir kişide var.':'Kaydedilemedi; tekrar deneyin.');
    await loadKlasik();closeDrawer();rerender();toast(x?'Kaydedildi.':'Kişi eklendi.');
  };
  drawer({t:x?(x.full_name||x.email||x.phone):'Kişi ekle',s:x?(KLK[x.source]||'')+(x.created_at?', '+dnum(new Date(x.created_at))+' tarihinde eklendi.':'.'):'Klasik erişim hakkı olan bir kişi.',body,w:520,
    foot:[x?h('button',{class:'lnk mu sp',type:'button',onclick:()=>confirmBox('Kişi silinsin mi?',(x.full_name||x.email||x.phone)+' klasik erişim listesinden çıkar.','Sil',async()=>{if(await klasikSil(x.id)){closeDrawer();rerender();toast('Silindi.');}},true)},'Listeden sil'):h('span',{class:'sp'}),
      btn('btn-o','Vazgeç',closeDrawer),btn('btn-k','Kaydet',e=>kaydet(e.currentTarget))]});
}
function openKlasikIceAktar(){
  const st={txt:'',urun:'ss'};
  const bilgi=h('div',{class:'sm',role:'status',style:'min-height:1.5em'});
  let son=null;
  const coz=()=>{
    son=null;
    if(!st.txt.trim()){bilgi.textContent='';return;}
    const r=klasikSatirlar(csvCoz(st.txt),st.urun==='ikisi'?['ss','gus']:st.urun==='yok'?[]:[st.urun]);
    if(r.err){bilgi.replaceChildren(h('span',{style:'color:var(--critT)'},r.err));return;}
    son=r.rows;
    const ad=r.rows.slice(0,3).map(x=>x.full_name||x.email||x.phone).join(', ');
    bilgi.replaceChildren(h('b',null,r.rows.length+' kişi bulundu.'),' ',ad?h('span',{class:'mu'},'İlk kişiler: '+ad+(r.rows.length>3?'…':'')):null,
      r.urunSutun?h('span',{class:'mu'},' Ürünler sütundan okunur; boş olanlara aşağıdaki seçim yazılır.'):null);
  };
  const ta=h('textarea',{class:'inp',id:'klCsv',rows:'8',placeholder:'Ad soyad;E-posta;Telefon;Ürün;Tarih\nAyşe Yılmaz;ayse@ornek.com;0532 000 00 00;Satışın Şifreleri;12.03.2018',spellcheck:'false',oninput:e=>{st.txt=e.target.value;coz();}});
  const dosya=h('input',{type:'file',id:'klDosya',accept:'.csv,.tsv,.txt,text/csv,text/plain',class:'inp',onchange:e=>{
    const f=e.target.files&&e.target.files[0];if(!f)return;
    if(f.size>5*1048576){bilgi.replaceChildren(h('span',{style:'color:var(--critT)'},'Dosya 5 MB’tan büyük olamaz.'));return;}
    const oku=(enc,sonra)=>{const r=new FileReader();r.onload=()=>sonra(String(r.result||''));r.readAsText(f,enc);};
    // Türkçe Excel CSV'si çoğu zaman Windows-1254'tür; UTF-8 bozuk çıkarsa onunla okunur.
    oku('utf-8',t=>{if(/�/.test(t))oku('windows-1254',t2=>{st.txt=t2;ta.value=t2;coz();});else{st.txt=t;ta.value=t;coz();}});
  }});
  const urunSec=sel('klUrun',[['ss','Satışın Şifreleri'],['gus','Gayrimenkulün Usta Satışçıları'],['ikisi','İkisi de'],['yok','Belirtme']],st.urun,v=>{st.urun=v;coz();});
  urunSec.className='inp';
  const body=h('div',{class:'st'},
    h('p',{class:'sm mu',style:'margin:0'},'Excel’den CSV olarak kaydedilen dosyayı seçin ya da satırları yapıştırın. İlk satırda sütun adları olsun: Ad soyad, E-posta, Telefon, Ürün, Tarih. Aynı e-posta varsa kayıt birleşir; yeni satır açılmaz.'),
    h('div',{class:'fld'},h('label',{for:'klDosya'},'Dosya'),dosya),
    h('div',{class:'fld'},h('label',{for:'klCsv'},'Ya da yapıştırın'),ta),
    h('div',{class:'fld'},h('label',{for:'klUrun'},'Ürün sütunu boşsa'),urunSec),
    bilgi);
  drawer({t:'Listeyi içe aktar',s:'Eski sitedeki kullanıcılar. Kişiler liste olarak kaydedilir; erişim ayrıca açılır.',body,w:600,
    foot:[btn('btn-o','Vazgeç',closeDrawer),btn('btn-k','İçe aktar',async e=>{
      if(!son||!son.length){coz();if(!son||!son.length){if(!bilgi.textContent)bilgi.textContent='Önce bir dosya seçin ya da liste yapıştırın.';return;}}
      const b=e.currentTarget;b.disabled=true;b.textContent='Aktarılıyor…';
      const r=await klasikIceAktar(son,'eski_site');
      if(!r){b.disabled=false;b.textContent='İçe aktar';bilgi.replaceChildren(h('span',{style:'color:var(--critT)'},'Aktarılamadı. Bağlantınızı kontrol edip tekrar deneyin.'));return;}
      closeDrawer();rerender();
      toast(r.added+' kişi eklendi'+(r.updated?', '+r.updated+' kişi güncellendi':'')+(r.skipped?', '+r.skipped+' satır atlandı (e-posta ya da telefon yok ya da geçersiz)':'')+'.'+(r.err?' Liste yarıda kaldı; kalanı için tekrar deneyin.':''),8000);
    })]});
}
VIEWS.merkez.guvenlik=()=>{
  const root=h('div'),R=realM();
  root.append(ph('Güvenlik','Video indirme, eş zamanlı kullanım ve ofis verisinin ayrımı.',R?[btn('btn-o btn-s',[ic('refresh'),'Yenile'],async()=>{await loadOturumlar();rerender();})]:null));
  const tg=(k,b,s,lock)=>h('div',{class:'tg2'},h('div',{class:'t'},h('b',null,b),h('span',null,s)),h('button',{class:'sw lt-sw',type:'button','aria-pressed':String(!!SEC[k]),'aria-label':b,disabled:lock||null,onclick:()=>{SEC[k]=!SEC[k];rerender();}},h('i')));
  const cs=sel('secC',[[1,'1 cihaz'],[2,'2 cihaz']],SEC.conc,v=>{
    const n=+v;
    if(!R){SEC.conc=n;toast('Eş zamanlı oturum sınırı: '+v+' cihaz.');return;}
    cs.value=String(SEC.conc);
    if(n<SEC.conc)confirmBox('Sınır '+n+' cihaz olsun mu?','Bir hesapla açık olan fazla oturumlar hemen kapanır, en yenisi kalır. Sizin bu cihazınız açık kalır.','Uygula',()=>sinirDegistir(n));
    else sinirDegistir(n);
  });
  cs.className='inp';cs.style.cssText='width:auto;height:38px';cs.setAttribute('aria-label','Eş zamanlı oturum sınırı');
  const rules=pn('Kurallar',null,h('div',null,
    tg('dl','Video indirme kapalı','Videolar Vimeo’dan yalnız akademi alan adında oynar; indirme bağlantısı yoktur.',true),
    tg('iso','Ofis verisi ayrı','Ofisler birbirinin danışmanlarını, raporlarını ve takvimini görmez.',true),
    tg('priv','Özel değerlendirme yalnız mentor ve broker','Merkez dahil başka kimse görmez.',true),
    h('div',{class:'tg2'},h('div',{class:'t'},h('b',null,'Aynı hesapla eş zamanlı oturum'),h('span',null,'Sınır aşılınca en eski oturum kapanır.')),cs)));
  let devs;
  if(!R)devs=h('ul',{class:'ls'},DEV.map((d,i)=>h('li',null,h('span',{class:'li-i'},ic('device')),h('div',{class:'t'},h('b',null,d.u+', '+d.r),h('span',null,d.o+', '+d.d+', '+d.w)),
    i?btn('btn-g btn-xs','Oturumu kapat',()=>{DEV.splice(i,1);toast('Oturum kapatıldı.');rerender();}):chip('ok',null,'Şu an'))));
  else{
    if(!SESS.busy&&Date.now()-SESS.at>30000)loadOturumlar().then(()=>{if(S.page==='guvenlik')rerender();});
    const rl=x=>x.role==='merkez'?'Merkez yöneticisi':x.role==='broker'?(x.is_mentor?'Broker ve mentor':'Broker'):'Mentor';
    devs=SESS.list.length?h('ul',{class:'ls'},SESS.list.map(x=>h('li',null,h('span',{class:'li-i'},ic('device')),
        h('div',{class:'t'},h('b',null,(x.full_name||x.email)+', '+rl(x)),h('span',null,[x.office_name?x.office_name.replace(/^RE\/MAX\s+/i,''):'Merkez',x.device||'Cihaz bilinmiyor',x.is_current?'Şu an':once(new Date(x.last_seen_at))].join(', '))),
        x.is_current?chip('ok',null,'Bu cihaz'):btn('btn-g btn-xs','Oturumu kapat',()=>confirmBox('Oturum kapatılsın mı?',(x.full_name||x.email)+' bu cihazda ('+(x.device||'cihaz')+') çıkış yapar; isterse yeniden giriş yapabilir.','Kapat',()=>oturumKapat(x.id)),{'aria-label':(x.full_name||x.email)+' oturumunu kapat'}))))
      :empty(SESS.err?'Liste alınamadı':'Açık oturum yok',SESS.err?'Bağlantınızı kontrol edip yenileyin.':'Hesaplar giriş yaptıkça burada görünür.');
  }
  root.append(h('div',{class:'g2'},h('div',{class:'st'},rules),pn('Açık oturumlar',R&&SESS.list.length?h('span',{class:'c'},String(SESS.list.length)):null,devs)));
  return root;
};
