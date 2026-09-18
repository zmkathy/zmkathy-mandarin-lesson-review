import { useMemo, useState } from "react";
import { Eye, EyeOff, Search, Shuffle } from "lucide-react";

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

export default function SentencePractice({ lessons }) {
  const [lessonFilter, setLessonFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [stages, setStages] = useState({});
  const [shuffleVersion, setShuffleVersion] = useState(0);
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

  function advanceCard(id) {
    setStages((current) => {
      const currentStage = current[id] || 0;
      return { ...current, [id]: currentStage >= 2 ? 0 : currentStage + 1 };
    });
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

        <label className="answer-toggle">
          <input type="checkbox" checked={showAll} onChange={(event) => setShowAll(event.target.checked)} />
          <span>
            {showAll ? <EyeOff size={18} /> : <Eye size={18} />}
            {showAll ? "Hide answers" : "Show answers"}
          </span>
        </label>
      </div>

      {visibleSentences.length > 0 ? (
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
