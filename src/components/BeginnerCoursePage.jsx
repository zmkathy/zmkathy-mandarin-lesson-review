import { useState } from "react";
import { ArrowLeft, BookOpen, GalleryHorizontalEnd, MessagesSquare } from "lucide-react";
import LessonCard from "./LessonCard.jsx";
import SentencePractice from "./SentencePractice.jsx";
import VocabularyPractice from "./VocabularyPractice.jsx";
import { getAvailableLessonNumbers } from "../lib/courseAccess.js";

export default function BeginnerCoursePage({ lessons, loadError, onSelectLesson, onBackToCourses, student, initialMode = "lessons" }) {
  const [mode, setMode] = useState(initialMode);
  const availableLessonNumbers = getAvailableLessonNumbers(student, 1, lessons.length);
  const availableLessonSet = new Set(availableLessonNumbers);
  const availableLessonCount = availableLessonNumbers.length;
  const availableLessons = lessons
    .map((lesson, index) => ({ ...lesson, lessonNumber: index + 1 }))
    .filter((lesson) => availableLessonSet.has(lesson.lessonNumber));

  return (
    <main className="content-page course-page">
      <button className="back-button course-library-back" type="button" onClick={onBackToCourses}>
        <ArrowLeft size={18} />
        My Courses
      </button>
      <header className="page-intro course-intro">
        <div>
          <p className="section-label">My Courses · Level 1</p>
          <h1>Beginner Mandarin · Level 1</h1>
          <p>{availableLessonCount > 0
            ? `Review ${availableLessonCount} available ${availableLessonCount === 1 ? "lesson" : "lessons"}, vocabulary, and sentences.`
            : "Your Level 1 lessons have not been opened yet."}</p>
        </div>
        <span className="lesson-count">{availableLessonCount} of {lessons.length} lessons available</span>
      </header>

      {loadError ? <p className="content-note">{loadError}</p> : null}

      <nav className="course-tabs" aria-label="Course practice modes">
        <button className={mode === "lessons" ? "is-active" : ""} type="button" onClick={() => setMode("lessons")}>
          <BookOpen size={18} /> Lesson Review
        </button>
        <button className={mode === "vocabulary" ? "is-active" : ""} type="button" onClick={() => setMode("vocabulary")}>
          <GalleryHorizontalEnd size={18} /> Vocabulary Cards
        </button>
        <button className={mode === "sentences" ? "is-active" : ""} type="button" onClick={() => setMode("sentences")}>
          <MessagesSquare size={18} /> Sentence Practice
        </button>
      </nav>

      {mode === "sentences" ? (
        <SentencePractice lessons={availableLessons} student={student} />
      ) : mode === "vocabulary" ? (
        <VocabularyPractice lessons={availableLessons} student={student} />
      ) : (
        <section className="course-module" aria-labelledby="lesson-review-title">
          <div className="section-heading course-module-heading">
            <div>
              <p className="section-label">Level 1 course</p>
              <h2 id="lesson-review-title">Lesson Review</h2>
            </div>
          </div>
          <div className="lesson-list" aria-label="Lessons">
            {lessons.map((lesson, index) => (
              <LessonCard key={lesson.id} lesson={lesson} lessonNumber={index + 1} onSelect={onSelectLesson} locked={!availableLessonSet.has(index + 1)} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
