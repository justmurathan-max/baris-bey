# Barış Kılıçarslan: site ve Masterclass Akademi

Barış Kılıçarslan'ın tanıtım sitesi ve giriş sonrası Masterclass Akademi. Şu an örnek verilerle çalışan bir arayüz; ana eğitim videoları Vimeo'dan gömülü.

## Klasörler

- `site/`: Vercel'in yayınladığı klasör.
  - `index.html`: tanıtım sitesi.
  - `akademi.html`: giriş sonrası akademi (mentor, broker ve merkez panelleri). Elle düzenlenmez; `akademi-kaynak/` içinden üretilir.
  - `img/`: görseller.
  - `js/supabase.js`: Supabase'in tarayıcı kütüphanesi (2.118.0), npm'den olduğu gibi.
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
