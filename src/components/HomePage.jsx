import { ArrowRight, AudioLines, BookOpen, CheckCircle2, GalleryHorizontalEnd, Images, LockKeyhole, MessagesSquare, ShieldCheck } from "lucide-react";
import { getAvailableLessonNumbers } from "../lib/courseAccess.js";
import StudentProgress from "./StudentProgress.jsx";

export default function HomePage({ lessons, onNavigate, onOpenCourse, student, studentPortalEnabled, teacherLoggedIn }) {
  const totalItems = lessons.reduce(
    (total, lesson) => total + lesson.vocabulary.length + lesson.sentences.length,
    0
  );
  const availableLessonCount = getAvailableLessonNumbers(student, 1, lessons.length).length;
  const hasCurrentCourse = teacherLoggedIn || (Boolean(student) && availableLessonCount > 0);

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
            <p className="section-label">01 · Learn</p>
            <h2 id="core-learning-title">Your learning path</h2>
          </div>
        </div>
        <div className="core-resource-grid">
          <button className="resource-card core-resource resource-lessons" type="button" onClick={() => hasCurrentCourse ? onOpenCourse("lessons") : onNavigate("course")}>
            <span className="resource-icon"><BookOpen size={28} /></span>
            <span className="resource-copy">
              <span className="resource-kicker">{hasCurrentCourse ? "Level 1 · Foundation Course" : "Structured Mandarin practice"}</span>
              <strong>{hasCurrentCourse ? "Beginner Mandarin · Level 1" : "Learning Courses"}</strong>
              <span>{hasCurrentCourse
                ? "Review lessons, vocabulary, and useful sentences in one place."
                : "Sign in to track your learning path and save your practice progress."}</span>
              <small>{student
                ? `${availableLessonCount} of ${lessons.length} lessons available`
                : teacherLoggedIn
                  ? `${lessons.length} lessons · Full teacher access`
                  : studentPortalEnabled
                    ? "Course access · Saved progress"
                    : `${lessons.length} lessons · ${totalItems} review items`}</small>
            </span>
            <span className="course-entry-route" aria-hidden="true">
              <span>Lesson Review</span><i>·</i><span>Vocabulary Cards</span><i>·</i><span>Sentence Practice</span>
            </span>
            {studentPortalEnabled && !student && !teacherLoggedIn ? <LockKeyhole className="resource-arrow" size={22} /> : <ArrowRight className="resource-arrow" size={23} />}
          </button>
          <button className="resource-card core-resource resource-pinyin" type="button" onClick={() => onNavigate("pinyin")}>
            <span className="resource-icon"><AudioLines size={30} /></span>
            <span className="resource-copy">
              <span className="resource-kicker">Pronunciation</span>
              <strong>Pinyin Chart</strong>
              <span>Hear every initial, final, and syllable clearly, then build confidence with the four tones.</span>
              <small>403 sounds · Tone practice · Native audio</small>
            </span>
            <span className="pinyin-tone-sample" aria-hidden="true">
              <small>Four tones</small>
              <strong>mā&nbsp; má&nbsp; mǎ&nbsp; mà</strong>
            </span>
            <ArrowRight className="resource-arrow" size={23} />
          </button>
        </div>
      </section>

      <section className="hub-section course-start" aria-labelledby="start-learning-title">
        <div className="section-heading">
          <div>
            <p className="section-label">02 · Practice your lesson</p>
            <h2 id="start-learning-title">Build confidence between lessons</h2>
          </div>
        </div>
        <p className="course-start-copy">Turn recent lessons into words and sentences you can hear, recall, and use.</p>
        <div className="course-action-grid">
          <button className="course-action course-action-vocabulary" type="button" onClick={() => onOpenCourse("vocabulary")}>
            <span className="course-action-icon"><GalleryHorizontalEnd size={24} /></span>
            <span className="course-action-copy">
              <span className="course-action-step">01 · Remember</span>
              <strong>Vocabulary Cards</strong>
              <span>Hear the word, recall the pinyin, then reveal the Chinese and meaning.</span>
              <small>Audio cards · listening quiz · saved progress</small>
            </span>
            {studentPortalEnabled && !student && !teacherLoggedIn ? <LockKeyhole className="course-action-arrow" size={21} /> : <ArrowRight className="course-action-arrow" size={22} />}
          </button>
          <button className="course-action course-action-sentences" type="button" onClick={() => onOpenCourse("sentences")}>
            <span className="course-action-icon"><MessagesSquare size={24} /></span>
            <span className="course-action-copy">
              <span className="course-action-step">02 · Use</span>
              <strong>Sentence Practice</strong>
              <span>Listen to each sentence, understand the meaning, then practise speaking it with confidence.</span>
              <small>Sentence cards · listening quiz · saved progress</small>
            </span>
            {studentPortalEnabled && !student && !teacherLoggedIn ? <LockKeyhole className="course-action-arrow" size={21} /> : <ArrowRight className="course-action-arrow" size={22} />}
          </button>
        </div>
      </section>

      <section className="hub-section extra-practice" aria-labelledby="extra-practice-title">
        <div className="section-heading">
          <div>
            <p className="section-label">03 · More to explore</p>
            <h2 id="extra-practice-title">Everyday vocabulary</h2>
          </div>
        </div>
        <div className="resource-grid resource-grid-compact">
          <button className="resource-card resource-everyday" type="button" onClick={() => onNavigate("everyday")}>
            <span className="resource-icon"><Images size={25} /></span>
            <span className="resource-copy">
              <span className="resource-kicker">Picture practice</span>
              <strong>Everyday Vocabulary</strong>
              <span>Build practical daily vocabulary with clear picture cards and audio.</span>
              <small>{student ? "Picture cards · audio · saved progress" : teacherLoggedIn ? "Full teacher access" : "Picture cards · audio · saved progress"}</small>
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
