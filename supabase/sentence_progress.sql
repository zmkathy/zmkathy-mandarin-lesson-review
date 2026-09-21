-- Run once in Supabase SQL Editor to enable saved sentence-card progress.
alter table public.card_progress
  drop constraint if exists card_progress_practice_type_check;

alter table public.card_progress
  add constraint card_progress_practice_type_check
  check (practice_type in ('lesson_vocabulary', 'lesson_sentences', 'everyday_vocabulary'));

create or replace function public.student_save_card_progress(input_token text, input_practice_type text, input_item_key text, input_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare matched_student_id uuid;
begin
  matched_student_id := public.student_id_for_token(input_token);
  if matched_student_id is null then return; end if;
  if input_practice_type not in ('lesson_vocabulary', 'lesson_sentences', 'everyday_vocabulary') or input_status not in ('known', 'review') then return; end if;
  insert into public.card_progress (student_id, practice_type, item_key, status, updated_at)
  values (matched_student_id, input_practice_type, input_item_key, input_status, now())
  on conflict (student_id, practice_type, item_key) do update
  set status = excluded.status, updated_at = now();
end;
$$;

grant execute on function public.student_save_card_progress(text, text, text, text) to anon, authenticated;
