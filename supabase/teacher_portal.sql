create table if not exists public.course_stages (
  stage_number smallint primary key check (stage_number > 0),
  title text not null,
  total_lessons smallint not null check (total_lessons > 0)
);

insert into public.course_stages (stage_number, title, total_lessons)
values (1, 'Beginner Level 1', 15), (2, 'Beginner Level 2', 15)
on conflict (stage_number) do update
set title = excluded.title, total_lessons = excluded.total_lessons;

create table if not exists public.student_course_access (
  student_id uuid not null references public.students(id) on delete cascade,
  stage_number smallint not null references public.course_stages(stage_number),
  max_lesson smallint not null default 0 check (max_lesson between 0 and 15),
  updated_at timestamptz not null default now(),
  primary key (student_id, stage_number)
);

alter table public.student_course_access
add column if not exists allowed_lessons smallint[];

create table if not exists public.teachers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

alter table public.course_stages enable row level security;
alter table public.student_course_access enable row level security;
alter table public.teachers enable row level security;

revoke all on public.course_stages from anon, authenticated;
revoke all on public.student_course_access from anon, authenticated;
revoke all on public.teachers from anon, authenticated;

insert into public.student_course_access (student_id, stage_number, max_lesson)
select id, 1, max_lesson from public.students
on conflict (student_id, stage_number) do nothing;

insert into public.student_course_access (student_id, stage_number, max_lesson)
select id, 2, 0 from public.students
on conflict (student_id, stage_number) do nothing;

create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.teachers where user_id = auth.uid());
$$;

revoke all on function public.is_teacher() from public, anon;
grant execute on function public.is_teacher() to authenticated;

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
      case when max_lesson > 0
        then array(select generate_series(1, max_lesson)::smallint)
        else '{}'::smallint[]
      end
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
      case when max_lesson > 0
        then array(select generate_series(1, max_lesson)::smallint)
        else '{}'::smallint[]
      end
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

create or replace function public.teacher_create_student(
  input_display_name text,
  input_login_name text,
  input_pin text,
  input_stage_1 smallint default 1
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare new_student_id uuid;
begin
  if not public.is_teacher() then raise exception 'Not authorized'; end if;
  if input_pin !~ '^[0-9]{4}$' then raise exception 'PIN must contain four digits'; end if;
  if input_stage_1 < 0 or input_stage_1 > 15 then raise exception 'Lesson access must be between 0 and 15'; end if;

  insert into public.students (display_name, login_name, pin_hash, max_lesson)
  values (trim(input_display_name), public.normalize_student_name(input_login_name), crypt(input_pin, gen_salt('bf')), greatest(input_stage_1, 1))
  returning id into new_student_id;

  insert into public.student_course_access (student_id, stage_number, max_lesson)
  values (new_student_id, 1, input_stage_1), (new_student_id, 2, 0);
  return new_student_id;
end;
$$;

create or replace function public.teacher_set_course_access(input_student_id uuid, input_stage smallint, input_max_lesson smallint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_teacher() then raise exception 'Not authorized'; end if;
  if input_stage not in (1, 2) or input_max_lesson < 0 or input_max_lesson > 15 then
    raise exception 'Invalid course access';
  end if;
  insert into public.student_course_access (student_id, stage_number, max_lesson, updated_at)
  values (input_student_id, input_stage, input_max_lesson, now())
  on conflict (student_id, stage_number) do update
  set max_lesson = excluded.max_lesson,
      allowed_lessons = case when excluded.max_lesson > 0 then array(select generate_series(1, excluded.max_lesson)::smallint) else '{}'::smallint[] end,
      updated_at = now();
  if input_stage = 1 then
    update public.students set max_lesson = greatest(input_max_lesson, 1), updated_at = now() where id = input_student_id;
  end if;
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

create or replace function public.teacher_set_student_active(input_student_id uuid, input_is_active boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_teacher() then raise exception 'Not authorized'; end if;
  update public.students set is_active = input_is_active, updated_at = now() where id = input_student_id;
end;
$$;

create or replace function public.teacher_reset_student_pin(input_student_id uuid, input_pin text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.is_teacher() then raise exception 'Not authorized'; end if;
  if input_pin !~ '^[0-9]{4}$' then raise exception 'PIN must contain four digits'; end if;
  update public.students set pin_hash = crypt(input_pin, gen_salt('bf')), updated_at = now() where id = input_student_id;
  delete from public.student_sessions where student_id = input_student_id;
end;
$$;

grant execute on function public.teacher_students() to authenticated;
grant execute on function public.teacher_create_student(text, text, text, smallint) to authenticated;
grant execute on function public.teacher_set_course_access(uuid, smallint, smallint) to authenticated;
grant execute on function public.teacher_set_lesson_access(uuid, smallint, smallint[]) to authenticated;
grant execute on function public.teacher_set_student_active(uuid, boolean) to authenticated;
grant execute on function public.teacher_reset_student_pin(uuid, text) to authenticated;

create or replace function public.student_start_study_session(input_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  matched_student_id uuid;
  new_session_id uuid;
begin
  matched_student_id := public.student_id_for_token(input_token);
  if matched_student_id is null then return null; end if;
  insert into public.study_sessions (student_id) values (matched_student_id)
  returning id into new_session_id;
  return new_session_id;
end;
$$;

create or replace function public.student_add_study_time(input_token text, input_session_id uuid, input_seconds integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare matched_student_id uuid;
begin
  matched_student_id := public.student_id_for_token(input_token);
  if matched_student_id is null or input_seconds < 1 or input_seconds > 60 then return; end if;
  update public.study_sessions
  set active_seconds = active_seconds + input_seconds, ended_at = now()
  where id = input_session_id and student_id = matched_student_id;
end;
$$;

create or replace function public.student_card_progress(input_token text, input_practice_type text)
returns table (item_key text, status text)
language plpgsql
security definer
set search_path = public
as $$
declare matched_student_id uuid;
begin
  matched_student_id := public.student_id_for_token(input_token);
  if matched_student_id is null then return; end if;
  return query select cp.item_key, cp.status
  from public.card_progress cp
  where cp.student_id = matched_student_id and cp.practice_type = input_practice_type;
end;
$$;

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

grant execute on function public.student_start_study_session(text) to anon, authenticated;
grant execute on function public.student_add_study_time(text, uuid, integer) to anon, authenticated;
grant execute on function public.student_card_progress(text, text) to anon, authenticated;
grant execute on function public.student_save_card_progress(text, text, text, text) to anon, authenticated;

-- After creating your teacher in Authentication > Users, run this once with your email:
-- insert into public.teachers (user_id, display_name)
-- select id, 'Mi' from auth.users where email = 'your-email@example.com'
-- on conflict (user_id) do update set display_name = excluded.display_name;
