import { useEffect, useMemo, useState } from "react";
import LessonCard from "./components/LessonCard.jsx";
import LessonPage from "./components/LessonPage.jsx";
import { lessons as fallbackLessons } from "./data/lessons.js";
import { parseLessonsText } from "./data/parseLessonsText.js";

export default function App() {
  const [lessons, setLessons] = useState(fallbackLessons);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    fetch("./lessons.txt")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Lesson text file was not found.");
        }

        return response.text();
      })
      .then((text) => {
        const parsedLessons = parseLessonsText(text);

        if (parsedLessons.length > 0) {
          setLessons(parsedLessons);
        }
      })
      .catch(() => {
        setLoadError("Using the built-in lesson copy because lessons.txt could not be loaded.");
      });
  }, []);

  const selectedLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === selectedLessonId),
    [lessons, selectedLessonId]
  );

  if (selectedLesson) {
    return <LessonPage lesson={selectedLesson} onBack={() => setSelectedLessonId(null)} />;
  }

  return (
    <main className="page home-page">
      <header className="site-header">
        <p className="site-kicker">Mi's Mandarin</p>
        <h1>Lesson Review</h1>
        <p>
          Review key vocabulary and sentences. Tap the speaker button as many times as you need.
        </p>
        {loadError ? <p className="content-note">{loadError}</p> : null}
      </header>

      <section className="lesson-list" aria-label="Lessons">
        {lessons.map((lesson) => (
          <LessonCard key={lesson.id} lesson={lesson} onSelect={setSelectedLessonId} />
        ))}
      </section>
    </main>
  );
}
