-- ═══════════════════════════════════════════════════════════
-- KIDQUEST Schema v2 — Full security + admin system
-- Run in Supabase → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════

-- ── EXTENSIONS ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for username search

-- ── ADD FIELDS TO PROFILES ──────────────────────────────────
alter table profiles add column if not exists username text unique;
alter table profiles add column if not exists birth_date date;
alter table profiles add column if not exists age_years integer;
alter table profiles add column if not exists is_minor boolean default false;
alter table profiles add column if not exists email_verified boolean default false;
alter table profiles add column if not exists biometric_verified boolean default false;
alter table profiles add column if not exists account_status text default 'pending_email'
  check (account_status in ('pending_email','pending_tutor','active','suspended','banned'));
alter table profiles add column if not exists admin_role text default 'none'
  check (admin_role in ('none','moderator','admin','master'));
alter table profiles add column if not exists admin_notes text;
alter table profiles add column if not exists last_seen timestamptz;
alter table profiles add column if not exists report_count integer default 0;
alter table profiles add column if not exists total_tasks_done integer default 0;
alter table profiles add column if not exists created_at timestamptz default now();

-- Set master admin for j.cancino.arias@gmail.com
-- (runs after first login, safe to run multiple times)
create or replace function set_master_admin()
returns void as $$
begin
  update profiles set admin_role = 'master', account_status = 'active'
  where id in (
    select id from auth.users where email = 'j.cancino.arias@gmail.com'
  );
end;
$$ language plpgsql security definer;

-- ── USERNAME GENERATION ─────────────────────────────────────
create or replace function generate_username(base_name text)
returns text as $$
declare
  clean text;
  candidate text;
  counter integer := 0;
begin
  clean := lower(regexp_replace(base_name, '[^a-zA-Z0-9]', '', 'g'));
  clean := left(clean, 12);
  if length(clean) < 3 then clean := 'user' || clean; end if;
  candidate := clean;
  loop
    exit when not exists (select 1 from profiles where username = candidate);
    counter := counter + 1;
    candidate := clean || counter::text;
  end loop;
  return candidate;
end;
$$ language plpgsql security definer;

-- ── INVITE TOKENS ───────────────────────────────────────────
create table if not exists invite_tokens (
  id           uuid default uuid_generate_v4() primary key,
  token        text unique not null,
  created_by   uuid references profiles(id) on delete cascade,
  creator_name text,
  creator_role text,
  used_by      uuid references profiles(id) on delete set null,
  used         boolean default false,
  expires_at   timestamptz default now() + interval '7 days',
  created_at   timestamptz default now()
);

-- ── TUTOR REQUESTS ──────────────────────────────────────────
create table if not exists tutor_requests (
  id           uuid default uuid_generate_v4() primary key,
  child_id     uuid references profiles(id) on delete cascade,
  child_name   text,
  tutor_email  text not null,
  tutor_id     uuid references profiles(id) on delete set null,
  status       text default 'pending' check (status in ('pending','approved','rejected')),
  token        text unique not null,
  created_at   timestamptz default now(),
  resolved_at  timestamptz
);

-- ── REPORTS ─────────────────────────────────────────────────
create table if not exists reports (
  id              uuid default uuid_generate_v4() primary key,
  reporter_id     uuid references profiles(id) on delete set null,
  reported_user_id uuid references profiles(id) on delete cascade,
  report_type     text not null check (report_type in (
    'inappropriate_content','bullying','spam','fake_account',
    'grooming','hate_speech','other'
  )),
  description     text,
  evidence_url    text,
  status          text default 'pending' check (status in ('pending','reviewing','resolved','dismissed')),
  admin_action    text,
  admin_notes     text,
  resolved_by     uuid references profiles(id) on delete set null,
  created_at      timestamptz default now(),
  resolved_at     timestamptz
);

-- ── ADMIN ACTIONS LOG ───────────────────────────────────────
create table if not exists admin_actions (
  id          uuid default uuid_generate_v4() primary key,
  admin_id    uuid references profiles(id) on delete set null,
  action_type text not null,
  target_user uuid references profiles(id) on delete set null,
  details     jsonb,
  created_at  timestamptz default now()
);

-- ── GIFT LOG (admin gives items/gems to users) ──────────────
create table if not exists gifts (
  id          uuid default uuid_generate_v4() primary key,
  from_admin  uuid references profiles(id) on delete set null,
  to_user     uuid references profiles(id) on delete cascade,
  gift_type   text not null check (gift_type in ('gems','coins','xp','item')),
  amount      integer,
  item_id     text,
  item_name   text,
  message     text,
  created_at  timestamptz default now()
);

-- ── STORE (placeholder for future) ──────────────────────────
create table if not exists store_packages (
  id          uuid default uuid_generate_v4() primary key,
  name        text not null,
  gems        integer not null,
  price_usd   numeric(10,2) not null,
  bonus_gems  integer default 0,
  icon        text,
  is_active   boolean default false,
  created_at  timestamptz default now()
);

-- Insert placeholder packages (inactive)
insert into store_packages (name, gems, price_usd, bonus_gems, icon, is_active) values
  ('Bolsita de Cristales',   100,  0.99,   0,  '💎', false),
  ('Cofre de Cristales',     550,  4.99,  50,  '📦', false),
  ('Saco de Cristales',     1200,  9.99, 200,  '🎒', false),
  ('Cofre Legendario',      2500, 19.99, 500,  '🏆', false)
on conflict do nothing;

-- ── RLS POLICIES ────────────────────────────────────────────
alter table invite_tokens   enable row level security;
alter table tutor_requests  enable row level security;
alter table reports         enable row level security;
alter table admin_actions   enable row level security;
alter table gifts           enable row level security;
alter table store_packages  enable row level security;

-- Invite tokens
drop policy if exists "Adults manage own tokens" on invite_tokens;
create policy "Adults manage own tokens"
  on invite_tokens for all using (auth.uid() = created_by);
create policy "Anyone can read token by value"
  on invite_tokens for select using (true);

-- Tutor requests  
drop policy if exists "Children manage own requests" on tutor_requests;
create policy "Children manage own requests"
  on tutor_requests for all using (auth.uid() = child_id);
create policy "Tutors see requests for them"
  on tutor_requests for select using (auth.uid() = tutor_id);
create policy "Tutors update their requests"
  on tutor_requests for update using (auth.uid() = tutor_id);

-- Reports: anyone can create, admins can manage
create policy "Anyone can report"
  on reports for insert with check (auth.uid() = reporter_id);
create policy "Users see own reports"
  on reports for select using (auth.uid() = reporter_id);
create policy "Admins manage all reports"
  on reports for all using (
    exists (select 1 from profiles where id = auth.uid() and admin_role in ('admin','master','moderator'))
  );

-- Admin actions: admins only
create policy "Admins log actions"
  on admin_actions for all using (
    exists (select 1 from profiles where id = auth.uid() and admin_role in ('admin','master','moderator'))
  );

-- Gifts
create policy "Admins give gifts"
  on gifts for insert with check (
    exists (select 1 from profiles where id = auth.uid() and admin_role in ('admin','master'))
  );
create policy "Users see own gifts"
  on gifts for select using (auth.uid() = to_user);
create policy "Admins see all gifts"
  on gifts for select using (
    exists (select 1 from profiles where id = auth.uid() and admin_role in ('admin','master'))
  );

-- Store: public read
create policy "Anyone reads store"
  on store_packages for select using (true);
create policy "Masters manage store"
  on store_packages for all using (
    exists (select 1 from profiles where id = auth.uid() and admin_role = 'master')
  );

-- Admin actions visible to admins
create policy "Admins see admin log"
  on admin_actions for select using (
    exists (select 1 from profiles where id = auth.uid() and admin_role in ('admin','master','moderator'))
  );

-- Profiles: admins can view all
drop policy if exists "Admins view all profiles" on profiles;
create policy "Admins view all profiles"
  on profiles for select using (
    auth.uid() = id or
    exists (select 1 from profiles p2 where p2.id = auth.uid() and p2.admin_role in ('admin','master','moderator')) or
    exists (select 1 from parent_child where parent_id = auth.uid() and child_id = profiles.id) or
    exists (select 1 from teacher_student where teacher_id = auth.uid() and student_id = profiles.id)
  );

-- Admins can update any profile
create policy "Admins update profiles"
  on profiles for update using (
    auth.uid() = id or
    exists (select 1 from profiles p2 where p2.id = auth.uid() and p2.admin_role in ('admin','master'))
  );

-- ── UPDATED handle_new_user ──────────────────────────────────
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();

create or replace function handle_new_user()
returns trigger as $$
declare
  v_birth_date  date;
  v_age         integer;
  v_is_minor    boolean;
  v_status      text;
  v_username    text;
  v_role        text;
  v_admin       text;
begin
  v_role := coalesce(new.raw_user_meta_data->>'role', 'student');

  begin
    v_birth_date := (new.raw_user_meta_data->>'birth_date')::date;
    v_age := date_part('year', age(v_birth_date));
  exception when others then
    v_age := 15;
    v_birth_date := null;
  end;

  v_is_minor := v_age < 18;
  v_status := case when v_is_minor then 'pending_tutor' else 'active' end;
  v_username := generate_username(coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)));

  -- Master admin override
  v_admin := case when new.email = 'j.cancino.arias@gmail.com' then 'master' else 'none' end;
  if v_admin = 'master' then v_status := 'active'; end if;

  insert into public.profiles (
    id, name, username, role, birth_date, age_years, is_minor,
    account_status, admin_role, email_verified
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    v_username,
    v_role,
    v_birth_date,
    v_age,
    v_is_minor,
    v_status,
    v_admin,
    false
  ) on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── APPLY MASTER TO EXISTING ACCOUNT ────────────────────────
do $$
begin
  update public.profiles set
    admin_role = 'master',
    account_status = 'active'
  where id in (
    select id from auth.users where email = 'j.cancino.arias@gmail.com'
  );
end $$;
