import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Eye, EyeOff, Grid2X2, Layers3, RotateCcw, Search, Shuffle } from "lucide-react";
import SpeakButton from "./SpeakButton.jsx";
import { getReviewAudioSrc } from "../utils/reviewAudio.js";
import { getCardProgress, saveCardProgress } from "../services/studentPortal.js";

const STORAGE_KEY = "mis-mandarin-vocabulary-progress-v1";

function loadProgress(storageKey) {
  try {
    return JSON.parse(window.localStorage.getItem(storageKey)) || {};
  } catch {
    return {};
  }
}

function collectVocabulary(lessons) {
  const uniqueItems = new Map();

  lessons.forEach((lesson, lessonIndex) => {
    const lessonNumber = lesson.lessonNumber ?? lessonIndex + 1;

    lesson.vocabulary.forEach((item, itemIndex) => {
      const key = item.hanzi + "-" + item.pinyin;
      const existing = uniqueItems.get(key);

      if (existing) {
        existing.lessonNumbers.push(lessonNumber);
        return;
      }

      uniqueItems.set(key, {
        ...item,
        id: lesson.id + "-" + itemIndex,
        progressKey: key,
        lessonNumber,
        audioItemNumber: itemIndex + 1,
        lessonNumbers: [lessonNumber]
      });
    });
  });

  return [...uniqueItems.values()];
}

function shuffleItems(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

export default function VocabularyPractice({ lessons, student }) {
  const storageKey = student?.id ? STORAGE_KEY + "-" + student.id : STORAGE_KEY;
  const [view, setView] = useState("practice");
  const [lessonFilter, setLessonFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [revealed, setRevealed] = useState(() => new Set());
  const [practiceRevealed, setPracticeRevealed] = useState(false);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [shuffleVersion, setShuffleVersion] = useState(0);
  const [progress, setProgress] = useState(() => loadProgress(storageKey));
  const vocabulary = useMemo(() => collectVocabulary(lessons), [lessons]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(progress));
    } catch {
      // Practice still works when browser storage is unavailable.
    }
  }, [progress, storageKey]);

  useEffect(() => {
    if (!student?.token || student.id === "demo") return;
    getCardProgress(student.token, "lesson_vocabulary").then((savedProgress) => {
      setProgress((current) => ({ ...current, ...savedProgress }));
    });
  }, [student?.id, student?.token]);

  const filteredVocabulary = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return vocabulary.filter((item) => {
      const matchesLesson = lessonFilter === "all"
        || item.lessonNumbers.includes(Number(lessonFilter));
      const itemStatus = progress[item.progressKey];
      const matchesStatus = statusFilter === "all"
        || (statusFilter === "unmarked" && !itemStatus)
        || itemStatus === statusFilter;
      const matchesQuery = !normalizedQuery
        || (item.hanzi + " " + item.pinyin + " " + item.english).toLowerCase().includes(normalizedQuery);
      return matchesLesson && matchesStatus && matchesQuery;
    });
  }, [lessonFilter, progress, query, statusFilter, vocabulary]);

  const visibleVocabulary = useMemo(
    () => (shuffleVersion === 0 ? filteredVocabulary : shuffleItems(filteredVocabulary)),
    [filteredVocabulary, shuffleVersion]
  );
  const activeIndex = Math.min(practiceIndex, Math.max(visibleVocabulary.length - 1, 0));
  const activeItem = visibleVocabulary[activeIndex];
  const markedCount = Object.keys(progress).length;

  useEffect(() => {
    setPracticeIndex(0);
    setPracticeRevealed(false);
  }, [lessonFilter, statusFilter, query, shuffleVersion]);

  function toggleCard(id) {
    setRevealed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function markItem(progressKey, status) {
    setProgress((current) => ({ ...current, [progressKey]: status }));
    if (student?.token && student.id !== "demo") {
      saveCardProgress(student.token, "lesson_vocabulary", progressKey, status);
    }
  }

  function movePractice(direction) {
    if (visibleVocabulary.length < 2) return;
    setPracticeIndex((current) => (
      (current + direction + visibleVocabulary.length) % visibleVocabulary.length
    ));
    setPracticeRevealed(false);
  }

  function markPracticeItem(status) {
    if (!activeItem) return;
    markItem(activeItem.progressKey, status);
    setPracticeRevealed(false);
    if (statusFilter !== "unmarked") {
      setPracticeIndex((current) => (
        visibleVocabulary.length > 1 ? (current + 1) % visibleVocabulary.length : 0
      ));
    }
  }

  function resetProgress() {
    if (window.confirm("Reset all saved vocabulary progress on this device?")) {
      setProgress({});
    }
  }

  return (
    <section className="vocabulary-practice" aria-labelledby="vocabulary-practice-title">
      <div className="section-heading practice-heading">
        <div>
          <p className="section-label">Beginner course</p>
          <h2 id="vocabulary-practice-title">Vocabulary Practice</h2>
        </div>
        <span className="result-count">{visibleVocabulary.length} words</span>
      </div>

      <div className="practice-view-switch" role="group" aria-label="Vocabulary view">
        <button className={view === "practice" ? "is-active" : ""} type="button" onClick={() => setView("practice")}>
          <Layers3 size={17} /> Practice cards
        </button>
        <button className={view === "browse" ? "is-active" : ""} type="button" onClick={() => setView("browse")}>
          <Grid2X2 size={17} /> Browse all
        </button>
      </div>

      <div className="practice-toolbar">
        <label className="filter-field">
          <span>Lesson</span>
          <select value={lessonFilter} onChange={(event) => setLessonFilter(event.target.value)}>
            <option value="all">All available lessons</option>
            {lessons.map((lesson, index) => (
              <option value={lesson.lessonNumber ?? index + 1} key={lesson.id}>Lesson {lesson.lessonNumber ?? index + 1}: {lesson.title}</option>
            ))}
          </select>
        </label>

        <label className="filter-field">
          <span>Practice set</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All words</option>
            <option value="review">Review again</option>
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

      <div className="progress-note" aria-live="polite">
        <span>Progress is saved on this device · {markedCount} marked</span>
        {markedCount > 0 ? (
          <button type="button" onClick={resetProgress}><RotateCcw size={15} /> Reset progress</button>
        ) : null}
      </div>

      {visibleVocabulary.length === 0 ? (
        <p className="empty-state">No vocabulary matches these filters.</p>
      ) : view === "practice" ? (
        <article className={"focus-practice-card" + (practiceRevealed ? " is-revealed" : "")}>
          <div className="focus-card-top">
            <span>{activeItem.lessonNumbers.map((number) => "Lesson " + number).join(" · ")}</span>
            <span>{activeIndex + 1} / {visibleVocabulary.length}</span>
          </div>
          <button className="focus-card-main" type="button" onClick={() => setPracticeRevealed((current) => !current)} aria-expanded={practiceRevealed}>
            <strong className="focus-pinyin">{activeItem.pinyin}</strong>
            {practiceRevealed ? (
              <span className="focus-answer">
                <span>{activeItem.hanzi}</span>
                <small>{activeItem.english}</small>
              </span>
            ) : (
              <span className="focus-reveal"><Eye size={17} /> Reveal meaning</span>
            )}
          </button>
          <div className="focus-card-actions">
            <button className="focus-nav-button" type="button" onClick={() => movePractice(-1)} disabled={visibleVocabulary.length < 2} aria-label="Previous word">
              <ChevronLeft size={20} />
            </button>
            <SpeakButton
              className="practice-audio-button"
              text={activeItem.hanzi}
              audioSrc={getReviewAudioSrc(activeItem.lessonNumber, "vocabulary", activeItem.audioItemNumber)}
            />
            <button className="focus-status-button is-review" type="button" onClick={() => markPracticeItem("review")}>
              <RotateCcw size={17} /> Review again
            </button>
            <button className="focus-status-button is-known" type="button" onClick={() => markPracticeItem("known")}>
              <Check size={17} /> Know it
            </button>
            <button className="focus-nav-button" type="button" onClick={() => movePractice(1)} disabled={visibleVocabulary.length < 2} aria-label="Next word">
              <ChevronRight size={20} />
            </button>
          </div>
        </article>
      ) : (
        <div className="practice-grid">
          {visibleVocabulary.map((item) => {
            const isRevealed = showAll || revealed.has(item.id);
            const itemStatus = progress[item.progressKey];
            return (
              <article
                className={"practice-card" + (isRevealed ? " is-revealed" : "") + (itemStatus ? " is-" + itemStatus : "")}
                key={item.id}
              >
                <button className="practice-card-main" type="button" onClick={() => toggleCard(item.id)} aria-expanded={isRevealed}>
                  <span className="practice-card-top">
                    <small>{item.lessonNumbers.map((number) => "L" + number).join(" · ")}</small>
                    {isRevealed ? <EyeOff size={17} /> : <Eye size={17} />}
                  </span>
                  <strong className="practice-pinyin">{item.pinyin}</strong>
                  {isRevealed ? (
                    <span className="practice-answer">
                      <span className="practice-hanzi">{item.hanzi}</span>
                      <small>{item.english}</small>
                    </span>
                  ) : (
                    <span className="practice-hidden">•••</span>
                  )}
                </button>
                <div className="mastery-actions" aria-label={"Progress for " + item.pinyin}>
                  <SpeakButton
                    className="browse-audio-button"
                    text={item.hanzi}
                    audioSrc={getReviewAudioSrc(item.lessonNumber, "vocabulary", item.audioItemNumber)}
                  />
                  <button className={itemStatus === "known" ? "is-active" : ""} type="button" onClick={() => markItem(item.progressKey, "known")}>
                    <Check size={15} /> Know it
                  </button>
                  <button className={itemStatus === "review" ? "is-active" : ""} type="button" onClick={() => markItem(item.progressKey, "review")}>
                    <RotateCcw size={15} /> Review again
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
