import { ChevronRight } from "lucide-react";

export default function LessonCard({ lesson, lessonNumber, onSelect }) {
  return (
    <button className="lesson-card" type="button" onClick={() => onSelect(lesson.id)}>
      <span>
        <span className="lesson-number">Lesson {lessonNumber}</span>
        <strong>{lesson.title}</strong>
        <span className="lesson-meta">
          {lesson.vocabulary.length} words · {lesson.sentences.length} sentences
        </span>
      </span>
      <ChevronRight size={22} strokeWidth={2.2} />
    </button>
  );
}
