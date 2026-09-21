import { ArrowRight, AudioLines, BookOpen, CheckCircle2, GalleryHorizontalEnd, Images, LockKeyhole, MessagesSquare, ShieldCheck } from "lucide-react";
import { getAvailableLessonNumbers } from "../lib/courseAccess.js";
import StudentProgress from "./StudentProgress.jsx";

export default function HomePage({ lessons, onNavigate, onOpenCourse, student, studentPortalEnabled, teacherLoggedIn }) {
  const totalItems = lessons.reduce(
    (total, lesson) => total + lesson.vocabulary.length + lesson.sentences.length,
    0
  );
  const availableLessonCount = getAvailableLessonNumbers(student, 1, lessons.length).length;

  return (
    <main className="content-page hub-page">
      {student ? (
        <>
          <section className="student-welcome" aria-label="Student learning access">
            <span className="student-welcome-icon"><CheckCircle2 size={23} /></span>
            <div>
              <p className="section-label">Your learning space</p>
              <h2>Welcome back, {student.displayName}</h2>
              <p>{availableLessonCount > 0
                ? `${availableLessonCount} ${availableLessonCount === 1 ? "lesson is" : "lessons are"} ready for you. Pinyin and everyday vocabulary are also ready to practice.`
                : "Your Level 1 lessons have not been opened yet. Pinyin and everyday vocabulary are still ready to practice."}</p>
            </div>
            <button type="button" onClick={() => onOpenCourse("lessons")}>Continue learning <ArrowRight size={18} /></button>
          </section>
          <StudentProgress
            lessons={lessons}
            availableLessonNumbers={getAvailableLessonNumbers(student, 1, lessons.length)}
            student={student}
            onContinue={() => onOpenCourse("vocabulary")}
          />
        </>
      ) : null}

      <section className="hub-section core-learning" aria-labelledby="core-learning-title">
        <div className="section-heading">
          <div>
            <p className="section-label">Start here</p>
            <h2 id="core-learning-title">Choose your learning path</h2>
          </div>
        </div>
        <div className="core-resource-grid">
          <button className="resource-card core-resource resource-lessons" type="button" onClick={() => onNavigate("course")}>
            <span className="resource-icon"><BookOpen size={28} /></span>
            <span className="resource-copy">
              <span className="resource-kicker">Level 1 · Beginner Course</span>
              <strong>Beginner Course</strong>
              <span>Follow your Level 1 lesson path, then choose the practice you need.</span>
              <small>{student
                ? `${availableLessonCount} of ${lessons.length} lessons available`
                : teacherLoggedIn
                  ? `${lessons.length} lessons · Full teacher access`
                  : studentPortalEnabled
                    ? "Sign in to see your lessons"
                    : `${lessons.length} lessons · ${totalItems} review items`}</small>
            </span>
            {studentPortalEnabled && !student && !teacherLoggedIn ? <LockKeyhole className="resource-arrow" size={22} /> : <ArrowRight className="resource-arrow" size={23} />}
          </button>
          <button className="resource-card core-resource resource-pinyin" type="button" onClick={() => onNavigate("pinyin")}>
            <span className="resource-icon"><AudioLines size={30} /></span>
            <span className="resource-copy">
              <span className="resource-kicker">Pronunciation</span>
              <strong>Pinyin Chart</strong>
              <span>Listen to initials, finals, complete syllables, and four tones.</span>
              <small>403 sounds · native audio</small>
            </span>
            <ArrowRight className="resource-arrow" size={23} />
          </button>
        </div>
      </section>

      <section className="hub-section course-start" aria-labelledby="start-learning-title">
        <div className="section-heading">
          <div>
            <p className="section-label">Practice</p>
            <h2 id="start-learning-title">Words and sentences</h2>
          </div>
        </div>
        <p className="course-start-copy">Use the cards and listening activities to build confidence between lessons.</p>
        <div className="course-action-grid">
          <button className="course-action course-action-vocabulary" type="button" onClick={() => onOpenCourse("vocabulary")}>
            <span className="course-action-icon"><GalleryHorizontalEnd size={24} /></span>
            <span className="course-action-copy">
              <span className="course-action-step">01 · Remember</span>
              <strong>Vocabulary Cards</strong>
              <span>Practice pinyin first, then reveal the Chinese and meaning.</span>
              <small>Cards · audio · saved progress</small>
            </span>
            {studentPortalEnabled && !student && !teacherLoggedIn ? <LockKeyhole className="course-action-arrow" size={21} /> : <ArrowRight className="course-action-arrow" size={22} />}
          </button>
          <button className="course-action course-action-sentences" type="button" onClick={() => onOpenCourse("sentences")}>
            <span className="course-action-icon"><MessagesSquare size={24} /></span>
            <span className="course-action-copy">
              <span className="course-action-step">02 · Use</span>
              <strong>Sentence Practice</strong>
              <span>Listen, understand the meaning, and build useful sentences.</span>
              <small>Sentence cards · listening quiz</small>
            </span>
            {studentPortalEnabled && !student && !teacherLoggedIn ? <LockKeyhole className="course-action-arrow" size={21} /> : <ArrowRight className="course-action-arrow" size={22} />}
          </button>
        </div>
      </section>

      <section className="hub-section extra-practice" aria-labelledby="extra-practice-title">
        <div className="section-heading">
          <div>
            <p className="section-label">Explore</p>
            <h2 id="extra-practice-title">Everyday vocabulary</h2>
          </div>
        </div>
        <div className="resource-grid resource-grid-compact">
          <button className="resource-card resource-everyday" type="button" onClick={() => onNavigate("everyday")}>
            <span className="resource-icon"><Images size={25} /></span>
            <span className="resource-copy">
              <span className="resource-kicker">Picture practice</span>
              <strong>Everyday Vocabulary</strong>
              <span>Use picture flashcards for useful words and everyday topics.</span>
              <small>{student ? "Picture cards · audio · saved progress" : teacherLoggedIn ? "Full teacher access" : "Sign in to open your vocabulary practice"}</small>
            </span>
            {studentPortalEnabled && !student && !teacherLoggedIn ? <LockKeyhole className="resource-arrow" size={21} /> : <ArrowRight className="resource-arrow" size={23} />}
          </button>
        </div>
      </section>

      <footer className="hub-footer">
        <button type="button" onClick={() => onNavigate("teacher")}><ShieldCheck size={15} /> Teacher access</button>
      </footer>
    </main>
  );
}
