// Barış AI: grup provasında müşteriyi oynar ve provayı değerlendirir (Claude).
// Yalnız akademiye giriş yapmış etkin kullanıcılar kullanabilir.
// ANTHROPIC_API_KEY Supabase'te fonksiyon sırrı olarak tanımlanmadıysa 503 döner;
// akademi bu durumda kendi sabit prova akışına geçer.
import { createClient } from 'npm:@supabase/supabase-js@2';

const SITES = [
  'https://baris-kilicarslan-akademi.vercel.app',
  'https://bariskilicarslan.com',
  'https://www.bariskilicarslan.com',
];

function cors(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin && SITES.includes(origin) ? origin : SITES[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

type Msg = { w: 'ai' | 'me'; t: string };
type Scenario = { ad?: string; kisi?: string; egitim?: string; bolum?: string; ornek?: string };

const clean = (s: unknown, n: number) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(origin) });
  const reply = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors(origin), 'Content-Type': 'application/json' } });
  if (req.method !== 'POST') return reply(405, { error: 'yontem' });

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) return reply(503, { error: 'anahtar_yok' });

  // Çağıran: akademide etkin bir kullanıcı
  const secrets = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}');
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, secrets.default ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: who, error: whoErr } = await admin.auth.getUser(token);
  if (whoErr || !who?.user) return reply(401, { error: 'oturum' });
  const { data: me } = await admin.from('profiles').select('active').eq('id', who.user.id).maybeSingle();
  if (!me?.active) return reply(403, { error: 'yetki' });

  let body: { action?: string; scenario?: Scenario; messages?: Msg[] };
  try {
    body = await req.json();
  } catch {
    return reply(400, { error: 'istek' });
  }
  const action = body.action === 'score' ? 'score' : 'reply';
  const sc = body.scenario ?? {};
  const kisi = clean(sc.kisi, 60) || 'Müşteri', ad = clean(sc.ad, 120), egitim = clean(sc.egitim, 120), bolum = clean(sc.bolum, 200);
  const msgs = (Array.isArray(body.messages) ? body.messages : [])
    .slice(-30)
    .map((m) => ({ w: m.w === 'me' ? 'me' : 'ai', t: clean(m.t, 800) } as Msg))
    .filter((m) => m.t);
  if (!msgs.length) return reply(400, { error: 'istek' });

  const model = Deno.env.get('BARIS_AI_MODEL') ?? 'claude-sonnet-5-5';
  let system: string;
  let messages: { role: 'user' | 'assistant'; content: string }[];

  if (action === 'reply') {
    system = [
      `Sen Barış Kılıçarslan'ın Masterclass Akademi'sinde gayrimenkul danışmanlarına satış provası yaptıran bir yapay zekâsın.`,
      `Bu provada ${kisi} adlı müşteriyi oynuyorsun. Senaryo: ${ad}. İlgili eğitim: ${egitim}${bolum ? ' (' + bolum + ')' : ''}.`,
      `Kurallar: Türkçe konuş. Gerçek bir müşteri gibi doğal ve kısa cevap ver; en fazla üç cümle.`,
      `Danışman iyi bir soru sorarsa asıl isteğini ve kaygını aç. Boş vaatlere ve hemen yapılan indirime ikna olma.`,
      `Danışman değeri somut anlatır ve tarihli bir sonraki adım önerirse yumuşa ve adımı kabul et.`,
      `Rolden çıkma, yapay zekâ olduğunu söyleme, değerlendirme ya da öneri yazma.`,
    ].join(' ');
    // Konuşma müşteriyle başlar; API ilk mesajın kullanıcıdan gelmesini ister.
    const conv: { role: 'user' | 'assistant'; content: string }[] = [
      { role: 'user', content: 'Prova başlıyor. Müşteri olarak ilk sözünü söyle; ardından danışman grubunun cevapları gelecek.' },
    ];
    for (const m of msgs) {
      const role = m.w === 'ai' ? 'assistant' : 'user';
      const last = conv[conv.length - 1];
      if (last.role === role) last.content += '\n' + m.t;
      else conv.push({ role, content: m.t });
    }
    if (conv[conv.length - 1].role !== 'user') return reply(400, { error: 'sira' });
    messages = conv;
  } else {
    system = [
      `Barış Kılıçarslan'ın satış eğitmeni gözüyle bir gayrimenkul satış provasını değerlendiriyorsun.`,
      `Ölçütler: soru sorup müşterinin asıl isteğini açmak; cevabı somut değere ve plana bağlamak; indirimle başlamamak;`,
      `müşterinin kaygısını kabul etmek; konuşmayı tarihli bir sonraki adımla bitirmek.`,
      `Yalnız şu biçimde JSON döndür, başka hiçbir şey yazma:`,
      `{"p": 0-100 arası puan, "g": ["en fazla iki güçlü yan"], "d": ["en fazla iki geliştirilecek nokta"], "ornek": "bir dahaki sefere denenebilecek tek cümle"}.`,
      `Türkçe, kısa ve somut yaz.`,
    ].join(' ');
    const transcript = msgs.map((m) => (m.w === 'ai' ? `${kisi} (müşteri): ` : 'Danışman grubu: ') + m.t).join('\n');
    messages = [{ role: 'user', content: `Senaryo: ${ad}. İlgili eğitim: ${egitim}.\n\nProva:\n${transcript}` }];
  }

  let text = '';
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model, max_tokens: action === 'reply' ? 300 : 600, system, messages }),
    });
    if (!r.ok) return reply(502, { error: 'yapay_zeka', status: r.status });
    const data = await r.json();
    text = (data?.content ?? []).filter((c: { type: string }) => c.type === 'text').map((c: { text: string }) => c.text).join('').trim();
  } catch {
    return reply(502, { error: 'yapay_zeka' });
  }
  if (!text) return reply(502, { error: 'bos' });

  if (action === 'reply') return reply(200, { text: text.slice(0, 1200) });
  const m = text.match(/\{[\s\S]*\}/);
  try {
    const j = JSON.parse(m ? m[0] : text);
    return reply(200, {
      p: Math.max(0, Math.min(100, Math.round(Number(j.p) || 0))),
      g: (Array.isArray(j.g) ? j.g : []).slice(0, 2).map((x: unknown) => clean(x, 240)),
      d: (Array.isArray(j.d) ? j.d : []).slice(0, 2).map((x: unknown) => clean(x, 240)),
      ornek: clean(j.ornek, 300),
    });
  } catch {
    return reply(502, { error: 'bicim' });
  }
});
