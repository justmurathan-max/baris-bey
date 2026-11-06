# Barış Kılıçarslan: site ve Masterclass Akademi

Barış Kılıçarslan'ın tanıtım sitesi ve giriş sonrası Masterclass Akademi. Giriş, ofisler, mentor ve broker panelleri, site formları ve sertifika doğrulama Supabase'e bağlı; ana eğitim videoları Vimeo'dan gömülü. Girişsiz açılan önizleme örnek verilerle çalışır.

## Klasörler

- `site/`: Vercel'in yayınladığı klasör.
  - `index.html`: tanıtım sitesi.
  - `akademi.html`: giriş sonrası akademi (mentor, broker ve merkez panelleri). Elle düzenlenmez; `akademi-kaynak/` içinden üretilir.
  - `img/`: görseller.
  - `odeme.html`: online eğitim setleri ve kitap için satın alma sayfası (`/odeme`).
  - `sozlesmeler/`: mesafeli satış, ön bilgilendirme, iptal ve iade, teslimat, KVKK, gizlilik ve çerez, üyelik, yasal uyarılar, hakkımızda, iletişim. Elle düzenlenmez; `satis-kaynak/` içinden üretilir.
  - `dogrula.html`: herkese açık sertifika doğrulama; `/dogrula/<numara>` adresi buraya yönlenir (`vercel.json`).
  - `js/supabase.js`: Supabase'in tarayıcı kütüphanesi (2.118.0), npm'den olduğu gibi.
  - `js/qr.js`: sertifikalardaki QR için qrcode-generator (1.4.4, MIT), npm'den olduğu gibi.
  - `vercel.json`, `robots.txt`: taslağı arama motorlarına kapatır.
- `satis-kaynak/`: satıcı bilgileri (`satici.json`), ürün ve fiyatlar (`urunler.json`), yasal metinler (`metinler/*.md`) ve bunlardan sayfaları üreten `build.py`.
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
4. `20261107000000_siparisler.sql`: site satın almaları (`orders`); yalnız `odeme` fonksiyonu yazar, merkez okur.

### Fonksiyonlar (Supabase Edge Functions)

- `davet`: merkez yöneticisinin açtığı ofise broker ve mentor daveti gönderir, yeniden gönderir.
- `odeme`: satın almayı kaydeder, ödemeyi PayTR ya da iyzico ile başlatır, ödeme sonucunu işler. Ayrıntı aşağıda, "Satış ve ödeme".
- `baris-ai`: grup provasında müşteriyi oynar ve provayı değerlendirir (Claude). Çalışması için Supabase'te Edge Functions > Secrets altına `ANTHROPIC_API_KEY` eklenmeli; isteğe bağlı `BARIS_AI_MODEL` modeli değiştirir. Anahtar yokken akademi sabit prova akışını kullanır.

Fonksiyonlar oturumu kendi kodunda doğrular; panelde "Verify JWT with legacy secret" kapalı. Gizli anahtarları Supabase kendi ortamından verir, depoda yer almaz.

### Akademinin veriyle çalışması

- Merkez girişinde ofisler, üyelikler, başvurular ve sertifika kaydı veritabanından gelir; işlemler doğrudan yazılır.
- Broker ve mentor girişinde ofisin bütün kayıtları yüklenir (`akademi-kaynak/6-veri.js`). Ekrandaki değişiklikler son kaydedilen hâlle karşılaştırılır, fark birkaç saniye içinde yazılır. Yükleme başarısız olursa hiçbir şey yazılmaz.


## Satış ve ödeme

Mağazadaki "Satın al" `odeme.html?urun=<kod>` sayfasını açar. Alıcı bilgileri ve fatura alınır, Ön Bilgilendirme Formu ile Mesafeli Satış Sözleşmesi alıcının bilgileriyle doldurulup onaylatılır, sonra ödeme ödeme kuruluşunun 3D Secure sayfasında alınır. Kart bilgisi siteye ve veritabanına hiç gelmez.

### Metinleri ve fiyatları değiştirmek

1. `satis-kaynak/satici.json`: unvan, adres, vergi dairesi ve no, MERSİS, telefon, e-posta, kargo firması, teslim süreleri. Boş (`null`) alanlar sitede sarı işaretle görünür.
2. `satis-kaynak/urunler.json`: ürünler ve KDV dâhil fiyatlar. Fiyatı `null` olan ürün satılmaz ("Yakında satışta").
3. `satis-kaynak/metinler/*.md`: yasal metinler. `{{eposta}}` gibi alanlar `satici.json`'dan, `[[alici_ad]]` gibi alanlar sipariş sırasında dolar.
4. `python3 satis-kaynak/build.py`: `site/sozlesmeler/`, `site/odeme.html` içindeki veri, ana sayfanın altbilgisi ve fiyatları, `supabase/functions/odeme/katalog.ts` yeniden yazılır. Sunucu fiyatı tarayıcıdan değil bu katalogdan hesaplar; fiyat değişince fonksiyon da yeniden yüklenmeli.

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
