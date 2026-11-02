-- Barış Kılıçarslan Masterclass Akademi: temel veritabanı (v1)
--
-- Roller: merkez (Barış Bey'in ekibi), broker ve mentor (ofis personeli).
-- Danışmanların hesabı yok; kayıtlarını ofis personeli tutar.
-- Her ofis kaydı office_id taşır. Satır kuralları (RLS) ile ofis personeli yalnız
-- kendi ofisini görür; merkez hepsini okur ama mentorun özel puanlarını göremez.
-- Kayıtlar birbirine (id, office_id) çiftiyle bağlanır: bir ofis başka bir ofisin
-- kaydına bağlantı kuramaz.
-- Projede yeni tablolar Data API'ye kendiliğinden açılmıyor; her tablonun yetkisi
-- bu dosyada açıkça veriliyor. Yeni tablo ekleyen her göç kendi yetkisini de vermeli.

begin;

create schema if not exists private;
grant usage on schema private to authenticated, service_role;

-- Yardımcı: updated_at --------------------------------------------------------

create or replace function private.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Eğitimler -------------------------------------------------------------------

create table public.trainings (
  id text primary key,
  title text not null,
  short_title text,
  sort smallint not null default 0,
  in_masterclass boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Ofisler ve kişiler ----------------------------------------------------------

create table public.offices (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  tier text check (tier in ('1–25', '26–75', '76–99', '100+')),
  status text not null default 'davet' check (status in ('davet', 'aktif', 'pasif')),
  membership_start date,
  membership_end date,
  invited_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (membership_end is null or membership_start is null or membership_end > membership_start)
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  office_id uuid references public.offices (id) on delete restrict,
  role text not null check (role in ('merkez', 'broker', 'mentor')),
  is_mentor boolean not null default false,
  full_name text not null default '',
  email text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (role = 'merkez' or office_id is not null)
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  office_id uuid references public.offices (id) on delete cascade,
  email text not null check (position('@' in email) > 1),
  role text not null check (role in ('merkez', 'broker', 'mentor')),
  full_name text,
  invited_by uuid references public.profiles (id) on delete set null,
  invited_at timestamptz not null default now(),
  user_id uuid references auth.users (id) on delete set null,
  linked_at timestamptz,
  check (role = 'merkez' or office_id is not null)
);
create unique index invitations_open_email on public.invitations (lower(email)) where user_id is null;

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices (id) on delete cascade,
  name text not null,
  description text,
  color text,
  sort smallint not null default 0,
  created_at timestamptz not null default now(),
  unique (id, office_id)
);

create table public.consultants (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices (id) on delete cascade,
  group_id uuid,
  full_name text not null,
  joined_on date,
  left_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, office_id),
  foreign key (group_id, office_id) references public.groups (id, office_id) on delete set null (group_id)
);

-- Eğitim oturumları -----------------------------------------------------------

create table public.runs (
  id uuid primary key default gen_random_uuid(),
  office_id uuid not null references public.offices (id) on delete cascade,
  training_id text not null references public.trainings (id),
  group_id uuid,
  template text not null check (template in ('tek', 'iki', 'yarim')),
  days date[] not null check (cardinality(days) between 1 and 2),
  status text not null default 'plan' check (status in ('plan', 'live', 'done', 'iptal')),
  days_done smallint not null default 0 check (days_done between 0 and 2),
  makeup boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, office_id),
  check ((template = 'iki') = (cardinality(days) = 2)),
  foreign key (group_id, office_id) references public.groups (id, office_id) on delete set null (group_id)
);

create table public.run_members (
  run_id uuid not null,
  consultant_id uuid not null,
  office_id uuid not null,
  primary key (run_id, consultant_id),
  foreign key (run_id, office_id) references public.runs (id, office_id) on delete cascade,
  foreign key (consultant_id, office_id) references public.consultants (id, office_id) on delete cascade
);

create table public.attendance (
  run_id uuid not null,
  consultant_id uuid not null,
  day_index smallint not null check (day_index between 0 and 1),
  office_id uuid not null,
  present boolean not null,
  marked_by uuid references public.profiles (id) on delete set null,
  marked_at timestamptz not null default now(),
  primary key (run_id, consultant_id, day_index),
  foreign key (run_id, office_id) references public.runs (id, office_id) on delete cascade,
  foreign key (consultant_id, office_id) references public.consultants (id, office_id) on delete cascade
);

create table public.makeups (
  run_id uuid not null,
  consultant_id uuid not null,
  day_index smallint not null check (day_index between 0 and 1),
  makeup_run_id uuid not null,
  office_id uuid not null,
  primary key (run_id, consultant_id, day_index),
  foreign key (run_id, office_id) references public.runs (id, office_id) on delete cascade,
  foreign key (makeup_run_id, office_id) references public.runs (id, office_id) on delete cascade,
  foreign key (consultant_id, office_id) references public.consultants (id, office_id) on delete cascade
);

create table public.coaching (
  run_id uuid not null,
  consultant_id uuid not null,
  office_id uuid not null,
  done boolean not null default true,
  marked_at timestamptz not null default now(),
  primary key (run_id, consultant_id),
  foreign key (run_id, office_id) references public.runs (id, office_id) on delete cascade,
  foreign key (consultant_id, office_id) references public.consultants (id, office_id) on delete cascade
);

create table public.run_progress (
  run_id uuid not null,
  step_index smallint not null check (step_index >= 0),
  office_id uuid not null,
  completed_at timestamptz not null default now(),
  primary key (run_id, step_index),
  foreign key (run_id, office_id) references public.runs (id, office_id) on delete cascade
);

-- Gelişim ve Kazanç Aktiviteleri ---------------------------------------------

create table public.activity_templates (
  office_id uuid not null references public.offices (id) on delete cascade,
  training_id text not null references public.trainings (id),
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (office_id, training_id)
);

create table public.run_activities (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null,
  office_id uuid not null,
  sort smallint not null default 0,
  kind text not null,
  body text not null,
  due_on date,
  unique (id, office_id),
  foreign key (run_id, office_id) references public.runs (id, office_id) on delete cascade
);

create table public.activity_results (
  activity_id uuid not null,
  consultant_id uuid not null,
  office_id uuid not null,
  done boolean not null default true,
  approved_by uuid references public.profiles (id) on delete set null,
  approved_at timestamptz not null default now(),
  primary key (activity_id, consultant_id),
  foreign key (activity_id, office_id) references public.run_activities (id, office_id) on delete cascade,
  foreign key (consultant_id, office_id) references public.consultants (id, office_id) on delete cascade
);

-- Değerlendirme ve sonuçlar ---------------------------------------------------

create table public.private_scores (
  run_id uuid not null,
  consultant_id uuid not null,
  office_id uuid not null,
  scores smallint[] not null check (cardinality(scores) = 4 and 1 <= all (scores) and 5 >= all (scores)),
  note text not null default '' check (length(note) <= 500),
  scored_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (run_id, consultant_id),
  foreign key (run_id, office_id) references public.runs (id, office_id) on delete cascade,
  foreign key (consultant_id, office_id) references public.consultants (id, office_id) on delete cascade
);

create table public.needs_assessments (
  consultant_id uuid not null,
  training_id text not null references public.trainings (id),
  office_id uuid not null,
  pre smallint[] check (pre is null or (1 <= all (pre) and 5 >= all (pre))),
  pre_on date,
  post smallint[] check (post is null or (1 <= all (post) and 5 >= all (post))),
  post_on date,
  updated_at timestamptz not null default now(),
  primary key (consultant_id, training_id),
  foreign key (consultant_id, office_id) references public.consultants (id, office_id) on delete cascade
);

create table public.business_results (
  consultant_id uuid not null,
  period date not null check (extract(day from period) = 1),
  office_id uuid not null,
  client_meetings integer not null default 0 check (client_meetings >= 0),
  price_analyses integer not null default 0 check (price_analyses >= 0),
  new_listings integer not null default 0 check (new_listings >= 0),
  closed_deals integer not null default 0 check (closed_deals >= 0),
  updated_at timestamptz not null default now(),
  primary key (consultant_id, period),
  foreign key (consultant_id, office_id) references public.consultants (id, office_id) on delete cascade
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  consultant_id uuid not null,
  office_id uuid not null,
  shared_by uuid references public.profiles (id) on delete set null,
  shared_at timestamptz not null default now(),
  broker_comment text check (length(broker_comment) <= 2000),
  commented_by uuid references public.profiles (id) on delete set null,
  commented_at timestamptz,
  foreign key (consultant_id, office_id) references public.consultants (id, office_id) on delete cascade
);

-- Sertifikalar ----------------------------------------------------------------

-- Numara MA-YY-XXXXXX: sıra numarası değil, tahmin edilemeyen altı karakter.
-- Böylece doğrulama sayfasından numara deneyerek kişi listesi çıkarılamaz.
create or replace function private.next_certificate_no() returns text
language plpgsql volatile security definer set search_path = '' as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  b bytea;
  code text;
  candidate text;
begin
  loop
    b := uuid_send(gen_random_uuid());
    code := '';
    for i in 0..5 loop
      code := code || substr(alphabet, (get_byte(b, i) % 32) + 1, 1);
    end loop;
    candidate := 'MA-' || to_char(now() at time zone 'Europe/Istanbul', 'YY') || '-' || code;
    exit when not exists (select 1 from public.certificates c where c.no = candidate);
  end loop;
  return candidate;
end $$;

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  no text not null unique default private.next_certificate_no(),
  office_id uuid not null references public.offices (id) on delete restrict,
  consultant_id uuid,
  holder_name text not null,
  training_id text references public.trainings (id),
  run_id uuid,
  kind text not null check (kind in ('kat', 'bas', 'mc')),
  issued_on date not null default current_date,
  issued_by uuid references public.profiles (id) on delete set null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check ((kind = 'mc') = (training_id is null)),
  foreign key (consultant_id, office_id) references public.consultants (id, office_id) on delete set null (consultant_id),
  foreign key (run_id, office_id) references public.runs (id, office_id) on delete set null (run_id)
);

-- Mentorun ön izlemesi ve oturumlar -------------------------------------------

create table public.mentor_previews (
  user_id uuid not null references public.profiles (id) on delete cascade,
  training_id text not null references public.trainings (id),
  step_index smallint not null check (step_index >= 0),
  completed_at timestamptz not null default now(),
  primary key (user_id, training_id, step_index)
);

create table public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  device text check (length(device) <= 200),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  ended_at timestamptz
);

-- Sitedeki formlar ------------------------------------------------------------

create table public.site_requests (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('kurumsal', 'ofis', 'davetiye', 'bulten', 'etkinlik', 'iletisim')),
  full_name text check (length(full_name) <= 200),
  email text check (length(email) <= 320),
  phone text check (length(phone) <= 40),
  company text check (length(company) <= 200),
  city text check (length(city) <= 100),
  message text check (length(message) <= 4000),
  meta jsonb not null default '{}' check (jsonb_typeof(meta) = 'object' and length(meta::text) <= 4000),
  status text not null default 'yeni' check (status in ('yeni', 'islendi', 'arsiv')),
  created_at timestamptz not null default now(),
  check (email is not null or phone is not null)
);

-- Kim olduğunu bilen yardımcılar ----------------------------------------------

create or replace function private.my_office() returns uuid
language sql stable security definer set search_path = '' as $$
  select p.office_id from public.profiles p where p.id = (select auth.uid()) and p.active
$$;

create or replace function private.is_merkez() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select p.role = 'merkez' from public.profiles p where p.id = (select auth.uid()) and p.active), false)
$$;

-- Davetle gelen kullanıcıya profil: rol ve ofis kullanıcının kendi verisinden
-- değil, merkezin açtığı davetten alınır.
create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  inv public.invitations;
begin
  select * into inv from public.invitations i
   where lower(i.email) = lower(new.email) and i.user_id is null
   order by i.invited_at desc
   limit 1;
  if found then
    insert into public.profiles (id, office_id, role, full_name, email)
    values (new.id, inv.office_id, inv.role, coalesce(inv.full_name, ''), new.email)
    on conflict (id) do nothing;
    update public.invitations set user_id = new.id, linked_at = now() where id = inv.id;
  end if;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Sertifika doğrulama: giriş yapmadan, yalnız tam numarayla ---------------------

create or replace function public.verify_certificate(p_no text)
returns table (no text, holder_name text, office_name text, training_title text, kind text, issued_on date, valid boolean)
language sql stable security definer set search_path = '' as $$
  select c.no, c.holder_name, o.name, t.title, c.kind, c.issued_on, c.revoked_at is null
    from public.certificates c
    join public.offices o on o.id = c.office_id
    left join public.trainings t on t.id = c.training_id
   where c.no = upper(btrim(p_no))
$$;

-- updated_at tetikleri --------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array['offices', 'profiles', 'consultants', 'runs', 'activity_templates',
                           'private_scores', 'needs_assessments', 'business_results'] loop
    execute format('create trigger set_updated_at before update on public.%I
                    for each row execute function private.set_updated_at()', t);
  end loop;
end $$;

-- Satır kuralları ve yetkiler --------------------------------------------------

-- Ofis kayıtları: ofis personeli kendi ofisinde okur ve yazar; merkez yalnız okur.
do $$
declare t text;
begin
  foreach t in array array['groups', 'consultants', 'runs', 'run_members', 'attendance', 'makeups',
                           'coaching', 'run_progress', 'activity_templates', 'run_activities',
                           'activity_results', 'needs_assessments', 'business_results', 'reports'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('create index on public.%I (office_id)', t);
    execute format('create policy "okuma: kendi ofisi ya da merkez" on public.%I for select to authenticated
                    using (office_id = (select private.my_office()) or (select private.is_merkez()))', t);
    execute format('create policy "ekleme: kendi ofisi" on public.%I for insert to authenticated
                    with check (office_id = (select private.my_office()))', t);
    execute format('create policy "güncelleme: kendi ofisi" on public.%I for update to authenticated
                    using (office_id = (select private.my_office()))
                    with check (office_id = (select private.my_office()))', t);
    execute format('create policy "silme: kendi ofisi" on public.%I for delete to authenticated
                    using (office_id = (select private.my_office()))', t);
  end loop;
end $$;

-- Özel puanlar: yalnız kendi ofisi; merkez göremez.
alter table public.private_scores enable row level security;
grant select, insert, update, delete on public.private_scores to authenticated;
create index on public.private_scores (office_id);
create policy "özel puan: yalnız kendi ofisi" on public.private_scores for all to authenticated
  using (office_id = (select private.my_office()))
  with check (office_id = (select private.my_office()));

-- Eğitimler: giriş yapan herkes okur, merkez yönetir.
alter table public.trainings enable row level security;
grant select, insert, update, delete on public.trainings to authenticated;
create policy "eğitim: herkes okur" on public.trainings for select to authenticated using (true);
create policy "eğitim: merkez ekler" on public.trainings for insert to authenticated
  with check ((select private.is_merkez()));
create policy "eğitim: merkez günceller" on public.trainings for update to authenticated
  using ((select private.is_merkez())) with check ((select private.is_merkez()));
create policy "eğitim: merkez siler" on public.trainings for delete to authenticated
  using ((select private.is_merkez()));

-- Ofisler: kendi ofisini okur; merkez yönetir.
alter table public.offices enable row level security;
grant select, insert, update, delete on public.offices to authenticated;
create policy "ofis: kendi ofisi ya da merkez okur" on public.offices for select to authenticated
  using (id = (select private.my_office()) or (select private.is_merkez()));
create policy "ofis: merkez ekler" on public.offices for insert to authenticated
  with check ((select private.is_merkez()));
create policy "ofis: merkez günceller" on public.offices for update to authenticated
  using ((select private.is_merkez())) with check ((select private.is_merkez()));
create policy "ofis: merkez siler" on public.offices for delete to authenticated
  using ((select private.is_merkez()));

-- Profiller: kendisi, ofis arkadaşları ve merkez okur. Kullanıcı yalnız adını
-- değiştirebilir; rol, ofis ve durum sunucu tarafında değişir.
alter table public.profiles enable row level security;
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;
create index on public.profiles (office_id);
create policy "profil: kendisi, ofisi ya da merkez okur" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or office_id = (select private.my_office()) or (select private.is_merkez()));
create policy "profil: kendi adını günceller" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Davetler: merkez yönetir.
alter table public.invitations enable row level security;
grant select, insert, update, delete on public.invitations to authenticated;
create policy "davet: merkez okur" on public.invitations for select to authenticated
  using ((select private.is_merkez()));
create policy "davet: merkez ekler" on public.invitations for insert to authenticated
  with check ((select private.is_merkez()));
create policy "davet: merkez günceller" on public.invitations for update to authenticated
  using ((select private.is_merkez())) with check ((select private.is_merkez()));
create policy "davet: merkez siler" on public.invitations for delete to authenticated
  using ((select private.is_merkez()));

-- Sertifikalar: ofis kendi sertifikasını verir ve görür; iptal merkezde.
alter table public.certificates enable row level security;
grant select, insert, update on public.certificates to authenticated;
create index on public.certificates (office_id);
create index on public.certificates (consultant_id);
create policy "sertifika: kendi ofisi ya da merkez okur" on public.certificates for select to authenticated
  using (office_id = (select private.my_office()) or (select private.is_merkez()));
create policy "sertifika: kendi ofisi verir" on public.certificates for insert to authenticated
  with check (office_id = (select private.my_office()) and revoked_at is null);
create policy "sertifika: merkez iptal eder" on public.certificates for update to authenticated
  using ((select private.is_merkez())) with check ((select private.is_merkez()));

-- Mentorun ön izlemesi: kişinin kendi kaydı.
alter table public.mentor_previews enable row level security;
grant select, insert, update, delete on public.mentor_previews to authenticated;
create policy "ön izleme: kendi kaydı" on public.mentor_previews for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Oturumlar: kişi kendi oturumunu, merkez hepsini görür ve kapatabilir.
alter table public.user_sessions enable row level security;
grant select, insert, update on public.user_sessions to authenticated;
create index on public.user_sessions (user_id);
create policy "oturum: kendisi ya da merkez okur" on public.user_sessions for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_merkez()));
create policy "oturum: kendisi açar" on public.user_sessions for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "oturum: kendisi ya da merkez günceller" on public.user_sessions for update to authenticated
  using (user_id = (select auth.uid()) or (select private.is_merkez()))
  with check (user_id = (select auth.uid()) or (select private.is_merkez()));

-- Site formları: herkes gönderir, yalnız merkez okur.
alter table public.site_requests enable row level security;
grant insert on public.site_requests to anon, authenticated;
grant select, update on public.site_requests to authenticated;
create policy "form: herkes gönderir" on public.site_requests for insert to anon, authenticated
  with check (status = 'yeni');
create policy "form: merkez okur" on public.site_requests for select to authenticated
  using ((select private.is_merkez()));
create policy "form: merkez günceller" on public.site_requests for update to authenticated
  using ((select private.is_merkez())) with check ((select private.is_merkez()));

-- Fonksiyon yetkileri
revoke all on all functions in schema private from public;
grant execute on function private.my_office(), private.is_merkez(), private.next_certificate_no() to authenticated;
grant execute on all functions in schema private to service_role;
revoke all on function public.verify_certificate(text) from public;
grant execute on function public.verify_certificate(text) to anon, authenticated, service_role;

-- Sunucu tarafı (davet, mail, sertifika PDF) için
grant all on all tables in schema public to service_role;

-- Eğitim kataloğu
insert into public.trainings (id, title, short_title, sort) values
  ('kb', 'Kişisel Başarı Prensiplerinde Ustalık', 'Kişisel Başarı', 1),
  ('mb', 'Kişisel Marka ve Müşteri Bulmada Ustalık', 'Kişisel Marka', 2),
  ('dd', 'Dolu Danışman Olmada Ustalık', 'Dolu Danışman', 3),
  ('fsbo', 'Sahibinden Satılıklarda Ustalık', 'Sahibinden Satılık', 4),
  ('pa', 'Portföy Almada Ustalık', 'Portföy Almada', 5),
  ('iu', 'İtirazlarda Ustalık', 'İtirazlar', 6),
  ('au', 'Alıcılarda Ustalık', 'Alıcılar', 7),
  ('dfi', 'Doğru Fiyatlı Portföy Almada Ustalık', 'Doğru Fiyat', 8),
  ('cl', 'İşlem Kapanışta Ustalık', 'İşlem Kapanış', 9),
  ('byu', 'Beyin Yönetiminde Ustalık', 'Beyin Yönetimi', 10);

commit;
