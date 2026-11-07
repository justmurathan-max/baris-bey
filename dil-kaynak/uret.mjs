// Türkçe ana sayfadan (site/index.html) İngilizce, İspanyolca ve Almanca sayfaları üretir:
//   site/en/index.html, site/es/index.html, site/de/index.html
//
// Çeviriler dil-kaynak/ceviri/*.txt dosyalarındadır (biçim aşağıda). Sayfadaki metinler, öznitelikler
// (alt, aria-label, placeholder, title, meta açıklamaları) ve betik içindeki dizgiler parça parça çevrilir.
// Satır içi etiketler (<b>, <a>, <span>…) çeviride <0>…</0> gibi yer tutucularla korunur.
// translate="no" taşıyan öğeler çevrilmez (dil menüsü her dil için ayrıca kurulur).
// Türkçe sayfa değişince bu komut yeniden çalıştırılır; çevirisi olmayan yeni parça varsa listelenir.
//
// Kullanım (dil-kaynak klasöründe bir kez `npm install`):
//   node dil-kaynak/uret.mjs            sayfaları üretir; eksik çeviri varsa listeler ve 1 ile çıkar
//   node dil-kaynak/uret.mjs --liste    çevrilecek bütün parçaları dil-kaynak/parcalar.txt dosyasına yazar
//   node dil-kaynak/uret.mjs --eksik    yalnız çevirisi olmayanları dil-kaynak/eksik.txt dosyasına yazar
//
// Çeviri dosyası biçimi: boş satırla ayrılan bloklar, # ile başlayan satırlar açıklama.
//   tr: Türkçe metin            (sayfadaki parça; boşluklar tekleştirilmiş hali)
//   en: English
//   es: Español
//   de: Deutsch
//   tr: Barış Kılıçarslan  +  =  satırı: her dilde aynı kalır
//   atla: metin                 betikte metin gibi görünen ama çevrilmeyecek dizgi
//   kod: <Türkçe sayfadaki kod parçası>  +  en/es/de satırları: kodun kendisi dile göre değişir
// Değerlerdeki \n satır sonu demektir.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';
import * as acorn from 'acorn';

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = path.join(KOK, 'site');
const SITE_URL = 'https://baris-kilicarslan-akademi.vercel.app'; // alan adı taşınınca https://bariskilicarslan.com
const DILLER = [
  { kod: 'en', ad: 'English', yer: 'en_US', simdi: 'Current' },
  { kod: 'es', ad: 'Español', yer: 'es_ES', simdi: 'Actual' },
  { kod: 'de', ad: 'Deutsch', yer: 'de_DE', simdi: 'Aktuell' },
];
const TUM = [{ kod: 'tr', ad: 'Türkçe', simdi: 'Şu an' }, ...DILLER];

const INLINE = new Set(['a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'cite', 'code', 'dfn', 'em', 'i', 'kbd', 'mark', 'q', 's', 'samp', 'small', 'span', 'strong', 'sub', 'sup', 'time', 'u', 'var', 'wbr']);
const ATLA = new Set(['script', 'style', 'svg', 'template', 'noscript']);
const METIN_OZ = ['alt', 'aria-label', 'placeholder', 'title', 'data-corp', 'data-title'];
const META = new Set(['description', 'og:title', 'og:description', 'og:image:alt', 'twitter:title', 'twitter:description']);
const URL_OZ = ['href', 'src', 'srcset', 'poster', 'action'];
const LS = String.fromCharCode(0x2028), PS = String.fromCharCode(0x2029);

const harfli = (s) => /\p{L}{2,}/u.test(s);
const sik = (s) => s.replace(/\s+/g, ' ').trim();
const kacHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const kacOz = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const fiyat = /^(\d{1,3}(?:\.\d{3})+)( TL)$/;
const cevrilmez = (el) => el.attrs && el.attrs.some((a) => a.name === 'translate' && a.value === 'no');
const tutucular = (s) => (s.match(/<\/?\d+\/?>/g) || []).sort().join(' ');

// ---------- Çeviri dosyaları ----------
function sozlukOku() {
  const dir = path.join(KOK, 'dil-kaynak', 'ceviri');
  const S = { cev: new Map(), ayni: new Set(), atla: new Set(), kod: [] };
  const coz = (v) => v.replace(/\\n/g, '\n').trim();
  for (const f of fs.existsSync(dir) ? fs.readdirSync(dir).filter((x) => x.endsWith('.txt')).sort() : []) {
    const metin = fs.readFileSync(path.join(dir, f), 'utf8');
    for (const b of metin.split(/\n[ \t]*\n/)) {
      const satir = b.split('\n').filter((x) => x.trim() && !x.startsWith('#'));
      if (!satir.length) continue;
      const D = {}; let ayni = false;
      for (const x of satir) {
        if (x.trim() === '=') { ayni = true; continue; }
        const m = x.match(/^(tr|en|es|de|atla|kod):\s?(.*)$/);
        if (!m) throw new Error(`${f}: anlaşılmayan satır: ${x.slice(0, 80)}`);
        if (m[1] === 'atla') { S.atla.add(coz(m[2])); continue; }
        if (D[m[1]] !== undefined) throw new Error(`${f}: blokta iki ${m[1]} satırı: ${x.slice(0, 80)}`);
        D[m[1]] = coz(m[2]);
      }
      const ana = D.tr !== undefined ? D.tr : D.kod;
      if (ana === undefined) { if (Object.keys(D).length) throw new Error(`${f}: tr ya da kod satırı yok: ${satir[0].slice(0, 80)}`); continue; }
      if (ayni) { if (D.tr === undefined) throw new Error(`${f}: = yalnız tr ile`); S.ayni.add(D.tr); continue; }
      for (const d of ['en', 'es', 'de']) if (D[d] === undefined || D[d] === '') throw new Error(`${f}: ${d} eksik: ${ana.slice(0, 80)}`);
      const deger = [D.en, D.es, D.de];
      if (D.kod !== undefined) { S.kod.push([D.kod, ...deger]); continue; }
      for (const v of deger) if (tutucular(v) !== tutucular(D.tr)) throw new Error(`${f}: yer tutucular uyuşmuyor:\n  ${D.tr}\n  ${v}`);
      const eski = S.cev.get(D.tr);
      if (eski && eski.join('\u0001') !== deger.join('\u0001')) throw new Error(`${f}: aynı metnin iki farklı çevirisi: ${D.tr.slice(0, 80)}`);
      S.cev.set(D.tr, deger);
    }
  }
  return S;
}

// ---------- Türkçe sayfadaki çevrilecek parçalar ----------
function parcala(src) {
  const doc = parse(src, { sourceCodeLocationInfo: true });
  const P = [];
  const yazi = (n) => n.nodeName === '#text' || n.nodeName === '#comment' || (INLINE.has(n.tagName) && !cevrilmez(n) && n.childNodes.every(yazi));
  function ozler(el) {
    const loc = el.sourceCodeLocation;
    if (!loc || !loc.attrs) return;
    for (const a of el.attrs) {
      const al = loc.attrs[a.name];
      if (!al) continue;
      if (METIN_OZ.includes(a.name) && harfli(a.value)) P.push({ tur: 'oz', k: sik(a.value), bas: al.startOffset, son: al.endOffset, ad: a.name, yer: el.tagName });
      if (URL_OZ.includes(a.name)) P.push({ tur: 'url', bas: al.startOffset, son: al.endOffset, ad: a.name, deger: a.value });
    }
    if (el.tagName === 'meta') {
      const ad = (el.attrs.find((a) => a.name === 'name' || a.name === 'property') || {}).value;
      const ic = el.attrs.find((a) => a.name === 'content');
      if (META.has(ad) && ic && harfli(ic.value)) P.push({ tur: 'oz', k: sik(ic.value), bas: loc.attrs.content.startOffset, son: loc.attrs.content.endOffset, ad: 'content', yer: 'meta ' + ad });
    }
  }
  function gez(el) {
    if (ATLA.has(el.tagName) || cevrilmez(el)) return;
    ozler(el);
    const loc = el.sourceCodeLocation, kids = el.childNodes || [];
    if (!loc || !loc.startTag) { kids.forEach((c) => c.tagName && gez(c)); return; }
    const cls = (el.attrs.find((a) => a.name === 'class') || {}).value || '';
    if (/(^|\s)hw(\s|$)/.test(cls)) {
      const metin = sik(kids.map(function t(n) { return n.nodeName === '#text' ? n.value : (n.childNodes || []).map(t).join(''); }).join(''));
      P.push({ tur: 'kelime', k: metin, bas: loc.startTag.endOffset, son: loc.endTag.startOffset, yer: el.tagName });
      return;
    }
    const dogrudan = kids.some((c) => c.nodeName === '#text' && c.value.trim());
    if (dogrudan && loc.endTag && kids.every(yazi)) {
      const etiket = [];
      let k = '';
      (function yaz(n) {
        for (const c of n.childNodes) {
          if (c.nodeName === '#text') k += c.value;
          else if (c.nodeName === '#comment') { etiket.push({ el: null, ham: src.slice(c.sourceCodeLocation.startOffset, c.sourceCodeLocation.endOffset) }); k += `<${etiket.length - 1}/>`; }
          else {
            const i = etiket.length, cl = c.sourceCodeLocation;
            etiket.push({ el: c, bas: cl.startTag.startOffset, son: cl.startTag.endOffset, kapa: cl.endTag ? src.slice(cl.endTag.startOffset, cl.endTag.endOffset) : '' });
            if (cl.endTag) { k += `<${i}>`; yaz(c); k += `</${i}>`; } else k += `<${i}/>`;
          }
        }
      })(el);
      const ic = src.slice(loc.startTag.endOffset, loc.endTag.startOffset);
      P.push({ tur: 'satir', k: sik(k), bas: loc.startTag.endOffset, son: loc.endTag.startOffset, on: ic.match(/^\s*/)[0], arka: ic.match(/\s*$/)[0], etiket, yer: el.tagName });
      return;
    }
    for (const c of kids) {
      if (c.nodeName === '#text') {
        if (c.value.trim()) {
          const cl = c.sourceCodeLocation, ham = src.slice(cl.startOffset, cl.endOffset);
          P.push({ tur: 'metin', k: sik(c.value), bas: cl.startOffset, son: cl.endOffset, on: ham.match(/^\s*/)[0], arka: ham.match(/\s*$/)[0], yer: el.tagName });
        }
      } else if (c.tagName) gez(c);
    }
  }
  (function kok(n) { for (const c of n.childNodes || []) { if (c.tagName) gez(c); else if (c.childNodes) kok(c); } })(doc);

  // betikler
  (function betik(n) {
    for (const c of n.childNodes || []) {
      if (c.tagName === 'script') {
        const tip = (c.attrs.find((a) => a.name === 'type') || {}).value;
        const t = c.childNodes[0];
        if (!c.attrs.some((a) => a.name === 'src') && (!tip || tip === 'text/javascript') && t && t.value.trim()) {
          const kod = t.value, taban = t.sourceCodeLocation.startOffset;
          for (const tok of acorn.tokenizer(kod, { ecmaVersion: 'latest' })) {
            if (tok.type.label === 'string' || tok.type.label === 'template') {
              P.push({ tur: tok.type.label === 'string' ? 'js' : 'jsk', k: String(tok.value), bas: taban + tok.start, son: taban + tok.end, ham: kod.slice(tok.start, tok.end) });
            }
          }
        }
      } else if (c.childNodes) betik(c);
      if (c.content) betik(c.content);
    }
  })(doc);
  return P;
}

// Betik dizgisi insan için yazılmış metin mi (çeviri adayı)?
function jsMetin(v, S) {
  const t = v.trim();
  if (!t || S.atla.has(t)) return false;
  if (!/\p{L}{2,}/u.test(t)) return false;
  if (/^[#.\[(:@]|^<|^https?:|^(img|js|sozlesmeler)\/|\.(html|webp|jpg|png|svg)(\?|$)/.test(t)) return false;
  if (/^[a-z0-9 _-]+$/.test(t) && t.split(' ').length <= 4) return false; // sınıf adları, anahtarlar
  if (/^[\w-]+\s*:\s*[^;]*;/.test(t)) return false; // css
  return /[çğıöşüÇĞİÖŞÜâÂ]/.test(t) || /\p{L}\s+\p{L}/u.test(t);
}

function ceviriBul(S, k, d) {
  const c = S.cev.get(k);
  if (c) return c[d];
  if (S.ayni.has(k)) return k;
  const m = k.match(fiyat);
  if (m) return DILLER[d].kod === 'en' ? m[1].replace(/\./g, ',') + m[2] : k;
  const t = k.trim();
  if (t && t !== k) {
    const ct = ceviriBul(S, t, d);
    if (ct != null) { const i = k.indexOf(t); return k.slice(0, i) + ct + k.slice(i + t.length); }
  }
  return null;
}

function yolCevir(v) {
  if (!v || /^(#|[a-z][a-z0-9+.-]*:|\/|data:)/i.test(v)) return v;
  return '../' + v.replace(/^\.\//, '');
}
const srcsetCevir = (v) => v.split(',').map((p) => p.trim().replace(/^\S+/, yolCevir)).join(', ');

function etiketIsle(src, e, S, d) {
  // Satır içi etiketin açılışı: öznitelikleri çevrilir, yolları düzeltilir
  let ac = src.slice(e.bas, e.son);
  const loc = e.el.sourceCodeLocation;
  const duz = [];
  for (const a of e.el.attrs) {
    const al = loc.attrs && loc.attrs[a.name];
    if (!al) continue;
    if (METIN_OZ.includes(a.name) && harfli(a.value)) {
      const c = ceviriBul(S, sik(a.value), d);
      if (c == null) throw new Error(`Çevirisi yok (satır içi öznitelik ${a.name}): ${a.value}`);
      duz.push([al.startOffset - e.bas, al.endOffset - e.bas, `${a.name}="${kacOz(c)}"`]);
    }
    if (URL_OZ.includes(a.name)) duz.push([al.startOffset - e.bas, al.endOffset - e.bas, `${a.name}="${kacOz(a.name === 'srcset' ? srcsetCevir(a.value) : yolCevir(a.value))}"`]);
  }
  duz.sort((x, y) => y[0] - x[0]).forEach(([b, s, t]) => { ac = ac.slice(0, b) + t + ac.slice(s); });
  return ac;
}

function satirYaz(src, p, ceviri, S, d) {
  let out = '';
  for (const x of ceviri.split(/(<\/?\d+\/?>)/)) {
    const m = x.match(/^<(\/?)(\d+)(\/?)>$/);
    if (!m) { out += kacHtml(x); continue; }
    const e = p.etiket[+m[2]];
    if (!e) throw new Error(`Yer tutucu yok: ${x} · ${p.k}`);
    if (e.el === null) out += e.ham;
    else if (m[1]) out += e.kapa;
    else out += etiketIsle(src, e, S, d);
  }
  return out;
}

function jsDizgi(ham, ceviri, sablon) {
  if (sablon) return ceviri.split('\\').join('\\\\').split('`').join('\\`').split('${').join('\\${');
  const t = ham[0];
  return t + ceviri.split('\\').join('\\\\').split(t).join('\\' + t).split('\n').join('\\n').split('\r').join('\\r').split(LS).join('\\u2028').split(PS).join('\\u2029') + t;
}

function dilMenusu(kod, onek) {
  const yol = (k) => (k === 'tr' ? (onek || './') : `${onek}${k}/`);
  const li = TUM.map((l) => (l.kod === kod
    ? `<li class="cur"><a href="${yol(l.kod)}" lang="${l.kod}" hreflang="${l.kod}" aria-current="page">${l.ad} <span>${l.simdi}</span></a></li>`
    : `<li><a href="${yol(l.kod)}" lang="${l.kod}" hreflang="${l.kod}">${l.ad}</a></li>`)).join('');
  const satir = TUM.map((l) => `<a href="${yol(l.kod)}" lang="${l.kod}" hreflang="${l.kod}"${l.kod === kod ? ' aria-current="page"' : ''}>${l.ad}</a>`).join(' · ');
  return { li, satir };
}

function uret(src, P, S, d, eksik) {
  const dil = DILLER[d];
  const duz = [];
  // kod: parçalarının içindeki dizgiler tek tek çevrilmez; parçanın tamamı aşağıda değiştirilir
  const kodAlan = [];
  for (const [o] of S.kod) { let i = src.indexOf(o); while (i >= 0) { kodAlan.push([i, i + o.length]); i = src.indexOf(o, i + o.length); } }
  for (const p of P) {
    if (kodAlan.some(([a, b]) => p.bas >= a && p.son <= b)) continue;
    if (p.tur === 'url') {
      const v = p.ad === 'srcset' ? srcsetCevir(p.deger) : yolCevir(p.deger);
      if (v !== p.deger) duz.push([p.bas, p.son, `${p.ad}="${kacOz(v)}"`]);
      continue;
    }
    if (p.tur === 'js' || p.tur === 'jsk') {
      let c = ceviriBul(S, p.k, d);
      if (c == null && /^(img|js|sozlesmeler)\/|^(odeme|akademi|dogrula|index)\.html/.test(p.k)) c = '../' + p.k;
      if (c == null) { if (jsMetin(p.k, S)) eksik.add(p.k.trim()); continue; }
      if (c !== p.k) duz.push([p.bas, p.son, jsDizgi(p.ham, c, p.tur === 'jsk')]);
      continue;
    }
    if (!harfli(p.k)) continue;
    const c = ceviriBul(S, p.k, d);
    if (c == null) { eksik.add(p.k); continue; }
    if (p.tur === 'oz') duz.push([p.bas, p.son, `${p.ad}="${kacOz(c)}"`]);
    else if (p.tur === 'metin') duz.push([p.bas, p.son, p.on + kacHtml(c) + p.arka]);
    else if (p.tur === 'kelime') duz.push([p.bas, p.son, c.split(/\s+/).map((w, i) => `<span class="w"><span style="--wi:${i}">${kacHtml(w)}</span></span>`).join(' ')]);
    else if (p.tur === 'satir') {
      if (tutucular(c) !== tutucular(p.k)) throw new Error(`[${dil.kod}] yer tutucular uyuşmuyor:\n  ${p.k}\n  ${c}`);
      duz.push([p.bas, p.son, p.on + satirYaz(src, p, c, S, d) + p.arka]);
    }
  }
  // satır içi parçaların içindeki yollar satirYaz'da düzeltildi; iç içe düzeltmelerden dıştakini tut
  duz.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  const temiz = [];
  let son = -1;
  for (const x of duz) { if (x[0] >= son) { temiz.push(x); son = x[1]; } else if (x[1] > son) throw new Error('Çakışan düzeltme ' + x[0]); }
  let out = src;
  for (let i = temiz.length - 1; i >= 0; i--) { const [b, s, t] = temiz[i]; out = out.slice(0, b) + t + out.slice(s); }

  // Sayfa düzeyindeki değişiklikler
  const bir = (o, n) => { const c = out.split(o).length - 1; if (c !== 1) throw new Error(`[${dil.kod}] "${o.slice(0, 60)}" ${c} kez bulundu`); out = out.split(o).join(n); };
  bir('<html lang="tr">', `<html lang="${dil.kod}">`);
  bir('<div class="site" id="top" lang="tr">', `<div class="site" id="top" lang="${dil.kod}">`);
  bir('<meta property="og:locale" content="tr_TR">', `<meta property="og:locale" content="${dil.yer}">`);
  bir(`<meta property="og:url" content="${SITE_URL}/">`, `<meta property="og:url" content="${SITE_URL}/${dil.kod}/">`);
  bir(`<link rel="canonical" href="${SITE_URL}/">`, `<link rel="canonical" href="${SITE_URL}/${dil.kod}/">`);
  bir('<use href="#i-g"/></svg>Türkçe</button>', `<use href="#i-g"/></svg>${dil.ad}</button>`);
  const menu = dilMenusu(dil.kod, '../');
  out = out.replace(/(<ul class="lang-m" id="langMenu" hidden translate="no">)[\s\S]*?(<\/ul>)/, (m, a, b) => a + menu.li + b);
  out = out.replace(/(<p class="mnav-l" translate="no">)[\s\S]*?(<\/p>)/, (m, a, b) => a + menu.satir + b);
  out = out.split(' data-yabanci hidden').join(' data-yabanci');
  for (const [o, ...n] of S.kod) {
    if (!out.includes(o)) throw new Error(`[${dil.kod}] kod parçası sayfada yok: ${o.slice(0, 80)}`);
    out = out.split(o).join(n[d]);
  }
  out = out.replace(/<!doctype html>/i, (m) => m + '\n<!-- Bu sayfa dil-kaynak/uret.mjs ile Türkçe ana sayfadan üretilir; elle düzenlenmez. -->');
  return out;
}

const blokYaz = (k) => `tr: ${k.split('\n').join('\\n')}\nen: \nes: \nde: \n`;

const src = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
const S = sozlukOku();
const P = parcala(src);

if (process.argv.includes('--liste') || process.argv.includes('--eksik')) {
  const gor = new Map();
  for (const p of P) {
    if (p.tur === 'url') continue;
    const js = p.tur === 'js' || p.tur === 'jsk';
    const k = js ? p.k.trim() : p.k;
    if (!(js ? jsMetin(p.k, S) : harfli(p.k)) || gor.has(k)) continue;
    gor.set(k, { k, tur: p.tur, yer: p.yer || '', var: [0, 1, 2].every((d) => ceviriBul(S, p.k, d) != null) });
  }
  const yalnizEksik = process.argv.includes('--eksik');
  const liste = [...gor.values()].filter((x) => !yalnizEksik || !x.var);
  const dosya = path.join(KOK, 'dil-kaynak', yalnizEksik ? 'eksik.txt' : 'parcalar.txt');
  fs.writeFileSync(dosya, liste.map((x) => `# ${x.tur} ${x.yer}${x.var ? ' (çevrildi)' : ''}\n` + blokYaz(x.k)).join('\n'));
  console.log(`${gor.size} parça, ${[...gor.values()].filter((x) => !x.var).length} çevirisiz → ${path.relative(KOK, dosya)}`);
  process.exit(0);
}

let hata = false;
for (let d = 0; d < DILLER.length; d++) {
  const eksik = new Set();
  const out = uret(src, P, S, d, eksik);
  const dir = path.join(SITE, DILLER[d].kod);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), out);
  console.log(`${DILLER[d].kod}: yazıldı${eksik.size ? `, ${eksik.size} parça çevirisiz` : ''}`);
  if (eksik.size) { hata = true; [...eksik].slice(0, 15).forEach((k) => console.log('   ', JSON.stringify(k).slice(0, 110))); }
}
process.exit(hata ? 1 : 0);
