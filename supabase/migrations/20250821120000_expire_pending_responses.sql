-- Ensure pg_cron is available
create extension if not exists pg_cron;

-- Function: expire pending auto-responses after deadline
create or replace function public.expire_pending_responses()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _updated_training integer := 0;
  _updated_matches integer := 0;
begin
  -- Training: pending -> no_response where deadline passed
  update public.training_attendance ta
  set status = 'no_response'
  where status = 'pending'
    and exists (
      select 1
      from public.training_sessions ts
      where ts.id = ta.session_id
        and ts.allow_responses_until is not null
        and now() > ts.allow_responses_until
    );
  get diagnostics _updated_training = row_count;

  -- Matches: pending -> no_response where deadline passed
  update public.match_attendance ma
  set status = 'no_response'
  where status = 'pending'
    and exists (
      select 1
      from public.matches m
      where m.id = ma.match_id
        and m.allow_responses_until is not null
        and now() > m.allow_responses_until
    );
  get diagnostics _updated_matches = row_count;

  -- Optional notice for audit/debugging
  raise notice 'expire_pending_responses: training=% matches=%', _updated_training, _updated_matches;
end;
$$;

-- Schedule every minute (idempotent check)
do $$
begin
  if not exists (
    select 1 from cron.job 
    where command like '%select public.expire_pending_responses()%'
  ) then
    perform cron.schedule('* * * * *', $$select public.expire_pending_responses();$$);
  end if;
end $$;

