-- ═══════════════════════════════════════════════════════════
-- KIDQUEST — Chat Messages Table
-- Run in Supabase → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════

create table if not exists chat_messages (
  id          uuid default uuid_generate_v4() primary key,
  room        text not null check (room in ('clan','adult')),
  author_id   uuid references profiles(id) on delete cascade,
  author_name text not null,
  author_role text not null,
  avatar_key  text default 'a_cub',
  text        text not null,
  is_system   boolean default false,
  created_at  timestamptz default now()
);

-- Index for fast room queries
create index if not exists chat_messages_room_idx on chat_messages(room, created_at desc);

-- RLS
alter table chat_messages enable row level security;

-- Anyone logged in can read clan chat
create policy "Read clan chat"
  on chat_messages for select
  using (auth.uid() is not null and room = 'clan');

-- Adults only read adult chat
create policy "Read adult chat"
  on chat_messages for select
  using (
    room = 'adult' and
    exists (select 1 from profiles where id = auth.uid() and role in ('parent','teacher'))
    or exists (select 1 from profiles where id = auth.uid() and admin_role in ('master','admin','moderator'))
  );

-- Logged in users can send to clan
create policy "Send clan message"
  on chat_messages for insert
  with check (auth.uid() = author_id and room = 'clan');

-- Only adults can send to adult chat
create policy "Send adult message"
  on chat_messages for insert
  with check (
    auth.uid() = author_id and room = 'adult' and
    exists (select 1 from profiles where id = auth.uid() and role in ('parent','teacher'))
  );

-- Enable realtime for chat_messages
alter publication supabase_realtime add table chat_messages;
