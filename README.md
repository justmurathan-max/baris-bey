# Barış Kılıçarslan: site ve Masterclass Akademi

Barış Kılıçarslan'ın tanıtım sitesi ve giriş sonrası Masterclass Akademi. Giriş, ofisler, mentor ve broker panelleri, site formları ve sertifika doğrulama Supabase'e bağlı; ana eğitim videoları Vimeo'dan gömülü. Girişsiz açılan önizleme örnek verilerle çalışır.

## Klasörler

- `site/`: Vercel'in yayınladığı klasör.
  - `index.html`: tanıtım sitesi.
  - `akademi.html`: giriş sonrası akademi (mentor, broker ve merkez panelleri). Elle düzenlenmez; `akademi-kaynak/` içinden üretilir.
  - `img/`: görseller.
  - `dogrula.html`: herkese açık sertifika doğrulama; `/dogrula/<numara>` adresi buraya yönlenir (`vercel.json`).
  - `js/supabase.js`: Supabase'in tarayıcı kütüphanesi (2.118.0), npm'den olduğu gibi.
  - `js/qr.js`: sertifikalardaki QR için qrcode-generator (1.4.4, MIT), npm'den olduğu gibi.
  - `vercel.json`, `robots.txt`: taslağı arama motorlarına kapatır.
- `akademi-kaynak/`: akademinin parçaları.
  - `a.html` iskelet, `a.css` stiller, `1-core.js` … `7-init.js` uygulama.
  - `1-core.js` içindeki `VIM` listesi bölüm kodlarını Vimeo videolarına bağlar: `[video kimliği, süre (sn), sitede oynar mı]`.

## Akademiyi üretmek

```
python3 akademi-kaynak/build.py
```

`site/akademi.html` yeniden yazılır.

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

### Fonksiyonlar (Supabase Edge Functions)

- `davet`: merkez yöneticisinin açtığı ofise broker ve mentor daveti gönderir, yeniden gönderir.
- `baris-ai`: grup provasında müşteriyi oynar ve provayı değerlendirir (Claude). Çalışması için Supabase'te Edge Functions > Secrets altına `ANTHROPIC_API_KEY` eklenmeli; isteğe bağlı `BARIS_AI_MODEL` modeli değiştirir. Anahtar yokken akademi sabit prova akışını kullanır.

Fonksiyonlar oturumu kendi kodunda doğrular; panelde "Verify JWT with legacy secret" kapalı. Gizli anahtarları Supabase kendi ortamından verir, depoda yer almaz.

### Akademinin veriyle çalışması

- Merkez girişinde ofisler, üyelikler, başvurular ve sertifika kaydı veritabanından gelir; işlemler doğrudan yazılır.
- Broker ve mentor girişinde ofisin bütün kayıtları yüklenir (`akademi-kaynak/6-veri.js`). Ekrandaki değişiklikler son kaydedilen hâlle karşılaştırılır, fark birkaç saniye içinde yazılır. Yükleme başarısız olursa hiçbir şey yazılmaz.

## Tally ve Cal.com

- `site/js/tally-cal.js`: ofis başvurusu, kurumsal talep ve etkinlik pencerelerinde formu Tally'den açar; gönderilen kayıt `site_requests` tablosuna da yazılır, merkezdeki Başvurular sayfası değişmeden çalışır. Başvurudan ve kurumsal talepten sonra aynı pencerede Cal.com takvimi ad, e-posta, telefon ve notla dolu açılır. Tally açılmazsa sitenin kendi formu, Cal.com açılmazsa Cal.com bağlantısı kullanılır. Bülten sitenin kendi formunda kalır. `index.html` sonunda `<script src="js/tally-cal.js" defer></script>` ile yüklenir.
- Tally formları Barış Bey'in hesabında: ofis başvurusu `4aBNGk`, kurumsal talep `Eq5bAN`, etkinlik kaydı `aOerkq`. Gizli alanlar: `kaynak`, kurumsalda `konu`, etkinlikte `etkinlik` (lansman için `lansman`, webinar için adı). Formdaki soru başlıkları değişirse `tally-cal.js` içindeki eşleştirme de güncellenmeli.
- Cal.com görüşmeleri: `baris-kilicarslan-yesokm/akademi-gorusmesi` ve `baris-kilicarslan-yesokm/kurumsal-gorusme`.
