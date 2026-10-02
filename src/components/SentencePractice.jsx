import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Eye, EyeOff, Headphones, RotateCcw, Search, Shuffle, X } from "lucide-react";
import SpeakButton from "./SpeakButton.jsx";
import { getReviewAudioSrc } from "../utils/reviewAudio.js";
import { getCardProgress, saveCardProgress } from "../services/studentPortal.js";

const STORAGE_KEY = "mis-mandarin-sentence-progress-v1";

function loadProgress(storageKey) {
  try {
    return JSON.parse(window.localStorage.getItem(storageKey)) || {};
  } catch {
    return {};
  }
}

function collectSentences(lessons, courseId) {
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
        progressKey: `${courseId}:${key}`,
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

export default function SentencePractice({ lessons, student, course }) {
  const storageKey = `${STORAGE_KEY}-${course.id}${student?.id ? `-${student.id}` : ""}`;
  const [view, setView] = useState("practice");
  const [lessonFilter, setLessonFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("continue");
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [stages, setStages] = useState({});
  const [shuffleVersion, setShuffleVersion] = useState(0);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceRevealed, setPracticeRevealed] = useState(false);
  const [quizQueue, setQuizQueue] = useState([]);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [quizStats, setQuizStats] = useState({ correct: 0, retries: 0 });
  const [progress, setProgress] = useState(() => loadProgress(storageKey));
  const sentences = useMemo(() => collectSentences(lessons, course.id), [course.id, lessons]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(progress));
    } catch {
      // Practice still works when browser storage is unavailable.
    }
  }, [progress, storageKey]);

  useEffect(() => {
    if (!student?.token || student.id === "demo") return;
    getCardProgress(student.token, "lesson_sentences").then((savedProgress) => {
      setProgress((current) => ({ ...current, ...savedProgress }));
    });
  }, [student?.id, student?.token]);

  const visibleSentences = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = sentences.filter((item) => {
      const matchesLesson = lessonFilter === "all"
        || item.lessonNumbers.includes(Number(lessonFilter));
      const itemStatus = progress[item.progressKey];
      const matchesStatus = statusFilter === "all"
        || (statusFilter === "continue" && itemStatus !== "known")
        || (statusFilter === "unmarked" && !itemStatus)
        || itemStatus === statusFilter;
      const matchesQuery = !normalizedQuery
        || `${item.hanzi} ${item.pinyin} ${item.english}`.toLowerCase().includes(normalizedQuery);
      return matchesLesson && matchesStatus && matchesQuery;
    });

    if (shuffleVersion === 0) return filtered;
    return shuffleItems(filtered);
  }, [lessonFilter, progress, query, sentences, shuffleVersion, statusFilter]);

  const quizSentences = useMemo(() => {
    const itemsById = new Map(visibleSentences.map((item) => [item.id, item]));
    return quizQueue.map((id) => itemsById.get(id)).filter(Boolean);
  }, [quizQueue, visibleSentences]);

  const activeQuizItem = quizSentences[0];
  const activePracticeIndex = Math.min(practiceIndex, Math.max(visibleSentences.length - 1, 0));
  const activePracticeItem = visibleSentences[activePracticeIndex];
  const quizChoices = useMemo(
    () => getQuizChoices(visibleSentences, activeQuizItem, shuffleVersion),
    [activeQuizItem, shuffleVersion, visibleSentences]
  );

  useEffect(() => {
    setPracticeIndex(0);
    setPracticeRevealed(false);
  }, [lessonFilter, query, shuffleVersion, statusFilter]);

  useEffect(() => {
    setQuizQueue(visibleSentences.map((item) => item.id));
    setQuizAnswer(null);
    setQuizStats({ correct: 0, retries: 0 });
  }, [visibleSentences]);

  function advanceCard(id) {
    setStages((current) => {
      const currentStage = current[id] || 0;
      return { ...current, [id]: currentStage >= 2 ? 0 : currentStage + 1 };
    });
  }

  function answerQuiz(choice) {
    if (quizAnswer || !activeQuizItem) return;
    setQuizAnswer({ id: choice.id, correct: choice.id === activeQuizItem.id });
  }

  function advanceQuiz() {
    if (!quizAnswer || !activeQuizItem) return;
    setQuizQueue((current) => quizAnswer.correct
      ? current.slice(1)
      : [...current.slice(1), current[0]]);
    setQuizStats((current) => ({
      correct: current.correct + (quizAnswer.correct ? 1 : 0),
      retries: current.retries + (quizAnswer.correct ? 0 : 1)
    }));
    setQuizAnswer(null);
  }

  function restartQuiz() {
    setQuizQueue(visibleSentences.map((item) => item.id));
    setQuizAnswer(null);
    setQuizStats({ correct: 0, retries: 0 });
  }

  function movePractice(direction) {
    if (visibleSentences.length < 2) return;
    setPracticeIndex((current) => (current + direction + visibleSentences.length) % visibleSentences.length);
    setPracticeRevealed(false);
  }

  function markPracticeItem(status) {
    if (!activePracticeItem) return;
    setProgress((current) => ({ ...current, [activePracticeItem.progressKey]: status }));
    if (student?.token && student.id !== "demo") {
      saveCardProgress(student.token, "lesson_sentences", activePracticeItem.progressKey, status);
    }
    setPracticeRevealed(false);
    if (!(statusFilter === "continue" && status === "known") && visibleSentences.length > 1) {
      setPracticeIndex((current) => (current + 1) % visibleSentences.length);
    }
  }

  return (
    <section className="sentence-practice" aria-labelledby="sentence-practice-title">
      <div className="section-heading practice-heading">
        <div>
          <p className="section-label">Beginner course</p>
          <h2 id="sentence-practice-title">Sentence Practice</h2>
        </div>
        <span className="result-count">{view === "quiz" ? `${quizSentences.length} left` : `${visibleSentences.length} sentences`}</span>
      </div>

      <div className="practice-view-switch" role="group" aria-label="Sentence practice view">
        <button className={view === "practice" ? "is-active" : ""} type="button" onClick={() => setView("practice")}>
          Sentence cards
        </button>
        <button className={view === "browse" ? "is-active" : ""} type="button" onClick={() => setView("browse")}>
          Browse sentences
        </button>
        <button className={view === "quiz" ? "is-active" : ""} type="button" onClick={() => { setStatusFilter("all"); setView("quiz"); }}>
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

        <label className="filter-field">
          <span>{view === "quiz" ? "Quiz set" : "Practice set"}</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="continue">Continue learning</option>
            <option value="review">Review again</option>
            <option value="all">All cards</option>
            <option value="unmarked">Not marked</option>
            <option value="known">Know it</option>
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

        {view === "browse" ? (
          <label className="answer-toggle">
            <input type="checkbox" checked={showAll} onChange={(event) => setShowAll(event.target.checked)} />
            <span>
              {showAll ? <EyeOff size={18} /> : <Eye size={18} />}
              {showAll ? "Hide answers" : "Show answers"}
            </span>
          </label>
        ) : null}
      </div>

      {view === "quiz" && quizSentences.length === 0 ? (
        <section className="empty-state">
          <strong>{visibleSentences.length === 0 ? "No cards match these filters." : "Quiz complete."}</strong>
          {visibleSentences.length > 0 ? <><br />Every card in this set was answered correctly.<br /><button type="button" onClick={restartQuiz}>Start this quiz again</button></> : null}
        </section>
      ) : view === "practice" && activePracticeItem ? (
        <article className={`focus-sentence-card ${practiceRevealed ? "is-revealed" : ""} ${progress[activePracticeItem.progressKey] ? `is-${progress[activePracticeItem.progressKey]}` : ""}`}>
          <div className="focus-card-top">
            <small>{activePracticeItem.lessonNumbers.map((number) => `Lesson ${number}`).join(" · ")}</small>
            <span>{activePracticeIndex + 1} / {visibleSentences.length}</span>
          </div>
          <button className="focus-card-main focus-sentence-main" type="button" onClick={() => setPracticeRevealed((current) => !current)}>
            <span className="focus-sentence-pinyin">{activePracticeItem.pinyin}</span>
            {practiceRevealed ? (
              <span className="focus-answer">
                <span>{activePracticeItem.hanzi}</span>
                <small>{activePracticeItem.english}</small>
              </span>
            ) : (
              <span className="focus-reveal"><Eye size={17} /> Reveal meaning</span>
            )}
          </button>
          <div className="focus-card-actions">
            <button className="focus-nav-button" type="button" onClick={() => movePractice(-1)} disabled={visibleSentences.length < 2} aria-label="Previous sentence" title="Previous sentence"><ChevronLeft size={21} /></button>
            <SpeakButton
              className="practice-audio-button"
              text={activePracticeItem.hanzi}
              audioSrc={course.recordedAudio ? getReviewAudioSrc(activePracticeItem.audioLessonNumber, "sentence", activePracticeItem.audioItemNumber) : undefined}
            />
            <button className="focus-sentence-reveal" type="button" onClick={() => setPracticeRevealed((current) => !current)}>
              {practiceRevealed ? <EyeOff size={17} /> : <Eye size={17} />} {practiceRevealed ? "Hide meaning" : "Reveal meaning"}
            </button>
            <button className="focus-status-button is-review" type="button" onClick={() => markPracticeItem("review")}>
              <RotateCcw size={17} /> Review again
            </button>
            <button className="focus-status-button is-known" type="button" onClick={() => markPracticeItem("known")}>
              <Check size={17} /> Know it
            </button>
            <button className="focus-nav-button" type="button" onClick={() => movePractice(1)} disabled={visibleSentences.length < 2} aria-label="Next sentence" title="Next sentence"><ChevronRight size={21} /></button>
          </div>
        </article>
      ) : view === "quiz" && activeQuizItem ? (
        <article className="listening-quiz" aria-live="polite">
          <div className="listening-quiz-top">
            <small>{activeQuizItem.lessonNumbers.map((number) => `Lesson ${number}`).join(" · ")}</small>
            <span>{quizSentences.length} left · {quizStats.correct} correct</span>
          </div>
          <div className="listening-quiz-prompt">
            <SpeakButton
              className="listening-audio-button"
              text={activeQuizItem.hanzi}
              audioSrc={course.recordedAudio ? getReviewAudioSrc(activeQuizItem.audioLessonNumber, "sentence", activeQuizItem.audioItemNumber) : undefined}
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
                  onClick={() => answerQuiz(choice)}
                >
                  {quizAnswer && isCorrect ? <Check size={18} /> : quizAnswer && isSelected ? <X size={18} /> : null}
                  <span>{choice.english}</span>
                </button>
              );
            })}
          </div>
          {quizAnswer ? (
            <div className={`listening-feedback ${quizAnswer.correct ? "is-correct" : "is-incorrect"}`}>
              {quizAnswer.correct ? "Correct. This card is complete." : `The answer was: ${activeQuizItem.english}. It will return later.`}
              <span>{activeQuizItem.hanzi} · {activeQuizItem.pinyin} · {activeQuizItem.english}</span>
            </div>
          ) : null}
          <div className="listening-quiz-actions">
            <button type="button" onClick={advanceQuiz} disabled={!quizAnswer}>{quizAnswer?.correct ? "Next card" : "Continue"}</button>
          </div>
        </article>
      ) : view === "browse" && visibleSentences.length > 0 ? (
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
        <p className="empty-state">{statusFilter === "continue"
          ? "You are all caught up. Choose All cards to practise this lesson again."
          : "No sentences match these filters."}</p>
      )}
    </section>
  );
}
