import { ArrowLeft } from "lucide-react";
import VocabularyCard from "./VocabularyCard.jsx";
import SentenceCard from "./SentenceCard.jsx";

export default function LessonPage({ lesson, onBack }) {
  return (
    <main className="page lesson-page">
      <button className="back-button" type="button" onClick={onBack}>
        <ArrowLeft size={19} />
        Lessons
      </button>

      <header className="lesson-header">
        <p className="lesson-eyebrow">Review</p>
        <h1>{lesson.title}</h1>
        <p className="lesson-summary">
          {lesson.vocabulary.length} key words · {lesson.sentences.length} key sentences
        </p>
      </header>

      <section className="lesson-section" aria-labelledby="vocabulary-title">
        <h2 id="vocabulary-title">Key Vocabulary</h2>
        <div className="card-list">
          {lesson.vocabulary.map((item) => (
            <VocabularyCard key={`${lesson.id}-${item.hanzi}`} item={item} />
          ))}
        </div>
      </section>

      <section className="lesson-section" aria-labelledby="sentences-title">
        <h2 id="sentences-title">Key Sentences</h2>
        <div className="card-list">
          {lesson.sentences.map((item) => (
            <SentenceCard key={`${lesson.id}-${item.hanzi}`} item={item} />
          ))}
        </div>
      </section>
    </main>
  );
}
