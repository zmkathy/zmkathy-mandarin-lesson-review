import { ArrowLeft, ArrowRight } from "lucide-react";
import VocabularyCard from "./VocabularyCard.jsx";
import SentenceCard from "./SentenceCard.jsx";

function getLessonAudioSrc(lessonNumber, section, itemNumber) {
  if (lessonNumber > 3) return undefined;

  const filename = `${section}-${String(itemNumber).padStart(2, "0")}.mp3`;
  return `${import.meta.env.BASE_URL}audio/lesson-review/lesson-${lessonNumber}/${filename}`;
}

export default function LessonPage({
  lesson,
  lessonNumber,
  totalLessons,
  onBack,
  onPrevious,
  onNext,
  previousTitle,
  nextTitle
}) {
  return (
    <main className="content-page lesson-page">
      <button className="back-button" type="button" onClick={onBack}>
        <ArrowLeft size={19} />
        Beginner Course
      </button>

      <header className="lesson-header">
        <span className="lesson-badge">{String(lessonNumber).padStart(2, "0")}</span>
        <div>
          <p className="section-label">Lesson {lessonNumber} of {totalLessons}</p>
          <h1>{lesson.title}</h1>
          <p className="lesson-summary">
            {lesson.vocabulary.length} key words · {lesson.sentences.length} key sentences
          </p>
        </div>
      </header>

      <section className="lesson-section" aria-labelledby="vocabulary-title">
        <div className="lesson-section-heading">
          <h2 id="vocabulary-title">Key Vocabulary</h2>
          <span>{lesson.vocabulary.length}</span>
        </div>
        <div className="card-list">
          {lesson.vocabulary.map((item, index) => (
            <VocabularyCard
              key={`${lesson.id}-${item.hanzi}`}
              item={item}
              index={index + 1}
              audioSrc={getLessonAudioSrc(lessonNumber, "vocabulary", index + 1)}
            />
          ))}
        </div>
      </section>

      <section className="lesson-section" aria-labelledby="sentences-title">
        <div className="lesson-section-heading">
          <h2 id="sentences-title">Key Sentences</h2>
          <span>{lesson.sentences.length}</span>
        </div>
        <div className="card-list">
          {lesson.sentences.map((item, index) => (
            <SentenceCard
              key={`${lesson.id}-${item.hanzi}`}
              item={item}
              index={index + 1}
              audioSrc={getLessonAudioSrc(lessonNumber, "sentence", index + 1)}
            />
          ))}
        </div>
      </section>

      <nav className="lesson-pagination" aria-label="Lesson navigation">
        {onPrevious ? (
          <button type="button" onClick={onPrevious}>
            <ArrowLeft size={19} />
            <span><small>Previous lesson</small><strong>{previousTitle}</strong></span>
          </button>
        ) : <span />}
        {onNext ? (
          <button className="next-lesson" type="button" onClick={onNext}>
            <span><small>Next lesson</small><strong>{nextTitle}</strong></span>
            <ArrowRight size={19} />
          </button>
        ) : <span />}
      </nav>
    </main>
  );
}
