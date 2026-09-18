import { ArrowRight, AudioLines, BookOpen, CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";
import { getAvailableLessonNumbers } from "../lib/courseAccess.js";

export default function HomePage({ lessons, onNavigate, loadError, student, studentPortalEnabled, teacherLoggedIn }) {
  const totalItems = lessons.reduce(
    (total, lesson) => total + lesson.vocabulary.length + lesson.sentences.length,
    0
  );
  const availableLessonCount = getAvailableLessonNumbers(student, 1, lessons.length).length;

  return (
    <main className="content-page hub-page">
      <header className="hub-intro">
        <div className="hub-heading">
          <h1>
            <span>Mi's Mandarin</span>
            <span className="hub-title-accent">Learning Hub</span>
          </h1>
          <p>Lessons, pronunciation, and practice activities in one place.</p>
        </div>
      </header>

      {loadError ? <p className="content-note">{loadError}</p> : null}

      {student ? (
        <section className="student-welcome" aria-label="Student learning access">
          <span className="student-welcome-icon"><CheckCircle2 size={23} /></span>
          <div>
            <p className="section-label">Your learning space</p>
            <h2>Welcome back, {student.displayName}</h2>
            <p>{availableLessonCount > 0
              ? `${availableLessonCount} ${availableLessonCount === 1 ? "lesson is" : "lessons are"} ready for you. Pinyin and everyday vocabulary are always available.`
              : "Your Level 1 lessons have not been opened yet. Pinyin and everyday vocabulary are still available."}</p>
          </div>
          <button type="button" onClick={() => onNavigate("course")}>Continue learning <ArrowRight size={18} /></button>
        </section>
      ) : null}

      <section className="hub-section" aria-labelledby="start-learning-title">
        <div className="section-heading">
          <div>
            <p className="section-label">Study tools</p>
            <h2 id="start-learning-title">Explore &amp; Practice</h2>
          </div>
        </div>
        <div className="resource-grid">
          <button className="resource-card resource-lessons" type="button" onClick={() => onNavigate("course")}>
            <span className="resource-icon"><BookOpen size={25} /></span>
            <span className="resource-copy">
              <span className="resource-kicker">Beginner level</span>
              <strong>Beginner Course</strong>
              <span>Review vocabulary and useful sentences from every class.</span>
              <small>{student
                ? `${availableLessonCount} of ${lessons.length} lessons available`
                : teacherLoggedIn
                  ? `${lessons.length} lessons · Full teacher access`
                  : studentPortalEnabled
                    ? "Sign in to see your available lessons"
                    : `${lessons.length} lessons · ${totalItems} review items`}</small>
            </span>
            {studentPortalEnabled && !student && !teacherLoggedIn ? <LockKeyhole className="resource-arrow" size={21} /> : <ArrowRight className="resource-arrow" size={23} />}
          </button>

          <button className="resource-card resource-pinyin" type="button" onClick={() => onNavigate("pinyin")}>
            <span className="resource-icon"><AudioLines size={26} /></span>
            <span className="resource-copy">
              <span className="resource-kicker">Pronunciation</span>
              <strong>Pinyin Chart</strong>
              <span>Explore initials, finals, complete syllables, and four tones.</span>
              <small>403 sounds · Tone Perfect native audio</small>
            </span>
            <ArrowRight className="resource-arrow" size={23} />
          </button>
        </div>
      </section>

      <footer className="hub-footer">
        <button type="button" onClick={() => onNavigate("teacher")}><ShieldCheck size={15} /> Teacher access</button>
      </footer>
    </main>
  );
}
