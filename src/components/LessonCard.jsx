import { ChevronRight, LockKeyhole } from "lucide-react";

export default function LessonCard({ lesson, lessonNumber, onSelect, locked = false }) {
  return (
    <button className={`lesson-card${locked ? " is-locked" : ""}`} type="button" onClick={() => onSelect(lesson.id)} disabled={locked}>
      <span>
        <span className="lesson-number">Lesson {lessonNumber}</span>
        <strong>{lesson.title}</strong>
        <span className="lesson-meta">{locked ? "Not available yet" : `${lesson.vocabulary.length} words · ${lesson.sentences.length} sentences`}</span>
      </span>
      {locked ? <LockKeyhole size={20} /> : <ChevronRight size={22} strokeWidth={2.2} />}
    </button>
  );
}
