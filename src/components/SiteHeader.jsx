import { AudioLines, BookOpen, GraduationCap, House, LogOut, UserRound } from "lucide-react";

export default function SiteHeader({ activeView, onNavigate, student, studentPortalEnabled, onStudentLogin, onStudentLogout }) {
  return (
    <header className="topbar">
      <button className="brand" type="button" onClick={() => onNavigate("home")}>
        <span className="brand-mark" aria-label="Mì">Mì</span>
        <span className="brand-copy"><strong>Mi's Mandarin</strong><small>Learning Hub</small></span>
      </button>
      <div className="header-actions">
      <nav className="primary-nav" aria-label="Main navigation">
        <button className={activeView === "home" ? "is-active" : ""} type="button" onClick={() => onNavigate("home")}>
          <House size={18} /> Home
        </button>
        <button className={activeView === "course" ? "is-active" : ""} type="button" onClick={() => onNavigate("course")}>
          <BookOpen size={18} /> Beginner Course
        </button>
        <button className={activeView === "pinyin" ? "is-active" : ""} type="button" onClick={() => onNavigate("pinyin")}>
          <AudioLines size={18} /> Pinyin Chart
        </button>
        {activeView === "teacher" ? (
          <button className="is-active" type="button">
            <GraduationCap size={18} /> Teacher
          </button>
        ) : null}
      </nav>
      {student ? (
        <div className="student-menu">
          <span><UserRound size={17} /> {student.displayName}</span>
          <button type="button" onClick={onStudentLogout} aria-label="Sign out" title="Sign out"><LogOut size={17} /></button>
        </div>
      ) : studentPortalEnabled && activeView !== "teacher" ? (
        <button className="student-login-button" type="button" onClick={onStudentLogin}>
          <UserRound size={17} /> Student sign in
        </button>
      ) : null}
      </div>
    </header>
  );
}
