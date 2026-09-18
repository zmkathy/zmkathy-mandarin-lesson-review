import { useEffect, useState } from "react";
import { ArrowLeft, Check, Eye, EyeOff, LogOut, Plus, RefreshCw, ShieldCheck, UserRoundPlus, X } from "lucide-react";
import {
  createTeacherStudent,
  getTeacherStudents,
  resetStudentPin,
  restoreTeacher,
  setLessonAccess,
  setStudentActive,
  signInTeacher,
  signOutTeacher
} from "../services/teacherPortal.js";

const lessonOptions = Array.from({ length: 16 }, (_, index) => index);

function formatLastSeen(value) {
  if (!value) return "Not yet";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function formatStudyTime(seconds) {
  const minutes = Math.round(Number(seconds || 0) / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export default function TeacherPage({ onBack }) {
  const [teacher, setTeacher] = useState(null);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [savingKey, setSavingKey] = useState("");
  const [accessEditor, setAccessEditor] = useState(null);

  useEffect(() => {
    restoreTeacher()
      .then((restoredTeacher) => {
        setTeacher(restoredTeacher);
        if (restoredTeacher) return refreshStudents();
        return null;
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function refreshStudents() {
    setError("");
    try {
      setStudents(await getTeacherStudents());
    } catch {
      setError("Student information could not be loaded.");
    }
  }

  async function handleSignIn(event) {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const signedInTeacher = await signInTeacher(email.trim(), password);
      setTeacher(signedInTeacher);
      await refreshStudents();
    } catch (signInError) {
      setError(signInError.message || "Email or password does not match.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSignOut() {
    await signOutTeacher();
    setTeacher(null);
    setStudents([]);
    setPassword("");
  }

  function openAccessEditor(student, stage) {
    const savedLessons = student[`stage_${stage}_lessons`];
    const fallbackMax = Number(student[`stage_${stage}_lesson`] || 0);
    const selectedLessons = Array.isArray(savedLessons)
      ? savedLessons.map(Number)
      : Array.from({ length: fallbackMax }, (_, index) => index + 1);
    setAccessEditor({ student, stage, selectedLessons });
  }

  function toggleEditorLesson(lessonNumber) {
    setAccessEditor((current) => {
      const selected = new Set(current.selectedLessons);
      if (selected.has(lessonNumber)) selected.delete(lessonNumber);
      else selected.add(lessonNumber);
      return { ...current, selectedLessons: [...selected].sort((a, b) => a - b) };
    });
  }

  async function saveAccessEditor() {
    const { student, stage, selectedLessons } = accessEditor;
    const key = `${student.id}-${stage}`;
    setSavingKey(key);
    setError("");
    try {
      await setLessonAccess(student.id, stage, selectedLessons);
      const highestLesson = selectedLessons.length ? Math.max(...selectedLessons) : 0;
      setStudents((current) => current.map((item) => item.id === student.id
        ? { ...item, [`stage_${stage}_lesson`]: highestLesson, [`stage_${stage}_lessons`]: selectedLessons }
        : item));
      setAccessEditor(null);
    } catch {
      setError("Lesson access could not be saved. Please run the selective-access database update and try again.");
    } finally {
      setSavingKey("");
    }
  }

  async function toggleStudent(student) {
    setSavingKey(`${student.id}-active`);
    try {
      await setStudentActive(student.id, !student.is_active);
      setStudents((current) => current.map((item) => item.id === student.id ? { ...item, is_active: !item.is_active } : item));
    } catch {
      setError("The student account could not be updated.");
    } finally {
      setSavingKey("");
    }
  }

  async function handleResetPin(student) {
    const pin = window.prompt(`Enter a new 4-digit PIN for ${student.display_name}:`);
    if (pin === null) return;
    if (!/^\d{4}$/.test(pin)) {
      setError("A PIN must contain exactly four digits.");
      return;
    }
    try {
      await resetStudentPin(student.id, pin);
      setError("");
      window.alert(`${student.display_name}'s PIN has been updated.`);
    } catch {
      setError("The PIN could not be updated.");
    }
  }

  async function handleCreateStudent(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const displayName = String(form.get("displayName") || "").trim();
    const trialDate = String(form.get("trialDate") || "");
    const pin = trialDate ? `${trialDate.slice(5, 7)}${trialDate.slice(8, 10)}` : "";
    if (!displayName || !/^\d{4}$/.test(pin)) {
      setError("Enter the student's name and trial date.");
      return;
    }

    setSavingKey("new-student");
    try {
      await createTeacherStudent({
        displayName,
        loginName: displayName,
        pin,
        stage1Lesson: Number(form.get("stage1Lesson") || 1)
      });
      event.currentTarget.reset();
      setShowAddStudent(false);
      await refreshStudents();
    } catch (createError) {
      setError(createError.message?.includes("duplicate") ? "A student with this login name already exists." : "The student could not be added.");
    } finally {
      setSavingKey("");
    }
  }

  if (isLoading && !teacher) {
    return <main className="content-page teacher-page"><p className="teacher-loading"><RefreshCw className="is-spinning" size={20} /> Loading teacher access...</p></main>;
  }

  if (!teacher) {
    return (
      <main className="content-page teacher-page">
        <button className="back-button" type="button" onClick={onBack}><ArrowLeft size={18} /> Learning Hub</button>
        <section className="teacher-login">
          <span className="teacher-login-icon"><ShieldCheck size={27} /></span>
          <p className="section-label">Private access</p>
          <h1>Teacher Dashboard</h1>
          <p>Sign in to manage students and course access.</p>
          <form onSubmit={handleSignIn}>
            <label><span>Email</span><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="username" required /></label>
            <label><span>Password</span><span className="teacher-password"><input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? "text" : "password"} autoComplete="current-password" required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>
            {error ? <p className="student-login-error" role="alert">{error}</p> : null}
            <button type="submit">Sign in</button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="content-page teacher-page">
      <header className="teacher-header">
        <div>
          <p className="section-label">Private teacher area</p>
          <h1>Student Management</h1>
          <p>Manage access for two 15-lesson beginner levels.</p>
        </div>
        <div className="teacher-header-actions">
          <button type="button" onClick={() => setShowAddStudent((value) => !value)}><Plus size={18} /> Add student</button>
          <button className="secondary" type="button" onClick={handleSignOut}><LogOut size={18} /> Sign out</button>
        </div>
      </header>

      {showAddStudent ? (
        <form className="add-student-form" onSubmit={handleCreateStudent}>
          <span className="add-student-icon"><UserRoundPlus size={22} /></span>
          <label><span>Student name</span><input name="displayName" type="text" placeholder="Student name" required /></label>
          <label><span>Trial date</span><input name="trialDate" type="date" required /></label>
          <label><span>Level 1 access</span><select name="stage1Lesson" defaultValue="1">{lessonOptions.slice(1).map((number) => <option key={number} value={number}>Lesson {number}</option>)}</select></label>
          <button type="submit" disabled={savingKey === "new-student"}>{savingKey === "new-student" ? "Adding..." : "Add student"}</button>
        </form>
      ) : null}

      {error ? <p className="teacher-error" role="alert">{error}</p> : null}

      <div className="teacher-summary">
        <span><strong>{students.length}</strong> students</span>
        <span><strong>{students.filter((student) => student.is_active).length}</strong> active</span>
        <button type="button" onClick={refreshStudents}><RefreshCw size={16} /> Refresh</button>
      </div>

      <div className="student-admin-table-wrap">
        <table className="student-admin-table">
          <thead><tr><th>Student</th><th>Level 1</th><th>Level 2</th><th>Last visit</th><th>Study time</th><th>Cards</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {students.map((student) => (
              <tr className={student.is_active ? "" : "is-inactive"} key={student.id}>
                <td><strong>{student.display_name}</strong><small>{student.login_name}</small></td>
                {[1, 2].map((stage) => {
                  const selectedLessons = student[`stage_${stage}_lessons`];
                  const count = Array.isArray(selectedLessons) ? selectedLessons.length : Number(student[`stage_${stage}_lesson`] || 0);
                  return <td key={stage}><button className="lesson-access-button" type="button" onClick={() => openAccessEditor(student, stage)}>{count === 0 ? "Not open" : `${count} ${count === 1 ? "lesson" : "lessons"}`}</button></td>;
                })}
                <td>{formatLastSeen(student.last_seen_at)}</td>
                <td>{formatStudyTime(student.active_seconds)}</td>
                <td>{student.marked_items}</td>
                <td><button className={`status-toggle${student.is_active ? " is-active" : ""}`} type="button" onClick={() => toggleStudent(student)}>{student.is_active ? "Active" : "Paused"}</button></td>
                <td><button className="text-action" type="button" onClick={() => handleResetPin(student)}>Reset PIN</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {students.length === 0 ? <p className="empty-state">No students have been added yet.</p> : null}
      </div>

      {accessEditor ? (
        <div className="student-dialog-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setAccessEditor(null);
        }}>
          <section className="lesson-access-dialog" role="dialog" aria-modal="true" aria-labelledby="lesson-access-title">
            <button className="dialog-close" type="button" onClick={() => setAccessEditor(null)} aria-label="Close lesson access"><X size={20} /></button>
            <p className="section-label">{accessEditor.student.display_name} · Level {accessEditor.stage}</p>
            <h2 id="lesson-access-title">Choose lesson access</h2>
            <p>Select only the lesson topics this student should be able to open.</p>
            <div className="lesson-access-shortcuts">
              <button type="button" onClick={() => setAccessEditor((current) => ({ ...current, selectedLessons: lessonOptions.slice(1) }))}>Select all</button>
              <button type="button" onClick={() => setAccessEditor((current) => ({ ...current, selectedLessons: [] }))}>Clear</button>
            </div>
            <div className="lesson-access-grid">
              {lessonOptions.slice(1).map((number) => {
                const checked = accessEditor.selectedLessons.includes(number);
                return <label className={checked ? "is-selected" : ""} key={number}>
                  <input type="checkbox" checked={checked} onChange={() => toggleEditorLesson(number)} />
                  <span>{checked ? <Check size={16} /> : null} Lesson {number}</span>
                </label>;
              })}
            </div>
            <div className="lesson-access-actions">
              <span>{accessEditor.selectedLessons.length} of 15 selected</span>
              <button className="secondary" type="button" onClick={() => setAccessEditor(null)}>Cancel</button>
              <button type="button" onClick={saveAccessEditor} disabled={savingKey === `${accessEditor.student.id}-${accessEditor.stage}`}>{savingKey ? "Saving..." : "Save access"}</button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
