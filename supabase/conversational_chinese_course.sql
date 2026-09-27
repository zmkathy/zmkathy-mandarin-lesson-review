-- Run this once in the Supabase SQL Editor.
-- Stage 3 is a separate Conversational Chinese course.
-- Beginner Level 1 and Beginner Level 2 remain unchanged.
insert into public.course_stages (stage_number, title, total_lessons)
values (3, 'Conversational Chinese Level 1', 10)
on conflict (stage_number) do update
set title = excluded.title,
    total_lessons = excluded.total_lessons;

insert into public.student_course_access (student_id, stage_number, max_lesson, allowed_lessons)
select id, 3, 0, '{}'::smallint[] from public.students
on conflict (student_id, stage_number) do nothing;

drop function if exists public.teacher_create_student(text, text, text, smallint);
create function public.teacher_create_student(
  input_display_name text,
  input_login_name text,
  input_pin text,
  input_stage smallint,
  input_initial_lesson smallint default 1
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  new_student_id uuid;
  course_lesson_limit smallint;
begin
  if not public.is_teacher() then raise exception 'Not authorized'; end if;
  if input_pin !~ '^[0-9]{4}$' then raise exception 'PIN must contain four digits'; end if;
  select total_lessons into course_lesson_limit from public.course_stages where stage_number = input_stage;
  if course_lesson_limit is null then raise exception 'Invalid course'; end if;
  if input_initial_lesson < 1 or input_initial_lesson > course_lesson_limit then
    raise exception 'Lesson is outside this course';
  end if;

  insert into public.students (display_name, login_name, pin_hash, max_lesson)
  values (trim(input_display_name), public.normalize_student_name(input_login_name), crypt(input_pin, gen_salt('bf')), case when input_stage = 1 then input_initial_lesson else 1 end)
  returning id into new_student_id;

  insert into public.student_course_access (student_id, stage_number, max_lesson, allowed_lessons)
  values
    (new_student_id, 1, case when input_stage = 1 then input_initial_lesson else 0 end, case when input_stage = 1 then array(select generate_series(1, input_initial_lesson)::smallint) else '{}'::smallint[] end),
    (new_student_id, 2, 0, '{}'::smallint[]),
    (new_student_id, 3, case when input_stage = 3 then input_initial_lesson else 0 end, case when input_stage = 3 then array(select generate_series(1, input_initial_lesson)::smallint) else '{}'::smallint[] end);
  return new_student_id;
end;
$$;

drop function if exists public.teacher_students();
create function public.teacher_students()
returns table (
  id uuid,
  display_name text,
  login_name text,
  is_active boolean,
  stage_1_lesson smallint,
  stage_2_lesson smallint,
  stage_3_lesson smallint,
  stage_1_lessons smallint[],
  stage_2_lessons smallint[],
  stage_3_lessons smallint[],
  last_seen_at timestamptz,
  active_seconds bigint,
  marked_items bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_teacher() then raise exception 'Not authorized'; end if;
  return query
  select s.id, s.display_name, s.login_name, s.is_active,
    coalesce(a1.max_lesson, 0)::smallint,
    coalesce(a2.max_lesson, 0)::smallint,
    coalesce(a3.max_lesson, 0)::smallint,
    coalesce(a1.allowed_lessons, case when coalesce(a1.max_lesson, 0) > 0 then array(select generate_series(1, a1.max_lesson)::smallint) else '{}'::smallint[] end),
    coalesce(a2.allowed_lessons, case when coalesce(a2.max_lesson, 0) > 0 then array(select generate_series(1, a2.max_lesson)::smallint) else '{}'::smallint[] end),
    coalesce(a3.allowed_lessons, case when coalesce(a3.max_lesson, 0) > 0 then array(select generate_series(1, a3.max_lesson)::smallint) else '{}'::smallint[] end),
    (select max(ss.last_seen_at) from public.student_sessions ss where ss.student_id = s.id),
    (select coalesce(sum(st.active_seconds), 0)::bigint from public.study_sessions st where st.student_id = s.id),
    (select count(*)::bigint from public.card_progress cp where cp.student_id = s.id)
  from public.students s
  left join public.student_course_access a1 on a1.student_id = s.id and a1.stage_number = 1
  left join public.student_course_access a2 on a2.student_id = s.id and a2.stage_number = 2
  left join public.student_course_access a3 on a3.student_id = s.id and a3.stage_number = 3
  order by s.display_name;
end;
$$;

create or replace function public.teacher_set_lesson_access(input_student_id uuid, input_stage smallint, input_lessons smallint[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_lessons smallint[];
  highest_lesson smallint;
  course_lesson_limit smallint;
begin
  if not public.is_teacher() then raise exception 'Not authorized'; end if;
  select total_lessons into course_lesson_limit from public.course_stages where stage_number = input_stage;
  if course_lesson_limit is null then raise exception 'Invalid course'; end if;
  if exists(select 1 from unnest(coalesce(input_lessons, '{}'::smallint[])) lesson where lesson < 1 or lesson > course_lesson_limit) then
    raise exception 'Lesson is outside this course';
  end if;

  select coalesce(array_agg(distinct lesson order by lesson), '{}'::smallint[])
  into normalized_lessons
  from unnest(coalesce(input_lessons, '{}'::smallint[])) lesson;
  select coalesce(max(lesson), 0)::smallint into highest_lesson from unnest(normalized_lessons) lesson;

  insert into public.student_course_access (student_id, stage_number, max_lesson, allowed_lessons, updated_at)
  values (input_student_id, input_stage, highest_lesson, normalized_lessons, now())
  on conflict (student_id, stage_number) do update
  set max_lesson = excluded.max_lesson,
      allowed_lessons = excluded.allowed_lessons,
      updated_at = now();

  if input_stage = 1 then
    update public.students set max_lesson = greatest(highest_lesson, 1), updated_at = now() where id = input_student_id;
  end if;
end;
$$;

grant execute on function public.teacher_students() to authenticated;
grant execute on function public.teacher_set_lesson_access(uuid, smallint, smallint[]) to authenticated;
grant execute on function public.teacher_create_student(text, text, text, smallint, smallint) to authenticated;
