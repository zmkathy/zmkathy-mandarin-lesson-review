alter table public.student_course_access
add column if not exists allowed_lessons smallint[];

create or replace function public.student_login(input_name text, input_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  matched_student public.students%rowtype;
  session_token text;
  access_data jsonb;
begin
  if input_pin !~ '^[0-9]{4}$' then return null; end if;

  select * into matched_student
  from public.students
  where login_name = public.normalize_student_name(input_name) and is_active = true
  limit 1;

  if matched_student.id is null or matched_student.pin_hash <> crypt(input_pin, matched_student.pin_hash) then
    perform pg_sleep(0.35);
    return null;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'stage', stage_number,
    'maxLesson', max_lesson,
    'lessons', coalesce(
      allowed_lessons,
      case when max_lesson > 0 then array(select generate_series(1, max_lesson)::smallint) else '{}'::smallint[] end
    )
  ) order by stage_number), '[]'::jsonb)
  into access_data
  from public.student_course_access
  where student_id = matched_student.id;

  delete from public.student_sessions where expires_at <= now();
  session_token := encode(gen_random_bytes(32), 'hex');
  insert into public.student_sessions (student_id, token_hash)
  values (matched_student.id, digest(session_token, 'sha256'));

  return jsonb_build_object(
    'token', session_token,
    'student', jsonb_build_object(
      'id', matched_student.id,
      'displayName', matched_student.display_name,
      'maxLesson', coalesce((select max_lesson from public.student_course_access where student_id = matched_student.id and stage_number = 1), matched_student.max_lesson),
      'courseAccess', access_data
    )
  );
end;
$$;

create or replace function public.student_me(input_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  matched_student public.students%rowtype;
  access_data jsonb;
begin
  select s.* into matched_student
  from public.students s
  join public.student_sessions ss on ss.student_id = s.id
  where ss.token_hash = digest(input_token, 'sha256')
    and ss.expires_at > now() and s.is_active = true
  limit 1;

  if matched_student.id is null then return null; end if;
  update public.student_sessions set last_seen_at = now()
  where token_hash = digest(input_token, 'sha256');

  select coalesce(jsonb_agg(jsonb_build_object(
    'stage', stage_number,
    'maxLesson', max_lesson,
    'lessons', coalesce(
      allowed_lessons,
      case when max_lesson > 0 then array(select generate_series(1, max_lesson)::smallint) else '{}'::smallint[] end
    )
  ) order by stage_number), '[]'::jsonb)
  into access_data
  from public.student_course_access
  where student_id = matched_student.id;

  return jsonb_build_object(
    'id', matched_student.id,
    'displayName', matched_student.display_name,
    'maxLesson', coalesce((select max_lesson from public.student_course_access where student_id = matched_student.id and stage_number = 1), matched_student.max_lesson),
    'courseAccess', access_data
  );
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
  stage_1_lessons smallint[],
  stage_2_lessons smallint[],
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
    coalesce(a1.allowed_lessons, case when coalesce(a1.max_lesson, 0) > 0 then array(select generate_series(1, a1.max_lesson)::smallint) else '{}'::smallint[] end),
    coalesce(a2.allowed_lessons, case when coalesce(a2.max_lesson, 0) > 0 then array(select generate_series(1, a2.max_lesson)::smallint) else '{}'::smallint[] end),
    (select max(ss.last_seen_at) from public.student_sessions ss where ss.student_id = s.id),
    (select coalesce(sum(st.active_seconds), 0)::bigint from public.study_sessions st where st.student_id = s.id),
    (select count(*)::bigint from public.card_progress cp where cp.student_id = s.id)
  from public.students s
  left join public.student_course_access a1 on a1.student_id = s.id and a1.stage_number = 1
  left join public.student_course_access a2 on a2.student_id = s.id and a2.stage_number = 2
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
begin
  if not public.is_teacher() then raise exception 'Not authorized'; end if;
  if input_stage not in (1, 2) then raise exception 'Invalid course level'; end if;
  if exists(select 1 from unnest(coalesce(input_lessons, '{}'::smallint[])) lesson where lesson < 1 or lesson > 15) then
    raise exception 'Lessons must be between 1 and 15';
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

revoke all on function public.teacher_students() from public, anon;
revoke all on function public.teacher_set_lesson_access(uuid, smallint, smallint[]) from public, anon;
grant execute on function public.teacher_students() to authenticated;
grant execute on function public.teacher_set_lesson_access(uuid, smallint, smallint[]) to authenticated;
