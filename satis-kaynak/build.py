#!/usr/bin/env python3
"""Satış ve yasal metin sayfalarını üretir.

Tek kaynak: satis-kaynak/satici.json, satis-kaynak/urunler.json, satis-kaynak/metinler/*.md

Yazdıkları:
  site/sozlesmeler/<ad>.html ve site/sozlesmeler/index.html
  site/odeme.html içindeki <!--URETILEN:veri--> bloğu (ürünler, satıcı, sözleşme şablonları)
  site/index.html içindeki <!--URETILEN:yasal--> (altbilgi), /*URETILEN:fiyat*/ (ürün fiyatları)
                 ve mağaza kartlarındaki <em class="pd-p" data-u="..."> fiyatları
  supabase/functions/odeme/katalog.ts (sunucunun fiyat listesi)

Kullanım: python3 satis-kaynak/build.py
"""
import hashlib
import html
import json
import pathlib
import re
import sys

KOK = pathlib.Path(__file__).resolve().parent.parent
KAYNAK = KOK / 'satis-kaynak'
SITE = KOK / 'site'
CIKTI = SITE / 'sozlesmeler'
FONK = KOK / 'supabase' / 'functions' / 'odeme'

S = json.loads((KAYNAK / 'satici.json').read_text(encoding='utf-8'))
URUNLER = json.loads((KAYNAK / 'urunler.json').read_text(encoding='utf-8'))

ETIKET = {
    'unvan': 'satıcı unvanı', 'adres': 'satıcı adresi', 'telefon': 'telefon', 'eposta': 'e-posta',
    'kep': 'KEP adresi', 'mersis': 'MERSİS no', 'vergi_dairesi': 'vergi dairesi', 'vergi_no': 'vergi no',
    'kargo_firma': 'kargo firması', 'web': 'web adresi',
}
EKSIK = []


def esc(t):
    return html.escape(str(t), quote=True)


def tl(n):
    """9797 -> '9.797 TL', 12.5 -> '12,50 TL'"""
    tam = int(round(n * 100))
    lira, kurus = divmod(tam, 100)
    s = f'{lira:,}'.replace(',', '.')
    return f'{s},{kurus:02d} TL' if kurus else f'{s} TL'


def ham(anahtar):
    if anahtar == 'kargo_firma':
        return S['kargo'].get('firma')
    if anahtar == 'hazirlama_gun':
        return S['kargo'].get('hazirlama_gun')
    return S.get(anahtar)


def eksik(anahtar):
    if anahtar not in EKSIK:
        EKSIK.append(anahtar)
    return f'<mark class="eksik">[{esc(ETIKET.get(anahtar, anahtar))}]</mark>'


def deger(anahtar):
    v = ham(anahtar)
    if v is None or v == '':
        return eksik(anahtar)
    if anahtar == 'eposta':
        return f'<a href="mailto:{esc(v)}">{esc(v)}</a>'
    if anahtar == 'telefon':
        return f'<a href="tel:{esc(re.sub(r"[^0-9+]", "", str(v)))}">{esc(v)}</a>'
    return esc(v)


def satici_blok():
    sat = [('Unvan', 'unvan'), ('Adres', 'adres'), ('Telefon', 'telefon'), ('E-posta', 'eposta')]
    if S.get('kep'):
        sat.append(('KEP adresi', 'kep'))
    sat.append(('MERSİS no', 'mersis'))
    out = ['<dl class="sb">']
    for ad, k in sat:
        out.append(f'<div><dt>{ad}</dt><dd>{deger(k)}</dd></div>')
    out.append(f'<div><dt>Vergi dairesi / no</dt><dd>{deger("vergi_dairesi")} / {deger("vergi_no")}</dd></div>')
    out.append(f'<div><dt>İnternet sitesi</dt><dd>{deger("web")}</dd></div>')
    out.append('</dl>')
    return ''.join(out)


def satici_satiri():
    parca = [deger('unvan'), deger('adres'), 'Tel: ' + deger('telefon'), deger('eposta'),
             'Vergi: ' + deger('vergi_dairesi') + ' / ' + deger('vergi_no'), 'MERSİS: ' + deger('mersis')]
    return ' · '.join(parca)


def yasal_altbilgi(onek=''):
    return (f'<footer class="yf"><p>{satici_satiri()}</p><p>© 2026 Barış Kılıçarslan · Ödemeler Türk lirası (TL) ile, lisanslı ödeme kuruluşunun '
            f'3D Secure güvenli sayfasında alınır. <a href="{onek}index.html">Yasal metinler</a></p></footer>')


def fiyat_metni(u):
    return tl(u['fiyat']) if u.get('fiyat') is not None else 'Fiyatı yakında'


def urun_listesi():
    out = ['<ul class="ul-u">']
    for u in URUNLER:
        ek = []
        if u.get('kargo') and u.get('kargo_ucreti') == 0:
            ek.append('kargo ücretsiz')
        elif u.get('kargo') and u.get('kargo_ucreti'):
            ek.append('kargo ' + tl(u['kargo_ucreti']))
        f = fiyat_metni(u) + (' (KDV dâhil)' if u.get('fiyat') is not None else '')
        out.append(f'<li><strong>{esc(u["ad"])}</strong>: {esc(u["kisa"])}. {f}'
                   + (f', {", ".join(ek)}' if ek else '') + '.</li>')
    out.append('</ul>')
    return ''.join(out)


def sayfa_listesi(sayfalar, aktif=None):
    out = []
    for s in sayfalar:
        cur = ' aria-current="page"' if s['ad'] == aktif else ''
        out.append(f'<li><a href="{s["ad"]}.html"{cur}>{esc(s["baslik"])}</a></li>')
    return ''.join(out)


def satir_ici(t):
    t = esc(t).replace('&#x27;', '’').replace('&quot;', '"')
    t = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', t)
    t = re.sub(r'\[([^\[\]]+)\]\(([^)\s]+)\)', r'<a href="\2">\1</a>', t)
    t = re.sub(r'\{\{(\w+)\}\}', lambda m: deger(m.group(1)), t)
    t = re.sub(r'\[\[(\w+)\]\]', lambda m: f'<span class="sf" data-f="{m.group(1)}">sipariş sırasında doldurulur</span>', t)
    return t


BLOKLAR = {
    '{{satici_blok}}': lambda: satici_blok(),
    '{{urun_listesi}}': lambda: urun_listesi(),
    '[[urun_tablosu]]': lambda: '<div class="sf-t" data-f="urun_tablosu"><p class="sf">Ürünler, adet ve fiyatlar sipariş sırasında doldurulur.</p></div>',
}


def md(govde):
    out, para, liste = [], [], None

    def bosalt():
        nonlocal para, liste
        if para:
            out.append('<p>' + satir_ici(' '.join(para)) + '</p>')
            para = []
        if liste:
            tag, ogeler = liste
            out.append(f'<{tag}>' + ''.join('<li>' + satir_ici(x) + '</li>' for x in ogeler) + f'</{tag}>')
            liste = None

    for satir in govde.split('\n'):
        s = satir.strip()
        if not s:
            bosalt()
            continue
        m = re.match(r'^(#{2,3})\s+(.*)$', s)
        if m:
            bosalt()
            n = len(m.group(1))
            out.append(f'<h{n}>{satir_ici(m.group(2))}</h{n}>')
            continue
        if s in BLOKLAR:
            bosalt()
            out.append(BLOKLAR[s]())
            continue
        m = re.match(r'^-\s+(.*)$', s) or re.match(r'^\d+\.\s+(.*)$', s)
        if m:
            tag = 'ul' if s.startswith('-') else 'ol'
            if para or (liste and liste[0] != tag):
                bosalt()
            if not liste:
                liste = [tag, []]
            liste[1].append(m.group(1))
            continue
        if liste:
            bosalt()
        para.append(s)
    bosalt()
    return '\n'.join(out)


def oku_metinler():
    sayfalar = []
    for yol in sorted((KAYNAK / 'metinler').glob('*.md')):
        ham_metin = yol.read_text(encoding='utf-8')
        bas, govde = ham_metin.split('\n---\n', 1)
        meta = {}
        for satir in bas.splitlines():
            if ':' in satir:
                k, v = satir.split(':', 1)
                meta[k.strip()] = v.strip()
        sayfalar.append({'ad': yol.stem, 'baslik': meta['baslik'], 'ozet': meta.get('ozet', ''),
                         'sira': int(meta.get('sira', 99)), 'govde': govde, 'ham': ham_metin})
    sayfalar.sort(key=lambda s: s['sira'])
    return sayfalar


CSS = """:root{--tx:#0B0B0C;--mu:#5E5E66;--ln:rgba(0,0,0,.11);--g0:#F4F4F1;--blue:#3653FF;--fd:"Inter Tight","Inter",system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;--fb:"Inter",system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;--fw:"Montserrat","Inter",system-ui,sans-serif}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%;scroll-padding-top:80px}
body{margin:0;background:#fff;color:var(--tx);font:400 16px/1.65 var(--fb);-webkit-font-smoothing:antialiased}
a{color:inherit;text-underline-offset:3px}:focus-visible{outline:2px solid var(--blue);outline-offset:3px}
.yh{position:sticky;top:0;z-index:5;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px clamp(16px,3.2vw,56px);background:rgba(255,255,255,.94);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border-bottom:1px solid var(--ln)}
.wm{font:800 14px/1 var(--fw);letter-spacing:.16em;text-decoration:none;white-space:nowrap}
.yh nav{display:flex;gap:20px;font:500 14px/1 var(--fb);white-space:nowrap}.yh nav a{text-decoration:none;color:var(--mu)}.yh nav a:hover{color:var(--tx)}
.yw{max-width:1200px;margin:0 auto;padding:clamp(28px,5vw,72px) clamp(16px,3.2vw,56px) 80px;display:grid;grid-template-columns:250px minmax(0,1fr);gap:clamp(24px,5vw,80px)}
.yl{position:sticky;top:88px;align-self:start}.yl ul{list-style:none;margin:12px 0 0;padding:0;display:grid;gap:2px}
.yl a{display:block;padding:8px 12px;border-radius:9px;text-decoration:none;color:var(--mu);font-size:14.5px;line-height:1.35}
.yl a:hover{background:var(--g0);color:var(--tx)}.yl a[aria-current]{background:var(--tx);color:#fff}
.lbl{margin:0;font:600 12px/1.3 var(--fb);letter-spacing:.08em;text-transform:uppercase;color:var(--mu)}
.ya{max-width:780px;min-width:0}.ya h1{font:500 clamp(34px,4.4vw,58px)/1.02 var(--fd);letter-spacing:-.045em;margin:14px 0 30px;text-wrap:balance}
.ya h2{font:600 clamp(20px,1.7vw,24px)/1.25 var(--fd);letter-spacing:-.02em;margin:44px 0 12px}.ya h3{font:600 18px/1.3 var(--fd);margin:28px 0 8px}
.ya p,.ya li{color:#26262B}.ya ul,.ya ol{padding-left:22px}.ya li{margin:7px 0}.ya li::marker{color:var(--mu)}
.sb{margin:10px 0 0;border:1px solid var(--ln);border-radius:14px;overflow:hidden}.sb div{display:grid;grid-template-columns:170px minmax(0,1fr);gap:14px;padding:11px 16px;border-top:1px solid var(--ln)}
.sb div:first-child{border-top:0}.sb dt{color:var(--mu);font-size:14px}.sb dd{margin:0;font-weight:500;overflow-wrap:anywhere}
mark.eksik{background:#FFF1B8;color:#6B5200;border-radius:4px;padding:0 5px;font-weight:500}
.sf{color:var(--mu);font-style:italic}.sf-t{margin:12px 0}
.ix{list-style:none;padding:0;margin:0;display:grid;gap:12px}.ix a{display:block;padding:18px 20px;border:1px solid var(--ln);border-radius:14px;text-decoration:none}
.ix a:hover{border-color:var(--tx)}.ix b{display:block;font:600 18px/1.3 var(--fd)}.ix span{color:var(--mu);font-size:14.5px}
.yf{border-top:1px solid var(--ln);padding:26px clamp(16px,3.2vw,56px);color:var(--mu);font-size:13.5px;line-height:1.6;display:grid;gap:6px}.yf p{margin:0}
@media (max-width:480px){.yh nav a+a{display:none}}
@media (max-width:880px){.yw{grid-template-columns:1fr}.yl{position:static;order:2;border-top:1px solid var(--ln);padding-top:22px}.sb div{grid-template-columns:1fr;gap:2px}.yh nav{gap:14px}}
@media print{.yh,.yl,.yf{display:none}.yw{display:block;padding:0}.ya{max-width:none}}"""


def sayfa(baslik, ozet, govde, liste_html):
    return f"""<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(baslik)} · Barış Kılıçarslan</title>
<meta name="description" content="{esc(ozet)}">
<link rel="icon" href="../favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="../favicon-32.png">
<link rel="apple-touch-icon" href="../apple-touch-icon.png">
<meta name="theme-color" content="#ffffff">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600&family=Inter:wght@400;500;600&family=Montserrat:wght@800&display=swap">
<style>
{CSS}
</style>
</head>
<body>
<!-- Bu sayfa satis-kaynak/build.py ile üretilir; metni satis-kaynak/metinler/ içinden değiştirin. -->
<header class="yh"><a class="wm" href="../index.html">BARIŞ KILIÇARSLAN</a><nav aria-label="Site"><a href="index.html">Yasal metinler</a><a href="../index.html#magaza">Mağaza</a></nav></header>
<main class="yw">
<aside class="yl" aria-label="Yasal metinler"><p class="lbl">Yasal metinler</p><ul>{liste_html}</ul></aside>
<article class="ya">
<p class="lbl">Son güncelleme: {esc(S['guncelleme'])}</p>
<h1>{esc(baslik)}</h1>
{govde}
</article>
</main>
{yasal_altbilgi()}
</body>
</html>
"""


def blok_degistir(metin, bas, son, yeni, dosya):
    i, j = metin.find(bas), metin.find(son)
    if i < 0 or j < i:
        sys.exit(f'{dosya}: {bas} işaretleri bulunamadı')
    return metin[:i + len(bas)] + yeni + metin[j:]


def main():
    CIKTI.mkdir(exist_ok=True)
    sayfalar = oku_metinler()
    surum_kaynak = json.dumps(S, sort_keys=True) + json.dumps(URUNLER, sort_keys=True) + ''.join(s['ham'] for s in sayfalar)
    surum = '2026-11-07.' + hashlib.sha1(surum_kaynak.encode()).hexdigest()[:8]
    govdeler = {}
    for s in sayfalar:
        govde = md(s['govde'])
        govdeler[s['ad']] = govde
        (CIKTI / f'{s["ad"]}.html').write_text(sayfa(s['baslik'], s['ozet'], govde, sayfa_listesi(sayfalar, s['ad'])), encoding='utf-8')
    ix = '<p>Satın alma, teslimat, iade ve kişisel verilerle ilgili bütün metinler.</p><ul class="ix">' + ''.join(
        f'<li><a href="{s["ad"]}.html"><b>{esc(s["baslik"])}</b><span>{esc(s["ozet"])}</span></a></li>' for s in sayfalar) + '</ul>'
    (CIKTI / 'index.html').write_text(sayfa('Yasal metinler', 'Satın alma, teslimat, iade ve kişisel verilerle ilgili metinler.', ix, sayfa_listesi(sayfalar)), encoding='utf-8')

    # Ödeme sayfası verisi
    acik = {k: ham(k) for k in ('unvan', 'marka', 'adres', 'vergi_dairesi', 'vergi_no', 'mersis', 'telefon', 'eposta', 'kep', 'web',
                                'dijital_teslim_saat', 'dijital_iptal_saat', 'hazirlama_gun', 'kargo_firma')}
    veri = {'surum': surum, 'satici': acik, 'urunler': URUNLER, 'eksik': EKSIK,
            'sablon': {'obf': govdeler['on-bilgilendirme-formu'], 'mss': govdeler['mesafeli-satis-sozlesmesi']}}
    veri_json = json.dumps(veri, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    odeme = SITE / 'odeme.html'
    if odeme.exists():
        m = odeme.read_text(encoding='utf-8')
        m = blok_degistir(m, '<!--URETILEN:veri-->', '<!--/URETILEN:veri-->',
                          f'<script type="application/json" id="veri">{veri_json}</script>', 'odeme.html')
        m = blok_degistir(m, '<!--URETILEN:altbilgi-->', '<!--/URETILEN:altbilgi-->', yasal_altbilgi('sozlesmeler/'), 'odeme.html')
        odeme.write_text(m, encoding='utf-8')

    # Ana sayfa: altbilgi, fiyatlar
    ana = SITE / 'index.html'
    a = ana.read_text(encoding='utf-8')
    linkler = ''.join(f'<a href="sozlesmeler/{ad}.html">{etiket}</a>' for ad, etiket in [
        ('mesafeli-satis-sozlesmesi', 'Mesafeli satış sözleşmesi'), ('on-bilgilendirme-formu', 'Ön bilgilendirme formu'),
        ('iptal-ve-iade', 'İptal ve iade'), ('teslimat', 'Teslimat'), ('kvkk-aydinlatma-metni', 'KVKK aydınlatma metni'),
        ('gizlilik-ve-cerez-politikasi', 'Gizlilik ve çerezler'), ('uyelik-sozlesmesi', 'Üyelik sözleşmesi'),
        ('yasal-uyarilar', 'Yasal uyarılar'), ('hakkimizda', 'Hakkımızda'), ('iletisim', 'İletişim')])
    altbilgi = (f'<div class="ft-leg"><span>© 2026 Barış Kılıçarslan</span>{linkler}</div>'
                f'<p class="ft-sat">{satici_satiri()}<br>Ödemeler Türk lirası (TL) ile, lisanslı ödeme kuruluşunun 3D Secure güvenli sayfasında alınır. Kart bilgileri bu siteye ulaşmaz.</p>')
    a = blok_degistir(a, '<!--URETILEN:yasal-->', '<!--/URETILEN:yasal-->', altbilgi, 'index.html')
    fiyat = {u['kod']: ({'f': u['fiyat'], 't': tl(u['fiyat'])} if u.get('fiyat') is not None else None) for u in URUNLER}
    a = blok_degistir(a, '/*URETILEN:fiyat*/', '/*/URETILEN:fiyat*/',
                      'var FIYAT=' + json.dumps(fiyat, ensure_ascii=False, separators=(',', ':')) + ';', 'index.html')
    for u in URUNLER:
        a, n = re.subn(r'(<em class="pd-p" data-u="' + u['kod'] + r'">)(.*?)(</em>)', lambda m: m.group(1) + esc(fiyat_metni(u)) + m.group(3), a)
        if n != 1:
            sys.exit(f'index.html: {u["kod"]} fiyat yeri {n} kez bulundu')
        a = re.sub(r'(<b class="vsl-fy" data-u="' + u['kod'] + r'">)(.*?)(</b>)', lambda m: m.group(1) + esc(fiyat_metni(u)) + m.group(3), a)
    ana.write_text(a, encoding='utf-8')

    # Sunucunun fiyat listesi
    FONK.mkdir(parents=True, exist_ok=True)
    katalog = {u['kod']: {'ad': u['ad'], 'fiyat': u['fiyat'], 'kargo': bool(u.get('kargo')), 'dijital': bool(u.get('dijital')),
                          'kargo_ucreti': u.get('kargo_ucreti'), 'en_fazla': u['en_fazla'], 'kategori': u['kategori']} for u in URUNLER}
    (FONK / 'katalog.ts').write_text(
        '// satis-kaynak/build.py üretir; elle değiştirmeyin. Fiyatlar TL, KDV dâhil.\n'
        f'export const SURUM = {json.dumps(surum)};\n'
        f'export const SATICI = {json.dumps(S.get("unvan") or S["marka"], ensure_ascii=False)};\n'
        'export type Urun = { ad: string; fiyat: number | null; kargo: boolean; dijital: boolean; kargo_ucreti: number | null; en_fazla: number; kategori: string };\n'
        f'export const KATALOG: Record<string, Urun> = {json.dumps(katalog, ensure_ascii=False, indent=2)};\n', encoding='utf-8')

    print(f'{len(sayfalar)} sayfa + dizin yazıldı, sürüm {surum}')
    print('eksik alanlar:', ', '.join(EKSIK) if EKSIK else 'yok')


if __name__ == '__main__':
    main()
