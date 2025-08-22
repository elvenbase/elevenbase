-- Atomic function to set the team captain
create or replace function public.set_captain(new_captain_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Unset any existing captain
  update public.players
  set is_captain = false
  where is_captain = true;

  -- Set the new captain if provided
  if new_captain_id is not null then
    update public.players
    set is_captain = true
    where id = new_captain_id;
  end if;
end;
$$;

-- Ensure function owner is postgres and grant execute to authenticated
alter function public.set_captain(uuid) owner to postgres;
revoke all on function public.set_captain(uuid) from public;
grant execute on function public.set_captain(uuid) to authenticated;