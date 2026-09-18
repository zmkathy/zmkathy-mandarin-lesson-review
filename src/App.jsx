import { useEffect, useMemo, useState } from "react";
import BeginnerCoursePage from "./components/BeginnerCoursePage.jsx";
import HomePage from "./components/HomePage.jsx";
import LessonPage from "./components/LessonPage.jsx";
import PinyinChart from "./components/PinyinChart.jsx";
import SiteHeader from "./components/SiteHeader.jsx";
import StudentLoginDialog from "./components/StudentLoginDialog.jsx";
import TeacherPage from "./components/TeacherPage.jsx";
import { lessons as fallbackLessons } from "./data/lessons.js";
import { parseLessonsText } from "./data/parseLessonsText.js";
import { getAvailableLessonNumbers } from "./lib/courseAccess.js";
import { addStudyTime, isStudentPortalConfigured, restoreStudentSession, signInStudent, signOutStudent, startStudySession } from "./services/studentPortal.js";

export default function App() {
  const [lessons, setLessons] = useState(fallbackLessons);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [activeView, setActiveView] = useState(() => new URLSearchParams(window.location.search).get("view") === "teacher" ? "teacher" : "home");
  const [loadError, setLoadError] = useState("");
  const [student, setStudent] = useState(null);
  const [showStudentLogin, setShowStudentLogin] = useState(false);
  const studentPortalEnabled = isStudentPortalConfigured;

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

  useEffect(() => {
    if (!student?.token || student.id === "demo") return undefined;
    let sessionId = null;
    let lastActivity = Date.now();
    const noteActivity = () => { lastActivity = Date.now(); };

    startStudySession(student.token).then((id) => { sessionId = id; });
    window.addEventListener("pointerdown", noteActivity);
    window.addEventListener("keydown", noteActivity);
    window.addEventListener("scroll", noteActivity, { passive: true });

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible" && Date.now() - lastActivity < 90000) {
        addStudyTime(student.token, sessionId, 30);
      }
    }, 30000);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("pointerdown", noteActivity);
      window.removeEventListener("keydown", noteActivity);
      window.removeEventListener("scroll", noteActivity);
    };
  }, [student?.id, student?.token]);

  useEffect(() => {
    restoreStudentSession().then((restoredStudent) => {
      if (restoredStudent) setStudent(restoredStudent);
    });
  }, []);

  const selectedLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === selectedLessonId),
    [lessons, selectedLessonId]
  );
  const selectedLessonNumber = lessons.findIndex((lesson) => lesson.id === selectedLessonId) + 1;
  const availableLessonNumbers = getAvailableLessonNumbers(student, 1, lessons.length);
  const availableLessonSet = new Set(availableLessonNumbers);
  const selectedAvailableIndex = availableLessonNumbers.indexOf(selectedLessonNumber);

  function navigate(view) {
    if (view === "course" && studentPortalEnabled && !student) {
      setShowStudentLogin(true);
      return;
    }
    setSelectedLessonId(null);
    setActiveView(view);
    const nextUrl = view === "teacher" ? `${window.location.pathname}?view=teacher` : window.location.pathname;
    window.history.replaceState({}, "", nextUrl);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleStudentSignIn(name, pin) {
    const signedInStudent = await signInStudent(name, pin);
    setStudent(signedInStudent);
    setShowStudentLogin(false);
    setSelectedLessonId(null);
    setActiveView("home");
  }

  function handleStudentSignOut() {
    signOutStudent(student?.token);
    setStudent(null);
    setSelectedLessonId(null);
    setActiveView("home");
  }

  if (selectedLesson) {
    return (
      <div className="site-shell">
        <SiteHeader activeView="course" onNavigate={navigate} student={student} studentPortalEnabled={studentPortalEnabled} onStudentLogin={() => setShowStudentLogin(true)} onStudentLogout={handleStudentSignOut} />
        <LessonPage
          lesson={selectedLesson}
          lessonNumber={selectedLessonNumber}
          totalLessons={lessons.length}
          onBack={() => setSelectedLessonId(null)}
          onPrevious={selectedAvailableIndex > 0 ? () => setSelectedLessonId(lessons[availableLessonNumbers[selectedAvailableIndex - 1] - 1].id) : null}
          onNext={selectedAvailableIndex >= 0 && selectedAvailableIndex < availableLessonNumbers.length - 1 ? () => setSelectedLessonId(lessons[availableLessonNumbers[selectedAvailableIndex + 1] - 1].id) : null}
          previousTitle={selectedAvailableIndex > 0 ? lessons[availableLessonNumbers[selectedAvailableIndex - 1] - 1].title : ""}
          nextTitle={selectedAvailableIndex >= 0 && selectedAvailableIndex < availableLessonNumbers.length - 1 ? lessons[availableLessonNumbers[selectedAvailableIndex + 1] - 1].title : ""}
        />
      </div>
    );
  }

  return (
    <div className="site-shell">
      <SiteHeader activeView={activeView} onNavigate={navigate} student={student} studentPortalEnabled={studentPortalEnabled} onStudentLogin={() => setShowStudentLogin(true)} onStudentLogout={handleStudentSignOut} />
      {activeView === "home" ? (
        <HomePage
          lessons={lessons}
          loadError={loadError}
          onNavigate={navigate}
          student={student}
          studentPortalEnabled={studentPortalEnabled}
        />
      ) : activeView === "teacher" ? (
        <TeacherPage onBack={() => navigate("home")} />
      ) : activeView === "pinyin" ? (
        <PinyinChart />
      ) : (
        <BeginnerCoursePage lessons={lessons} loadError={loadError} onSelectLesson={(lessonId) => {
          const lessonNumber = lessons.findIndex((lesson) => lesson.id === lessonId) + 1;
          if (availableLessonSet.has(lessonNumber)) setSelectedLessonId(lessonId);
        }} student={student} />
      )}
      <StudentLoginDialog
        isOpen={showStudentLogin}
        isConfigured={isStudentPortalConfigured}
        onClose={() => setShowStudentLogin(false)}
        onSignIn={handleStudentSignIn}
        onPreview={() => {
          setStudent({
            id: "demo",
            displayName: "Demo Student",
            maxLesson: 8,
            courseAccess: [{ stage: 1, maxLesson: 8, lessons: [2, 5, 8] }]
          });
          setShowStudentLogin(false);
          setActiveView("home");
        }}
      />
    </div>
  );
}
