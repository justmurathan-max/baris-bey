/* Tally formları ve Cal.com görüşme adımı.
   Ofis başvurusu, kurumsal talep ve etkinlik kaydı pencerelerinde form Tally'den açılır.
   Gönderilen kayıt Supabase'e de yazılır; merkezdeki Başvurular sayfası aynen çalışır.
   Başvuru ve kurumsal talepten sonra aynı pencerede Cal.com'dan görüşme saati seçilir.
   Tally ya da Cal.com yüklenemezse sitenin kendi formu ve Cal.com bağlantısı kullanılır.
   Bülten formu sitenin kendi formuyla kalır. */
(function () {
  'use strict';

  var CAL_USER = 'baris-kilicarslan-yesokm';
  var CFG = {
    'm-apply': { form: '4aBNGk', kind: 'ofis', cal: CAL_USER + '/akademi-gorusmesi', ns: 'akademi',
      after: { t: 'Başvurunuz alındı', p: 'Şimdi tanışma görüşmesi için size uygun bir saat seçin. 30 dakika; Google Meet ya da telefonla.' },
      booked: 'Görüşmeniz ayarlandı. Takvim daveti ve görüşme bağlantısı e-postanıza gönderildi.' },
    'm-corp': { form: 'Eq5bAN', kind: 'kurumsal', cal: CAL_USER + '/kurumsal-gorusme', ns: 'kurumsal',
      after: { t: 'Talebiniz alındı', p: 'İsterseniz şimdi 30 dakikalık bir görüşme saati seçin; konu, kitle ve tarihi birlikte konuşalım.' },
      booked: 'Görüşmeniz ayarlandı. Takvim daveti ve görüşme bağlantısı e-postanıza gönderildi.' },
    'm-invite': { form: 'aOerkq', kind: 'etkinlik' }
  };
  var LOAD_MS = 10000;
  var SB_URL = window.SB_URL || 'https://xjbqesljonbbduldeesd.supabase.co';
  var SB_KEY = window.SB_KEY || 'sb_publishable_VaavFE-aieVC-vJJ7AA-Mg_k5RNSJNq';

  var tallyState = 0; // 0 yüklenmedi, 1 yükleniyor, 2 hazır, -1 kullanılamıyor
  var tallyWaiting = [];
  var loaded = {};   // formId -> son yüklenme zamanı
  var mounts = {};   // pencere kimliği -> o anki gösterim
  var calSeq = 0;

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function cut(s, n) { s = s == null ? '' : String(s).trim(); return s.length > n ? s.slice(0, n) : s; }

  /* ---------- Stiller ---------- */
  var css = el('style');
  css.textContent =
    '.tc-box{margin-top:4px}' +
    '.tc-box iframe{display:block;width:100%;min-height:440px;border:0;background:transparent;color-scheme:light}' +
    '.tc-wait{display:flex;align-items:center;gap:10px;padding:18px 0;color:var(--mu,#5E5E66);font:500 14px/1.4 var(--fb,system-ui)}' +
    '.tc-wait i{width:16px;height:16px;border-radius:50%;border:2px solid #D6D6D1;border-top-color:#0B0B0C;animation:tcspin .8s linear infinite}' +
    '@keyframes tcspin{to{transform:rotate(360deg)}}' +
    '.dlg.tc-wide{width:min(1000px,100%)}' +
    '.tc-cal{min-height:520px;margin:6px -6px 0;overflow:hidden}' +
    '.tc-cal iframe{max-width:100%}' +
    '.tc-alt{display:flex;flex-wrap:wrap;gap:8px 18px;align-items:center;margin:-4px 0 6px}' +
    '.tc-alt button,.tc-alt a{background:none;border:0;padding:6px 0;font:600 14px/1.4 var(--fb,system-ui);color:var(--mu,#5E5E66);text-decoration:underline;text-underline-offset:3px;cursor:pointer}' +
    '.tc-alt a.btn{color:#fff;text-decoration:none;padding:0 22px}' +
    '@media (prefers-reduced-motion:reduce){.tc-wait i{animation:none}}';
  document.head.appendChild(css);

  /* ---------- Tally ---------- */
  function loadTally(cb) {
    if (tallyState === 2) { cb(true); return; }
    if (tallyState === -1) { cb(false); return; }
    tallyWaiting.push(cb);
    if (tallyState === 1) return;
    tallyState = 1;
    var s = el('script');
    s.src = 'https://tally.so/widgets/embed.js';
    s.async = true;
    s.onload = function () { tallyState = window.Tally ? 2 : -1; flush(); };
    s.onerror = function () { tallyState = -1; flush(); };
    document.head.appendChild(s);
    function flush() { var w = tallyWaiting; tallyWaiting = []; w.forEach(function (f) { f(tallyState === 2); }); }
  }

  function hiddenFields(m) {
    var h = { kaynak: 'site' };
    if (m.id === 'm-corp') { var t = document.getElementById('cf-topic'); if (t && t.value) h.konu = t.value; }
    if (m.id === 'm-invite') h.etkinlik = m.dataset.ev ? m.dataset.ev : 'lansman';
    return h;
  }

  function nativeForm(m) { return m.querySelector('form[data-demo]'); }

  function remember(m) {
    // Pencerenin kendi başlığı, açıklaması ve sonuç metni; her açılışta geri konur.
    if (m._tcOrig) return;
    var h = m.querySelector('.dlg h3'), p = h && h.nextElementSibling && h.nextElementSibling.tagName === 'P' ? h.nextElementSibling : null, d = m.querySelector('.done');
    m._tcOrig = { h: h, ht: h ? h.textContent : '', p: p, pt: p ? p.textContent : '', d: d, dh: d ? d.innerHTML : '' };
  }

  function restore(m) {
    var o = m._tcOrig; if (!o) return;
    // Etkinlik penceresinin başlığını sitenin kendi kodu her açılışta yazar; ona dokunulmaz.
    if (m.id !== 'm-invite') { if (o.h) o.h.textContent = o.ht; if (o.p) o.p.textContent = o.pt; }
    if (o.d) o.d.innerHTML = o.dh;
    var dlg = m.querySelector('.dlg'); if (dlg) dlg.classList.remove('tc-wide');
  }

  function unmount(m) {
    var cur = mounts[m.id];
    if (cur) { clearTimeout(cur.timer); if (cur.box && cur.box.parentNode) cur.box.parentNode.removeChild(cur.box); }
    delete mounts[m.id];
  }

  function fallback(m, cur) {
    // Tally açılmadı: sitenin kendi formu görünür, kayıt eskisi gibi Supabase'e gider.
    if (mounts[m.id] !== cur) return;
    unmount(m);
    var f = nativeForm(m); if (f) f.hidden = false;
  }

  function mount(m) {
    var c = CFG[m.id]; if (!c) return;
    remember(m); unmount(m); restore(m);
    var f = nativeForm(m);
    if (tallyState === -1 || !f) return;
    f.hidden = true;
    var cur = { at: Date.now(), hidden: hiddenFields(m) };
    mounts[m.id] = cur;
    var box = el('div', 'tc-box'); cur.box = box;
    var wait = el('div', 'tc-wait'); wait.append(el('i'), el('span', null, 'Form yükleniyor…'));
    var q = 'alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1';
    Object.keys(cur.hidden).forEach(function (k) { q += '&' + encodeURIComponent(k) + '=' + encodeURIComponent(cur.hidden[k]); });
    var fr = el('iframe');
    fr.setAttribute('data-tally-src', 'https://tally.so/embed/' + c.form + '?' + q);
    fr.setAttribute('title', (m.querySelector('.dlg h3') || {}).textContent || 'Form');
    fr.setAttribute('loading', 'eager');
    fr.setAttribute('width', '100%');
    fr.setAttribute('height', '440');
    fr.setAttribute('frameborder', '0');
    box.append(wait, fr);
    f.parentNode.insertBefore(box, f);
    cur.wait = wait; cur.frame = fr;
    cur.timer = setTimeout(function () { fallback(m, cur); }, LOAD_MS);
    // Sitenin kodu gizli formdaki ilk alana odaklanamaz; odak pencerede kalsın.
    setTimeout(function () { if (mounts[m.id] === cur && !m.contains(document.activeElement)) { var x = m.querySelector('.x'); if (x) try { x.focus({ preventScroll: true }); } catch (e) {} } }, 80);
    loadTally(function (ok) {
      if (mounts[m.id] !== cur) return;
      if (!ok) { fallback(m, cur); return; }
      try { window.Tally.loadEmbeds(); } catch (e) { fallback(m, cur); }
    });
  }

  /* ---------- Gönderim ---------- */
  function answer(a) {
    if (a == null) return '';
    if (Array.isArray(a)) return a.map(answer).filter(Boolean).join(', ');
    if (typeof a === 'object') return answer(a.text != null ? a.text : a.label != null ? a.label : a.name != null ? a.name : a.value);
    return String(a).trim();
  }

  function fieldsOf(payload) {
    var o = {};
    (payload && payload.fields || []).forEach(function (fl) {
      var t = String(fl.title || '').trim().toLocaleLowerCase('tr');
      var v = fl.answer ? answer(fl.answer.value) : '';
      if (!v && fl.answer) v = answer(fl.answer.raw);
      if (t) o[t] = v;
    });
    return function (title) { return o[title.toLocaleLowerCase('tr')] || ''; };
  }

  function rowFor(m, v, cur, payload) {
    var tally = payload && payload.id ? String(payload.id) : undefined;
    if (m.id === 'm-apply') return { kind: 'ofis', company: cut(v('Ofis adı'), 200), city: cut(v('Şehir'), 100), full_name: cut(v('Ad soyad'), 200), phone: cut(v('Telefon'), 40) || null, email: cut(v('E-posta'), 320) || null, meta: { size: cut(v('Danışman sayısı'), 40), tally: tally } };
    if (m.id === 'm-corp') return { kind: 'kurumsal', company: cut(v('Kurum'), 200), full_name: cut(v('Ad soyad'), 200), phone: cut(v('Telefon'), 40) || null, email: cut(v('E-posta'), 320) || null, message: cut(v('Not'), 4000) || null, meta: { size: cut(v('Kişi sayısı'), 40), topic: cut(v('Konu'), 80), giris: cut(cur.hidden.konu, 80) || undefined, tally: tally } };
    var lans = cur.hidden.etkinlik === 'lansman';
    return { kind: lans ? 'davetiye' : 'etkinlik', full_name: cut(v('Ad soyad'), 200), company: cut(v('Ofis'), 200), phone: cut(v('Telefon'), 40) || null, email: cut(v('E-posta'), 320) || null, meta: { mode: cut(lans ? v('Katılım') : cur.hidden.etkinlik, 120), tally: tally } };
  }

  function save(row) {
    if (!row || !(row.phone || row.email)) return;
    try {
      fetch(SB_URL + '/rest/v1/site_requests', { method: 'POST', headers: { apikey: SB_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(row) })
        .catch(function () {});
    } catch (e) {}
  }

  function showDone(m, text) {
    unmount(m);
    var dlg = m.querySelector('.dlg'); if (dlg) dlg.classList.remove('tc-wide');
    var o = m._tcOrig, d = m.querySelector('.done');
    if (o && o.h && m.id !== 'm-invite') { o.h.textContent = o.ht; if (o.p) o.p.textContent = o.pt; }
    if (d) {
      if (text) { d.replaceChildren(el('b', null, text.split('. ')[0] + '.'), el('p', null, text.split('. ').slice(1).join('. '))); }
      d.hidden = false;
    }
    var f = nativeForm(m); if (f) f.hidden = true;
    var x = m.querySelector('.x'); if (x) try { x.focus({ preventScroll: true }); } catch (e) {}
  }

  function onSubmitted(payload) {
    var id = payload && payload.formId;
    Object.keys(CFG).forEach(function (mid) {
      var c = CFG[mid], m = document.getElementById(mid), cur = mounts[mid];
      if (!m || m.hidden || !cur || c.form !== id || cur.sent) return;
      cur.sent = true;
      var v = fieldsOf(payload);
      save(rowFor(m, v, cur, payload));
      if (c.cal) showCal(m, c, v); else showDone(m);
    });
  }

  window.addEventListener('message', function (e) {
    if (typeof e.data !== 'string' || e.data.indexOf('Tally.') === -1) return;
    var d; try { d = JSON.parse(e.data); } catch (x) { return; }
    if (!d || !d.event || !d.payload) return;
    if (d.event === 'Tally.FormLoaded') {
      loaded[d.payload.formId] = Date.now();
      Object.keys(mounts).forEach(function (mid) {
        var cur = mounts[mid];
        if (CFG[mid].form === d.payload.formId && cur) { clearTimeout(cur.timer); if (cur.wait && cur.wait.parentNode) cur.wait.parentNode.removeChild(cur.wait); }
      });
    }
    if (d.event === 'Tally.FormSubmitted') onSubmitted(d.payload);
  });

  /* ---------- Cal.com ---------- */
  function loadCal() {
    if (window.Cal && window.Cal.loaded) return;
    /* Cal.com'un yerleştirme kodu */
    (function (C, A, L) { var p = function (a, ar) { a.q.push(ar); }; var d = C.document; C.Cal = C.Cal || function () { var cal = C.Cal; var ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement('script')).src = A; cal.loaded = true; } if (ar[0] === L) { var api = function () { p(api, arguments); }; var namespace = ar[1]; api.q = api.q || []; if (typeof namespace === 'string') { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ['initNamespace', namespace]); } else p(cal, ar); return; } p(cal, ar); }; })(window, 'https://app.cal.com/embed/embed.js', 'init');
  }

  function phoneE164(s) {
    var d = String(s || '').replace(/[^\d+]/g, '');
    if (!d) return '';
    if (d.charAt(0) === '+') return d;
    if (d.indexOf('00') === 0) return '+' + d.slice(2);
    if (d.charAt(0) === '0') return '+9' + d;
    if (d.length === 10) return '+90' + d;
    return d;
  }

  function calNotes(m, v) {
    if (m.id === 'm-apply') return ['Ofis: ' + v('Ofis adı'), 'Şehir: ' + v('Şehir'), 'Danışman sayısı: ' + v('Danışman sayısı')].join('\n');
    var n = ['Kurum: ' + v('Kurum'), 'Konu: ' + v('Konu'), 'Kişi sayısı: ' + v('Kişi sayısı')];
    if (v('Not')) n.push('Not: ' + v('Not'));
    return n.join('\n');
  }

  function calUrl(c, pre) {
    var q = Object.keys(pre).filter(function (k) { return pre[k]; }).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(pre[k]); }).join('&');
    return 'https://cal.com/' + c.cal + (q ? '?' + q : '');
  }

  function showCal(m, c, v) {
    var cur = mounts[m.id]; if (!cur) return;
    clearTimeout(cur.timer);
    var o = m._tcOrig;
    if (o && o.h) o.h.textContent = c.after.t;
    if (o && o.p) o.p.textContent = c.after.p;
    var dlg = m.querySelector('.dlg'); if (dlg) dlg.classList.add('tc-wide');
    var pre = { name: v('Ad soyad'), email: v('E-posta'), attendeePhoneNumber: phoneE164(v('Telefon')), notes: calNotes(m, v) };
    var box = cur.box; box.replaceChildren();
    var wait = el('div', 'tc-wait'); wait.append(el('i'), el('span', null, 'Takvim yükleniyor…'));
    var holder = el('div', 'tc-cal'); holder.id = 'tc-cal-' + c.ns + '-' + Date.now();
    var alt = el('div', 'tc-alt');
    var skip = el('button', null, 'Şimdi değil, beni arayın'); skip.type = 'button';
    skip.addEventListener('click', function () { showDone(m); });
    alt.append(skip);
    box.append(alt, wait, holder);
    try { m.scrollTop = 0; } catch (e) {}
    var ready = false, done = false;
    function booked() { if (done || mounts[m.id] !== cur) return; done = true; showDone(m, c.booked); }
    function failed() {
      if (ready || mounts[m.id] !== cur) return;
      if (wait.parentNode) wait.parentNode.removeChild(wait);
      holder.hidden = true;
      var a = el('a', 'btn btn-r', 'Görüşme saatini seç'); a.href = calUrl(c, pre); a.target = '_blank'; a.rel = 'noopener';
      alt.insertBefore(a, skip);
    }
    cur.timer = setTimeout(failed, LOAD_MS + 4000);
    try {
      loadCal();
      var Cal = window.Cal, ns = c.ns + '-' + (++calSeq);
      Cal('init', ns, { origin: 'https://app.cal.com' });
      var api = Cal.ns[ns];
      api('on', { action: 'linkReady', callback: function () { ready = true; clearTimeout(cur.timer); if (wait.parentNode) wait.parentNode.removeChild(wait); } });
      api('on', { action: 'linkFailed', callback: function () { failed(); } });
      api('on', { action: 'bookingSuccessfulV2', callback: booked });
      api('on', { action: 'bookingSuccessful', callback: booked });
      api('inline', { elementOrSelector: '#' + holder.id, calLink: c.cal, config: { layout: 'month_view', theme: 'light', name: pre.name, email: pre.email, attendeePhoneNumber: pre.attendeePhoneNumber, notes: pre.notes } });
      api('ui', { theme: 'light', layout: 'month_view', hideEventTypeDetails: false, cssVarsPerTheme: { light: { 'cal-brand': '#0B0B0C' } } });
    } catch (e) { failed(); }
  }

  /* ---------- Pencereleri izle ---------- */
  Object.keys(CFG).forEach(function (mid) {
    var m = document.getElementById(mid); if (!m) return;
    new MutationObserver(function () {
      if (!m.hidden) mount(m);
      else { unmount(m); restore(m); }
    }).observe(m, { attributes: true, attributeFilter: ['hidden'] });
  });

  // Testler ve elle deneme için
  window.__tallyCal = { cfg: CFG, mounts: mounts, onSubmitted: onSubmitted, showDone: showDone };
})();
