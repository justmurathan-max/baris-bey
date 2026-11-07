-- Eş zamanlı oturum sınırı, merkez ayarları ve yeni eğitim taslakları
--
-- Oturum: her tarayıcı oturumu (Supabase Auth'un session_id'si) user_sessions'ta bir satırdır.
-- Akademi girişte ve dakikada bir session_open çağırır. Yeni oturum açılınca kullanıcının
-- açık oturumlarından sınırı aşan en eskileri kapanır; kapanan cihaz bir sonraki yoklamada
-- çıkış yapar. Kapanan oturumun yenileme anahtarı da auth.sessions'tan silinir (izin varsa),
-- böylece değiştirilmiş bir istemci de en geç erişim anahtarının süresi dolunca düşer.
-- Satırlar yalnız bu fonksiyonlarla yazılır; istemci tabloyu doğrudan değiştiremez.

begin;

-- Ayarlar ---------------------------------------------------------------------

create table public.settings (
  key text primary key check (key ~ '^[a-z_]{2,40}$'),
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);
alter table public.settings enable row level security;
grant select, insert, update on public.settings to authenticated;
create policy "ayar: giriş yapan okur" on public.settings for select to authenticated using (true);
create policy "ayar: merkez ekler" on public.settings for insert to authenticated
  with check ((select private.is_merkez()) and key <> 'concurrent_sessions');
create policy "ayar: merkez günceller" on public.settings for update to authenticated
  using ((select private.is_merkez()) and key <> 'concurrent_sessions')
  with check ((select private.is_merkez()) and key <> 'concurrent_sessions');
insert into public.settings (key, value) values ('concurrent_sessions', '1') on conflict (key) do nothing;

create or replace function private.session_limit() returns integer
language sql stable security definer set search_path = '' as $$
  select coalesce((select case when jsonb_typeof(s.value) = 'number' then greatest(1, least(2, (s.value)::integer)) end
                     from public.settings s where s.key = 'concurrent_sessions'), 1)
$$;

-- Oturumlar -------------------------------------------------------------------

alter table public.user_sessions
  add column auth_session_id uuid,
  add column ended_reason text check (ended_reason in ('cikis', 'sinir', 'merkez', 'kapatildi'));
create unique index user_sessions_auth_session on public.user_sessions (auth_session_id) where auth_session_id is not null;
create index user_sessions_open on public.user_sessions (user_id, created_at desc) where ended_at is null;

-- İstemci okur ama yazamaz; açma ve kapatma aşağıdaki fonksiyonlarla.
drop policy if exists "oturum: kendisi açar" on public.user_sessions;
drop policy if exists "oturum: kendisi ya da merkez günceller" on public.user_sessions;
revoke insert, update, delete on public.user_sessions from authenticated;

-- Kapanan oturumların yenileme anahtarlarını geçersiz kılar. auth şemasına yazma izni
-- yoksa sessizce geçer: oturum istemcide yine kapanır.
create or replace function private.revoke_auth_sessions(p_ids uuid[]) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if p_ids is null or cardinality(p_ids) = 0 then return; end if;
  begin
    delete from auth.sessions where id = any (p_ids);
  exception when others then
    null;
  end;
end $$;

-- Girişte ve yoklamada: oturumu kaydeder ya da kapanmışsa söyler.
create or replace function public.session_open(p_device text default null)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_sid uuid;
  v_row public.user_sessions;
  v_limit integer := private.session_limit();
  v_ids uuid[];
begin
  if v_uid is null then raise exception 'giris_yok' using errcode = '28000'; end if;
  begin
    v_sid := nullif((select auth.jwt()) ->> 'session_id', '')::uuid;
  exception when others then
    v_sid := null;
  end;
  -- Oturum kimliği yoksa izlenemez; kullanıcıyı engelleme.
  if v_sid is null or not exists (select 1 from public.profiles p where p.id = v_uid and p.active) then
    return jsonb_build_object('state', 'open', 'id', null, 'limit', v_limit);
  end if;
  perform pg_advisory_xact_lock(hashtextextended('oturum:' || v_uid::text, 0));
  select * into v_row from public.user_sessions s where s.auth_session_id = v_sid;
  if found then
    if v_row.user_id <> v_uid then raise exception 'oturum_uyusmuyor' using errcode = '42501'; end if;
    if v_row.ended_at is not null then
      return jsonb_build_object('state', 'closed', 'reason', v_row.ended_reason, 'id', v_row.id, 'limit', v_limit);
    end if;
    update public.user_sessions s
       set last_seen_at = now(), device = coalesce(nullif(left(btrim(p_device), 200), ''), s.device)
     where s.id = v_row.id;
    return jsonb_build_object('state', 'open', 'id', v_row.id, 'limit', v_limit);
  end if;
  insert into public.user_sessions (user_id, device, auth_session_id)
  values (v_uid, nullif(left(btrim(p_device), 200), ''), v_sid)
  returning * into v_row;
  -- Sınırı aşan en eski açık oturumlar kapanır (yeni açılan hep kalır).
  with fazla as (
    select s.id from public.user_sessions s
     where s.user_id = v_uid and s.ended_at is null
     order by (s.id = v_row.id) desc, s.created_at desc
     offset v_limit
  ), kapanan as (
    update public.user_sessions u set ended_at = now(), ended_reason = 'sinir'
      from fazla where u.id = fazla.id
    returning u.auth_session_id
  )
  select coalesce(array_agg(k.auth_session_id) filter (where k.auth_session_id is not null), '{}') into v_ids from kapanan k;
  perform private.revoke_auth_sessions(v_ids);
  return jsonb_build_object('state', 'open', 'id', v_row.id, 'limit', v_limit, 'closed', cardinality(v_ids));
end $$;

-- Çıkışta (p_id boş: bu cihaz) ya da listeden (p_id: kendi başka oturumu ya da merkez).
create or replace function public.session_close(p_id uuid default null)
returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_sid uuid;
  v_row public.user_sessions;
begin
  if v_uid is null then return false; end if;
  if p_id is null then
    begin
      v_sid := nullif((select auth.jwt()) ->> 'session_id', '')::uuid;
    exception when others then
      v_sid := null;
    end;
    if v_sid is null then return false; end if;
    update public.user_sessions s set ended_at = now(), ended_reason = 'cikis'
     where s.auth_session_id = v_sid and s.user_id = v_uid and s.ended_at is null;
    return found;
  end if;
  select * into v_row from public.user_sessions s where s.id = p_id;
  if not found or v_row.ended_at is not null then return false; end if;
  if v_row.user_id <> v_uid and not (select private.is_merkez()) then
    raise exception 'yetki_yok' using errcode = '42501';
  end if;
  update public.user_sessions s
     set ended_at = now(), ended_reason = case when v_row.user_id = v_uid then 'kapatildi' else 'merkez' end
   where s.id = p_id;
  perform private.revoke_auth_sessions(array_remove(array[v_row.auth_session_id], null));
  return true;
end $$;

-- Merkez: eş zamanlı oturum sınırı. Yeni sınır hemen uygulanır; çağıranın bu cihazı kalır.
create or replace function public.set_session_limit(p_n integer)
returns integer
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_sid uuid;
  v_ids uuid[];
  v_n integer;
begin
  if not (select private.is_merkez()) then raise exception 'yetki_yok' using errcode = '42501'; end if;
  if p_n is null or p_n not in (1, 2) then raise exception 'gecersiz_sinir' using errcode = '22023'; end if;
  begin
    v_sid := nullif((select auth.jwt()) ->> 'session_id', '')::uuid;
  exception when others then
    v_sid := null;
  end;
  insert into public.settings (key, value, updated_at, updated_by)
  values ('concurrent_sessions', to_jsonb(p_n), now(), v_uid)
  on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by;
  with sira as (
    select s.id, row_number() over (partition by s.user_id
                                     order by (s.auth_session_id is not distinct from v_sid and v_sid is not null) desc, s.created_at desc) as n
      from public.user_sessions s
     where s.ended_at is null
  ), kapanan as (
    update public.user_sessions u set ended_at = now(), ended_reason = 'sinir'
      from sira where u.id = sira.id and sira.n > p_n
    returning u.auth_session_id
  )
  select count(*), coalesce(array_agg(k.auth_session_id) filter (where k.auth_session_id is not null), '{}')
    into v_n, v_ids from kapanan k;
  perform private.revoke_auth_sessions(v_ids);
  return v_n;
end $$;

-- Merkez: açık oturumlar (kişi, rol, ofis, cihaz, son görülme).
create or replace function public.active_sessions()
returns table (id uuid, user_id uuid, full_name text, email text, role text, is_mentor boolean, office_name text,
               device text, created_at timestamptz, last_seen_at timestamptz, is_current boolean)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_sid uuid;
begin
  if not (select private.is_merkez()) then raise exception 'yetki_yok' using errcode = '42501'; end if;
  begin
    v_sid := nullif((select auth.jwt()) ->> 'session_id', '')::uuid;
  exception when others then
    v_sid := null;
  end;
  return query
    select s.id, s.user_id, p.full_name, p.email, p.role, p.is_mentor, o.name, s.device, s.created_at, s.last_seen_at,
           coalesce(s.auth_session_id = v_sid, false)
      from public.user_sessions s
      join public.profiles p on p.id = s.user_id
      left join public.offices o on o.id = p.office_id
     where s.ended_at is null
     order by s.last_seen_at desc
     limit 500;
end $$;

revoke execute on function private.revoke_auth_sessions(uuid[]) from public, anon, authenticated;
revoke execute on function public.session_open(text), public.session_close(uuid), public.set_session_limit(integer),
  public.active_sessions() from public, anon;
grant execute on function public.session_open(text), public.session_close(uuid), public.set_session_limit(integer),
  public.active_sessions() to authenticated;

-- Yeni eğitim taslakları (merkez) ------------------------------------------------

create table public.training_drafts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) between 3 and 160),
  result text check (length(result) <= 300),
  chapters text[] not null default '{}' check (cardinality(chapters) <= 60),
  included boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null
);
alter table public.training_drafts enable row level security;
grant select, insert, update, delete on public.training_drafts to authenticated;
create policy "taslak: merkez okur" on public.training_drafts for select to authenticated using ((select private.is_merkez()));
create policy "taslak: merkez ekler" on public.training_drafts for insert to authenticated with check ((select private.is_merkez()));
create policy "taslak: merkez günceller" on public.training_drafts for update to authenticated
  using ((select private.is_merkez())) with check ((select private.is_merkez()));
create policy "taslak: merkez siler" on public.training_drafts for delete to authenticated using ((select private.is_merkez()));

commit;
