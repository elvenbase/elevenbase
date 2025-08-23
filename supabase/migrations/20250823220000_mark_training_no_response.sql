-- RPC function to mark non-respondents as "no_response" for a training session
-- This function ensures all invited players have attendance records without NULL player_id

create or replace function public.mark_training_session_no_response(sid uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Insert "no_response" records for players who were invited but don't have attendance records
  -- This prevents NULL player_id violations by only inserting for valid player IDs
  insert into public.training_attendance (session_id, player_id, status, created_at, updated_at)
  select 
    sid,
    ti.player_id,
    'no_response'::attendance_status,
    now(),
    now()
  from public.training_invitations ti
  where ti.session_id = sid
    and ti.player_id is not null -- Ensure player_id is not null
    and not exists (
      -- Only insert if no attendance record exists yet
      select 1 
      from public.training_attendance ta 
      where ta.session_id = sid 
        and ta.player_id = ti.player_id
    );
    
  -- Update the session status to closed if not already
  update public.training_sessions 
  set is_closed = true, updated_at = now()
  where id = sid and is_closed = false;
end;
$$;

-- Grant execute permissions
alter function public.mark_training_session_no_response(uuid) owner to postgres;
revoke all on function public.mark_training_session_no_response(uuid) from public;
grant execute on function public.mark_training_session_no_response(uuid) to authenticated;