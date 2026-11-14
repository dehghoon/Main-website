-- Public projection written only after owner approval. Keep draft assets and publishing jobs private.
create table if not exists public.ai_news_website_feed (
  asset_id uuid primary key references public.ai_news_social_assets(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 150),
  title text not null check (length(btrim(title)) between 1 and 200),
  summary text not null check (length(btrim(summary)) between 1 and 700),
  source_url text not null check (source_url ~ '^https://'),
  image_url text not null check (image_url ~ '^https://'),
  image_alt text not null check (length(btrim(image_alt)) between 1 and 300),
  social_links jsonb not null default '{}'::jsonb check (
    jsonb_typeof(social_links) = 'object' and
    social_links - array['facebook', 'instagram', 'linkedin'] = '{}'::jsonb
  ),
  published_at timestamptz not null default now()
);

alter table public.ai_news_website_feed enable row level security;
revoke all on table public.ai_news_website_feed from public, anon, authenticated;
grant select (slug, title, summary, source_url, image_url, image_alt, social_links, published_at)
  on public.ai_news_website_feed to anon, authenticated;
grant select, insert, update, delete on public.ai_news_website_feed to service_role;

create policy "Read published AI news cards"
  on public.ai_news_website_feed for select
  to anon, authenticated
  using (published_at <= now());

comment on table public.ai_news_website_feed is
  'Owner-approved public cards only. Use one stable asset_id. Drafts and social jobs remain private.';
