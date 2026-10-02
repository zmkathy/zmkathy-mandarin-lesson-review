import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpenCheck, CheckCircle2, RotateCcw } from "lucide-react";
import { getCardProgress } from "../services/studentPortal.js";

function getProgressKey(item, courseId) {
  return `${courseId}:${item.hanzi}-${item.pinyin}`;
}

export default function StudentProgress({ lessons, availableLessonNumbers, student, onContinue, courseId }) {
  const [progress, setProgress] = useState({ vocabulary: {}, sentences: {} });
  const availableLessons = useMemo(
    () => lessons.filter((_, index) => availableLessonNumbers.includes(index + 1)),
    [availableLessonNumbers, lessons]
  );

  useEffect(() => {
    if (!student?.token || student.id === "demo") return;
    let isCurrent = true;
    Promise.all([
      getCardProgress(student.token, "lesson_vocabulary"),
      getCardProgress(student.token, "lesson_sentences")
    ]).then(([vocabulary, sentences]) => {
      if (isCurrent) setProgress({ vocabulary, sentences });
    });
    return () => { isCurrent = false; };
  }, [student?.id, student?.token]);

  const overview = useMemo(() => {
    const allItems = [];
    availableLessons.forEach((lesson) => {
      lesson.vocabulary.forEach((item) => allItems.push({ type: "vocabulary", key: getProgressKey(item, courseId) }));
      lesson.sentences.forEach((item) => allItems.push({ type: "sentences", key: getProgressKey(item, courseId) }));
    });
    const uniqueItems = [...new Map(allItems.map((item) => [`${item.type}:${item.key}`, item])).values()];
    const getStatus = ({ type, key }) => progress[type]?.[key];
    const known = uniqueItems.filter((item) => getStatus(item) === "known").length;
    const review = uniqueItems.filter((item) => getStatus(item) === "review").length;
    return {
      total: uniqueItems.length,
      reviewed: known + review,
      known,
      review,
      newItems: uniqueItems.length - known - review
    };
  }, [availableLessons, courseId, progress]);

  if (availableLessons.length === 0) return null;

  const progressPercent = overview.total ? Math.round((overview.reviewed / overview.total) * 100) : 0;

  return (
    <section className="student-progress" id="my-progress" aria-labelledby="student-progress-title" tabIndex="-1">
      <div className="student-progress-heading">
        <div>
          <p className="section-label">Your progress</p>
          <h2 id="student-progress-title">Course review progress</h2>
          <p>Vocabulary and sentence cards are saved when you choose <strong>Know it</strong> or <strong>Review again</strong>.</p>
        </div>
        <button type="button" onClick={onContinue}>Continue cards <ArrowRight size={17} /></button>
      </div>

      <div className="student-progress-overview">
        <div className="student-progress-ring" style={{ "--progress": `${progressPercent}%` }}>
          <strong>{progressPercent}%</strong>
          <span>reviewed</span>
        </div>
        <div className="student-progress-stats">
          <div><BookOpenCheck size={18} /><strong>{overview.reviewed}</strong><span>Reviewed</span></div>
          <div><CheckCircle2 size={18} /><strong>{overview.known}</strong><span>Know it</span></div>
          <div><RotateCcw size={18} /><strong>{overview.review}</strong><span>Review again</span></div>
          <div><strong>{overview.newItems}</strong><span>Still new</span></div>
        </div>
      </div>

      <div className="student-lesson-progress" aria-label="Lesson vocabulary progress">
        {availableLessons.map((lesson) => {
          const lessonNumber = lessons.indexOf(lesson) + 1;
          const items = [
            ...lesson.vocabulary.map((item) => ({ type: "vocabulary", key: getProgressKey(item, courseId) })),
            ...lesson.sentences.map((item) => ({ type: "sentences", key: getProgressKey(item, courseId) }))
          ];
          const uniqueItems = [...new Map(items.map((item) => [`${item.type}:${item.key}`, item])).values()];
          const reviewed = uniqueItems.filter(({ type, key }) => {
            return Boolean(progress[type]?.[key]);
          }).length;
          const percent = uniqueItems.length ? Math.round((reviewed / uniqueItems.length) * 100) : 0;
          return (
            <div className="student-lesson-progress-item" key={lesson.id}>
              <div><strong>Lesson {lessonNumber}</strong><span>{reviewed} / {uniqueItems.length} reviewed</span></div>
              <span className="student-lesson-progress-track"><span style={{ width: `${percent}%` }} /></span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
