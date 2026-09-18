import { supabase } from "../lib/supabase.js";

export async function restoreTeacher() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;
  const { data: isTeacher } = await supabase.rpc("is_teacher");
  return isTeacher ? data.session.user : null;
}

export async function signInTeacher(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const { data: isTeacher, error: teacherError } = await supabase.rpc("is_teacher");
  if (teacherError || !isTeacher) {
    await supabase.auth.signOut();
    throw new Error("This account does not have teacher access.");
  }
  return data.user;
}

export async function signOutTeacher() {
  await supabase.auth.signOut();
}

export async function getTeacherStudents() {
  const { data, error } = await supabase.rpc("teacher_students");
  if (error) throw error;
  return data;
}

export async function createTeacherStudent({ displayName, loginName, pin, stage1Lesson }) {
  const { error } = await supabase.rpc("teacher_create_student", {
    input_display_name: displayName,
    input_login_name: loginName,
    input_pin: pin,
    input_stage_1: stage1Lesson
  });
  if (error) throw error;
}

export async function setCourseAccess(studentId, stage, maxLesson) {
  const { error } = await supabase.rpc("teacher_set_course_access", {
    input_student_id: studentId,
    input_stage: stage,
    input_max_lesson: maxLesson
  });
  if (error) throw error;
}

export async function setLessonAccess(studentId, stage, lessons) {
  const { error } = await supabase.rpc("teacher_set_lesson_access", {
    input_student_id: studentId,
    input_stage: stage,
    input_lessons: lessons
  });
  if (error) throw error;
}

export async function setStudentActive(studentId, isActive) {
  const { error } = await supabase.rpc("teacher_set_student_active", {
    input_student_id: studentId,
    input_is_active: isActive
  });
  if (error) throw error;
}

export async function resetStudentPin(studentId, pin) {
  const { error } = await supabase.rpc("teacher_reset_student_pin", {
    input_student_id: studentId,
    input_pin: pin
  });
  if (error) throw error;
}
