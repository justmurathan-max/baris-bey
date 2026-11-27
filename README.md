# Barış Kılıçarslan: site ve Masterclass Akademi

Barış Kılıçarslan'ın tanıtım sitesi ve giriş sonrası Masterclass Akademi. Giriş, ofisler, mentor ve broker panelleri, site formları ve sertifika doğrulama Supabase'e bağlı; ana eğitim videoları Vimeo'dan gömülü. Girişsiz açılan önizleme örnek verilerle çalışır.

## Klasörler

- `site/`: Vercel'in yayınladığı klasör.
  - `index.html`: tanıtım sitesi (Türkçe, ana sayfa).
  - `en/`, `es/`, `de/`: İngilizce, İspanyolca ve Almanca site. Elle düzenlenmez; `dil-kaynak/` ile Türkçe sayfadan üretilir.
  - `akademi.html`: giriş sonrası akademi (mentor, broker ve merkez panelleri). Elle düzenlenmez; `akademi-kaynak/` içinden üretilir.
  - `img/`: görseller.
  - `odeme.html`: online eğitim setleri ve kitap için satın alma sayfası (`/odeme`).
  - `sozlesmeler/`: mesafeli satış, ön bilgilendirme, iptal ve iade, teslimat, KVKK, gizlilik ve çerez, üyelik, yasal uyarılar, hakkımızda, iletişim. Elle düzenlenmez; `satis-kaynak/` içinden üretilir.
  - `dogrula.html`: herkese açık sertifika doğrulama; `/dogrula/<numara>` adresi buraya yönlenir (`vercel.json`).
  - `js/supabase.js`: Supabase'in tarayıcı kütüphanesi (2.118.0), npm'den olduğu gibi.
  - `js/qr.js`: sertifikalardaki QR için qrcode-generator (1.4.4, MIT), npm'den olduğu gibi.
  - `js/cerez.js`: çerez bildirimi ve izne bağlı ziyaret istatistiği (aşağıda "KVKK, çerez ve formlar").
  - `fonts/`: yazı tipleri ve sayfa gruplarının `@font-face` dosyaları. Elle düzenlenmez; `font-kaynak/` ile üretilir.
  - `vercel.json`: güvenlik başlıkları, yönlendirmeler; `robots.txt` ile birlikte taslağı arama motorlarına kapatır.
- `satis-kaynak/`: satıcı bilgileri (`satici.json`), ürün ve fiyatlar (`urunler.json`), yasal metinler (`metinler/*.md`) ve bunlardan sayfaları üreten `build.py`.
- `dil-kaynak/`: dil sayfalarını üreten `uret.mjs` ve çeviriler (`ceviri/*.txt`).
- `font-kaynak/`: yazı tiplerini `site/fonts/` içine yazan `uret.py` (Fontsource paketlerinden, Google Fonts'un aynı sürümleri).
- `.github/workflows/veritabani-yedegi.yml`: veritabanının şifreli gece yedeği (aşağıda "Veritabanı yedeği").
- `akademi-kaynak/`: akademinin parçaları.
  - `a.html` iskelet, `a.css` stiller, `1-core.js` … `7-init.js` uygulama.
  - `1-core.js` içindeki `VIM` listesi bölüm kodlarını Vimeo videolarına bağlar: `[video kimliği, süre (sn), sitede oynar mı]`.

## Akademiyi üretmek

```
python3 akademi-kaynak/build.py
```

`site/akademi.html` yeniden yazılır.

## Dil sayfaları

Türkçe `site/index.html` asıl sayfadır; İngilizce, İspanyolca ve Almanca sayfalar ondan üretilir. Türkçe sayfada bir metin değişince ya da yeni metin eklenince:

```
cd dil-kaynak && npm install    # bir kez
node dil-kaynak/uret.mjs         # site/en, site/es, site/de yeniden yazılır
node dil-kaynak/uret.mjs --eksik # çevirisi olmayan metinler dil-kaynak/eksik.txt dosyasına
```

- Çeviriler `dil-kaynak/ceviri/*.txt` dosyalarında, `tr:` satırının altında `en:`, `es:`, `de:` satırlarıyla durur. `=` satırı "her dilde aynı" demektir (adlar, markalar, kapak yazıları). Biçim `uret.mjs` dosyasının başında anlatılır.
- Çevirisi olmayan metin varsa komut sayfaları yine yazar ama eksikleri listeler ve hata koduyla biter. `satis-kaynak/build.py` de sonunda bu komutu çalıştırır.
- Sözleşmeler, ödeme sayfası, akademi ve sertifika doğrulama Türkçe kalır; dil sayfalarında bunu söyleyen kısa notlar görünür (`data-yabanci`).
- Dil sayfalarından gelen form kayıtlarına sayfanın dili yazılır (`meta.dil`); merkez panelinde "İngilizce sayfadan" gibi görünür.
- Alan adı değişince `uret.mjs` içindeki `SITE_URL` ve Türkçe sayfadaki `canonical`, `hreflang`, `og:url` adresleri birlikte değişmeli.

## Yayın

Vercel'de projenin kök klasörü (Root Directory) `site` olmalı; derleme komutu yok. `main` dalına gelen her değişiklik yayına çıkar.

## Veritabanı

Supabase (Frankfurt). Şema `supabase/migrations/` içindeki göç dosyalarında; sırayla çalıştırılır.

- Roller: merkez, broker, mentor. Danışmanların hesabı yok.
- Her ofis kaydı `office_id` taşır; satır kurallarıyla ofisler birbirini göremez. Merkez hepsini okur, mentorun özel puanlarını göremez.
- Giriş yalnız davetle: kullanıcı oluşunca profili `invitations` tablosundaki davetten açılır. Şifre yok; akademinin giriş ekranı e-postaya giriş bağlantısı gönderir (`akademi-kaynak/6-supabase.js`).
- Akademideki anahtar Supabase'in yayınlanabilir (publishable) anahtarıdır; tarayıcıda durması için yapılmıştır. Gizli (secret) anahtar asla depoya konmaz.
- Yeni tablolar Data API'ye kendiliğinden açılmaz; her göç kendi tablosunun yetkisini ve satır kurallarını vermeli.
- Bu depo herkese açık: anahtar, şifre ve kişisel veri buraya konmaz. Gizli anahtarlar Vercel'in ortam değişkenlerinde durur.

### Göçler

1. `20261103000000_akademi_temel.sql`: tablolar, satır kuralları, davetle profil, sertifika doğrulama.
2. `20261103010000_katilim_ve_ofis_durumu.sql`: ilk girişte katılma zamanı; ofis davetten etkine geçer.
3. `20261103020000_puan_ve_ofis_kilidi.sql`: özel puanda 0 = puanlanmadı; pasif ya da üyeliği bitmiş ofis kilitlenir.
4. `20261107000000_siparisler.sql`: site satın almaları (`orders`); yalnız `odeme` fonksiyonu yazar, merkez okur.
5. `20261107100000_oturum_siniri_ve_ayarlar.sql`: eş zamanlı oturum sınırı (`session_open`, `session_close`, `set_session_limit`, `active_sessions`), merkez ayarları (`settings`), yeni eğitim taslakları (`training_drafts`).
6. `20261107110000_egitim_belgeleri.sql`: eğitim belgeleri (`training_documents`, Storage'da özel `belgeler` kovası ve kuralları) ve ek videolar (`training_videos`).
7. `20261107120000_klasik_erisim.sql`: klasik erişim listesi (`legacy_access`) ve içe aktarma (`legacy_import`).
8. `20261108000000_merkez_ekibi_ve_tamamlama.sql`: ofislerin eğitim tamamlama oranı (`office_completion`) ve merkez yöneticisini pasif/etkin yapma (`set_merkez_active`).

Not: 4 numara ödeme açılınca çalıştırılır; 5-8 ondan bağımsızdır.

### Fonksiyonlar (Supabase Edge Functions)

- `davet`: merkez yöneticisinin açtığı ofise broker ve mentor daveti gönderir, yeniden gönderir; `{ merkez: true }` ile merkez ekibine yeni yönetici davet eder ya da bekleyen daveti yeniden gönderir.
- `odeme`: satın almayı kaydeder, ödemeyi PayTR ya da iyzico ile başlatır, ödeme sonucunu işler. Ayrıntı aşağıda, "Satış ve ödeme".
- `baris-ai`: grup provasında müşteriyi oynar ve provayı değerlendirir (Claude). Çalışması için Supabase'te Edge Functions > Secrets altına `ANTHROPIC_API_KEY` eklenmeli; isteğe bağlı `BARIS_AI_MODEL` modeli değiştirir. Anahtar yokken akademi sabit prova akışını kullanır.

Fonksiyonlar oturumu kendi kodunda doğrular; panelde "Verify JWT with legacy secret" kapalı. Gizli anahtarları Supabase kendi ortamından verir, depoda yer almaz.

### Akademinin veriyle çalışması

- Merkez girişinde ofisler, üyelikler, başvurular ve sertifika kaydı veritabanından gelir; işlemler doğrudan yazılır.
- Broker ve mentor girişinde ofisin bütün kayıtları yüklenir (`akademi-kaynak/6-veri.js`). Ekrandaki değişiklikler son kaydedilen hâlle karşılaştırılır, fark birkaç saniye içinde yazılır. Yükleme başarısız olursa hiçbir şey yazılmaz.
- Eş zamanlı oturum (`akademi-kaynak/6-gercek.js`): her tarayıcı oturumu (Supabase Auth'un `session_id`'si) `user_sessions`'ta bir satırdır. Akademi girişte ve dakikada bir `session_open` çağırır. Aynı hesapla yeni cihazdan girilince sınırı aşan en eski oturum kapanır ve o cihaz en geç bir dakikada çıkış yapar; kapanan oturumun yenileme anahtarı da silinir. Sınır merkezin Güvenlik sayfasından (1 ya da 2 cihaz); oradan açık oturumlar görülür ve kapatılır. Çıkış yalnız o cihazı kapatır.
- Belgeler: merkez, Eğitimler ve belgeler sayfasında her eğitime üç PDF yükler (en fazla 20 MB) ve tanıtım, koçluk, uygulama videolarının Vimeo bağlantısını girer. Mentor ve broker belgeyi imzalı, süreli bağlantıyla açar; aktivite belgesi ofisin uyarlanmış listesinden üretilir. Önizlemede örnek bayraklar kalır.
- Merkez ekibi: merkez yöneticileri listelenir, yeni yönetici `davet` fonksiyonuyla davet edilir, bekleyen davet yeniden gönderilir ya da silinir, başka bir yönetici pasif/etkin yapılır (pasif olanın açık oturumları kapanır; kimse kendi hesabını pasif yapamaz).
- Eğitim tamamlama (merkezin ofisler listesi): biten, telafi olmayan oturumlarda bütün günlere katılıp koçluğu tamamlayan danışmanların oranı; biten eğitim yoksa "—".
- Klasik erişimler: hak sahiplerinin listesi; kişi eklenir ya da eski sitenin listesi CSV olarak içe aktarılır (aynı e-posta birleşir). Kişilerin izleyeceği yer ayrıca karara bağlanacak.
- Giriş: e-postaya giriş bağlantısı gider; bağlantı hangi cihazda açılırsa giriş orada olur. Bağlantı istendikten sonra giriş ekranında "E-postadaki kod" alanı açılır; kod `verifyOtp({type: 'email'})` ile bu cihazda oturum açar. Bunun için Supabase > Authentication > Emails'teki Magic Link şablonuna `{{ .Token }}` eklenmeli (mail servisi kurulurken Türkçe şablonlarla birlikte). Hesabı olmayanlar için giriş ekranında başvuru ve satıcı e-postasına (`satici.json`) yönlendirme var.
- Brokerın "Yenileme görüşmesi iste" düğmesi `site_requests`'e `kind = 'iletisim'`, `meta.tur = 'yenileme'` kaydı yazar; merkezin Başvurular sayfasında "Yenileme talebi" olarak görünür. Aynı cihazdan bir gün içinde ikinci kez gönderilmez.
- Başvurular sayfasında ofis başvurusunun "Ofis aç" düğmesi Yeni ofis aç formunu başvurudaki bilgilerle (ofis adı, şehir, broker, danışman sayısına göre kademe) açar; ofis açılınca başvuru işlendi olur.
- "Mentor görevini üstlen" yalnız etkin mentoru olmayan ofisin brokerında görünür.
- Oturumda videosu olmayan bölüm (Vimeo'da olmayan ya da merkezin henüz eklemediği tanıtım, koçluk, uygulama videosu) oynatılmaz ve izlendi sayılmaz; sıralı oturumda geçilebilir. Ön izleme yüzdesi yalnız videosu olan bölümlerden hesaplanır.


## Satış ve ödeme

Mağazadaki "Satın al" `odeme.html?urun=<kod>` sayfasını açar. İngilizce, İspanyolca ve Almanca sayfalarda ödeme sayfası ve sözleşmeler Türkçe olduğu için bunun yerine satıcının e-posta adresine (`satici.json`) e-postayla sipariş düğmesi çıkar (`dil-kaynak/uret.mjs`, `satinAlYabanci`). Alıcı bilgileri ve fatura alınır, Ön Bilgilendirme Formu ile Mesafeli Satış Sözleşmesi alıcının bilgileriyle doldurulup onaylatılır, sonra ödeme ödeme kuruluşunun 3D Secure sayfasında alınır. Kart bilgisi siteye ve veritabanına hiç gelmez.

### Metinleri ve fiyatları değiştirmek

1. `satis-kaynak/satici.json`: unvan, adres, vergi dairesi ve no, MERSİS, telefon, e-posta, kargo firması, teslim süreleri. Boş (`null`) alanlar sitede sarı işaretle görünür.
2. `satis-kaynak/urunler.json`: ürünler ve KDV dâhil fiyatlar. Fiyatı `null` olan ürün satılmaz ("Yakında satışta").
3. `satis-kaynak/metinler/*.md`: yasal metinler. `{{eposta}}` gibi alanlar `satici.json`'dan, `[[alici_ad]]` gibi alanlar sipariş sırasında dolar.
4. `python3 satis-kaynak/build.py`: `site/sozlesmeler/`, `site/odeme.html` içindeki veri, ana sayfanın altbilgisi ve fiyatları, `supabase/functions/odeme/katalog.ts` ve dil sayfaları yeniden yazılır. Sunucu fiyatı tarayıcıdan değil bu katalogdan hesaplar; fiyat değişince fonksiyon da yeniden yüklenmeli.

### Ödeme kuruluşunu açmak

Onay gelene kadar ödeme kapalıdır; sayfa "Kartla ödeme çok yakında" der. Açmak için:

1. `20261107000000_siparisler.sql` göçünü çalıştırın.
2. `odeme` fonksiyonunu yükleyin; JWT doğrulaması kapalı olmalı (PayTR bildirimi ve iyzico dönüşü oturumsuz gelir; fonksiyon imzaları kendisi doğrular): `supabase functions deploy odeme --no-verify-jwt`.
3. Supabase > Edge Functions > Secrets:
   - PayTR: `ODEME_SAGLAYICI=paytr`, `PAYTR_MERCHANT_ID`, `PAYTR_MERCHANT_KEY`, `PAYTR_MERCHANT_SALT`; denemede `PAYTR_TEST=1`. İsteğe bağlı `PAYTR_MAX_TAKSIT` (0 = izin verilen en fazla).
   - iyzico: `ODEME_SAGLAYICI=iyzico`, `IYZICO_API_KEY`, `IYZICO_SECRET_KEY`; canlıda `IYZICO_BASE_URL=https://api.iyzipay.com` (boşsa sandbox).
4. PayTR mağaza panelinde Bildirim URL: `https://xjbqesljonbbduldeesd.supabase.co/functions/v1/odeme/paytr`. iyzico'da ayrı ayar gerekmez; dönüş adresi her ödemede gönderilir.
5. Ödeme kuruluşunun verdiği logo bandını `site/img/` içine koyup altbilgiye ekleyin.

Ödenen siparişler `orders` tablosunda `status = 'odendi'` olur. Online eğitim erişimi ve kitap kargosu şimdilik ekip tarafından verilir; `ops` alanı ekibin notları (erişim, kargo takip no) içindir.

## Tally ve Cal.com

- `site/js/tally-cal.js`: ofis başvurusu, kurumsal talep ve etkinlik pencerelerinde formu Tally'den açar; gönderilen kayıt `site_requests` tablosuna da yazılır, merkezdeki Başvurular sayfası değişmeden çalışır. Başvurudan ve kurumsal talepten sonra aynı pencerede Cal.com takvimi ad, e-posta, telefon ve notla dolu açılır. Tally açılmazsa sitenin kendi formu, Cal.com açılmazsa Cal.com bağlantısı kullanılır. Bülten sitenin kendi formunda kalır. `index.html` sonunda `<script src="js/tally-cal.js" defer></script>` ile yüklenir; yalnız Türkçe sayfada çalışır (Tally formları Türkçe), dil sürümlerinde sitenin çevrilmiş formları kalır.
- Tally formları Barış Bey'in hesabında: ofis başvurusu `4aBNGk`, kurumsal talep `Eq5bAN`, etkinlik kaydı `aOerkq`. Gizli alanlar: `kaynak`, kurumsalda `konu`, etkinlikte `etkinlik` (lansman için `lansman`, webinar için adı). Formdaki soru başlıkları değişirse `tally-cal.js` içindeki eşleştirme de güncellenmeli.
- Cal.com görüşmeleri: `baris-kilicarslan-yesokm/akademi-gorusmesi` ve `baris-kilicarslan-yesokm/kurumsal-gorusme`.

## KVKK, çerez ve formlar

- Metinler `satis-kaynak/metinler/kvkk-aydinlatma-metni.md` ve `gizlilik-ve-cerez-politikasi.md` dosyalarında; ön bilgideki `guncelleme:` o sayfanın "Son güncelleme" tarihidir (yoksa `satici.json`'daki). Başlığın sonuna `{#kimlik}` yazılırsa başlık o kimlikle bağlantı alır (`#cerezler`). Değişince `python3 satis-kaynak/build.py`.
- Yeni bir dış hizmet, yeni bir tarayıcı kaydı (çerez, yerel depolama) ya da yeni bir veri işleme eklenince bu iki metin ve `vercel.json`'daki CSP birlikte güncellenir.
- Çerez bildirimi (`site/js/cerez.js`): Türkçe, İngilizce, İspanyolca, Almanca sayfalar, ödeme, yasal metinler ve sertifika doğrulamada. "Kabul et" ile "Reddet" aynı görünür; tercih `bk-cerez` (yerel depolama) içinde 12 ay saklanır. Sayfadaki `data-cerez-ayar` taşıyan bağlantı bildirimi yeniden açar (altbilgilerdeki "Çerez ayarları"). Akademide bildirim ve istatistik yok; orada yalnız zorunlu kayıtlar var.
- Ziyaret istatistiği: Vercel Web Analytics, yalnız "Kabul et" seçilirse `/_vercel/insights/script.js` yüklenir. Çerez kullanmaz. Gönderilmeden önce adres temizlenir (`/dogrula/<numara>` yalnız `/dogrula`; sorgudan yalnız `urun` ve `utm_*` kalır; `#` sonrası gitmez). Vercel'de projenin Analytics sayfasından bir kez "Enable" denmeli; açılmadan izin verenlerde betik 404 döner, site etkilenmez. Ücretsiz planda ayda 50.000 olay; dolunca ay sonuna kadar sayım durur.
- Formlar: başvuru, kurumsal talep ve etkinlik pencerelerinde gönder düğmesinin üstünde aydınlatma notu (`.f-kvkk`); Tally formunun ve Cal.com takviminin altında da aynı not (`tally-cal.js`). Bu formlar için açık rıza istenmez (talebe cevap için gereken işleme). Bültende ad soyad ve önceden seçili olmayan, zorunlu onay kutusu var; kayıt `meta.onay = 'ticari-ileti'` ve onay metninin sürümüyle (`meta.onay_metni`) yazılır. Onay metni değişirse `index.html`'deki sürüm de değişmeli. Ödemedeki ileti onayı isteğe bağlı ve seçili gelmez. Akademinin giriş ekranında aydınlatma ve çerez politikası bağlantısı var.
- Ticari ileti onaylarının gönderimden önce İleti Yönetim Sistemi'ne (İYS) kaydedilmesi ve ret bildirimlerinin işlenmesi bülten gönderimi başlamadan kurulmalı.

## Güvenlik başlıkları

`site/vercel.json` bütün adreslere şunları ekler: Content-Security-Policy (betik, stil, görsel, bağlantı ve çerçeve yalnız sitenin kendisinden ve listelenen hizmetlerden: Supabase, Tally, Cal.com, Vimeo, PayTR; `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'self'`), X-Content-Type-Options, Referrer-Policy, Permissions-Policy (kamera, mikrofon, konum kapalı), X-Frame-Options. HSTS'yi Vercel kendisi gönderir. Satır içi betikler ve stiller sayfaların yapısı gereği açık (`'unsafe-inline'`). Ödeme sayfasında çerçeve için her https adresine izin var: 3D Secure doğrulaması ödeme kuruluşunun çerçevesi içinde bankanın kendi adresinde açılır.

- Yeni bir dış betik, çerçeve ya da bağlantı eklenince CSP'ye eklenmezse tarayıcı engeller; konsolda "Content Security Policy" hatası görünür.
- Supabase projesi değişirse CSP'deki `xjbqesljonbbduldeesd.supabase.co` adresleri de değişmeli.
- `/fonts/` altındaki dosyalar bir yıl önbellekte tutulur; yazı tipi dosyası değişirse adı da değişmeli.

## Yazı tipleri

Yazı tipleri sitenin kendi sunucusundan gelir (önceden Google Fonts'tan geliyordu ve her açılışta ziyaretçinin IP adresi Google'a gidiyordu). Dosyalar Google Fonts'un aynı sürümleri; yalnız latin ve latin-ext. Her sayfa grubu (`site.css`, `odeme.css`, `dogrula.css`, `yasal.css`) önceki bağlantısındaki kalınlıkları aynen alır, görünüm değişmez. Yeniden üretmek: `cd font-kaynak && npm install && python3 uret.py`. Lisans: SIL Open Font License 1.1 (`site/fonts/LICENSE-*.txt`).

## Veritabanı yedeği

Supabase'in ücretsiz planında otomatik yedek yok. `.github/workflows/veritabani-yedegi.yml` her gece 03:17'de (Türkiye) rolleri, şemayı ve veriyi (akademi hesapları dahil) alır, AES-256 ile şifreler ve GitHub'da çalıştırmanın "Artifacts" bölümüne koyar; 30 gün saklanır. Depo herkese açık: yedek şifrelenmeden hiçbir yere yazılmaz, günlüklere veri ya da sayı yazılmaz. Belgeler kovasındaki PDF'ler, fonksiyonların gizli anahtarları ve Supabase panelindeki ayarlar bu yedekte yok (PDF'lerin aslı merkezde, fonksiyon kodu depoda).

Kurulum (bir kez):

1. Supabase > Project Settings > Database'de veritabanı şifresi bilinmiyorsa "Reset database password" ile yenisi alınır (fonksiyonlar ve site bu şifreyi kullanmaz).
2. Supabase'de üstteki "Connect" > "Session pooler" bağlantı adresi kopyalanır, `[YOUR-PASSWORD]` yerine şifre yazılır. Şifrede `@ : / ? #` varsa yüzde kodlamasıyla yazılmalı.
3. Uzun bir yedek parolası üretilir (en az 24 karakter) ve parola yöneticisine kaydedilir. Kaybolursa yedekler açılamaz.
4. GitHub > Settings > Secrets and variables > Actions > New repository secret: `SUPABASE_DB_URL` (2. adımdaki adres) ve `YEDEK_SIFRE` (3. adımdaki parola).
5. Actions > Veritabanı yedeği > Run workflow, "geri yükleme denemesi" işaretli: yedek alınır, geçici bir Supabase veritabanına yüklenir ve her tablonun satır sayısı yedekle karşılaştırılır.

Geri yükleme:

1. Actions > Veritabanı yedeği > istenen gecenin çalıştırması > Artifacts'tan `yedek-....tar.gz.gpg` indirilir.
2. Açmak: `gpg -d yedek-....tar.gz.gpg | tar -xzf -` (parola sorulur); `roles.sql`, `schema.sql`, `data.sql` çıkar.
3. Boş bir Supabase projesine (ya da yerel `supabase db start` veritabanına):

```
psql --single-transaction --variable ON_ERROR_STOP=1 \
  --file roles.sql --file schema.sql \
  --command 'SET session_replication_role = replica' \
  --file data.sql --dbname "<yeni projenin Session pooler adresi>"
```

4. Sonra fonksiyonlar (`supabase/functions`) yeniden yüklenir, gizli anahtarlar (`ANTHROPIC_API_KEY` vb.) girilir, Auth ayarları (Site URL, yönlendirme adresleri, SMTP, e-posta şablonları) ve belgeler kovasındaki PDF'ler yeniden kurulur; sitede ve CSP'de proje adresi değiştiyse güncellenir.

Not: GitHub, herkese açık depoda 60 gün hiç değişiklik olmazsa zamanlanmış işleri durdurur; Actions sayfasında yeniden açılır. Gece yedeği başarısız olursa GitHub, iş dosyasını son değiştiren hesaba e-posta gönderir.
