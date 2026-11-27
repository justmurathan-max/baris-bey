/* Çerez bildirimi ve ziyaret istatistiği.
   Sitenin çalışması için gereken kayıtlar (çerez tercihi, açılış animasyonu, akademi oturumu) her zaman kullanılır.
   Ziyaret istatistiği (Vercel Web Analytics) yalnız "Kabul et" seçilirse yüklenir; çerez ve yerel depolama kullanmaz.
   "Kabul et" ile "Reddet" aynı görünür. Tercih 12 ay saklanır, sonra yeniden sorulur.
   Sayfadaki [data-cerez-ayar] bağlantıları bildirimi yeniden açar. Metinler sayfanın diline göre (tr, en, es, de).
   Ayrıntılar: Gizlilik ve Çerez Politikası (sozlesmeler/gizlilik-ve-cerez-politikasi.html). */
(function () {
  'use strict';
  var ANAHTAR = 'bk-cerez', SURUM = 1, OMUR = 365 * 864e5;
  var POLITIKA = '/sozlesmeler/gizlilik-ve-cerez-politikasi.html#cerezler';
  var METIN = {
    tr: { b: 'Çerez tercihiniz', p: 'Sitenin çalışması için gereken kayıtları her zaman kullanırız. İzin verirseniz ziyaret istatistiği de tutarız: hangi sayfaların açıldığı, çerez kullanılmadan ve kimliğiniz belirlenmeden sayılır.', l: 'Çerez politikası', k: 'Kabul et', r: 'Reddet', ac: 'Şu anki tercihiniz: ziyaret istatistiği açık.', ka: 'Şu anki tercihiniz: ziyaret istatistiği kapalı.', a: 'Çerez tercihi' },
    en: { b: 'Your cookie choice', p: 'We always use the records the site needs to work. If you allow it, we also keep visit statistics: which pages are opened is counted without cookies and without identifying you.', l: 'Cookie policy (in Turkish)', k: 'Accept', r: 'Reject', ac: 'Current choice: visit statistics on.', ka: 'Current choice: visit statistics off.', a: 'Cookie choice' },
    es: { b: 'Tus preferencias de cookies', p: 'Siempre usamos los registros que el sitio necesita para funcionar. Si lo permites, también llevamos estadísticas de visitas: contamos qué páginas se abren, sin cookies y sin identificarte.', l: 'Política de cookies (en turco)', k: 'Aceptar', r: 'Rechazar', ac: 'Preferencia actual: estadísticas de visitas activadas.', ka: 'Preferencia actual: estadísticas de visitas desactivadas.', a: 'Preferencias de cookies' },
    de: { b: 'Ihre Cookie-Einstellung', p: 'Wir verwenden immer die Einträge, die die Website zum Funktionieren braucht. Wenn Sie zustimmen, führen wir außerdem eine Besuchsstatistik: Wir zählen, welche Seiten aufgerufen werden, ohne Cookies und ohne Sie zu identifizieren.', l: 'Cookie-Richtlinie (auf Türkisch)', k: 'Akzeptieren', r: 'Ablehnen', ac: 'Aktuelle Einstellung: Besuchsstatistik an.', ka: 'Aktuelle Einstellung: Besuchsstatistik aus.', a: 'Cookie-Einstellung' }
  };
  var dil = String(document.documentElement.lang || 'tr').slice(0, 2).toLowerCase();
  var T = METIN[dil] || METIN.tr;
  var kutu = null;

  function oku() {
    try {
      var v = JSON.parse(localStorage.getItem(ANAHTAR) || 'null');
      if (v && v.v === SURUM && typeof v.analitik === 'boolean' && Date.now() - v.t < OMUR) return v;
    } catch (e) {}
    return null;
  }
  var tercih = oku();

  function yaz(analitik) {
    tercih = { v: SURUM, analitik: analitik, t: Date.now() };
    try { localStorage.setItem(ANAHTAR, JSON.stringify(tercih)); } catch (e) {}
  }

  /* ---------- Ziyaret istatistiği ---------- */
  var IZINLI = ['urun', 'utm_source', 'utm_medium', 'utm_campaign'];
  function temizle(adres) {
    // Sipariş, sertifika numarası gibi bilgiler gönderilmez: sorgu yalnız izinli alanlarla, #'den sonrası hiç.
    var u = new URL(adres, location.href), q = new URLSearchParams();
    IZINLI.forEach(function (k) { var x = u.searchParams.get(k); if (x) q.set(k, x.slice(0, 60)); });
    u.search = q.toString(); u.hash = '';
    u.pathname = u.pathname.replace(/^\/dogrula\/.+$/, '/dogrula');
    return u.toString();
  }
  function analitikYukle() {
    if (window.__bkAnalitik) return;
    window.__bkAnalitik = true;
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    window.va('beforeSend', function (olay) {
      if (!tercih || !tercih.analitik) return null;
      try { var y = {}; for (var k in olay) y[k] = olay[k]; y.url = temizle(olay.url); return y; } catch (e) { return null; }
    });
    var s = document.createElement('script');
    s.defer = true;
    s.src = '/_vercel/insights/script.js';
    document.head.appendChild(s);
  }

  /* ---------- Bildirim ---------- */
  function stil() {
    if (document.getElementById('bk-cerez-stil')) return;
    var c = document.createElement('style');
    c.id = 'bk-cerez-stil';
    c.textContent =
      '.bk-cz{position:fixed;left:16px;bottom:16px;z-index:60;width:min(420px,calc(100vw - 32px));box-sizing:border-box;padding:18px 18px 16px;' +
      'background:#fff;color:#0B0B0C;border:1px solid rgba(0,0,0,.12);border-radius:18px;box-shadow:0 18px 50px -18px rgba(0,0,0,.45);' +
      'font:400 14px/1.5 "Inter",system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased}' +
      '.bk-cz[hidden]{display:none}' +
      '.bk-cz b{display:block;margin:0 0 6px;font:600 15px/1.3 "Inter",system-ui,sans-serif}' +
      '.bk-cz p{margin:0;color:#3A3A40}' +
      '.bk-cz .bk-cz-d{margin-top:6px;color:#5E5E66;font-size:13px}' +
      '.bk-cz a{color:inherit;text-decoration:underline;text-underline-offset:3px}' +
      '.bk-cz-b{display:flex;gap:8px;margin-top:14px}' +
      '.bk-cz-b button{flex:1 1 0;height:44px;padding:0 14px;border:0;border-radius:999px;background:#0B0B0C;color:#fff;font:600 14px/1 "Inter",system-ui,sans-serif;cursor:pointer}' +
      '.bk-cz-b button:hover{background:#2A2A2E}' +
      '.bk-cz button:focus-visible,.bk-cz a:focus-visible{outline:2px solid #3653FF;outline-offset:3px}' +
      '@media (max-width:560px){.bk-cz{left:12px;right:12px;bottom:12px;width:auto;padding:16px 16px 14px}}' +
      '@media (prefers-reduced-motion:no-preference){.bk-cz{animation:bkCzIn .35s cubic-bezier(.2,.7,.2,1)}@keyframes bkCzIn{from{opacity:0;transform:translateY(12px)}}}' +
      '@media print{.bk-cz{display:none!important}}';
    document.head.appendChild(c);
  }

  function goster(odaklan) {
    stil();
    if (!kutu) {
      kutu = document.createElement('section');
      kutu.className = 'bk-cz';
      kutu.setAttribute('role', 'region');
      kutu.setAttribute('aria-label', T.a);
      kutu.setAttribute('translate', 'no');
      var b = document.createElement('b'); b.textContent = T.b;
      var p = document.createElement('p'); p.appendChild(document.createTextNode(T.p + ' '));
      var a = document.createElement('a'); a.href = POLITIKA; a.textContent = T.l; p.appendChild(a); p.appendChild(document.createTextNode('.'));
      var d = document.createElement('p'); d.className = 'bk-cz-d'; d.hidden = true;
      var dug = document.createElement('div'); dug.className = 'bk-cz-b';
      var k = document.createElement('button'); k.type = 'button'; k.textContent = T.k; k.setAttribute('data-secim', 'kabul');
      var r = document.createElement('button'); r.type = 'button'; r.textContent = T.r; r.setAttribute('data-secim', 'ret');
      dug.appendChild(k); dug.appendChild(r);
      kutu.appendChild(b); kutu.appendChild(p); kutu.appendChild(d); kutu.appendChild(dug);
      kutu.addEventListener('click', function (e) {
        var t = e.target.closest ? e.target.closest('[data-secim]') : null;
        if (!t) return;
        var evet = t.getAttribute('data-secim') === 'kabul';
        yaz(evet);
        kutu.hidden = true;
        if (evet) analitikYukle();
      });
      document.body.appendChild(kutu);
    }
    var durum = kutu.querySelector('.bk-cz-d');
    durum.hidden = !tercih;
    if (tercih) durum.textContent = tercih.analitik ? T.ac : T.ka;
    kutu.hidden = false;
    if (odaklan) { var ilk = kutu.querySelector('button'); if (ilk) try { ilk.focus(); } catch (e) {} }
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-cerez-ayar]') : null;
    if (!t) return;
    e.preventDefault();
    goster(true);
  });

  window.bkCerez = { ac: function () { goster(true); }, durum: function () { return tercih ? { analitik: tercih.analitik } : null; } };

  function basla() {
    if (tercih && tercih.analitik) analitikYukle();
    if (!tercih) goster(false);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', basla); else basla();
})();
