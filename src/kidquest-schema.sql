-- ═══════════════════════════════════════════════════════════
-- KIDQUEST — Supabase Database Schema
-- Run this in Supabase → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── PROFILES ─────────────────────────────────────────────
create table profiles (
  id          uuid references auth.users on delete cascade primary key,
  name        text not null,
  role        text not null check (role in ('student','parent','teacher')),
  age_group   text default 'tween' check (age_group in ('kids','tween','teen')),
  avatar_key  text default 'a_cub',
  frame       text default 'none',
  bg_key      text default 'mint',
  gems        integer default 30,
  coins       integer default 0,
  xp          integer default 0,
  level       integer default 1,
  streak      integer default 0,
  streak_shields integer default 1,
  trophies    integer default 0,
  allowance   integer default 5000,
  allowance_spent integer default 0,
  savings_goal_name   text default 'Mi primera meta',
  savings_goal_target integer default 50000,
  savings_goal_saved  integer default 0,
  savings_goal_emoji  text default '🎯',
  last_login_date text default '',
  created_at  timestamptz default now()
);

-- ── PARENT-CHILD LINKS ───────────────────────────────────
create table parent_child (
  id         uuid default uuid_generate_v4() primary key,
  parent_id  uuid references profiles(id) on delete cascade,
  child_id   uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(parent_id, child_id)
);

-- ── TEACHER-STUDENT LINKS ────────────────────────────────
create table teacher_student (
  id          uuid default uuid_generate_v4() primary key,
  teacher_id  uuid references profiles(id) on delete cascade,
  student_id  uuid references profiles(id) on delete cascade,
  course      text default '5to B',
  created_at  timestamptz default now(),
  unique(teacher_id, student_id)
);

-- ── TASK PROGRESS ────────────────────────────────────────
create table task_progress (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references profiles(id) on delete cascade,
  task_id     integer not null,
  task_title  text not null,
  status      text default 'idle' check (status in ('idle','pending','approved','rejected')),
  evidence_url text,
  self_desc   text,
  ai_score    integer,
  completed_at timestamptz,
  created_at  timestamptz default now()
);

-- ── CUSTOM TASKS ─────────────────────────────────────────
create table custom_tasks (
  id          uuid default uuid_generate_v4() primary key,
  created_by  uuid references profiles(id) on delete cascade,
  assigned_to uuid references profiles(id) on delete cascade,
  title       text not null,
  description text,
  emoji       text default '⭐',
  freq        text default 'diaria',
  xp          integer default 80,
  coins       integer default 16,
  hint        text,
  status      text default 'idle',
  created_at  timestamptz default now()
);

-- ── INVENTORY ────────────────────────────────────────────
create table inventory (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references profiles(id) on delete cascade,
  item_id     text not null,
  item_type   text not null,
  item_name   text not null,
  rarity      text not null,
  svg_key     text not null,
  obtained_at timestamptz default now()
);

-- ── SPEND LOG ────────────────────────────────────────────
create table spend_log (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references profiles(id) on delete cascade,
  amount      integer not null,
  category    text not null,
  note        text,
  created_at  timestamptz default now()
);

-- ── CHALLENGES ───────────────────────────────────────────
create table challenges (
  id            uuid default uuid_generate_v4() primary key,
  template_id   text not null,
  title         text not null,
  description   text,
  emoji         text,
  xp            integer default 150,
  coins         integer default 40,
  freq          text default 'semanal',
  assigned_by   uuid references profiles(id) on delete cascade,
  assigned_to   uuid references profiles(id) on delete cascade,
  status        text default 'pending' check (status in ('pending','completed','expired')),
  assigned_at   timestamptz default now(),
  completed_at  timestamptz
);

-- ── CLANS ────────────────────────────────────────────────
create table clans (
  id          uuid default uuid_generate_v4() primary key,
  name        text not null,
  emblem      text default '🐉',
  level       integer default 1,
  level_xp    integer default 0,
  created_at  timestamptz default now()
);

create table clan_members (
  id        uuid default uuid_generate_v4() primary key,
  clan_id   uuid references clans(id) on delete cascade,
  user_id   uuid references profiles(id) on delete cascade,
  role      text default 'member',
  joined_at timestamptz default now(),
  unique(clan_id, user_id)
);

-- ── MONTHLY HISTORY ──────────────────────────────────────
create table monthly_history (
  id        uuid default uuid_generate_v4() primary key,
  user_id   uuid references profiles(id) on delete cascade,
  month     text not null,
  year      integer not null,
  saved     integer default 0,
  spent     integer default 0,
  tasks_done integer default 0
);

-- ══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) — users only see their own data
-- ══════════════════════════════════════════════════════════

alter table profiles         enable row level security;
alter table parent_child     enable row level security;
alter table teacher_student  enable row level security;
alter table task_progress    enable row level security;
alter table custom_tasks     enable row level security;
alter table inventory        enable row level security;
alter table spend_log        enable row level security;
alter table challenges       enable row level security;
alter table clans            enable row level security;
alter table clan_members     enable row level security;
alter table monthly_history  enable row level security;

-- Profiles: users can read/update their own
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- Parents can view their children's profiles
create policy "Parents can view children profiles"
  on profiles for select using (
    exists (select 1 from parent_child where parent_id = auth.uid() and child_id = profiles.id)
  );

-- Teachers can view their students' profiles
create policy "Teachers can view student profiles"
  on profiles for select using (
    exists (select 1 from teacher_student where teacher_id = auth.uid() and student_id = profiles.id)
  );

-- Task progress: own records + parent/teacher can view
create policy "Users manage own task progress"
  on task_progress for all using (auth.uid() = user_id);
create policy "Parents view child task progress"
  on task_progress for select using (
    exists (select 1 from parent_child where parent_id = auth.uid() and child_id = task_progress.user_id)
  );
create policy "Teachers view student task progress"
  on task_progress for select using (
    exists (select 1 from teacher_student where teacher_id = auth.uid() and student_id = task_progress.user_id)
  );

-- Inventory: own records
create policy "Users manage own inventory"
  on inventory for all using (auth.uid() = user_id);

-- Spend log: own records
create policy "Users manage own spend log"
  on spend_log for all using (auth.uid() = user_id);

-- Challenges: assigned_by or assigned_to
create policy "Challenge participants can view"
  on challenges for select using (auth.uid() = assigned_by or auth.uid() = assigned_to);
create policy "Assigners can create challenges"
  on challenges for insert with check (auth.uid() = assigned_by);
create policy "Assigned users can update status"
  on challenges for update using (auth.uid() = assigned_to or auth.uid() = assigned_by);

-- Custom tasks
create policy "Custom task participants"
  on custom_tasks for all using (auth.uid() = created_by or auth.uid() = assigned_to);

-- Monthly history
create policy "Users manage own history"
  on monthly_history for all using (auth.uid() = user_id);

-- Parent-child
create policy "View own links"
  on parent_child for select using (auth.uid() = parent_id or auth.uid() = child_id);
create policy "Create links"
  on parent_child for insert with check (auth.uid() = parent_id);

-- Teacher-student
create policy "View own teacher links"
  on teacher_student for select using (auth.uid() = teacher_id or auth.uid() = student_id);
create policy "Teachers create links"
  on teacher_student for insert with check (auth.uid() = teacher_id);

-- Clans (public read)
create policy "Anyone can view clans"
  on clans for select using (true);
create policy "Clan members"
  on clan_members for select using (true);

-- ══════════════════════════════════════════════════════════
-- FUNCTION: auto-create profile on signup
-- ══════════════════════════════════════════════════════════
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
