-- Apply in the Supabase SQL editor. Provision parent identities out-of-band.
create table public.verified_parents (
 user_id uuid primary key references auth.users(id) on delete cascade,
 verified_at timestamptz not null default now()
);
alter table public.verified_parents enable row level security;
-- No browser policies: only service_role may enroll verified parents.
create table public.storefronts (
 id uuid primary key default gen_random_uuid(),
 parent_id uuid not null references public.verified_parents(user_id) on delete cascade,
 slug uuid not null unique default gen_random_uuid(),
 status text not null default 'review' check(status in ('review','published','rejected','unpublished')),
 content jsonb not null,
 created_at timestamptz not null default now(),
 approved_at timestamptz,
 constraint approved_before_public check(status <> 'published' or approved_at is not null),
 constraint valid_content check(jsonb_typeof(content)='object' and length(content->>'name') between 2 and 60 and length(content->>'description')<=140 and jsonb_array_length(content->'products') between 1 and 10)
);
create index storefront_parent on public.storefronts(parent_id,created_at desc);
alter table public.storefronts enable row level security;
-- Browsers receive no direct database privileges. Server authenticates and validates each action.
revoke all on public.verified_parents from anon,authenticated;
revoke all on public.storefronts from anon,authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('product-images','product-images',false,307200,array['image/webp'])
on conflict(id) do update set public=false,file_size_limit=307200,allowed_mime_types=array['image/webp'];
-- No storage object policies grant browser access. Server issues 60-second signed URLs only for published stores.
