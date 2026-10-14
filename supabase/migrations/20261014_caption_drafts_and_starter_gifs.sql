-- Private, user-owned drafts. Uploaded files live in Storage, not in a
-- relational row. A draft can reference either a private upload or one of the
-- fixed GIPHY reaction GIFs defined by the application.

begin;

alter table public.captions
  drop constraint if exists captions_media_key_check;

alter table public.captions
  add constraint captions_media_key_check
  check (media_key in (
    'uptown-platform', 'dorm-desk', 'soho-coffee', 'city-after-class',
    'user-upload', 'reaction-gif'
  ));

create table if not exists public.caption_drafts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 220),
  prompt text,
  generation_model text,
  media_source text not null check (media_source in ('upload', 'starter-gif')),
  media_url text,
  media_path text,
  media_alt text not null,
  challenge_id bigint references public.daily_detours(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (media_source = 'upload' and media_path is not null and media_url is null)
    or (media_source = 'starter-gif' and media_url is not null and media_path is null)
  )
);

alter table public.caption_drafts enable row level security;

drop policy if exists "Users can read their own caption drafts" on public.caption_drafts;
drop policy if exists "Users can create their own caption drafts" on public.caption_drafts;
drop policy if exists "Users can remove their own caption drafts" on public.caption_drafts;

create policy "Users can read their own caption drafts"
on public.caption_drafts for select to authenticated
using ((select auth.uid()) = author_id);

create policy "Users can create their own caption drafts"
on public.caption_drafts for insert to authenticated
with check ((select auth.uid()) = author_id);

create policy "Users can remove their own caption drafts"
on public.caption_drafts for delete to authenticated
using ((select auth.uid()) = author_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'caption-drafts', 'caption-drafts', false, 4194304,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can view their own caption draft media" on storage.objects;
drop policy if exists "Users can upload their own caption draft media" on storage.objects;
drop policy if exists "Users can remove their own caption draft media" on storage.objects;

create policy "Users can view their own caption draft media"
on storage.objects for select to authenticated
using (
  bucket_id = 'caption-drafts'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can upload their own caption draft media"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'caption-drafts'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can remove their own caption draft media"
on storage.objects for delete to authenticated
using (
  bucket_id = 'caption-drafts'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

commit;
