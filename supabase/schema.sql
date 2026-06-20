-- Run this in Supabase SQL Editor.
create extension if not exists "pgcrypto";

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid null,
  title text not null,
  slug text not null,
  type text not null default 'resource' check (type in ('video','pdf','resource','batch','link')),
  description text,
  file_url text,
  video_url text,
  thumbnail_url text,
  source_name text,
  source_url text unique,
  source_id text,
  credit_text text default 'Study Ratna permission acknowledged on Credits page.',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.import_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null unique,
  type text not null default 'public_page',
  last_checked_at timestamptz,
  status text default 'idle',
  created_at timestamptz not null default now()
);

create table if not exists public.import_logs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.import_sources(id) on delete set null,
  status text not null,
  items_found int default 0,
  items_imported int default 0,
  items_skipped int default 0,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  resource_id uuid references public.resources(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, resource_id)
);

alter table public.resources enable row level security;
alter table public.import_sources enable row level security;
alter table public.import_logs enable row level security;
alter table public.bookmarks enable row level security;

-- Public users can read only published resources.
drop policy if exists "Public read published resources" on public.resources;
create policy "Public read published resources" on public.resources for select using (is_published = true);

-- Logged-in users can read all resources in admin panel. For production, restrict this to your own admin email.
drop policy if exists "Authenticated read resources" on public.resources;
create policy "Authenticated read resources" on public.resources for select to authenticated using (true);

-- Logged-in users can publish/delete resources. For production, restrict this to admin only.
drop policy if exists "Authenticated update resources" on public.resources;
create policy "Authenticated update resources" on public.resources for update to authenticated using (true) with check (true);
drop policy if exists "Authenticated delete resources" on public.resources;
create policy "Authenticated delete resources" on public.resources for delete to authenticated using (true);

-- Import API uses service role and bypasses RLS.

-- Bookmarks
create policy "Users read own bookmarks" on public.bookmarks for select to authenticated using (auth.uid() = user_id);
create policy "Users insert own bookmarks" on public.bookmarks for insert to authenticated with check (auth.uid() = user_id);
create policy "Users delete own bookmarks" on public.bookmarks for delete to authenticated using (auth.uid() = user_id);

-- Extra policies for manual importer without service_role key.
drop policy if exists "Authenticated insert resources" on public.resources;
create policy "Authenticated insert resources" on public.resources for insert to authenticated with check (true);

drop policy if exists "Authenticated manage import sources" on public.import_sources;
create policy "Authenticated manage import sources" on public.import_sources for all to authenticated using (true) with check (true);

drop policy if exists "Authenticated manage import logs" on public.import_logs;
create policy "Authenticated manage import logs" on public.import_logs for all to authenticated using (true) with check (true);
