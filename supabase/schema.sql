create table if not exists public.verses (
  id text primary key,
  reference text not null,
  translation text not null default 'NIV',
  parts text[] not null,
  answers text[] not null,
  decoys text[] not null,
  theme_id text not null default 'core',
  theme_label text not null default 'Hope',
  devotional text not null default '',
  application_prompt text not null default '',
  difficulty text,
  is_daily_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attempts (
  id bigserial primary key,
  user_id text not null,
  verse_id text not null references public.verses(id) on delete cascade,
  correct_count int not null,
  total_blanks int not null,
  attempt_index int not null,
  elapsed_ms int not null,
  points int not null,
  created_at timestamptz not null default now()
);

create table if not exists public.scores (
  user_id text primary key,
  display_name text not null default 'Learner',
  total_points int not null default 0,
  best_session int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.streaks (
  user_id text primary key,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_played_on date,
  updated_at timestamptz not null default now()
);

create table if not exists public.reflections (
  id bigserial primary key,
  user_id text not null,
  verse_id text not null references public.verses(id) on delete cascade,
  category_id text not null,
  heart_check_tags text[],
  response_text text not null,
  created_at timestamptz not null default now()
);

alter table public.verses add column if not exists theme_label text not null default 'Hope';
alter table public.verses add column if not exists devotional text not null default '';
alter table public.verses add column if not exists application_prompt text not null default '';
alter table public.verses add column if not exists difficulty text;
alter table public.verses add column if not exists is_daily_featured boolean not null default false;

alter table public.verses enable row level security;
alter table public.attempts enable row level security;
alter table public.scores enable row level security;
alter table public.streaks enable row level security;
alter table public.reflections enable row level security;

create policy if not exists "Read verses" on public.verses for select using (true);
create policy if not exists "Insert attempts" on public.attempts for insert with check (true);
create policy if not exists "Read own attempts" on public.attempts for select using (true);
create policy if not exists "Read scores" on public.scores for select using (true);
create policy if not exists "Write scores" on public.scores for all using (true) with check (true);
create policy if not exists "Read streaks" on public.streaks for select using (true);
create policy if not exists "Write streaks" on public.streaks for all using (true) with check (true);
create policy if not exists "Read reflections" on public.reflections for select using (true);
create policy if not exists "Write reflections" on public.reflections for all using (true) with check (true);
