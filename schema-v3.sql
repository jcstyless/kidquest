-- ═══════════════════════════════════════════════════════════
-- KIDQUEST Schema v3 — Ruby system + inventory + tasks
-- Run in Supabase → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════

-- Add rubies column to profiles (parents only, defaults 0)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rubies integer default 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS allowance integer default 5000;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS savings_goal_name text default 'Mi primera meta';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS savings_goal_target integer default 50000;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS savings_goal_saved integer default 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS savings_goal_emoji text default '🎯';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_tasks_done integer default 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS frame text default 'none';

-- Inventory table (for both regular and ruby items)
CREATE TABLE IF NOT EXISTS inventory (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references profiles(id) on delete cascade,
  item_id     text not null,
  item_type   text not null check (item_type in ('avatar','frame','sticker','badge')),
  item_name   text not null,
  rarity      text not null,
  svg_key     text,
  obtained_at timestamptz default now()
);
CREATE INDEX IF NOT EXISTS inventory_user_idx ON inventory(user_id, obtained_at desc);

-- Task progress table
CREATE TABLE IF NOT EXISTS task_progress (
  id           uuid default uuid_generate_v4() primary key,
  user_id      uuid references profiles(id) on delete cascade,
  task_id      text not null,
  task_title   text,
  status       text default 'pending' check (status in ('pending','approved','rejected','appealed')),
  ai_score     integer default 0,
  self_desc    text,
  evidence_url text,
  completed_at timestamptz default now(),
  updated_at   timestamptz default now(),
  UNIQUE(user_id, task_id)
);
CREATE INDEX IF NOT EXISTS task_progress_user_idx ON task_progress(user_id, status);

-- Custom tasks (parent/teacher assigns to child)
CREATE TABLE IF NOT EXISTS custom_tasks (
  id          uuid default uuid_generate_v4() primary key,
  created_by  uuid references profiles(id) on delete cascade,
  assigned_to uuid references profiles(id) on delete cascade,
  title       text not null,
  emoji       text default '⭐',
  freq        text default 'diaria',
  xp          integer default 100,
  coins       integer default 20,
  hint        text,
  status      text default 'idle',
  created_at  timestamptz default now()
);

-- Spend log
CREATE TABLE IF NOT EXISTS spend_log (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid references profiles(id) on delete cascade,
  amount     integer not null,
  category   text not null check (category in ('need','want','save')),
  note       text,
  created_at timestamptz default now()
);

-- RLS for inventory
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own inventory" ON inventory FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Parents see child inventory" ON inventory FOR SELECT USING (
  exists (select 1 from parent_child where parent_id = auth.uid() and child_id = inventory.user_id)
);

-- RLS for task_progress
ALTER TABLE task_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tasks" ON task_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Parents see child tasks" ON task_progress FOR SELECT USING (
  exists (select 1 from parent_child where parent_id = auth.uid() and child_id = task_progress.user_id)
);
CREATE POLICY "Teachers see student tasks" ON task_progress FOR SELECT USING (
  exists (select 1 from teacher_student where teacher_id = auth.uid() and student_id = task_progress.user_id)
);
-- Parents can update child task status (approve/reject)
CREATE POLICY "Parents update child tasks" ON task_progress FOR UPDATE USING (
  exists (select 1 from parent_child where parent_id = auth.uid() and child_id = task_progress.user_id)
);

-- RLS for custom_tasks
ALTER TABLE custom_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Adults manage tasks they created" ON custom_tasks FOR ALL USING (auth.uid() = created_by);
CREATE POLICY "Children see their tasks" ON custom_tasks FOR SELECT USING (auth.uid() = assigned_to);

-- RLS for spend_log
ALTER TABLE spend_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own spend" ON spend_log FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Parents see child spend" ON spend_log FOR SELECT USING (
  exists (select 1 from parent_child where parent_id = auth.uid() and child_id = spend_log.user_id)
);

-- Update master admin
UPDATE profiles SET admin_role = 'master', account_status = 'active'
WHERE id = (SELECT id FROM auth.users WHERE email = 'j.cancino.arias@gmail.com');
