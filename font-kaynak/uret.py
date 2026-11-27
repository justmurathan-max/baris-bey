#!/usr/bin/env python3
"""Sitenin yazı tiplerini site/fonts/ klasörüne yazar.

Yazı tipleri daha önce Google Fonts'tan yükleniyordu; her sayfa açılışında ziyaretçinin
IP adresi Google'a gidiyordu. Artık aynı dosyalar sitenin kendi sunucusundan gelir.
Dosyalar Fontsource paketlerinden alınır; sürümleri Google Fonts'un sunduğuyla aynıdır
(Inter v20, Inter Tight v9, Montserrat v31, Playfair Display v40, Anton v27).
Yalnız latin ve latin-ext (Türkçe, İspanyolca, Almanca harfler) alt kümeleri kullanılır.

Her sayfa grubu, önceki Google Fonts bağlantısında istediği kalınlık aralığını alır;
böylece tarayıcı aynı kalınlığı seçer ve görünüm değişmez:
  site.css     ana sayfa (tr, en, es, de) ve akademi
  odeme.css    ödeme sayfası
  dogrula.css  sertifika doğrulama
  yasal.css    yasal metinler (satis-kaynak/build.py)

Kullanım: cd font-kaynak && npm install && python3 uret.py
"""
import pathlib
import re
import shutil

KOK = pathlib.Path(__file__).resolve().parent
NM = KOK / 'node_modules'
HEDEF = KOK.parent / 'site' / 'fonts'

# aile, stil -> (paket, css dosyası, dosya adı öneki)
KAYNAK = {
    ('Anton', 'normal'): ('@fontsource/anton', '400.css', 'anton'),
    ('Inter', 'normal'): ('@fontsource-variable/inter', 'wght.css', 'inter'),
    ('Inter Tight', 'normal'): ('@fontsource-variable/inter-tight', 'wght.css', 'inter-tight'),
    ('Montserrat', 'normal'): ('@fontsource-variable/montserrat', 'wght.css', 'montserrat'),
    ('Playfair Display', 'normal'): ('@fontsource-variable/playfair-display', 'wght.css', 'playfair-display'),
    ('Playfair Display', 'italic'): ('@fontsource-variable/playfair-display', 'wght-italic.css', 'playfair-display-italic'),
}

# Önceki Google Fonts bağlantılarındaki kalınlıklar (aralık olarak)
TAKIM = {
    'site': [('Anton', 'normal', '400'), ('Inter Tight', 'normal', '400 600'), ('Inter', 'normal', '400 700'),
             ('Montserrat', 'normal', '600 800'), ('Playfair Display', 'normal', '700 800'), ('Playfair Display', 'italic', '700 800')],
    'odeme': [('Inter Tight', 'normal', '500 600'), ('Inter', 'normal', '400 700'), ('Montserrat', 'normal', '800')],
    'dogrula': [('Inter Tight', 'normal', '500 600'), ('Inter', 'normal', '400 700')],
    'yasal': [('Inter Tight', 'normal', '500 600'), ('Inter', 'normal', '400 600'), ('Montserrat', 'normal', '800')],
}
ALT = ['latin-ext', 'latin']


def yuzler(aile, stil):
    """Paketin CSS'inden latin ve latin-ext yüzlerinin dosyasını ve unicode-range'ini okur."""
    paket, css, onek = KAYNAK[(aile, stil)]
    metin = (NM / paket / css).read_text(encoding='utf-8')
    out = {}
    for blok in re.findall(r'/\* ([\w-]+) \*/\s*@font-face\s*\{(.*?)\}', metin, re.S):
        ad, govde = blok
        alt = next((a for a in ALT if re.search(r'-' + re.escape(a) + r'-(?:\d+|wght)-(?:normal|italic)$', ad)), None)
        if not alt or alt in out:
            continue
        dosya = re.search(r'url\(\./files/([^)]+\.woff2)\)', govde).group(1)
        aralik = re.search(r'unicode-range:\s*([^;]+);', govde).group(1).strip()
        out[alt] = (NM / paket / 'files' / dosya, f'{onek}-{alt}.woff2', aralik)
    eksik = [a for a in ALT if a not in out]
    if eksik:
        raise SystemExit(f'{aile} {stil}: {eksik} bulunamadı')
    return out


def main():
    HEDEF.mkdir(parents=True, exist_ok=True)
    kopyalanan = set()
    for takim, liste in TAKIM.items():
        satir = [f'/* Bu dosya font-kaynak/uret.py ile üretilir. Yazı tipleri SIL Open Font License 1.1 (LICENSE-*.txt). */']
        for aile, stil, kalinlik in liste:
            for alt, (kaynak, ad, aralik) in yuzler(aile, stil).items():
                if ad not in kopyalanan:
                    shutil.copyfile(kaynak, HEDEF / ad)
                    kopyalanan.add(ad)
                satir.append("@font-face{font-family:'%s';font-style:%s;font-weight:%s;font-display:swap;"
                             "src:url(%s) format('woff2');unicode-range:%s}" % (aile, stil, kalinlik, ad, aralik))
        (HEDEF / f'{takim}.css').write_text('\n'.join(satir) + '\n', encoding='utf-8')
    for paket, ad in [('@fontsource-variable/inter', 'inter'), ('@fontsource-variable/inter-tight', 'inter-tight'),
                      ('@fontsource-variable/montserrat', 'montserrat'), ('@fontsource-variable/playfair-display', 'playfair-display'),
                      ('@fontsource/anton', 'anton')]:
        shutil.copyfile(NM / paket / 'LICENSE', HEDEF / f'LICENSE-{ad}.txt')
    print(f'{len(kopyalanan)} yazı tipi dosyası ve {len(TAKIM)} CSS dosyası yazıldı: {HEDEF}')


if __name__ == '__main__':
    main()
