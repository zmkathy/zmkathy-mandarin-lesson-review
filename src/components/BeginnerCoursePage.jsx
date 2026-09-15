import { useState } from "react";
import { BookOpen, GalleryHorizontalEnd, MessagesSquare } from "lucide-react";
import LessonCard from "./LessonCard.jsx";
import SentencePractice from "./SentencePractice.jsx";
import VocabularyPractice from "./VocabularyPractice.jsx";

export default function BeginnerCoursePage({ lessons, loadError, onSelectLesson }) {
  const [mode, setMode] = useState("lessons");

  return (
    <main className="content-page course-page">
      <header className="page-intro course-intro">
        <div>
          <p className="section-label">Beginner level</p>
          <h1>Beginner Course</h1>
          <p>Review lessons, vocabulary, and sentences from Lessons 1–{lessons.length}.</p>
        </div>
        <span className="lesson-count">{lessons.length} lessons</span>
      </header>

      {loadError ? <p className="content-note">{loadError}</p> : null}

      <nav className="course-tabs" aria-label="Beginner course modes">
        <button className={mode === "lessons" ? "is-active" : ""} type="button" onClick={() => setMode("lessons")}>
          <BookOpen size={18} /> Lesson Review
        </button>
        <button className={mode === "vocabulary" ? "is-active" : ""} type="button" onClick={() => setMode("vocabulary")}>
          <GalleryHorizontalEnd size={18} /> Vocabulary Practice
        </button>
        <button className={mode === "sentences" ? "is-active" : ""} type="button" onClick={() => setMode("sentences")}>
          <MessagesSquare size={18} /> Sentence Practice
        </button>
      </nav>

      {mode === "sentences" ? (
        <SentencePractice lessons={lessons} />
      ) : mode === "vocabulary" ? (
        <VocabularyPractice lessons={lessons} />
      ) : (
        <section className="course-module" aria-labelledby="lesson-review-title">
          <div className="section-heading course-module-heading">
            <div>
              <p className="section-label">Beginner course</p>
              <h2 id="lesson-review-title">Lesson Review</h2>
            </div>
          </div>
          <div className="lesson-list" aria-label="Lessons">
            {lessons.map((lesson, index) => (
              <LessonCard key={lesson.id} lesson={lesson} lessonNumber={index + 1} onSelect={onSelectLesson} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
