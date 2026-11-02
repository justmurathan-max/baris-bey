# Barış Kılıçarslan: site ve Masterclass Akademi

Barış Kılıçarslan'ın tanıtım sitesi ve giriş sonrası Masterclass Akademi. Şu an örnek verilerle çalışan bir arayüz; ana eğitim videoları Vimeo'dan gömülü.

## Klasörler

- `site/`: Vercel'in yayınladığı klasör.
  - `index.html`: tanıtım sitesi.
  - `akademi.html`: giriş sonrası akademi (mentor, broker ve merkez panelleri). Elle düzenlenmez; `akademi-kaynak/` içinden üretilir.
  - `img/`: görseller.
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
