import { useEffect, useMemo, useState } from "react";
import BeginnerCoursePage from "./components/BeginnerCoursePage.jsx";
import HomePage from "./components/HomePage.jsx";
import LessonPage from "./components/LessonPage.jsx";
import PinyinChart from "./components/PinyinChart.jsx";
import SiteHeader from "./components/SiteHeader.jsx";
import { lessons as fallbackLessons } from "./data/lessons.js";
import { parseLessonsText } from "./data/parseLessonsText.js";

export default function App() {
  const [lessons, setLessons] = useState(fallbackLessons);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [activeView, setActiveView] = useState("home");
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
  const selectedLessonNumber = lessons.findIndex((lesson) => lesson.id === selectedLessonId) + 1;

  function navigate(view) {
    setSelectedLessonId(null);
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (selectedLesson) {
    return (
      <div className="site-shell">
        <SiteHeader activeView="course" onNavigate={navigate} />
        <LessonPage
          lesson={selectedLesson}
          lessonNumber={selectedLessonNumber}
          totalLessons={lessons.length}
          onBack={() => setSelectedLessonId(null)}
          onPrevious={selectedLessonNumber > 1 ? () => setSelectedLessonId(lessons[selectedLessonNumber - 2].id) : null}
          onNext={selectedLessonNumber < lessons.length ? () => setSelectedLessonId(lessons[selectedLessonNumber].id) : null}
          previousTitle={selectedLessonNumber > 1 ? lessons[selectedLessonNumber - 2].title : ""}
          nextTitle={selectedLessonNumber < lessons.length ? lessons[selectedLessonNumber].title : ""}
        />
      </div>
    );
  }

  return (
    <div className="site-shell">
      <SiteHeader activeView={activeView} onNavigate={navigate} />
      {activeView === "home" ? (
        <HomePage
          lessons={lessons}
          loadError={loadError}
          onNavigate={navigate}
        />
      ) : activeView === "pinyin" ? (
        <PinyinChart />
      ) : (
        <BeginnerCoursePage lessons={lessons} loadError={loadError} onSelectLesson={setSelectedLessonId} />
      )}
    </div>
  );
}
