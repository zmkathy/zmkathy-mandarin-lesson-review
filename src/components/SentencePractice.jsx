import { useEffect, useMemo, useState } from "react";
import { Check, Eye, EyeOff, Headphones, Search, Shuffle, X } from "lucide-react";
import SpeakButton from "./SpeakButton.jsx";
import { getReviewAudioSrc } from "../utils/reviewAudio.js";

function collectSentences(lessons) {
  const uniqueItems = new Map();

  lessons.forEach((lesson, lessonIndex) => {
    const lessonNumber = lesson.lessonNumber ?? lessonIndex + 1;
    lesson.sentences.forEach((item, itemIndex) => {
      const key = `${item.hanzi}-${item.pinyin}`;
      const existing = uniqueItems.get(key);

      if (existing) {
        existing.lessonNumbers.push(lessonNumber);
        return;
      }

      uniqueItems.set(key, {
        ...item,
        id: `${lesson.id}-sentence-${itemIndex}`,
        audioLessonNumber: lessonNumber,
        audioItemNumber: itemIndex + 1,
        lessonNumbers: [lessonNumber]
      });
    });
  });

  return [...uniqueItems.values()];
}

function getQuizChoices(items, activeItem, version) {
  if (!activeItem) return [];

  const alternatives = items.filter((item) => item.id !== activeItem.id);
  const seed = [...`${activeItem.id}-${version}`].reduce((total, character) => total + character.charCodeAt(0), 0);
  const picked = alternatives
    .map((item, index) => ({ item, order: (index * 17 + seed) % 97 }))
    .sort((first, second) => first.order - second.order)
    .slice(0, 2)
    .map(({ item }) => item);

  return [activeItem, ...picked]
    .map((item, index) => ({ item, order: (index * 23 + seed) % 89 }))
    .sort((first, second) => first.order - second.order)
    .map(({ item }) => item);
}

function shuffleItems(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

export default function SentencePractice({ lessons }) {
  const [view, setView] = useState("cards");
  const [lessonFilter, setLessonFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [stages, setStages] = useState({});
  const [shuffleVersion, setShuffleVersion] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const sentences = useMemo(() => collectSentences(lessons), [lessons]);

  const visibleSentences = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = sentences.filter((item) => {
      const matchesLesson = lessonFilter === "all"
        || item.lessonNumbers.includes(Number(lessonFilter));
      const matchesQuery = !normalizedQuery
        || `${item.hanzi} ${item.pinyin} ${item.english}`.toLowerCase().includes(normalizedQuery);
      return matchesLesson && matchesQuery;
    });

    if (shuffleVersion === 0) return filtered;
    return shuffleItems(filtered);
  }, [lessonFilter, query, sentences, shuffleVersion]);

  const activeQuizIndex = Math.min(quizIndex, Math.max(visibleSentences.length - 1, 0));
  const activeQuizItem = visibleSentences[activeQuizIndex];
  const quizChoices = useMemo(
    () => getQuizChoices(visibleSentences, activeQuizItem, shuffleVersion),
    [activeQuizItem, shuffleVersion, visibleSentences]
  );

  useEffect(() => {
    setQuizIndex(0);
  }, [lessonFilter, query, shuffleVersion]);

  useEffect(() => {
    setQuizAnswer(null);
  }, [activeQuizItem?.id]);

  function advanceCard(id) {
    setStages((current) => {
      const currentStage = current[id] || 0;
      return { ...current, [id]: currentStage >= 2 ? 0 : currentStage + 1 };
    });
  }

  function moveQuiz(direction) {
    if (visibleSentences.length < 2) return;
    setQuizIndex((current) => (current + direction + visibleSentences.length) % visibleSentences.length);
  }

  return (
    <section className="sentence-practice" aria-labelledby="sentence-practice-title">
      <div className="section-heading practice-heading">
        <div>
          <p className="section-label">Beginner course</p>
          <h2 id="sentence-practice-title">Sentence Practice</h2>
        </div>
        <span className="result-count">{visibleSentences.length} sentences</span>
      </div>

      <div className="practice-view-switch" role="group" aria-label="Sentence practice view">
        <button className={view === "cards" ? "is-active" : ""} type="button" onClick={() => setView("cards")}>
          Sentence cards
        </button>
        <button className={view === "quiz" ? "is-active" : ""} type="button" onClick={() => setView("quiz")}>
          <Headphones size={17} /> Listening quiz
        </button>
      </div>

      <div className="practice-toolbar sentence-toolbar">
        <label className="filter-field">
          <span>Lesson</span>
          <select value={lessonFilter} onChange={(event) => setLessonFilter(event.target.value)}>
            <option value="all">All lessons</option>
            {lessons.map((lesson, index) => (
              <option value={lesson.lessonNumber ?? index + 1} key={lesson.id}>Lesson {lesson.lessonNumber ?? index + 1}: {lesson.title}</option>
            ))}
          </select>
        </label>

        <label className="practice-search">
          <span>Search</span>
          <span className="search-input-wrap">
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Chinese, Pinyin, or English" />
          </span>
        </label>

        <button className="toolbar-button" type="button" onClick={() => setShuffleVersion((value) => value + 1)}>
          <Shuffle size={18} /> Shuffle
        </button>

        {view === "cards" ? (
          <label className="answer-toggle">
            <input type="checkbox" checked={showAll} onChange={(event) => setShowAll(event.target.checked)} />
            <span>
              {showAll ? <EyeOff size={18} /> : <Eye size={18} />}
              {showAll ? "Hide answers" : "Show answers"}
            </span>
          </label>
        ) : null}
      </div>

      {view === "quiz" && activeQuizItem ? (
        <article className="listening-quiz" aria-live="polite">
          <div className="listening-quiz-top">
            <small>{activeQuizItem.lessonNumbers.map((number) => `Lesson ${number}`).join(" · ")}</small>
            <span>{activeQuizIndex + 1} / {visibleSentences.length}</span>
          </div>
          <div className="listening-quiz-prompt">
            <SpeakButton
              className="listening-audio-button"
              text={activeQuizItem.hanzi}
              audioSrc={getReviewAudioSrc(activeQuizItem.audioLessonNumber, "sentence", activeQuizItem.audioItemNumber)}
            />
            <div>
              <p className="section-label">Listen and choose</p>
              <h3>What did you hear?</h3>
              <p>Play the sentence as many times as you need.</p>
            </div>
          </div>
          <div className="listening-choices" role="group" aria-label="Choose the sentence you heard">
            {quizChoices.map((choice) => {
              const isCorrect = choice.id === activeQuizItem.id;
              const isSelected = quizAnswer && choice.id === quizAnswer.id;
              const resultClass = quizAnswer
                ? isCorrect ? "is-correct" : isSelected ? "is-incorrect" : ""
                : "";
              return (
                <button
                  className={`listening-choice ${resultClass}`.trim()}
                  type="button"
                  key={choice.id}
                  disabled={Boolean(quizAnswer)}
                  onClick={() => setQuizAnswer({ id: choice.id, correct: isCorrect })}
                >
                  {quizAnswer && isCorrect ? <Check size={18} /> : quizAnswer && isSelected ? <X size={18} /> : null}
                  <span>{choice.english}</span>
                </button>
              );
            })}
          </div>
          {quizAnswer ? (
            <div className={`listening-feedback ${quizAnswer.correct ? "is-correct" : "is-incorrect"}`}>
              {quizAnswer.correct ? "Correct. Nice listening." : `The answer was: ${activeQuizItem.english}`}
              <span>{activeQuizItem.hanzi} · {activeQuizItem.pinyin} · {activeQuizItem.english}</span>
            </div>
          ) : null}
          <div className="listening-quiz-actions">
            <button type="button" onClick={() => moveQuiz(-1)} disabled={visibleSentences.length < 2}>Previous</button>
            <button type="button" onClick={() => moveQuiz(1)} disabled={visibleSentences.length < 2}>Next sentence</button>
          </div>
        </article>
      ) : view === "cards" && visibleSentences.length > 0 ? (
        <div className="sentence-practice-grid">
          {visibleSentences.map((item) => {
            const stage = showAll ? 2 : stages[item.id] || 0;
            const actionLabel = stage === 0 ? "Show Pinyin" : stage === 1 ? "Show Chinese" : "Hide answer";
            return (
              <article className={`sentence-practice-card stage-${stage}`} key={item.id}>
                <div className="sentence-practice-top">
                  <small>{item.lessonNumbers.map((number) => `Lesson ${number}`).join(" · ")}</small>
                </div>
                <p className="sentence-prompt">{item.english}</p>
                <div className="sentence-practice-answer" aria-live="polite">
                  {stage >= 1 ? <p className="sentence-practice-pinyin">{item.pinyin}</p> : <span className="sentence-answer-placeholder">•••</span>}
                  {stage >= 2 ? <p className="sentence-practice-hanzi">{item.hanzi}</p> : null}
                </div>
                <button className="sentence-step-button" type="button" onClick={() => advanceCard(item.id)} disabled={showAll}>
                  {stage >= 2 ? <EyeOff size={17} /> : <Eye size={17} />} {showAll ? "Answers shown" : actionLabel}
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="empty-state">No sentences match these filters.</p>
      )}
    </section>
  );
}
