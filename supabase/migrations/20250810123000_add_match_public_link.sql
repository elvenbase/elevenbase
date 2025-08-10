-- Ensure pgcrypto for gen_random_uuid / bytes
create extension if not exists pgcrypto;

-- Add columns if missing
alter table public.matches
  add column if not exists public_link_token text unique,
  add column if not exists allow_responses_until timestamptz;

-- Function to generate token if null
create or replace function public.set_match_public_token()
returns trigger as $$
begin
  if new.public_link_token is null then
    new.public_link_token := encode(extensions.gen_random_bytes(16), 'hex');
  end if;
  return new;
end;
$$ language plpgsql;

-- Trigger on insert
drop trigger if exists trg_matches_set_token on public.matches;
create trigger trg_matches_set_token
before insert on public.matches
for each row execute function public.set_match_public_token();

-- Optional: index for token lookups
create index if not exists idx_matches_public_token on public.matches(public_link_token);