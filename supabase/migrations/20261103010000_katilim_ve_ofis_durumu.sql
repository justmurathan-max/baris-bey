-- Davetli kişi ilk kez girince (e-postası doğrulanınca) profiline katılma zamanı yazılır;
-- ofisi hâlâ davet aşamasındaysa etkin olur.

begin;

alter table public.profiles add column if not exists joined_at timestamptz;

create or replace function private.handle_user_confirmed() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  off uuid;
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    update public.profiles set joined_at = coalesce(joined_at, now())
     where id = new.id
     returning office_id into off;
    if off is not null then
      update public.offices set status = 'aktif' where id = off and status = 'davet';
    end if;
  end if;
  return new;
end $$;

create trigger on_auth_user_confirmed
  after update of email_confirmed_at on auth.users
  for each row execute function private.handle_user_confirmed();

revoke all on function private.handle_user_confirmed() from public;

-- Daha önce girmiş olanlar
update public.profiles p set joined_at = u.email_confirmed_at
  from auth.users u
 where u.id = p.id and u.email_confirmed_at is not null and p.joined_at is null;

commit;
