import { isStudentPortalConfigured, supabase } from "../lib/supabase.js";

const TOKEN_KEY = "mis-mandarin-student-session-v1";

function normalizeStudent(payload, token) {
  if (!payload) return null;
  return {
    id: payload.id,
    displayName: payload.displayName,
    maxLesson: payload.maxLesson,
    courseAccess: payload.courseAccess || [{ stage: 1, maxLesson: payload.maxLesson }],
    token
  };
}

export { isStudentPortalConfigured };

export async function signInStudent(name, pin) {
  if (!supabase) throw new Error("Student access is not configured yet.");

  const { data, error } = await supabase.rpc("student_login", {
    input_name: name,
    input_pin: pin
  });

  if (error) throw error;
  if (!data?.token || !data?.student) throw new Error("Name or PIN does not match.");

  window.localStorage.setItem(TOKEN_KEY, data.token);
  return normalizeStudent(data.student, data.token);
}

export async function restoreStudentSession() {
  if (!supabase) return null;
  const token = window.localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  const { data, error } = await supabase.rpc("student_me", { input_token: token });
  if (error || !data) {
    window.localStorage.removeItem(TOKEN_KEY);
    return null;
  }

  return normalizeStudent(data, token);
}

export async function signOutStudent(token) {
  window.localStorage.removeItem(TOKEN_KEY);
  if (!supabase || !token) return;
  await supabase.rpc("student_logout", { input_token: token });
}

export async function startStudySession(token) {
  const { data } = await supabase.rpc("student_start_study_session", { input_token: token });
  return data || null;
}

export async function addStudyTime(token, sessionId, seconds) {
  if (!sessionId) return;
  await supabase.rpc("student_add_study_time", {
    input_token: token,
    input_session_id: sessionId,
    input_seconds: seconds
  });
}

export async function getCardProgress(token, practiceType) {
  const { data, error } = await supabase.rpc("student_card_progress", {
    input_token: token,
    input_practice_type: practiceType
  });
  if (error) return {};
  return Object.fromEntries(data.map((item) => [item.item_key, item.status]));
}

export async function saveCardProgress(token, practiceType, itemKey, status) {
  await supabase.rpc("student_save_card_progress", {
    input_token: token,
    input_practice_type: practiceType,
    input_item_key: itemKey,
    input_status: status
  });
}
