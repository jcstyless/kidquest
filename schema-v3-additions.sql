
-- ═══════════════════════════════════════════════════════════
-- SCHEMA ADDITIONS for v18
-- Run after schema-v3.sql
-- ═══════════════════════════════════════════════════════════

-- Daily bonus log (prevents re-claiming)
CREATE TABLE IF NOT EXISTS daily_bonus_log (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references profiles(id) on delete cascade,
  bonus_date  date not null,
  gems_awarded integer default 3,
  created_at  timestamptz default now(),
  UNIQUE(user_id, bonus_date)
);
ALTER TABLE daily_bonus_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own bonus log" ON daily_bonus_log FOR ALL USING (auth.uid() = user_id);

-- Add missing columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_key text default 'a_cub';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS frame text default 'none';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rubies integer default 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS allowance integer default 5000;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen timestamptz default now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username text;

-- Chat messages already created via chat-schema.sql
-- If not run yet, enable realtime:
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
