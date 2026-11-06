-- Sitedeki satın almalar (online eğitim setleri ve kitap).
-- Satırları yalnız `odeme` Edge Function'ı (gizli anahtarla) yazar; tarayıcıdan doğrudan erişim yok.
-- Merkez yöneticisi okur ve günceller (iade, kargo takip notu vb.).

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  no text not null unique check (no ~ '^BK[0-9A-Z]{8,20}$'),
  access_key text not null check (length(access_key) = 32),
  status text not null default 'bekliyor' check (status in ('bekliyor', 'odendi', 'basarisiz', 'iptal', 'iade')),
  provider text check (provider in ('paytr', 'iyzico')),
  provider_ref text check (length(provider_ref) <= 100),
  return_url text check (length(return_url) <= 200),
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  shipping numeric(12, 2) not null default 0 check (shipping >= 0),
  total numeric(12, 2) not null check (total > 0),
  paid_total numeric(12, 2),
  currency text not null default 'TRY',
  buyer jsonb not null check (jsonb_typeof(buyer) = 'object'),
  consents jsonb not null check (jsonb_typeof(consents) = 'object'),
  raw jsonb not null default '{}' check (jsonb_typeof(raw) = 'object'),
  ops jsonb not null default '{}' check (jsonb_typeof(ops) = 'object'),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.orders is 'Site satın almaları. buyer: alıcı ve fatura; consents: ön bilgilendirme ve sözleşme onayı (zaman, sürüm, IP), ticari ileti tercihi; raw: ödeme kuruluşunun son yanıtı (kart bilgisi yok); ops: ekip notları (erişim verildi, kargo takip no).';
create index orders_created_at on public.orders (created_at desc);
create index orders_status on public.orders (status);

alter table public.orders enable row level security;
grant select, update on public.orders to authenticated;
grant all on public.orders to service_role;
create policy "siparis: merkez okur" on public.orders for select to authenticated
  using ((select private.is_merkez()));
create policy "siparis: merkez günceller" on public.orders for update to authenticated
  using ((select private.is_merkez())) with check ((select private.is_merkez()));
