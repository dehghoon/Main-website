create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  excerpt text,
  body text not null,
  author_id uuid not null references auth.users(id) on delete cascade,
  author_name text,
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz
);

alter table public.blog_posts enable row level security;

create policy "Public can read published posts"
on public.blog_posts for select
to anon, authenticated
using (status = 'published' or author_id = auth.uid());

create policy "Authors can create posts"
on public.blog_posts for insert
to authenticated
with check (author_id = auth.uid());

create policy "Authors can update own posts"
on public.blog_posts for update
to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

create policy "Authors can delete own posts"
on public.blog_posts for delete
to authenticated
using (author_id = auth.uid());
