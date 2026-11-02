// Merkez yöneticisinin açtığı ofise broker ve mentor davetini gönderir ya da yeniden gönderir.
// Çağıranın oturumu doğrulanır; yalnız etkin merkez yöneticisi kullanabilir.
// Gizli anahtar yalnız Supabase'in kendi ortamından okunur; depoda ve tarayıcıda yoktur.
import { createClient } from 'npm:@supabase/supabase-js@2';

const SITES = [
  'https://baris-kilicarslan-akademi.vercel.app',
  'https://bariskilicarslan.com',
  'https://www.bariskilicarslan.com',
];
const ROLES = ['broker', 'mentor'];
const MAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type Result = { email: string; role: string; ok: boolean; reason?: string };

function cors(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin && SITES.includes(origin) ? origin : SITES[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(origin) });
  const reply = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors(origin), 'Content-Type': 'application/json' } });
  if (req.method !== 'POST') return reply(405, { error: 'yontem' });

  const secrets = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}');
  const key = secrets.default ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Çağıran: geçerli oturum ve etkin merkez yöneticisi
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: who, error: whoErr } = await admin.auth.getUser(token);
  if (whoErr || !who?.user) return reply(401, { error: 'oturum' });
  const { data: me } = await admin.from('profiles').select('role, active').eq('id', who.user.id).maybeSingle();
  if (!me || !me.active || me.role !== 'merkez') return reply(403, { error: 'yetki' });

  let body: {
    office_id?: string;
    resend?: boolean;
    invites?: { email?: string; role?: string; full_name?: string }[];
  };
  try {
    body = await req.json();
  } catch {
    return reply(400, { error: 'istek' });
  }
  const { data: office } = await admin.from('offices').select('id').eq('id', String(body.office_id ?? '')).maybeSingle();
  if (!office) return reply(404, { error: 'ofis' });

  const redirectTo = (origin && SITES.includes(origin) ? origin : SITES[0]) + '/akademi.html';
  const results: Result[] = [];

  // Daveti gönderir; başarısızsa nedenini döner
  async function send(email: string, role: string): Promise<string | null> {
    const { error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
    if (!error) {
      results.push({ email, role, ok: true });
      return null;
    }
    const code = (error as { code?: string }).code ?? '';
    const reason = code === 'email_exists' || /already been registered/i.test(error.message)
      ? 'kayitli'
      : error.status === 429 || /rate limit/i.test(error.message)
      ? 'limit'
      : 'mail';
    results.push({ email, role, ok: false, reason });
    return reason;
  }

  if (body.resend) {
    // Henüz girmemiş herkese yeniden gönder
    const { data: inv } = await admin.from('invitations').select('email, role, user_id').eq('office_id', office.id);
    for (const i of inv ?? []) {
      if (i.user_id) {
        const { data: u } = await admin.auth.admin.getUserById(i.user_id);
        if (u?.user?.email_confirmed_at) continue;
      }
      await send(i.email, i.role);
    }
  } else {
    for (const it of (body.invites ?? []).slice(0, 4)) {
      const email = String(it.email ?? '').trim().toLowerCase();
      const role = String(it.role ?? '');
      const name = String(it.full_name ?? '').trim().slice(0, 120) || null;
      if (!MAIL.test(email) || !ROLES.includes(role)) {
        results.push({ email, role, ok: false, reason: 'gecersiz' });
        continue;
      }
      // Aynı adrese açık kalmış eski davet varsa yerine yenisi
      await admin.from('invitations').delete().is('user_id', null).eq('email', email);
      const { error: insErr } = await admin.from('invitations')
        .insert({ office_id: office.id, email, role, full_name: name, invited_by: who.user.id });
      if (insErr) {
        results.push({ email, role, ok: false, reason: 'kayit' });
        continue;
      }
      const reason = await send(email, role);
      // Zaten hesabı olan adrese davet kaydı bırakma
      if (reason === 'kayitli') await admin.from('invitations').delete().is('user_id', null).eq('email', email);
    }
  }

  if (results.some((r) => r.ok)) {
    await admin.from('offices').update({ invited_at: new Date().toISOString() }).eq('id', office.id);
  }
  return reply(200, { results });
});
