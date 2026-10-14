-- Daily Detour was removed from the product. Remove its data model and give
-- owners the narrow update permission required for editing their private text.

begin;

alter table public.captions drop column if exists challenge_id;
alter table public.caption_drafts drop column if exists challenge_id;
drop table if exists public.daily_detours;

drop policy if exists "Users can update their own caption drafts" on public.caption_drafts;
create policy "Users can update their own caption drafts"
on public.caption_drafts for update to authenticated
using ((select auth.uid()) = author_id)
with check ((select auth.uid()) = author_id);

commit;
