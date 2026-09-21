create extension if not exists pgcrypto with schema extensions;

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  login_name text not null unique,
  pin_hash text not null,
  max_lesson smallint not null default 1 check (max_lesson between 1 and 15),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  token_hash bytea not null unique,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '90 days')
);

create table if not exists public.card_progress (
  student_id uuid not null references public.students(id) on delete cascade,
  practice_type text not null check (practice_type in ('lesson_vocabulary', 'lesson_sentences', 'everyday_vocabulary')),
  item_key text not null,
  status text not null check (status in ('known', 'review')),
  updated_at timestamptz not null default now(),
  primary key (student_id, practice_type, item_key)
);

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  active_seconds integer not null default 0 check (active_seconds >= 0)
);

alter table public.students enable row level security;
alter table public.student_sessions enable row level security;
alter table public.card_progress enable row level security;
alter table public.study_sessions enable row level security;

revoke all on public.students from anon, authenticated;
revoke all on public.student_sessions from anon, authenticated;
revoke all on public.card_progress from anon, authenticated;
revoke all on public.study_sessions from anon, authenticated;

create or replace function public.normalize_student_name(input_name text)
returns text
language sql
immutable
set search_path = public
as $$
  select lower(regexp_replace(trim(input_name), '\s+', ' ', 'g'));
$$;

create or replace function public.student_id_for_token(input_token text)
returns uuid
language sql
security definer
set search_path = public, extensions
as $$
  select student_id
  from public.student_sessions
  where token_hash = digest(input_token, 'sha256')
    and expires_at > now()
  limit 1;
$$;

revoke all on function public.student_id_for_token(text) from public, anon, authenticated;

create or replace function public.student_login(input_name text, input_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  matched_student public.students%rowtype;
  session_token text;
begin
  if input_pin !~ '^[0-9]{4}$' then
    return null;
  end if;

  select * into matched_student
  from public.students
  where login_name = public.normalize_student_name(input_name)
    and is_active = true
  limit 1;

  if matched_student.id is null or matched_student.pin_hash <> crypt(input_pin, matched_student.pin_hash) then
    perform pg_sleep(0.35);
    return null;
  end if;

  delete from public.student_sessions where expires_at <= now();
  session_token := encode(gen_random_bytes(32), 'hex');

  insert into public.student_sessions (student_id, token_hash)
  values (matched_student.id, digest(session_token, 'sha256'));

  return jsonb_build_object(
    'token', session_token,
    'student', jsonb_build_object(
      'id', matched_student.id,
      'displayName', matched_student.display_name,
      'maxLesson', matched_student.max_lesson
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
begin
  select s.* into matched_student
  from public.students s
  join public.student_sessions ss on ss.student_id = s.id
  where ss.token_hash = digest(input_token, 'sha256')
    and ss.expires_at > now()
    and s.is_active = true
  limit 1;

  if matched_student.id is null then return null; end if;

  update public.student_sessions
  set last_seen_at = now()
  where token_hash = digest(input_token, 'sha256');

  return jsonb_build_object(
    'id', matched_student.id,
    'displayName', matched_student.display_name,
    'maxLesson', matched_student.max_lesson
  );
end;
$$;

create or replace function public.student_logout(input_token text)
returns void
language sql
security definer
set search_path = public, extensions
as $$
  delete from public.student_sessions where token_hash = digest(input_token, 'sha256');
$$;

grant execute on function public.student_login(text, text) to anon, authenticated;
grant execute on function public.student_me(text) to anon, authenticated;
grant execute on function public.student_logout(text) to anon, authenticated;

-- Add students from the SQL Editor after replacing the sample values:
-- insert into public.students (display_name, login_name, pin_hash, max_lesson)
-- values ('Sample Student', public.normalize_student_name('Sample Student'), crypt('0000', gen_salt('bf')), 4);
