-- Klasik erişimler: 2017'den beri sınırsız erişimle satılan Satışın Şifreleri (ss) ve
-- Gayrimenkulün Usta Satışçıları (gus) online setlerinin kullanıcıları.
-- Liste merkezindir: elle eklenir ya da eski sitedeki liste içe aktarılır. Haklar yalnız
-- satın alınan ürünleri kapsar; yeni eğitimlere erişim vermez. Kişilerin izleyeceği yer
-- (akademi hesabı, ayrı sayfa) ayrıca karara bağlanacak; bu tablo hak sahiplerinin kaydıdır.

begin;

create table public.legacy_access (
  id uuid primary key default gen_random_uuid(),
  full_name text not null default '' check (length(full_name) <= 200),
  email text check (email is null or (position('@' in email) > 1 and length(email) <= 320)),
  phone text check (length(phone) <= 40),
  products text[] not null default '{}' check (products <@ array['ss', 'gus']::text[]),
  source text not null default 'elle' check (source in ('eski_site', 'magaza', 'elle')),
  purchased_on date,
  note text check (length(note) <= 1000),
  status text not null default 'bekliyor' check (status in ('bekliyor', 'acildi')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (email is not null or phone is not null)
);
create unique index legacy_access_email on public.legacy_access (lower(email)) where email is not null;
create trigger legacy_access_updated_at before update on public.legacy_access
  for each row execute function private.set_updated_at();

alter table public.legacy_access enable row level security;
grant select, insert, update, delete on public.legacy_access to authenticated;
create policy "klasik: merkez okur" on public.legacy_access for select to authenticated using ((select private.is_merkez()));
create policy "klasik: merkez ekler" on public.legacy_access for insert to authenticated with check ((select private.is_merkez()));
create policy "klasik: merkez günceller" on public.legacy_access for update to authenticated
  using ((select private.is_merkez())) with check ((select private.is_merkez()));
create policy "klasik: merkez siler" on public.legacy_access for delete to authenticated using ((select private.is_merkez()));

-- Listeyi içe aktarma: aynı e-posta varsa ürünler birleşir, boş alanlar dolar.
-- p_rows: [{full_name, email, phone, products:[...], purchased_on:'YYYY-MM-DD', note}]
create or replace function public.legacy_import(p_rows jsonb, p_source text default 'eski_site')
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  r jsonb;
  v_email text; v_phone text; v_name text; v_products text[]; v_date date; v_note text;
  v_new integer := 0; v_upd integer := 0; v_skip integer := 0;
  v_ins boolean;
begin
  if not (select private.is_merkez()) then raise exception 'yetki_yok' using errcode = '42501'; end if;
  if p_source not in ('eski_site', 'magaza', 'elle') then raise exception 'gecersiz_kaynak' using errcode = '22023'; end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 5000 then raise exception 'gecersiz_liste' using errcode = '22023'; end if;
  for r in select * from jsonb_array_elements(p_rows) loop
    v_email := nullif(lower(btrim(r ->> 'email')), '');
    v_phone := nullif(left(btrim(r ->> 'phone'), 40), '');
    v_name := left(coalesce(btrim(r ->> 'full_name'), ''), 200);
    v_note := nullif(left(btrim(r ->> 'note'), 1000), '');
    select coalesce(array_agg(distinct x), '{}') into v_products
      from jsonb_array_elements_text(case when jsonb_typeof(r -> 'products') = 'array' then r -> 'products' else '[]'::jsonb end) x
     where x in ('ss', 'gus');
    begin
      v_date := nullif(r ->> 'purchased_on', '')::date;
    exception when others then
      v_date := null;
    end;
    if (v_email is null and v_phone is null) or (v_email is not null and (position('@' in v_email) < 2 or length(v_email) > 320)) then
      v_skip := v_skip + 1;
      continue;
    end if;
    if v_email is not null then
      insert into public.legacy_access as l (full_name, email, phone, products, source, purchased_on, note)
      values (v_name, v_email, v_phone, v_products, p_source, v_date, v_note)
      on conflict (lower(email)) where email is not null do update set
        full_name = case when l.full_name = '' then excluded.full_name else l.full_name end,
        phone = coalesce(l.phone, excluded.phone),
        products = (select coalesce(array_agg(distinct p order by p), '{}') from unnest(l.products || excluded.products) p),
        purchased_on = coalesce(least(l.purchased_on, excluded.purchased_on), l.purchased_on, excluded.purchased_on),
        note = coalesce(l.note, excluded.note)
      returning (xmax = 0) into v_ins;
    else
      insert into public.legacy_access (full_name, email, phone, products, source, purchased_on, note)
      values (v_name, null, v_phone, v_products, p_source, v_date, v_note);
      v_ins := true;
    end if;
    if v_ins then v_new := v_new + 1; else v_upd := v_upd + 1; end if;
  end loop;
  return jsonb_build_object('added', v_new, 'updated', v_upd, 'skipped', v_skip);
end $$;
revoke execute on function public.legacy_import(jsonb, text) from public, anon;
grant execute on function public.legacy_import(jsonb, text) to authenticated;

insert into public.settings (key, value) values ('legacy_steps', '[false, false, false, false]') on conflict (key) do nothing;

commit;
