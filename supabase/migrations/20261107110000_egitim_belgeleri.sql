-- Eğitim belgeleri (PDF) ve ek videolar
--
-- Her eğitimde üç belge: Eğitim Notları (not), Koçluk ve İçselleştirme Soruları (koc),
-- Gelişim ve Kazanç Aktiviteleri (akt). Dosyalar Storage'da, özel "belgeler" kovasında;
-- yolu <eğitim>/<belge>-<rastgele>.pdf. Yalnız merkez yükler; merkez ve etkin ofislerin
-- personeli okur (imzalı, süreli bağlantıyla). Danışmanların hesabı yok, belgeyi mentor dağıtır.
-- Ek videolar (tanıtım, koçluk, uygulama) Vimeo'da; burada yalnız kimlikleri tutulur.

begin;

create table public.training_documents (
  training_id text not null references public.trainings (id) on delete cascade,
  kind text not null check (kind in ('not', 'koc', 'akt')),
  path text not null check (path ~ '^[a-z0-9]{1,12}/(not|koc|akt)-[0-9a-z]{8,40}\.pdf$'),
  file_name text check (length(file_name) <= 200),
  size_bytes integer check (size_bytes between 1 and 20971520),
  uploaded_at timestamptz not null default now(),
  uploaded_by uuid references public.profiles (id) on delete set null,
  primary key (training_id, kind),
  check (split_part(path, '/', 1) = training_id and split_part(split_part(path, '/', 2), '-', 1) = kind)
);
alter table public.training_documents enable row level security;
grant select, insert, update, delete on public.training_documents to authenticated;
create policy "belge: akademi okur" on public.training_documents for select to authenticated
  using ((select private.is_merkez()) or (select private.my_office()) is not null);
create policy "belge: merkez ekler" on public.training_documents for insert to authenticated with check ((select private.is_merkez()));
create policy "belge: merkez günceller" on public.training_documents for update to authenticated
  using ((select private.is_merkez())) with check ((select private.is_merkez()));
create policy "belge: merkez siler" on public.training_documents for delete to authenticated using ((select private.is_merkez()));

create table public.training_videos (
  training_id text not null references public.trainings (id) on delete cascade,
  kind text not null check (kind in ('tan', 'koc', 'uyg')),
  vimeo_id bigint not null check (vimeo_id > 0),
  vimeo_hash text check (vimeo_hash ~ '^[0-9a-f]{6,20}$'),
  duration_s integer check (duration_s between 1 and 36000),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null,
  primary key (training_id, kind)
);
alter table public.training_videos enable row level security;
grant select, insert, update, delete on public.training_videos to authenticated;
create policy "ek video: akademi okur" on public.training_videos for select to authenticated
  using ((select private.is_merkez()) or (select private.my_office()) is not null);
create policy "ek video: merkez ekler" on public.training_videos for insert to authenticated with check ((select private.is_merkez()));
create policy "ek video: merkez günceller" on public.training_videos for update to authenticated
  using ((select private.is_merkez())) with check ((select private.is_merkez()));
create policy "ek video: merkez siler" on public.training_videos for delete to authenticated using ((select private.is_merkez()));

-- Storage: özel kova ve kuralları -------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('belgeler', 'belgeler', false, 20971520, array['application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "belgeler: akademi okur" on storage.objects for select to authenticated
  using (bucket_id = 'belgeler' and ((select private.is_merkez()) or (select private.my_office()) is not null));
create policy "belgeler: merkez yükler" on storage.objects for insert to authenticated
  with check (bucket_id = 'belgeler' and (select private.is_merkez()));
create policy "belgeler: merkez günceller" on storage.objects for update to authenticated
  using (bucket_id = 'belgeler' and (select private.is_merkez()))
  with check (bucket_id = 'belgeler' and (select private.is_merkez()));
create policy "belgeler: merkez siler" on storage.objects for delete to authenticated
  using (bucket_id = 'belgeler' and (select private.is_merkez()));

commit;
