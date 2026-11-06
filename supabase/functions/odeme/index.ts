// Satın alma: siparişi kaydeder, ödemeyi PayTR ya da iyzico ile başlatır, ödeme sonucunu işler.
//
// Yollar (fonksiyon adresi: <SUPABASE_URL>/functions/v1/odeme):
//   POST /baslat   site → sipariş + ödeme oturumu ({ kapali } | { saglayici:'paytr', token } | { saglayici:'iyzico', url })
//   GET  /durum    sonuç sayfası → sipariş durumu (no + erişim anahtarı ile)
//   POST /paytr    PayTR bildirim URL'si (sunucudan sunucuya; yanıt düz "OK")
//   POST /iyzico   iyzico ödeme formu dönüşü (tarayıcıdan; sonuç sayfasına yönlendirir)
//
// Gizli ayarlar Supabase > Edge Functions > Secrets altında durur, depoda yoktur:
//   ODEME_SAGLAYICI   paytr | iyzico   (boşsa ödeme kapalı; site "çok yakında" der)
//   PAYTR_MERCHANT_ID, PAYTR_MERCHANT_KEY, PAYTR_MERCHANT_SALT, PAYTR_TEST (1 = test modu), PAYTR_MAX_TAKSIT (0 = izin verilen en fazla)
//   IYZICO_API_KEY, IYZICO_SECRET_KEY, IYZICO_BASE_URL (varsayılan sandbox; canlı: https://api.iyzipay.com)
//   SITE_URL (isteğe bağlı; izinli sitelerin dışından gelen isteklerde dönüş adresi)
//   PAYTR_API_URL (yalnız yerel deneme için; varsayılan PayTR'nin token adresi)
// Fiyatlar tarayıcıdan alınmaz; katalog.ts'den (satis-kaynak/build.py üretir) hesaplanır.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { SURUM } from './katalog.ts';
import * as L from './lib.ts';

const SITES = [
  'https://baris-kilicarslan-akademi.vercel.app',
  'https://bariskilicarslan.com',
  'https://www.bariskilicarslan.com',
];
const env = (k: string) => (Deno.env.get(k) ?? '').trim();
const simdi = () => new Date().toISOString();

function cors(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin && SITES.includes(origin) ? origin : SITES[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Vary': 'Origin',
  };
}
function json(status: number, body: unknown, origin: string | null) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors(origin), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}
const duz = (t: string, status = 200) => new Response(t, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
const yonlendir = (adres: string) => new Response(null, { status: 303, headers: { Location: adres, 'Cache-Control': 'no-store' } });

function admin() {
  const secrets = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}');
  const key = secrets.default ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  return createClient(Deno.env.get('SUPABASE_URL')!, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
function istemciIp(req: Request) {
  const h = req.headers;
  return (h.get('cf-connecting-ip') || h.get('x-real-ip') || (h.get('x-forwarded-for') ?? '').split(',')[0] || '').trim();
}
function saglayiciHazir(): 'paytr' | 'iyzico' | null {
  const s = env('ODEME_SAGLAYICI');
  if (s === 'paytr' && env('PAYTR_MERCHANT_ID') && env('PAYTR_MERCHANT_KEY') && env('PAYTR_MERCHANT_SALT')) return 'paytr';
  if (s === 'iyzico' && env('IYZICO_API_KEY') && env('IYZICO_SECRET_KEY')) return 'iyzico';
  return null;
}
const iyziTaban = () => (env('IYZICO_BASE_URL') || 'https://sandbox-api.iyzipay.com').replace(/\/+$/, '');
const fonkAdres = () => env('SUPABASE_URL').replace(/\/+$/, '') + '/functions/v1/odeme';

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const yol = url.pathname.replace(/\/+$/, '').split('/').pop();
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(origin) });
  try {
    if (yol === 'baslat' && req.method === 'POST') return await baslat(req, origin);
    if (yol === 'durum' && req.method === 'GET') return await durum(url, origin);
    if (yol === 'paytr' && req.method === 'POST') return await paytrBildirim(req);
    if (yol === 'iyzico' && req.method === 'POST') return await iyzicoDonus(req, url);
    return json(404, { hata: 'yol' }, origin);
  } catch (e) {
    console.error('odeme', yol, e);
    return json(500, { hata: 'sunucu' }, origin);
  }
});

async function baslat(req: Request, origin: string | null) {
  let g: Record<string, unknown>;
  try {
    g = await req.json();
  } catch {
    return json(400, { hata: 'istek' }, origin);
  }
  const sip = L.hesapla(g?.urunler);
  if (typeof sip === 'string') return json(400, { hata: sip }, origin);
  const alici = L.aliciDogrula(g?.alici);
  if (typeof alici === 'string') return json(400, { hata: 'istek', alan: alici }, origin);
  const fatura = L.faturaDogrula(g?.fatura);
  if (typeof fatura === 'string') return json(400, { hata: 'istek', alan: fatura }, origin);
  const onay = (g?.onay ?? {}) as Record<string, unknown>;
  if (onay.sozlesme !== true) return json(400, { hata: 'istek', alan: 'onay' }, origin);

  const saglayici = saglayiciHazir();
  if (!saglayici) return json(200, { kapali: true }, origin);

  const db = admin();
  const no = L.siparisNo(), k = L.anahtar(), ip = istemciIp(req);
  const site = origin && SITES.includes(origin) ? origin : env('SITE_URL') || SITES[0];
  const { error } = await db.from('orders').insert({
    no, access_key: k, status: 'bekliyor', provider: saglayici, return_url: site,
    items: sip.kalemler, subtotal: sip.ara, shipping: sip.kargo, total: sip.toplam,
    buyer: { ...alici, fatura },
    consents: {
      on_bilgilendirme_ve_sozlesme: simdi(), ticari_ileti: onay.ticari_ileti === true,
      sayfa_surum: String(onay.surum ?? '').slice(0, 40), sunucu_surum: SURUM, ip, tarayici: (req.headers.get('user-agent') ?? '').slice(0, 300),
    },
  });
  if (error) {
    console.error('siparis yazilamadi', error);
    return json(500, { hata: 'sunucu' }, origin);
  }
  const donus = `${site}/odeme.html?no=${no}&k=${k}`;
  try {
    if (saglayici === 'paytr') return json(200, { saglayici, no, k, token: await paytrBaslat(no, sip, alici, ip, donus) }, origin);
    return json(200, { saglayici, no, k, url: await iyzicoBaslat(no, sip, alici, fatura, ip) }, origin);
  } catch (e) {
    console.error('odeme baslatilamadi', no, e);
    await db.from('orders').update({ status: 'basarisiz', updated_at: simdi(), raw: { baslatma_hatasi: String(e).slice(0, 500) } }).eq('no', no);
    return json(502, { hata: 'saglayici' }, origin);
  }
}

async function paytrBaslat(no: string, sip: L.Siparis, alici: L.Alici, ip: string, donus: string) {
  const p = {
    merchant_id: env('PAYTR_MERCHANT_ID'), merchant_key: env('PAYTR_MERCHANT_KEY'), merchant_salt: env('PAYTR_MERCHANT_SALT'),
    user_ip: ip, merchant_oid: no, email: alici.eposta, payment_amount: L.kurus(sip.toplam), user_basket: L.paytrSepet(sip),
    no_installment: '0', max_installment: env('PAYTR_MAX_TAKSIT') || '0', currency: 'TL', test_mode: env('PAYTR_TEST') === '1' ? '1' : '0',
  };
  const form = new URLSearchParams({
    merchant_id: p.merchant_id, user_ip: p.user_ip, merchant_oid: p.merchant_oid, email: p.email, payment_amount: p.payment_amount,
    paytr_token: await L.paytrToken(p), user_basket: p.user_basket, debug_on: p.test_mode, no_installment: p.no_installment,
    max_installment: p.max_installment, user_name: `${alici.ad} ${alici.soyad}`, user_address: L.adresMetni(alici), user_phone: '0' + alici.telefon,
    merchant_ok_url: donus + '&d=ok', merchant_fail_url: donus + '&d=hata', timeout_limit: '30', currency: p.currency, test_mode: p.test_mode,
    lang: 'tr', iframe_v2: '1',
  });
  const r = await fetch(env('PAYTR_API_URL') || 'https://www.paytr.com/odeme/api/get-token', { method: 'POST', body: form });
  const j = await r.json().catch(() => ({}));
  if (j.status !== 'success' || !j.token) throw new Error('paytr: ' + (j.reason ?? r.status));
  return String(j.token);
}

async function iyziIstek(yol: string, govde: unknown) {
  const body = JSON.stringify(govde), rnd = L.rastgele();
  const r = await fetch(iyziTaban() + yol, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json', Accept: 'application/json', 'x-iyzi-rnd': rnd,
      Authorization: await L.iyziYetki(env('IYZICO_API_KEY'), env('IYZICO_SECRET_KEY'), yol, body, rnd),
    },
    body,
  });
  return await r.json().catch(() => ({ status: 'failure', errorMessage: 'yanit ' + r.status }));
}

async function iyzicoBaslat(no: string, sip: L.Siparis, alici: L.Alici, fatura: L.Fatura, ip: string) {
  const adSoyad = `${alici.ad} ${alici.soyad}`;
  const adres = {
    contactName: fatura.tip === 'kurumsal' ? fatura.unvan : adSoyad, city: alici.il, country: 'Turkey',
    address: L.adresMetni(alici), zipCode: alici.posta || undefined,
  };
  const sepet = sip.kalemler.map((k) => ({
    id: k.kod, name: k.adet > 1 ? `${k.ad} (${k.adet} adet)` : k.ad, category1: k.kategori,
    itemType: k.kargo ? 'PHYSICAL' : 'VIRTUAL', price: L.iki(k.tutar),
  }));
  if (sip.kargo > 0) sepet.push({ id: 'kargo', name: 'Kargo ücreti', category1: 'Kargo', itemType: 'PHYSICAL', price: L.iki(sip.kargo) });
  const govde = {
    locale: 'tr', conversationId: no, price: L.iki(sip.toplam), paidPrice: L.iki(sip.toplam), currency: 'TRY',
    basketId: no, paymentGroup: 'PRODUCT', callbackUrl: `${fonkAdres()}/iyzico?no=${no}`, enabledInstallments: [1, 2, 3, 6, 9, 12],
    buyer: {
      id: no, name: alici.ad, surname: alici.soyad, gsmNumber: '+90' + alici.telefon, email: alici.eposta,
      identityNumber: (fatura.tip === 'bireysel' && fatura.tckn) || '11111111111', registrationAddress: L.adresMetni(alici),
      ip, city: alici.il, country: 'Turkey', zipCode: alici.posta || undefined,
    },
    billingAddress: adres,
    ...(sip.fiziksel ? { shippingAddress: { ...adres, contactName: adSoyad } } : {}),
    basketItems: sepet,
  };
  const j = await iyziIstek('/payment/iyzipos/checkoutform/initialize/auth/ecom', govde);
  if (j.status !== 'success' || !j.token || !j.paymentPageUrl) throw new Error('iyzico: ' + (j.errorMessage ?? j.errorCode ?? 'yanit'));
  if (j.signature && !L.esit(await L.iyziImza(env('IYZICO_SECRET_KEY'), [j.conversationId, j.token]), j.signature)) throw new Error('iyzico: imza');
  return String(j.paymentPageUrl);
}

async function paytrBildirim(req: Request) {
  const f = await req.formData();
  const p = (k: string) => String(f.get(k) ?? '');
  const key = env('PAYTR_MERCHANT_KEY'), salt = env('PAYTR_MERCHANT_SALT');
  if (!key || !salt) return duz('PAYTR ayarlanmadi', 500);
  if (!L.esit(await L.paytrBildirimHash(key, salt, p('merchant_oid'), p('status'), p('total_amount')), p('hash'))) {
    return duz('PAYTR notification failed: bad hash', 400);
  }
  const db = admin();
  const { data: o } = await db.from('orders').select('no, status, total').eq('no', p('merchant_oid')).maybeSingle();
  if (!o) {
    console.error('paytr: siparis yok', p('merchant_oid'));
    return duz('OK');
  }
  if (['odendi', 'iade', 'iptal'].includes(o.status)) return duz('OK');
  const ham = {
    saglayici: 'paytr', status: p('status'), total_amount: p('total_amount'), payment_amount: p('payment_amount'), payment_type: p('payment_type'),
    installment_count: p('installment_count'), currency: p('currency'), test_mode: p('test_mode'),
    failed_reason_code: p('failed_reason_code'), failed_reason_msg: p('failed_reason_msg'),
  };
  if (p('status') === 'success') {
    // Taksitte vade farkı eklenebilir; tahsil edilen tutar total_amount'tadır.
    await db.from('orders').update({ status: 'odendi', paid_at: simdi(), updated_at: simdi(), paid_total: Number(p('total_amount')) / 100, raw: ham }).eq('no', o.no);
  } else {
    await db.from('orders').update({ status: 'basarisiz', updated_at: simdi(), raw: ham }).eq('no', o.no).eq('status', 'bekliyor');
  }
  return duz('OK');
}

async function iyzicoDonus(req: Request, url: URL) {
  const f = await req.formData().catch(() => new FormData());
  const token = String(f.get('token') ?? '');
  const no = url.searchParams.get('no') ?? '';
  const db = admin();
  const { data: o } = await db.from('orders').select('no, access_key, status, total, return_url').eq('no', no).maybeSingle();
  if (!o || !token) return yonlendir(`${SITES[0]}/odeme.html`);
  const donus = `${o.return_url || SITES[0]}/odeme.html?no=${o.no}&k=${o.access_key}`;
  if (o.status === 'odendi') return yonlendir(donus + '&d=ok');

  const j = await iyziIstek('/payment/iyzipos/checkoutform/auth/ecom/detail', { locale: 'tr', conversationId: o.no, token });
  let gecerli = j.status === 'success' && j.basketId === o.no && j.conversationId === o.no && j.token === token && L.tutarEsit(j.price, o.total);
  if (gecerli && j.signature) {
    const beklenen = await L.iyziImza(env('IYZICO_SECRET_KEY'), [j.paymentStatus, j.paymentId, j.currency, j.basketId, j.conversationId, L.sifirsiz(j.paidPrice), L.sifirsiz(j.price), j.token]);
    gecerli = L.esit(beklenen, j.signature);
  }
  const ham = {
    saglayici: 'iyzico', paymentStatus: j.paymentStatus, paymentId: j.paymentId, fraudStatus: j.fraudStatus, paidPrice: j.paidPrice,
    installment: j.installment, errorCode: j.errorCode, errorMessage: j.errorMessage, imza_var: Boolean(j.signature), gecerli,
  };
  if (gecerli && j.paymentStatus === 'SUCCESS' && j.fraudStatus === 1) {
    await db.from('orders').update({ status: 'odendi', paid_at: simdi(), updated_at: simdi(), paid_total: Number(j.paidPrice), provider_ref: String(j.paymentId), raw: ham }).eq('no', o.no);
    return yonlendir(donus + '&d=ok');
  }
  if (gecerli && j.paymentStatus === 'SUCCESS') {
    // fraudStatus 0: iyzico incelemesinde; onaylanınca panelden ya da bildirimle sonuçlanır.
    await db.from('orders').update({ updated_at: simdi(), provider_ref: String(j.paymentId), raw: { ...ham, inceleme: true } }).eq('no', o.no);
    return yonlendir(donus);
  }
  await db.from('orders').update({ status: 'basarisiz', updated_at: simdi(), raw: ham }).eq('no', o.no).eq('status', 'bekliyor');
  return yonlendir(donus + '&d=hata');
}

async function durum(url: URL, origin: string | null) {
  const no = url.searchParams.get('no') ?? '', k = url.searchParams.get('k') ?? '';
  if (!/^BK[0-9A-Z]{8,20}$/.test(no) || !/^[0-9a-f]{32}$/.test(k)) return json(400, { hata: 'istek' }, origin);
  const { data: o } = await admin().from('orders').select('status, items, total, access_key, raw').eq('no', no).maybeSingle();
  if (!o || !L.esit(o.access_key, k)) return json(404, { hata: 'yok' }, origin);
  const kalemler = (o.items ?? []) as L.Kalem[];
  const raw = (o.raw ?? {}) as Record<string, unknown>;
  return json(200, {
    durum: o.status,
    urunler: kalemler.map((x) => ({ kod: x.kod, ad: x.ad, adet: x.adet, tutar: x.tutar })),
    toplam: Number(o.total),
    dijital: kalemler.some((x) => x.dijital),
    kargo: kalemler.some((x) => x.kargo),
    neden: o.status === 'basarisiz' ? String(raw.failed_reason_msg || raw.errorMessage || '') || undefined : undefined,
  }, origin);
}
