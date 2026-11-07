-- Merkez ekibi ve ofislerin eğitim tamamlama oranı
--
-- Tamamlama: biten (telafi olmayan) oturumlarda bütün günlere katılıp koçluğu tamamlayan
-- danışmanların oranı; akademinin Katılım Sertifikası koşuluyla aynı (telafiyle tamamlanan gün
-- asıl oturumda "katıldı" olarak işaretlenir). Satır kurallarıyla çalışır: merkez bütün ofisleri,
-- ofis personeli yalnız kendi ofisini görür.
-- Merkez ekibi: merkez yöneticisi başka bir merkez hesabını pasif ya da etkin yapar; kendi
-- hesabını pasif yapamaz (böylece en az bir etkin yönetici kalır). Pasif yapılan hesabın açık
-- oturumları hemen kapanır. Yeni yöneticinin daveti "davet" fonksiyonundan gider.

begin;

create or replace function public.office_completion()
returns table (office_id uuid, finished integer, completed integer)
language sql stable set search_path = '' as $$
  select r.office_id,
         count(*)::integer,
         count(*) filter (where
           (select count(*) from public.attendance a
             where a.run_id = r.id and a.consultant_id = m.consultant_id and a.present) >= cardinality(r.days)
           and exists (select 1 from public.coaching c
                        where c.run_id = r.id and c.consultant_id = m.consultant_id and c.done))::integer
    from public.runs r
    join public.run_members m on m.run_id = r.id
   where r.status = 'done' and not r.makeup
   group by r.office_id
$$;
revoke execute on function public.office_completion() from public, anon;
grant execute on function public.office_completion() to authenticated;

create or replace function public.set_merkez_active(p_id uuid, p_active boolean)
returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_ids uuid[];
begin
  if not (select private.is_merkez()) then raise exception 'yetki_yok' using errcode = '42501'; end if;
  if p_id is null or p_active is null then raise exception 'gecersiz' using errcode = '22023'; end if;
  if p_id = (select auth.uid()) then raise exception 'kendi_hesabi' using errcode = '22023'; end if;
  if not exists (select 1 from public.profiles p where p.id = p_id and p.role = 'merkez') then
    raise exception 'merkez_degil' using errcode = '22023';
  end if;
  update public.profiles p set active = p_active where p.id = p_id;
  if not p_active then
    with kapanan as (
      update public.user_sessions s set ended_at = now(), ended_reason = 'merkez'
       where s.user_id = p_id and s.ended_at is null
      returning s.auth_session_id
    )
    select coalesce(array_agg(k.auth_session_id) filter (where k.auth_session_id is not null), '{}') into v_ids from kapanan k;
    perform private.revoke_auth_sessions(v_ids);
  end if;
  return true;
end $$;
revoke execute on function public.set_merkez_active(uuid, boolean) from public, anon;
grant execute on function public.set_merkez_active(uuid, boolean) to authenticated;

commit;
