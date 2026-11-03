-- 1) Özel puanda 0 = henüz puanlanmadı (mentor dört ölçütü tek tek doldurur).
-- 2) Pasif ya da üyeliği bitmiş ofisin personeli ofis verisine erişemez; kendi profilini
--    görmeye devam eder, böylece giriş ekranı "üyelik etkin değil" diyebilir.

begin;

alter table public.private_scores drop constraint if exists private_scores_scores_check;
alter table public.private_scores add constraint private_scores_scores_check
  check (cardinality(scores) = 4 and 0 <= all (scores) and 5 >= all (scores));

create or replace function private.my_office() returns uuid
language sql stable security definer set search_path = '' as $$
  select p.office_id
    from public.profiles p
    join public.offices o on o.id = p.office_id
   where p.id = (select auth.uid())
     and p.active
     and o.status <> 'pasif'
     and (o.membership_end is null or o.membership_end >= (now() at time zone 'Europe/Istanbul')::date)
$$;

commit;
