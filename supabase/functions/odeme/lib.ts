// Ödeme yardımcıları: sepet hesabı, alan doğrulama, PayTR ve iyzico imzaları.
// Saf fonksiyonlar; Deno'da ve Node'da (Web Crypto) aynı çalışır, testleri tools/odeme-lib.test.mjs içinde.
import { KATALOG } from './katalog.ts';

export const IL = ['Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 'Antalya', 'Ardahan', 'Artvin', 'Aydın', 'Balıkesir', 'Bartın', 'Batman', 'Bayburt', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Iğdır', 'Isparta', 'İstanbul', 'İzmir', 'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kilis', 'Kırıkkale', 'Kırklareli', 'Kırşehir', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Mardin', 'Mersin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Şanlıurfa', 'Şırnak', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak'];

export type Kalem = { kod: string; ad: string; adet: number; birim: number; tutar: number; dijital: boolean; kargo: boolean; kategori: string };
export type Siparis = { kalemler: Kalem[]; ara: number; kargo: number; toplam: number; fiziksel: boolean; dijital: boolean };
export type Alici = { ad: string; soyad: string; eposta: string; telefon: string; il: string; ilce: string; adres: string; posta: string };
export type Fatura = { tip: 'bireysel'; tckn?: string } | { tip: 'kurumsal'; unvan: string; vergi_dairesi: string; vergi_no: string };

const kurusla = (n: number) => Math.round(n * 100) / 100;
const metin = (v: unknown, enFazla: number) => String(v ?? '').trim().replace(/\s+/g, ' ').slice(0, enFazla);
const sahip = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k);

/** Sepeti katalog fiyatlarıyla hesaplar. Hata hâlinde 'istek' ya da 'urun' döner. */
export function hesapla(girdi: unknown): Siparis | string {
  if (!Array.isArray(girdi) || girdi.length < 1 || girdi.length > 10) return 'istek';
  const goruldu = new Set<string>();
  const kalemler: Kalem[] = [];
  for (const x of girdi) {
    const kod = String((x as { kod?: unknown })?.kod ?? '');
    const adet = Number((x as { adet?: unknown })?.adet);
    if (!sahip(KATALOG, kod) || goruldu.has(kod)) return 'urun';
    const u = KATALOG[kod];
    if (u.fiyat == null || (u.kargo && u.kargo_ucreti == null)) return 'urun';
    if (!Number.isInteger(adet) || adet < 1 || adet > u.en_fazla) return 'istek';
    goruldu.add(kod);
    kalemler.push({ kod, ad: u.ad, adet, birim: u.fiyat, tutar: kurusla(u.fiyat * adet), dijital: u.dijital, kargo: u.kargo, kategori: u.kategori });
  }
  const fiziksel = kalemler.some((k) => k.kargo);
  const ara = kurusla(kalemler.reduce((t, k) => t + k.tutar, 0));
  const kargo = fiziksel ? Math.max(...kalemler.filter((k) => k.kargo).map((k) => KATALOG[k.kod].kargo_ucreti ?? 0)) : 0;
  return { kalemler, ara, kargo, toplam: kurusla(ara + kargo), fiziksel, dijital: kalemler.some((k) => k.dijital) };
}

/** Türkiye telefonunu 10 haneye indirir (5xx…); geçersizse boş döner. */
export function telNorm(s: string): string {
  let d = String(s ?? '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('90')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return /^[2-9]\d{9}$/.test(d) ? d : '';
}

export function tcknGecerli(t: string): boolean {
  if (!/^[1-9]\d{10}$/.test(t)) return false;
  const d = t.split('').map(Number);
  const onuncu = (((d[0] + d[2] + d[4] + d[6] + d[8]) * 7 - (d[1] + d[3] + d[5] + d[7])) % 10 + 10) % 10;
  if (onuncu !== d[9]) return false;
  return d.slice(0, 10).reduce((a, b) => a + b, 0) % 10 === d[10];
}

/** Alıcı bilgilerini temizler; geçersiz alanın adını döner. */
export function aliciDogrula(a: unknown): Alici | string {
  const g = (a ?? {}) as Record<string, unknown>;
  const ad = metin(g.ad, 60), soyad = metin(g.soyad, 60), eposta = metin(g.eposta, 120);
  const il = metin(g.il, 30), ilce = metin(g.ilce, 60), adres = metin(g.adres, 300), posta = metin(g.posta, 5);
  const telefon = telNorm(String(g.telefon ?? ''));
  if (ad.length < 2) return 'ad';
  if (soyad.length < 2) return 'soyad';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(eposta)) return 'eposta';
  if (!telefon) return 'telefon';
  if (!IL.includes(il)) return 'il';
  if (ilce.length < 2) return 'ilce';
  if (adres.length < 10) return 'adres';
  if (posta && !/^\d{5}$/.test(posta)) return 'posta';
  return { ad, soyad, eposta, telefon, il, ilce, adres, posta };
}

export function faturaDogrula(f: unknown): Fatura | string {
  const g = (f ?? {}) as Record<string, unknown>;
  if (g.tip === 'kurumsal') {
    const unvan = metin(g.unvan, 150), vd = metin(g.vergi_dairesi, 60), vn = String(g.vergi_no ?? '').replace(/\D/g, '');
    if (unvan.length < 2) return 'unvan';
    if (vd.length < 2) return 'vergi_dairesi';
    if (!/^\d{10,11}$/.test(vn)) return 'vergi_no';
    return { tip: 'kurumsal', unvan, vergi_dairesi: vd, vergi_no: vn };
  }
  const tckn = String(g.tckn ?? '').replace(/\D/g, '');
  if (tckn && !tcknGecerli(tckn)) return 'tckn';
  return tckn ? { tip: 'bireysel', tckn } : { tip: 'bireysel' };
}

export const adresMetni = (a: Alici) => `${a.adres}, ${a.ilce}/${a.il}${a.posta ? ' ' + a.posta : ''}`;

/** 9797 -> '979700' (kuruş, PayTR payment_amount) */
export const kurus = (n: number) => String(Math.round(n * 100));
/** 9797 -> '9797.00' (iyzico fiyat alanları, PayTR sepet fiyatı) */
export const iki = (n: number) => (Math.round(n * 100) / 100).toFixed(2);
/** iyzico imzasında fiyatların sondaki sıfırları atılır: '50.00' -> '50', '10.510' -> '10.51' */
export function sifirsiz(x: string | number): string {
  let s = String(x);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s;
}
/** İki tutarın kuruşu kuruşuna eşit olup olmadığı */
export const tutarEsit = (a: unknown, b: unknown) => Math.round(Number(a) * 100) === Math.round(Number(b) * 100);

/** Sabit sürede karşılaştırma */
export function esit(a: string, b: string): boolean {
  a = String(a ?? ''); b = String(b ?? '');
  let fark = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) fark |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return fark === 0;
}

const yazi = new TextEncoder();
function b64(bayt: Uint8Array): string {
  let s = '';
  for (const b of bayt) s += String.fromCharCode(b);
  return btoa(s);
}
export const b64Metin = (s: string) => b64(yazi.encode(s));
async function hmac(anahtar: string, mesaj: string): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey('raw', yazi.encode(anahtar), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, yazi.encode(mesaj)));
}
export const hmacHex = async (anahtar: string, mesaj: string) => Array.from(await hmac(anahtar, mesaj), (b) => b.toString(16).padStart(2, '0')).join('');
export const hmacB64 = async (anahtar: string, mesaj: string) => b64(await hmac(anahtar, mesaj));

function rastgeleBayt(n: number) { return crypto.getRandomValues(new Uint8Array(n)); }
/** Sipariş no: yalnız harf ve rakam (PayTR merchant_oid kuralı). Örn. BK261107K7Q2XM */
export function siparisNo(simdi = Date.now()): string {
  const d = new Date(simdi + 3 * 3600 * 1000); // Türkiye saati
  const iki2 = (n: number) => String(n).padStart(2, '0');
  const harf = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let e = '';
  for (const b of rastgeleBayt(6)) e += harf[b % harf.length];
  return `BK${iki2(d.getUTCFullYear() % 100)}${iki2(d.getUTCMonth() + 1)}${iki2(d.getUTCDate())}${e}`;
}
/** Sonuç sayfası anahtarı: 32 onaltılık karakter */
export const anahtar = () => Array.from(rastgeleBayt(16), (b) => b.toString(16).padStart(2, '0')).join('');
/** iyzico randomKey */
export const rastgele = () => String(Date.now()) + Array.from(rastgeleBayt(5), (b) => String(b % 10)).join('');

/** JSON'u PHP json_encode gibi ASCII olarak yazar (Türkçe harfler \\uXXXX) */
export const jsonAscii = (v: unknown) => JSON.stringify(v).replace(/[\u007f-￿]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));

/** PayTR user_basket: base64([[ad, birim fiyat, adet], …]) */
export function paytrSepet(s: Siparis): string {
  const satirlar: [string, string, number][] = s.kalemler.map((k) => [k.ad, iki(k.birim), k.adet]);
  if (s.kargo > 0) satirlar.push(['Kargo ücreti', iki(s.kargo), 1]);
  return b64Metin(jsonAscii(satirlar));
}

/** PayTR iFrame API 1. adım token'ı (dev.paytr.com/iframe-api/iframe-api-1-adim) */
export function paytrToken(p: {
  merchant_id: string; merchant_key: string; merchant_salt: string; user_ip: string; merchant_oid: string; email: string;
  payment_amount: string; user_basket: string; no_installment: string; max_installment: string; currency: string; test_mode: string;
}): Promise<string> {
  const hashStr = p.merchant_id + p.user_ip + p.merchant_oid + p.email + p.payment_amount + p.user_basket + p.no_installment + p.max_installment + p.currency + p.test_mode;
  return hmacB64(p.merchant_key, hashStr + p.merchant_salt);
}

/** PayTR bildirim (2. adım) hash'i */
export function paytrBildirimHash(merchantKey: string, merchantSalt: string, merchantOid: string, status: string, totalAmount: string): Promise<string> {
  return hmacB64(merchantKey, merchantOid + merchantSalt + status + totalAmount);
}

/** iyzico IYZWSv2 yetki başlığı (docs.iyzico.com, HMACSHA256 Auth) */
export async function iyziYetki(apiKey: string, secretKey: string, yol: string, govde: string, rnd: string): Promise<string> {
  const imza = await hmacHex(secretKey, rnd + yol + govde);
  return 'IYZWSv2 ' + b64Metin(`apiKey:${apiKey}&randomKey:${rnd}&signature:${imza}`);
}

/** iyzico yanıt imzası: parçalar ':' ile birleşir, HMAC-SHA256, hex */
export function iyziImza(secretKey: string, parcalar: (string | number | null | undefined)[]): Promise<string> {
  return hmacHex(secretKey, parcalar.map((p) => String(p ?? '')).join(':'));
}
