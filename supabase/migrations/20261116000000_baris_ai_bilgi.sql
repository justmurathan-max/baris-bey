-- Barış AI: bilgi tabanı ve kullanım kaydı
--
-- ai_knowledge: Barış Kılıçarslan'ın kitaplarından ve Masterclass eğitimlerinden çıkarılan
-- yöntem özeti. İçerik depoda durmaz; satırlar ayrı, özel bir dosyayla yüklenir.
-- Anahtarlar: "cekirdek", "egitim:<eğitim>", "rol:<senaryo>", "olcut:<senaryo>".
-- Tabloyu yalnız baris-ai fonksiyonu (service_role) okur. Satır kuralı açık, politika yok:
-- tarayıcıdan gelen hiçbir istek (anon, authenticated) tek satır göremez.
--
-- ai_usage: her Barış AI çağrısı için bir satır; konuşmanın içeriği tutulmaz, yalnız sayaçlar.
-- Fonksiyon kullanıcı başına günlük sınırı buradan sayar. Merkez okur, başkası göremez.

begin;

create table public.ai_knowledge (
  key text primary key check (key ~ '^[a-z0-9:_-]{2,60}$'),
  title text not null default '' check (length(title) <= 200),
  body text not null check (length(body) between 1 and 200000),
  updated_at timestamptz not null default now()
);
alter table public.ai_knowledge enable row level security;
revoke all on public.ai_knowledge from anon, authenticated;
grant all on public.ai_knowledge to service_role;
create trigger set_updated_at before update on public.ai_knowledge
  for each row execute function private.set_updated_at();

create table public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  action text not null check (action in ('reply', 'score', 'ask')),
  scenario text check (scenario ~ '^[a-z0-9]{2,20}$'),
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cache_read_tokens integer not null default 0,
  cache_write_tokens integer not null default 0,
  created_at timestamptz not null default now()
);
create index ai_usage_user_time on public.ai_usage (user_id, created_at desc);
alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;
grant select on public.ai_usage to authenticated;
grant all on public.ai_usage to service_role;
grant usage, select on sequence public.ai_usage_id_seq to service_role;
create policy "ai kullanımı: merkez okur" on public.ai_usage for select to authenticated
  using ((select private.is_merkez()));

commit;
