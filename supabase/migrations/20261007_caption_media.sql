-- Associate every caption with a visual scene. The selected key is stored with
-- the caption so the feed can reproduce the post that the voter saw.
alter table public.captions
  add column if not exists media_key text,
  add column if not exists media_url text;

update public.captions
set
  media_key = coalesce(media_key, case mod(id, 4)
    when 0 then 'uptown-platform'
    when 1 then 'dorm-desk'
    when 2 then 'soho-coffee'
    else 'city-after-class'
  end),
  media_url = coalesce(media_url, case mod(id, 4)
    when 0 then 'https://images.unsplash.com/photo-1519501025264-65ba15a82390'
    when 1 then 'https://images.unsplash.com/photo-1524758631624-e2822e304c36'
    when 2 then 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb'
    else 'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee'
  end)
where media_key is null or media_url is null;

alter table public.captions
  alter column media_key set default 'uptown-platform',
  alter column media_key set not null,
  alter column media_url set not null;

alter table public.captions
  drop constraint if exists captions_media_key_check;

alter table public.captions
  add constraint captions_media_key_check
  check (media_key in ('uptown-platform', 'dorm-desk', 'soho-coffee', 'city-after-class'));
