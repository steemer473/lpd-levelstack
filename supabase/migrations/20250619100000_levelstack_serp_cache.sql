-- 24h SERP cache for organic + maps queries (cost optimization)
create table if not exists public.levelstack_serp_cache (
  cache_key text primary key,
  engine text not null check (engine in ('google', 'google_maps')),
  query text not null,
  response_json jsonb not null,
  provider text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists levelstack_serp_cache_expires_at_idx
  on public.levelstack_serp_cache (expires_at);

alter table public.levelstack_serp_cache enable row level security;

-- Service role only (pipeline writes via admin client)
drop policy if exists "Service role full access on serp cache" on public.levelstack_serp_cache;
create policy "Service role full access on serp cache"
  on public.levelstack_serp_cache
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
