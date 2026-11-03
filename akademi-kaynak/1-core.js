'use strict';
(()=>{
/* Gerçek giriş durumu (Supabase): en başta tanımlı, örnek veri üretilirken de okunabilsin */
let SB=null,ME=null;
/* =================== YARDIMCILAR =================== */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
function put(e,kids){for(const c of kids.flat(9)){if(c==null||c===false||c==='')continue;e.append(c instanceof Node?c:document.createTextNode(String(c)));}return e;}
const fill=(e,...k)=>{e.replaceChildren();return put(e,k);};
function h(tag,a,...kids){
  const e=document.createElement(tag);
  if(a)for(const k in a){const v=a[k];if(v==null||v===false)continue;
    if(k==='class')e.className=v;else if(k==='style')e.style.cssText=v;
    else if(k.slice(0,2)==='on'&&typeof v==='function')e.addEventListener(k.slice(2),v);
    else e.setAttribute(k,v===true?'':v);}
  return put(e,kids);
}
const NS='http://www.w3.org/2000/svg';
function ic(n,cls){const s=document.createElementNS(NS,'svg');s.setAttribute('class','i'+(cls?' '+cls:''));s.setAttribute('aria-hidden','true');const u=document.createElementNS(NS,'use');u.setAttribute('href','#i-'+n);s.append(u);return s;}
const btn=(cls,label,on,a)=>h('button',Object.assign({class:'btn '+cls,type:'button',onclick:on},a||{}),label);
const up=s=>s.toLocaleUpperCase('tr');
const ini=n=>{const p=n.split(' ').filter(Boolean);return up((p[0]||'?')[0]+(p.length>1?p[p.length-1][0]:''));};
const first=n=>n.split(' ')[0];
const pad2=n=>String(n).padStart(2,'0');
const pct=(a,b)=>b?Math.round(a/b*100):0;
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
const r1=x=>Math.round(x*10)/10;
const trn=x=>String(r1(x)).replace('.',',');

/* ---------- Tarih ---------- */
const T0=new Date();T0.setHours(0,0,0,0);
const DAY=864e5;
const plus=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x;};
const D=n=>plus(T0,n);
const isWk=d=>d.getDay()===0||d.getDay()===6;
const wd=n=>{const d=D(n);const s=n<0?-1:1;while(isWk(d))d.setDate(d.getDate()+s);return d;};
const nwd=d=>{const x=new Date(d);do{x.setDate(x.getDate()+1);}while(isWk(x));return x;};
const AY=['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const GUN=['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
const GK=['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
const dd=d=>d.getDate()+' '+AY[d.getMonth()];
const ddy=d=>dd(d)+' '+d.getFullYear();
const dnum=d=>pad2(d.getDate())+'.'+pad2(d.getMonth()+1)+'.'+d.getFullYear();
const df=d=>{const x=new Date(d);x.setHours(0,0,0,0);return Math.round((x-T0)/DAY);};
const rel=d=>{const n=df(d);if(n===0)return 'Bugün';if(n===1)return 'Yarın';if(n===-1)return 'Dün';if(n>1&&n<7)return GUN[d.getDay()];return dd(d);};
const relL=d=>{const n=df(d);return n>=-1&&n<=1?rel(d)+', '+dd(d):(n>1&&n<7?GUN[d.getDay()]+', '+dd(d):dd(d));};
const sameDay=(a,b)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
const iso=d=>d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate());
const fromIso=s=>{const p=s.split('-').map(Number);return new Date(p[0],p[1]-1,p[2]);};
const lateBy=d=>-df(d);

/* ---------- Sabit rastgele ---------- */
function hash(s){let x=2166136261>>>0;for(let i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,16777619);}return x>>>0;}
function rng(seed){let t=seed>>>0;return()=>{t=(t+0x6D2B79F5)>>>0;let r=Math.imul(t^(t>>>15),1|t);r=(r+Math.imul(r^(r>>>7),61|r))^r;return((r^(r>>>14))>>>0)/4294967296;};}

/* =================== EĞİTİMLER =================== */
function chs(str){return str.split(';').map(x=>x.split('|'));}
const TR=[
  {id:'kb',s:'Kişisel Başarı',t:'Kişisel Başarı Prensiplerinde Ustalık',img:'img/hero-armsup.jpg',pos:'50% 16%',tn:'#5A0A12',lt:[['s','Kişisel',15],['c','BAŞARI',27],['w','PRENSİPLERİ',4.4]],r:'Hedefini koy, korkunu yönet, özgüvenle sahaya çık.',
   ch:chs('KB01|Giriş;KB02|Kişisel Motivasyon, Kişisel İlerleme;KB03|İçsel Hedef Belirleme Sanatı 1;KB04|İçsel Hedef Belirleme Sanatı 2;KB05|Kişisel Gelişim Metodolojilerinin Önemi;KB06|Özgüven Gelişimi;KB07|3B Gelişim;KB08|Rahatlık Bölgesi Gelişimi;KB09|Korku Yönetimi Gelişimi;KB10|Geri Bildirimde Gelişmek;KB11|Çevre Yönetiminde Gelişmek;KB14|Kişisel Dönüşüm: Mantalite Eğitimleri;KB15|İki Çeşit Mantalite;KB16|Mantalitenin Yapı Taşları: Başarı İnançları;KB17|İnanç Değişiminin 5 Adımı')},
  {id:'mb',s:'Kişisel Marka',t:'Kişisel Marka ve Müşteri Bulmada Ustalık',img:'img/point.jpg',pos:'50% 10%',tn:'#0B1E5C',lt:[['s','Kişisel Marka ve',10.5],['c','MÜŞTERİ',23],['w','BULMA USTALIĞI',4.2]],r:'Müşteri havuzunu büyüt, adayları randevuya çevir.',
   ch:chs('MB01|Geniş Müşteri Havuzu Oluşturmanın Önemi;MB02|Alıcı ve Satıcı Tipleri: Kolay ve Zor Müşteri;MB03|Geniş Müşteri Havuzu Oluşturmanın 2 Yöntemi;KP01|Kişisel Markamızın 4 K’sı;KP02|Müşteri Bulma Kaynakları;KP03|Kişisel Pazarlamada Tanıtımlar ve Sunulan Değerler;KP04-01|Etki Çevresi Kaynağı;KP04-02|Etki Çevresi: Değer Sunarken Dengeyi Yakalamak;SM01|Sosyal Medyada Konumlanma;KP05|Eski Müşterilerimiz;KP06|Dernekler ve Kulüpler;KP07|Yeni İnsanlarla Tanışmak;RD01|Adayları Randevuya Çevirmek İçin İlk Temas Prensipleri;RD02|Randevuya Çevirmede Başarının Mental Sırları')},
  {id:'dd',s:'Dolu Danışman',t:'Dolu Danışman Olmada Ustalık',img:'img/collection.jpg',pos:'50% 12%',tn:'#4A3205',lt:[['s','Dolu',16],['c','DANIŞMAN',20],['w','OLMADA USTALIK',4.2]],r:'Portföy sunumuna hazır git, ilk görüşmede fark yarat.',
   ch:chs('D01|Portföy Sunumu Hazırlıkları;D02|Ön Portföy Paketi;D02-01|Rakip Pazar Analizi;D04|Raporlama ve İletişim Planı')},
  {id:'fsbo',s:'Sahibinden Satılık',t:'Sahibinden Satılıklarda Ustalık',img:'img/mic.jpg',pos:'50% 12%',tn:'#3A0A0E',lt:[['s','Sahibinden',14],['c','SATILIKLAR',16.5],['w','USTALIK',4.6]],r:'Sahibinden satılık ilanını telefonda randevuya çevir.',
   ch:chs('FSBO 01|Sahibinden Satılıklar Neden Sahibinden Satılık;FSBO 02|Sahibinden Satılıkların Problemleri;FSBO 03|Sahibinden Satılıklarda Farklı FSBO Grupları;FSBO 03-01|FSBO’larla Telefon Görüşmesi;FSBO 04|Telefon Görüşmesinde Çıkabilecek 3 Sonuç;FSBO 05|Telefon Görüşmesinde İtirazlar;FSBO 06|Telefonu Açma Teknikleri;FSBO 07|Alternatif Randevu Alma Yöntemleri;FSBO 08|FSBO Özetleri ve Hareket Planı')},
  {id:'pa',s:'Portföy Almada',t:'Portföy Almada Ustalık',img:'img/stage.jpg',pos:'34% 24%',tn:'#5C0810',lt:[['c','PORTFÖY',23],['w','ALMADA USTALIK',4.2]],r:'İlk görüşmede güveni kur, sözleşmeyi iste ve al.',
   ch:chs('PA01|Portföy Almada Ustalık: Giriş;PA02|Birinci Görüşmede Güven ve Yakınlık;PA03|Mülk Analizi;PA04|Birinci Görüşme İtirazları;PA05|Portföy Almada İkinci Görüşme;PA06|Portföy Sunumu Sıralaması: Timeline Detayları;PA07|Portföy Sunumunda Fiyatı ve Pazarlama Planını Sunmak;PA08|Portföy Sunumunda İletişim Planını Sunmak;PA09|Satıcı Kapanışı: Sözleşmeyi İstemek;PA10|Sözleşmeyi Alma Yöntemleri;PA11|Koçluk Soruları')},
  {id:'iu',s:'İtirazlar',t:'İtirazlarda Ustalık',img:'img/upgrade.jpg',pos:'50% 10%',tn:'#1D1D22',lt:[['s','İtirazlarda',14],['c','USTALIK',23]],r:'İtirazı karşıla, değerini koru, işlemi kapat.',
   ch:chs('İU 01|İtirazlarda Ustalığın Temeli;İU 02|İtirazları Yönetmenin 3 Prensibi;İU 03|Değerde Güçlü Olmak;İU 04|Duruşta Güçlü Olmak;İU 05|Diyaloglarda Güçlü Olmak;İU 06|Hizmet Bedeli İçin Güçlü Diyalog Yöntemleri;İU 07|Gayrimenkul Danışmanlığında 2 Farklı Rekabet;İU 08|“Düşünmek İstiyoruz” İtirazı;İU 09|Sözleşme İtirazlarında Ustalık;İU 10|Koçluk Soruları')},
  {id:'au',s:'Alıcılar',t:'Alıcılarda Ustalık',img:'img/banner.jpg',pos:'21% 46%',tn:'#0D2A1A',lt:[['s','Alıcılarda',14],['c','USTALIK',23]],r:'Alıcıyı doğru analiz et, teklife ve sonuca ulaştır.',
   ch:chs('AU 01|Alıcılara Giriş ve Alıcı Deneyimi Süreci;AU 02|Alıcı Tipleri ve Alıcılarda Öncelik Yönetimi;AU 03|Alıcı Analizinde Ustalık;AU 04|Alıcı Telefon Görüşmesinde Ustalık;AU 05|Alıcılarda İlk Yüz Yüze Görüşmede Ustalık;AU 06|Alıcı Ön Sunumunda Ustalık;AU 07|Yer Göstermelerde Ustalık;AU 08|Teklif Sürecinde Ustalık;AU 09|Koçluk Soruları ve Hareket Planı')},
  {id:'dfi',s:'Doğru Fiyat',t:'Doğru Fiyatlı Portföy Almada Ustalık',img:'img/baris-portre.jpg',pos:'50% 40%',tn:'#08153A',lt:[['s','Doğru',16],['c','FİYAT',28],['w','PORTFÖY ALMADA USTALIK',3.4]],r:'Doğru fiyatla sözleşme al, satılan portföy topla.',
   ch:chs('DFI 01|Doğru Fiyata İknada Ustalık;DFI 02|Fiyatı Etkileyen Alıcı ve Satıcı Pazarı;DFI 03|Sebep Sonuç İlişkisi;DFI 04|Fiyatı Etkileyen Faktörler;DFI 05|Fiyatı Belirlemede Ustalık;DFI 06|Alternatif Rakip Pazar Analizi Yöntemleri;DFI 07|Fiyat Sunumunda Ustalık;DFI 08|Fiyat Karşılamada Ustalık;DFI 09|“Masrafımız Çok” İtirazı;DFI 10|“Başkaları Daha Yükseğe Satarız Dedi” İtirazı;DFI 11|“Vaktimiz Var, Biraz Yüksek Fiyattan Deneyelim” İtirazı;DFI 12|Pazarlık Payı İtirazı;DFI 13|“Ne Kadar Sürede Satılır?” İtirazı;DFI 14|Fiyat Düzeltme Stratejileri;DFI 15|Fiyatı Kabullenmenin Psikolojik Yolculuğu;DFI 16|Fiyata İknada En Etkili Teknik;DFI 17|Hareket Planı')},
  {id:'cl',s:'İşlem Kapanış',t:'İşlem Kapanışta Ustalık',img:'img/roportaj-3.jpg',pos:'16% 50%',tn:'#3B2405',lt:[['s','İşlem',16],['c','KAPANIŞ',23],['w','USTALIK',4.6]],r:'Kapanışı ilk görüşmeden kur, işlemi sonuca bağla.',
   ch:chs('CLOSING 01|Kapanış Çizgisi;CLOSING 02|Kapanışta Ustalık Mantalitesi;CLOSING 03|Üç Farklı Kapanış;CLOSING 04|Kapanış Açılışla Başlar;CLOSING 05|Kapanış Süreçle Devam Eder;CLOSING 06|Taktiksel Empatide Rüya ve Kabus Sınırlar;CLOSING 07|Mesaj Ustası ve Kapanış Ustası;CLOSING 08|Teklif ve Kontra Teklif Yönetimi;CLOSING 09|Alternatif Kapanış Teknikleri;CLOSING 10|Baskı Kapanışı, Geri Bildirim Kapanışı;CLOSING 11|Koçluk Soruları, Hareket Planı')},
  {id:'byu',s:'Beyin Yönetimi',t:'Beyin Yönetiminde Ustalık',img:'img/baris-boy.webp',cut:true,tn:'#000',lt:[['s','Beyin',16],['c','YÖNETİMİ',20],['w','USTALIK',4.6]],r:'Dikkatini koru, gününü yönet, üretkenliğini artır.',
   ch:chs('BYU 01|Beynimizi Keşfediyoruz;BYU 02|Yeni Dünyanın Dijital Rahatsızlıkları ve Dikkat Dağıtıcıları;BYU 03|Üretkenliğin 4 Ana Kuralı;BYU 04|Süper Güçlerimiz ve Kriptonitlerimiz;BYU 05|Sıradışı Üretkenlik İçin Yap, Vazgeç, Delege Et Modeli;BYU 06|Üretkenlik Planımda Sabah ve Akşam Rutinleri;BYU 07|Beynimizi Yönetme Uygulamaları ve Formları;BYU 08|Koçluk Soruları')}
];
const TRM={};TR.forEach((t,i)=>{t.no=i+1;TRM[t.id]=t;});

/* ---------- Vimeo: Masterclass Academy klasörü (31 Ekim) ----------
   kod: [video kimliği, süre (sn), sitede oynar mı]. 1 Kasım: 75 özel video Embed only yapıldı, hepsi 1. */
const VIM={"KB01":[1014299550,462,1],"KB02":[1014298018,646,1],"KB03":[1014296811,1029,1],"KB04":[1014294714,1578,1],"KB05":[1014293819,528,1],"KB06":[1014350341,1639,1],"KB07":[1014286238,582,1],"KB08":[1014284819,758,1],"KB09":[1014282839,1342,1],"KB10":[1014282147,674,1],"KB11":[1014300223,1109,1],"KB14":[1014361429,193,1],"KB15":[1014273232,743,1],"KB16":[1014362879,950,1],"KB17":[1014365861,1246,1],"KP02":[1014261123,341,1],"KP03":[1014260397,603,1],"KP04-01":[1014259689,735,1],"KP04-02":[1014259344,314,1],"SM01":[1014261326,1290,1],"KP06":[1014259076,383,1],"KP07":[1014258544,464,1],"RD01":[1014257655,514,1],"RD02":[1014257393,393,1],"D01":[1014257014,204,1],"D02":[1014256531,486,1],"D02-01":[1014255992,460,1],"D04":[1014255639,410,1],"FSBO 01":[1014254559,756,1],"FSBO 02":[1014252620,746,1],"FSBO 03":[1014252515,88,1],"FSBO 03-01":[1014248580,1337,1],"FSBO 04":[1014252002,380,1],"FSBO 05":[1014251672,335,1],"FSBO 06":[1014251062,686,1],"FSBO 07":[1014250454,525,1],"FSBO 08":[1014250249,161,1],"PA01":[1051617923,1085,1],"PA02":[1024494920,1115,1],"PA03":[1024497442,887,1],"PA04":[1024499399,614,1],"PA05":[1151157126,299,1],"PA06":[1024501352,633,1],"PA07":[1024502642,87,1],"PA08":[1024502845,227,1],"PA09":[1024503385,302,1],"PA10":[1024504086,1561,1],"PA11":[1024507404,303,1],"İU 01":[1050847165,1194,1],"İU 02":[1024459036,253,1],"İU 03":[1024459671,1494,1],"İU 04":[1151273131,624,1],"İU 05":[1024463644,253,1],"İU 06":[1024464851,1950,1],"İU 07":[1024469620,259,1],"İU 08":[1024470168,167,1],"İU 09":[1024470559,417,1],"İU 10":[1024471512,338,1],"AU 01":[1024389611,820,1],"AU 02":[1024392184,746,1],"AU 03":[1024430393,983,1],"AU 04":[1024433827,435,1],"AU 05":[1050321079,1428,1],"AU 06":[1050332280,744,1],"AU 07":[1050333531,1441,1],"AU 08":[1024435422,426,1],"AU 09":[1024436977,284,1],"DFI 01":[1014446820,653,1],"DFI 02":[1014450196,764,1],"DFI 03":[1050743826,507,1],"DFI 04":[1050752209,452,1],"DFI 05":[1014453908,1412,1],"DFI 06":[1014463040,372,1],"DFI 07":[1050764841,901,1],"DFI 08":[1014484629,180,1],"DFI 09":[1151353197,485,1],"DFI 10":[1151352467,314,1],"DFI 11":[1050547371,213,1],"DFI 12":[1050547587,202,1],"DFI 13":[1050547926,458,1],"DFI 14":[1050548249,330,1],"DFI 15":[1050548755,253,1],"DFI 16":[1050549284,451,1],"DFI 17":[1050550186,274,1],"CLOSING 01":[1014399014,463,1],"CLOSING 02":[1014401016,578,1],"CLOSING 04":[1014428955,557,1],"CLOSING 05":[1151156228,281,1],"CLOSING 06":[1014434791,756,1],"CLOSING 07":[1014438375,1166,1],"CLOSING 08":[1014443262,670,1],"CLOSING 09":[1151337078,1289,1],"CLOSING 10":[1151346238,340,1],"CLOSING 11":[1151345633,250,1],"BYU 01":[1024442443,1049,1],"BYU 02":[1024446321,458,1],"BYU 03":[1151154392,587,1],"BYU 04":[1151324856,1161,1],"BYU 05":[1024447945,451,1],"BYU 06":[1151333754,906,1],"BYU 07":[1151272597,189,1],"BYU 08":[1024452515,199,1]};
const vimOf=c=>c&&VIM[c]||null;
function vidStat(t){const c=t.ch.map(x=>x[0]),have=c.filter(x=>VIM[x]);return{n:c.length,have:have.length,miss:c.filter(x=>!VIM[x]),priv:have.filter(x=>!VIM[x][2]).length};}
const CLS=[
  {id:'ss',t:'Satışın Şifreleri',img:'img/hero-armsup.jpg',pos:'50% 24%',tn:'#3A0A0E',lt:[['s','Satışın',17],['c','ŞİFRELERİ',21]],d:'Sonucu Satmak, Önce Kendine Sat, Ethos, Logos, Pathos, Kendini Satmak'},
  {id:'gus',t:'Gayrimenkulün Usta Satışçıları',img:'img/roportaj-2.jpg',pos:'80% 60%',tn:'#111',lt:[['s','Gayrimenkulün',10.5],['c','USTA',27],['w','SATIŞÇILARI',4.6]],d:'Türkiye’nin usta satışçılarıyla birebir sohbetler'}
];

/* ---------- Akış: tanıtım, ana, koçluk, uygulama ---------- */
const STN={tan:'Tanıtım ve motivasyon',ana:'Ana eğitim',koc:'Koçluk ve içselleştirme',uyg:'Uygulama ve kazanç'};
const SKEYS=['tan','ana','koc','uyg'];
const FLC={};
function flow(t){
  if(FLC[t.id])return FLC[t.id];
  const ana=[],koc=[],uyg=[];
  t.ch.forEach(([c,a])=>{if(/Koçluk/.test(a))koc.push({k:'koc',c,a});else if(a==='Hareket Planı')uyg.push({k:'uyg',c,a});else ana.push({k:'ana',c,a});});
  return FLC[t.id]=[{k:'tan',c:'',a:'Tanıtım ve motivasyon videosu'}].concat(ana,[{k:'koc',c:'',a:'Koçluk ve içselleştirme videosu'}],koc,[{k:'uyg',c:'',a:'Uygulama videosu'}],uyg);
}
function dur(t,i){const st=flow(t)[i],v=vimOf(st.c);if(v)return v[1];const r=rng(hash(t.id+':'+i))();const b={tan:[6,3],ana:[13,15],koc:[11,7],uyg:[7,6]}[st.k];return Math.round((b[0]+r*b[1])*60);}
const fmtT=s=>Math.floor(s/60)+':'+pad2(Math.floor(s%60));
const fmtH=s=>{const m=Math.round(s/60),hh=Math.floor(m/60),mm=m%60;return hh?hh+' sa'+(mm?' '+mm+' dk':''):mm+' dk';};
const totalDur=t=>flow(t).reduce((a,_,i)=>a+dur(t,i),0);
const anaCount=t=>flow(t).filter(s=>s.k==='ana').length;
function daySplit(t,tpl){
  const all=flow(t).map((_,i)=>i);
  if(tpl!=='iki')return [all];
  const ana=all.filter(i=>flow(t)[i].k==='ana');
  const cut=ana[Math.ceil(ana.length/2)-1];
  return [all.filter(i=>i<=cut),all.filter(i=>i>cut)];
}
const stepName=st=>(st.c?st.c+' ':'')+st.a;
const needItems=t=>t.ch.filter(([,a])=>!/(^|: )Giriş$|Koçluk|Hareket Planı/.test(a)).slice(0,10);
const TPL={
  tek:{n:'Tek gün',d:'09:30–17:30, öğle arası dahil',ol:['Tanıtım ve motivasyon, Eğitim Notları dağıtılır','Ana eğitim videoları','Koçluk ve içselleştirme aynı gün','Gelişim ve Kazanç Aktiviteleri verilir']},
  iki:{n:'İki yarım gün',d:'İki ayrı gün, 09:30–13:00',ol:['1. gün: tanıtım ve ana videoların ilk yarısı','2. gün: kalan ana videolar','2. gün: koçluk ve içselleştirme aynı gün','2. gün: Gelişim ve Kazanç Aktiviteleri verilir']},
  yarim:{n:'Yarım gün',d:'Tekrar ya da telafi için, 09:30–13:00',ol:['Kaçırılan ya da tekrarlanacak bölümler','Gerekirse koçluk soruları']}
};

/* ---------- Gelişim ve Kazanç Aktiviteleri (örnek; mentor ofise uyarlar) ---------- */
const ACTS={
  kb:[['Hedef','Bu çeyrek için üç kişisel hedefini yaz, mentorunla paylaş',0],['Müşteri çalışması','Rahatlık bölgenin dışında kalan bir müşteri aramasını bu hafta yap',7],['Hedef','Bir ay boyunca sabah planını uygula, sonucu grupla paylaş',30]],
  mb:[['Müşteri çalışması','Etki çevrenden 20 kişilik listeyi çıkar',0],['Müşteri çalışması','Listeden on kişiyle iletişime geç, değer sunan bir mesaj gönder',7],['Hedef','İki adayı randevuya çevir',14]],
  dd:[['Role-play','Portföy sunumunu ekip arkadaşınla prova et',0],['Fiyat analizi','Bir mülk için ön portföy paketini hazırla',3],['Fiyat analizi','Rakip pazar analizini mentoruna sun',7]],
  fsbo:[['Role-play','Sahibinden satılık telefon görüşmesini grupla prova et',0],['Müşteri çalışması','Beş sahibinden satılık ilan sahibini ara, sonuçları yaz',7],['Hedef','Bir sahibinden satılıktan randevu al',14]],
  pa:[['Role-play','Birinci görüşmeyi ekip arkadaşınla prova et',0],['Fiyat analizi','Bir mülk analizi hazırla, mentorunla gözden geçir',7],['Hedef','Bir portföy görüşmesinde sözleşmeyi iste',14]],
  iu:[['Role-play','Hizmet bedeli diyaloğunu ekip arkadaşınla prova et',0],['Müşteri çalışması','Son üç itirazı yaz, yeni diyalogla karşıla',7],['Müşteri çalışması','“Düşünmek istiyoruz” diyen bir müşteriyi yeniden ara',21]],
  au:[['Role-play','Alıcı telefon görüşmesini grupla prova et',0],['Müşteri çalışması','İki alıcının analizini çıkar',7],['Hedef','Bir alıcıyla teklif aşamasına gel',21]],
  dfi:[['Role-play','Fiyat sunumunu ekip arkadaşınla prova et',0],['Fiyat analizi','Üç emsalle bir fiyat analizi hazırla',3],['Hedef','Doğru fiyatla bir yetkili portföy al',30]],
  cl:[['Role-play','Teklif ve kontra teklif görüşmesini prova et',0],['Müşteri çalışması','Açık işlemlerinin kapanış çizgisini çıkar',7],['Hedef','Bir işlemi kapanışa taşı',30]],
  byu:[['Hedef','Sabah ve akşam rutinini yaz',0],['Hedef','Bir hafta Yap, Vazgeç, Delege Et listesini uygula',7],['Hedef','Dikkat dağıtıcıları bir hafta kayda al, grupla paylaş',14]]
};
const ACTTY=['Role-play','Müşteri çalışması','Fiyat analizi','Hedef'];
const OFFACT={};
const actTpl=id=>OFFACT[id]||ACTS[id];

/* =================== OFİS VERİSİ =================== */
const OFF={id:'kdk',n:'RE/MAX Örnek Ofis Kadıköy',city:'İstanbul',tier:'1–25',start:D(-150),end:D(215)};
const PPL={mentor:{n:'Seda Yıldız',r:'Mentor'},broker:{n:'Hakan Demir',r:'Broker'},merkez:{n:'Derya Kaplan',r:'Merkez yöneticisi'}};
const GR=[{id:'a',n:'Grup A',d:'Deneyimli danışmanlar',c:'var(--c1)'},{id:'b',n:'Grup B',d:'Gelişen danışmanlar',c:'var(--c2)'},{id:'y',n:'Yeni Başlayanlar',d:'İlk yılındaki danışmanlar',c:'var(--c3)'}];
const GRM={};GR.forEach(g=>GRM[g.id]=g);
const CO=[
  ['ayse','Ayşe Kaya','a',-1180],['mert','Mert Doğan','a',-900],['elif','Elif Şahin','a',-760],['burak','Burak Tekin','a',-700],['zeynep','Zeynep Aydın','a',-640],['can','Can Yılmaz','a',-520],
  ['selin','Selin Öztürk','b',-420],['emre','Emre Koç','b',-380],['deniz','Deniz Yalçın','b',-300],['okan','Okan Bulut','b',-260],['gizem','Gizem Taş','b',-200],
  ['cem','Cem Akın','y',-120],['irem','İrem Şen','y',-75],['tolga','Tolga Eren','y',-40],
  ['kaan','Kaan Mutlu','b',-500,-30],['ebru','Ebru Polat','a',-800,-80]
].map(([id,n,g,s,l])=>({id,n,g,since:D(s),left:l!=null?D(l):null}));
const COM={};CO.forEach(c=>COM[c.id]=c);
const active=()=>CO.filter(c=>!c.left);
const inG=g=>active().filter(c=>c.g===g);

const r5d=wd(-55),r1d=wd(-20),r4d=wd(13);
const RUNS=[
  {id:'r5',tr:'au',g:'b',days:[r5d,nwd(r5d)],tpl:'iki',st:'done',dd:2,mem:['selin','emre','deniz','okan','gizem','kaan']},
  {id:'r1',tr:'iu',g:'a',days:[r1d,nwd(r1d)],tpl:'iki',st:'done',dd:2,mem:['ayse','mert','elif','burak','zeynep','can']},
  {id:'r2',tr:'pa',g:'b',days:[wd(-1),wd(1)],tpl:'iki',st:'live',dd:1,mem:['selin','emre','deniz','okan','gizem']},
  {id:'r3',tr:'kb',g:'y',days:[wd(6)],tpl:'tek',st:'plan',dd:0,mem:['cem','irem','tolga']},
  {id:'r4',tr:'dfi',g:'a',days:[r4d,nwd(r4d)],tpl:'iki',st:'plan',dd:0,mem:['ayse','mert','elif','burak','zeynep','can']}
];
const RM=id=>RUNS.find(r=>r.id===id);
const lastDay=r=>r.days[r.days.length-1];
let RUNNO=6;

const ATT={r5:{},r1:{},r2:{}};
['selin','emre','deniz','okan','gizem','kaan'].forEach(c=>ATT.r5[c]=[1,1]);
['ayse','mert','elif','burak','zeynep','can'].forEach(c=>ATT.r1[c]=[1,1]);
['selin','emre','deniz','okan'].forEach(c=>ATT.r2[c]=[1,null]);ATT.r2.gizem=[0,null];
const CCH={r5:{selin:1,emre:1,deniz:1,okan:1,gizem:1,kaan:1},r1:{ayse:1,mert:1,elif:1,burak:1,zeynep:1,can:0},r2:{}};
const ACT={};
function mkAct(r){return{items:actTpl(r.tr).map(([ty,t,n])=>({ty,t,n,due:plus(lastDay(r),n)})),done:{}};}
ACT.r5=mkAct(RM('r5'));ACT.r5.done={selin:[1,1,1],emre:[1,1,1],okan:[1,1,1],deniz:[1,0,0],gizem:[1,1,0],kaan:[1,0,0]};
ACT.r1=mkAct(RM('r1'));ACT.r1.done={ayse:[1,1,1],mert:[1,1,1],zeynep:[1,1,1],elif:[1,1,0],burak:[1,0,0],can:[1,1,0]};
const TELAFI={};

/* ---------- Özel değerlendirme ---------- */
const CRIT=['Katılım kalitesi','Odak','Koçluk yanıtlarına yaklaşım','Uygulama gayreti'];
const SC={
  'r1:ayse':{q:[5,5,4,5],n:'Hizmet bedeli diyaloğunu grubun önünde örnek olacak şekilde kurdu.'},
  'r1:mert':{q:[4,4,4,5],n:''},
  'r1:elif':{q:[4,3,4,3],n:'Koçluk sorularında kendi örneklerini getirdi.'},
  'r1:burak':{q:[3,2,3,2],n:'İkinci gün dikkati dağıldı; birebir konuşmak iyi olur.'},
  'r1:zeynep':{q:[5,4,5,5],n:''},
  'r1:can':{q:[4,3,3,3],n:''},
  'r5:selin':{q:[5,4,5,5],n:'Teklif sürecindeki provası gruba örnek oldu.'},
  'r5:emre':{q:[4,4,4,4],n:''},
  'r5:deniz':{q:[3,3,4,2],n:''},
  'r5:okan':{q:[4,5,4,4],n:''},
  'r5:gizem':{q:[4,3,3,3],n:''},
  'r5:kaan':{q:[3,3,3,2],n:''}
};

/* ---------- İhtiyaç değerlendirmesi ---------- */
const NEED={};
const BIAS={a:3.45,b:2.85,y:2.1};
const TADJ={dfi:-.45,cl:-.3,iu:-.2,kb:.35,mb:.2,au:.1,fsbo:-.1};
const EVAL={a:['iu','pa','dfi','cl','kb','au'],b:['au','pa','iu','dfi','fsbo','kb'],y:['kb','mb','pa','fsbo']};
function genNeed(c,trid,bias){const r=rng(hash(c+'|'+trid));return needItems(TRM[trid]).map(()=>Math.max(1,Math.min(5,Math.round(bias+(r()*2.3-1.15)))));}
active().filter(c=>c.id!=='tolga').forEach(c=>EVAL[c.g].forEach(tr=>{NEED[c.id+':'+tr]={pre:genNeed(c.id,tr,BIAS[c.g]+(TADJ[tr]||0)),post:null,d:D(-34)};}));
RM('r1').mem.forEach(c=>{const n=NEED[c+':iu'];n.d=plus(r1d,-4);n.post=n.pre.map((v,i)=>Math.min(5,v+1+(i%4===0?1:0)));n.pd=plus(r1d,16);});
['selin','emre','deniz','okan','gizem'].forEach(c=>{const n=NEED[c+':au'];n.d=plus(r5d,-5);n.post=n.pre.map((v,i)=>Math.min(5,v+(i%3===2?0:1)));n.pd=plus(r5d,20);});
const needPct=a=>a&&a.length?Math.round((5-avg(a))/4*100):null;
const lvl=p=>p==null?null:p>=60?'Yüksek':p>=35?'Orta':'Düşük';
const qcls=p=>p==null?'e':p<20?'q1':p<40?'q2':p<60?'q3':p<80?'q4':'q5';

/* ---------- İş sonuçları (isteğe bağlı) ---------- */
const BZN=['Müşteri görüşmesi','Fiyat analizi','Yeni portföy','Kapanan işlem'];
const BIZ={ayse:[14,5,3,1],mert:[12,4,2,1],elif:[9,3,1,0],burak:[6,1,0,0],zeynep:[13,6,3,1],can:[8,2,1,0],selin:[11,4,2,1],emre:[10,3,2,0],deniz:[7,2,1,0],okan:[12,4,2,1],gizem:[6,2,1,0],cem:[5,1,0,0],irem:[7,2,1,0],tolga:[4,1,0,0]};

/* ---------- Sertifikalar ---------- */
const CT={kat:'Katılım Sertifikası',bas:'Başarı Sertifikası',mc:'Masterclass Akademi Sertifikası'};
let CNO=311;
const newNo=()=>realO()?certNo():'MA-'+String(T0.getFullYear()).slice(2)+'-'+String(CNO++).padStart(5,'0');
const CERT=[];
['selin','emre','deniz','okan','gizem','kaan'].forEach(c=>CERT.push({no:newNo(),c,run:'r5',tr:'au',ty:'kat',d:plus(lastDay(RM('r5')),1)}));
['selin','emre','okan'].forEach(c=>CERT.push({no:newNo(),c,run:'r5',tr:'au',ty:'bas',d:plus(lastDay(RM('r5')),24)}));
const MCSET=new Set(TR.map(t=>t.id));

/* ---------- Raporlar ---------- */
const REP={ayse:{sh:D(-2),cm:null},mert:{sh:D(-2),cm:null},zeynep:{sh:null,cm:null},selin:{sh:D(-30),cm:{t:'Teklif sürecini çok iyi yönetiyor; Grup B’de ikinci yarıda ona küçük bir liderlik rolü verelim.',d:D(-29)}}};

/* ---------- Mentorun ön izlemesi ---------- */
const PREV={};TR.forEach(t=>PREV[t.id]=new Set());
['iu','au','pa'].forEach(id=>flow(TRM[id]).forEach((_,i)=>PREV[id].add(i)));
[['kb',.6],['dfi',.35]].forEach(([id,p])=>{const n=Math.round(flow(TRM[id]).length*p);for(let i=0;i<n;i++)PREV[id].add(i);});
const prevPct=id=>pct(PREV[id].size,flow(TRM[id]).length);

/* =================== MERKEZ VERİSİ =================== */
const OFFS=[
  {id:'kdk',n:'RE/MAX Örnek Ofis Kadıköy',city:'İstanbul',br:'Hakan Demir',mn:'Seda Yıldız',tier:'1–25',cons:14,start:OFF.start,end:OFF.end,ses:5,st:'aktif',comp:62,cert:9},
  {id:'cnk',n:'RE/MAX Örnek Ofis Çankaya',city:'Ankara',br:'Levent Arı',mn:null,tier:'26–75',cons:38,start:D(-300),end:D(58),ses:7,st:'aktif',comp:71,cert:46},
  {id:'brn',n:'RE/MAX Örnek Ofis Bornova',city:'İzmir',br:'Nazlı Er',mn:'Ozan Kurt',tier:'26–75',cons:31,start:D(-200),end:D(165),ses:4,st:'aktif',comp:55,cert:27},
  {id:'nlf',n:'RE/MAX Örnek Ofis Nilüfer',city:'Bursa',br:'Tuna Sarı',mn:'Ece Duman',tier:'1–25',cons:19,start:D(-340),end:D(25),ses:1,st:'aktif',comp:38,cert:12},
  {id:'mrt',n:'RE/MAX Örnek Ofis Muratpaşa',city:'Antalya',br:'Ferit Gök',mn:'Bora Ak',tier:'76–99',cons:84,start:D(-90),end:D(275),ses:9,st:'aktif',comp:47,cert:31},
  {id:'plt',n:'RE/MAX Pilot Ofis',city:'İstanbul',br:null,mn:null,tier:'1–25',cons:0,start:null,end:null,ses:0,st:'davet',comp:0,cert:0,inv:D(-3)}
];
const TIERS=['1–25','26–75','76–99','100+'];
const MAT={};TR.forEach(t=>{const full=['iu','pa','au'].includes(t.id),half=['kb','dfi'].includes(t.id);MAT[t.id]={vim:1,ext:full?1:0,pdf:[full||half?1:0,full?1:0,full?1:0],live:1};});
const NEWTR=[];
const REQS=[
  {id:'q1',at:D(-1),kind:'kurumsal',name:'Ece Yalın',company:'Örnek Holding',phone:'0532 000 00 01',topic:'Satış',size:'21-80 kişi',message:'Mart ayında İstanbul’da yarım günlük eğitim',status:'yeni'},
  {id:'q2',at:D(-2),kind:'ofis',name:'Kerem Aksoy',company:'RE/MAX Örnek Ofis Moda',city:'İstanbul',phone:'0532 000 00 02',size:'26–75',status:'yeni'},
  {id:'q3',at:D(-6),kind:'bulten',email:'ornek@ornek.com',status:'islendi'}
];
const LEGACY=[{t:'Eski sitedeki kullanıcı ve satın alma listesi alındı',d:0},{t:'Test kullanıcılarıyla yeni erişim doğrulandı',d:0},{t:'Bütün eski kullanıcılara yeni erişim açıldı',d:0},{t:'Eski sistem kapatıldı',d:0}];
const SEC={dl:true,conc:1,iso:true,priv:true};
const DEV=[
  {u:'Seda Yıldız',o:'Kadıköy',r:'Mentor',d:'MacBook, Chrome',w:'Şu an'},
  {u:'Hakan Demir',o:'Kadıköy',r:'Broker',d:'iPhone, Safari',w:'2 saat önce'},
  {u:'Levent Arı',o:'Çankaya',r:'Broker ve mentor',d:'Windows, Edge',w:'Dün'},
  {u:'Ozan Kurt',o:'Bornova',r:'Mentor',d:'iPad, Safari',w:'3 gün önce'}
];
